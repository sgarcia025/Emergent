from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import base64
from io import BytesIO
import csv

# Emergent integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="WhatsNew Admin", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class TicketType(str, Enum):
    GENERAL = "general"
    VIP = "vip"
    EARLY_BIRD = "early_bird"

class CheckInStatus(str, Enum):
    VALID = "valid"
    DUPLICATE = "duplicate"
    EXPIRED = "expired"
    NOT_ACTIVATED = "not_activated"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# Models
class Organization(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    email: str
    name: str
    role: str = "organizer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class TicketTypeConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: TicketType
    price: float
    stock: int
    max_per_person: int = 10
    description: Optional[str] = None
    is_active: bool = True

class NewPayStore(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    is_active: bool = True

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    store_id: str
    name: str
    price: float
    stock: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    name: str
    description: str
    date: datetime
    venue: str
    category_tags: List[str] = []
    ticket_types: List[TicketTypeConfig] = []
    newpay_enabled: bool = False
    newpay_stores: List[NewPayStore] = []
    public_calendar: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class Ticket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    ticket_type_id: str
    attendee_name: str
    attendee_email: str
    attendee_phone: Optional[str] = None
    qr_code: str
    purchase_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_checked_in: bool = False
    check_in_time: Optional[datetime] = None
    payment_session_id: Optional[str] = None
    is_active: bool = True

class FAQ(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    question: str
    answer: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BotConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    auto_reply_enabled: bool = True
    welcome_message: str = "¡Bienvenido al evento! ¿En qué puedo ayudarte?"
    reminder_message: str = "Recuerda llegar 30 minutos antes del evento."
    system_prompt: str = "Eres un asistente virtual para eventos. Responde de manera amigable y útil."
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    event_id: str
    ticket_type_id: str
    attendee_email: str
    amount: float
    currency: str = "usd"
    status: PaymentStatus = PaymentStatus.PENDING
    payment_status: str = "pending"
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class EventCreate(BaseModel):
    name: str
    description: str
    date: datetime
    venue: str
    category_tags: List[str] = []

class TicketPurchaseRequest(BaseModel):
    event_id: str
    ticket_type_id: str
    attendee_name: str
    attendee_email: str
    attendee_phone: Optional[str] = None
    origin_url: str

class CheckInRequest(BaseModel):
    qr_code: str

class FAQRequest(BaseModel):
    event_id: str
    question: str
    answer: str

class BotQueryRequest(BaseModel):
    event_id: str
    message: str
    session_id: Optional[str] = None

# Utility Functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Simple auth - in production, verify JWT token"""
    # For MVP, return mock user
    return {"id": "user1", "organization_id": "org1", "email": "admin@example.com"}

# API Routes

# Events Management
@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    event_dict = event_data.dict()
    event_dict["organization_id"] = current_user["organization_id"]
    event = Event(**event_dict)
    
    await db.events.insert_one(event.dict())
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events(current_user: dict = Depends(get_current_user)):
    events = await db.events.find({
        "organization_id": current_user["organization_id"],
        "is_active": True
    }).to_list(1000)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({
        "id": event_id,
        "organization_id": current_user["organization_id"]
    })
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    update_data = event_data.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.events.update_one(
        {"id": event_id, "organization_id": current_user["organization_id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    updated_event = await db.events.find_one({"id": event_id})
    return Event(**updated_event)

# Ticket Sales
@api_router.post("/tickets/purchase")
async def purchase_ticket(request: TicketPurchaseRequest):
    # Get event and ticket type
    event = await db.events.find_one({"id": request.event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_obj = Event(**event)
    ticket_type = None
    for tt in event_obj.ticket_types:
        if tt.id == request.ticket_type_id:
            ticket_type = tt
            break
    
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    
    # Create Stripe checkout session
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe_checkout = StripeCheckout(
        api_key=stripe_api_key,
        webhook_url=f"{request.origin_url}/api/webhook/stripe"
    )
    
    success_url = f"{request.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/events/{request.event_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=ticket_type.price,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "event_id": request.event_id,
            "ticket_type_id": request.ticket_type_id,
            "attendee_email": request.attendee_email,
            "attendee_name": request.attendee_name
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_transaction = PaymentTransaction(
        session_id=session.session_id,
        event_id=request.event_id,
        ticket_type_id=request.ticket_type_id,
        attendee_email=request.attendee_email,
        amount=ticket_type.price,
        currency="usd",
        metadata=checkout_request.metadata
    )
    
    await db.payment_transactions.insert_one(payment_transaction.dict())
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    # Get payment transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment session not found")
    
    # Check Stripe status
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if stripe_api_key:
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        update_data = {
            "status": PaymentStatus.COMPLETED if checkout_status.payment_status == "paid" else PaymentStatus.PENDING,
            "payment_status": checkout_status.payment_status,
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If payment successful and ticket not created yet, create ticket
        if checkout_status.payment_status == "paid":
            existing_ticket = await db.tickets.find_one({"payment_session_id": session_id})
            if not existing_ticket:
                # Create ticket
                qr_data = f"ticket:{uuid.uuid4()}"
                ticket = Ticket(
                    event_id=transaction["event_id"],
                    ticket_type_id=transaction["ticket_type_id"],
                    attendee_name=transaction["metadata"].get("attendee_name", ""),
                    attendee_email=transaction["attendee_email"],
                    qr_code=qr_data,
                    payment_session_id=session_id
                )
                
                await db.tickets.insert_one(ticket.dict())
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency
        }
    
    return {"status": "unknown", "payment_status": transaction["payment_status"]}

# QR Code Check-in
@api_router.post("/checkin")
async def check_in_attendee(request: CheckInRequest):
    ticket = await db.tickets.find_one({"qr_code": request.qr_code})
    if not ticket:
        return {"status": CheckInStatus.EXPIRED, "message": "Ticket not found"}
    
    if ticket["is_checked_in"]:
        return {"status": CheckInStatus.DUPLICATE, "message": "Ticket already used"}
    
    # Update ticket
    await db.tickets.update_one(
        {"id": ticket["id"]},
        {
            "$set": {
                "is_checked_in": True,
                "check_in_time": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "status": CheckInStatus.VALID,
        "message": "Check-in successful",
        "attendee_name": ticket["attendee_name"],
        "ticket_type": ticket["ticket_type_id"]
    }

# Bot Configuration & FAQ
@api_router.post("/events/{event_id}/faqs")
async def create_faq(event_id: str, faq_data: FAQRequest, current_user: dict = Depends(get_current_user)):
    faq = FAQ(
        event_id=event_id,
        question=faq_data.question,
        answer=faq_data.answer
    )
    
    await db.faqs.insert_one(faq.dict())
    return faq

@api_router.get("/events/{event_id}/faqs", response_model=List[FAQ])
async def get_faqs(event_id: str):
    faqs = await db.faqs.find({"event_id": event_id, "is_active": True}).to_list(1000)
    return [FAQ(**faq) for faq in faqs]

@api_router.post("/bot/query")
async def bot_query(request: BotQueryRequest):
    # Get event FAQs
    faqs = await db.faqs.find({"event_id": request.event_id, "is_active": True}).to_list(1000)
    
    # Get bot config
    bot_config = await db.bot_configs.find_one({"event_id": request.event_id})
    if not bot_config:
        # Create default config
        bot_config = BotConfig(event_id=request.event_id)
        await db.bot_configs.insert_one(bot_config.dict())
    else:
        bot_config = BotConfig(**bot_config)
    
    # Prepare context
    faq_context = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in faqs])
    system_message = f"{bot_config.system_prompt}\n\nFAQs del evento:\n{faq_context}"
    
    # Use Emergent LLM
    emergent_key = os.environ.get('EMERGENT_LLM_KEY')
    if not emergent_key:
        return {"response": "Lo siento, el sistema de chat no está disponible en este momento."}
    
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        chat = LlmChat(
            api_key=emergent_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logging.error(f"Bot query error: {e}")
        return {"response": "Lo siento, no pude procesar tu consulta en este momento."}

# Analytics & Reports
@api_router.get("/events/{event_id}/analytics")
async def get_event_analytics(event_id: str, current_user: dict = Depends(get_current_user)):
    # Get ticket sales
    tickets = await db.tickets.find({"event_id": event_id}).to_list(1000)
    
    # Get payment transactions
    payments = await db.payment_transactions.find({"event_id": event_id}).to_list(1000)
    
    # Calculate metrics
    total_tickets_sold = len([t for t in tickets if t.get("payment_session_id")])
    total_revenue = sum([p["amount"] for p in payments if p["status"] == "completed"])
    checked_in_count = len([t for t in tickets if t.get("is_checked_in")])
    
    # Group by ticket type
    ticket_type_stats = {}
    for ticket in tickets:
        tt_id = ticket["ticket_type_id"]
        if tt_id not in ticket_type_stats:
            ticket_type_stats[tt_id] = {"sold": 0, "revenue": 0, "checked_in": 0}
        
        ticket_type_stats[tt_id]["sold"] += 1
        if ticket.get("is_checked_in"):
            ticket_type_stats[tt_id]["checked_in"] += 1
    
    for payment in payments:
        if payment["status"] == "completed":
            tt_id = payment["ticket_type_id"]
            if tt_id in ticket_type_stats:
                ticket_type_stats[tt_id]["revenue"] += payment["amount"]
    
    return {
        "total_tickets_sold": total_tickets_sold,
        "total_revenue": total_revenue,
        "checked_in_count": checked_in_count,
        "check_in_rate": (checked_in_count / total_tickets_sold * 100) if total_tickets_sold > 0 else 0,
        "ticket_type_breakdown": ticket_type_stats
    }

@api_router.get("/events/{event_id}/attendees/export")
async def export_attendees(event_id: str, current_user: dict = Depends(get_current_user)):
    tickets = await db.tickets.find({"event_id": event_id}).to_list(1000)
    
    attendees_data = []
    for ticket in tickets:
        attendees_data.append({
            "name": ticket["attendee_name"],
            "email": ticket["attendee_email"],
            "phone": ticket.get("attendee_phone", ""),
            "ticket_type": ticket["ticket_type_id"],
            "purchase_date": ticket["purchase_date"].isoformat(),
            "checked_in": "Yes" if ticket.get("is_checked_in") else "No",
            "check_in_time": ticket.get("check_in_time").isoformat() if ticket.get("check_in_time") else ""
        })
    
    return {"attendees": attendees_data}

# Stripe Webhook
@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if stripe_api_key:
            stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
            webhook_response = await stripe_checkout.handle_webhook(body, signature)
            
            # Handle the webhook event
            if webhook_response.event_type == "checkout.session.completed":
                session_id = webhook_response.session_id
                
                # Update payment transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {
                        "$set": {
                            "status": PaymentStatus.COMPLETED,
                            "payment_status": "paid",
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
                
                # Create ticket if payment successful
                transaction = await db.payment_transactions.find_one({"session_id": session_id})
                if transaction:
                    existing_ticket = await db.tickets.find_one({"payment_session_id": session_id})
                    if not existing_ticket:
                        qr_data = f"ticket:{uuid.uuid4()}"
                        ticket = Ticket(
                            event_id=transaction["event_id"],
                            ticket_type_id=transaction["ticket_type_id"],
                            attendee_name=transaction["metadata"].get("attendee_name", ""),
                            attendee_email=transaction["attendee_email"],
                            qr_code=qr_data,
                            payment_session_id=session_id
                        )
                        
                        await db.tickets.insert_one(ticket.dict())
            
            return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()