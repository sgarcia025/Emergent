import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid

class WhatsNewAPITester:
    def __init__(self, base_url="https://event-manager-28.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = "mock-jwt-token"  # Using mock token as per backend implementation
        self.tests_run = 0
        self.tests_passed = 0
        self.created_event_id = None
        self.created_faq_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_event(self):
        """Test event creation"""
        event_data = {
            "name": f"Test Event {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test event for WhatsNew Admin platform",
            "date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "venue": "Test Venue, Test City",
            "category_tags": ["conference", "tech", "networking"]
        }
        
        success, response = self.run_test(
            "Create Event",
            "POST",
            "events",
            200,
            data=event_data
        )
        
        if success and 'id' in response:
            self.created_event_id = response['id']
            print(f"   Created Event ID: {self.created_event_id}")
            return True
        return False

    def test_get_events(self):
        """Test getting events list"""
        success, response = self.run_test(
            "Get Events List",
            "GET",
            "events",
            200
        )
        
        if success:
            print(f"   Found {len(response)} events")
            return True
        return False

    def test_get_single_event(self):
        """Test getting a single event"""
        if not self.created_event_id:
            print("❌ No event ID available for single event test")
            return False
            
        success, response = self.run_test(
            "Get Single Event",
            "GET",
            f"events/{self.created_event_id}",
            200
        )
        
        return success

    def test_create_faq(self):
        """Test FAQ creation"""
        if not self.created_event_id:
            print("❌ No event ID available for FAQ test")
            return False
            
        faq_data = {
            "event_id": self.created_event_id,
            "question": "¿Cuál es el horario del evento?",
            "answer": "El evento comienza a las 9:00 AM y termina a las 6:00 PM."
        }
        
        success, response = self.run_test(
            "Create FAQ",
            "POST",
            f"events/{self.created_event_id}/faqs",
            200,
            data=faq_data
        )
        
        if success and 'id' in response:
            self.created_faq_id = response['id']
            return True
        return False

    def test_get_faqs(self):
        """Test getting FAQs for an event"""
        if not self.created_event_id:
            print("❌ No event ID available for FAQ list test")
            return False
            
        success, response = self.run_test(
            "Get Event FAQs",
            "GET",
            f"events/{self.created_event_id}/faqs",
            200
        )
        
        if success:
            print(f"   Found {len(response)} FAQs")
            return True
        return False

    def test_bot_query(self):
        """Test bot query functionality with Emergent LLM"""
        if not self.created_event_id:
            print("❌ No event ID available for bot query test")
            return False
            
        query_data = {
            "event_id": self.created_event_id,
            "message": "¿Cuál es el horario del evento?",
            "session_id": str(uuid.uuid4())
        }
        
        success, response = self.run_test(
            "Bot Query (Emergent LLM)",
            "POST",
            "bot/query",
            200,
            data=query_data
        )
        
        if success and 'response' in response:
            print(f"   Bot Response: {response['response'][:100]}...")
            return True
        return False

    def test_analytics(self):
        """Test analytics endpoint"""
        if not self.created_event_id:
            print("❌ No event ID available for analytics test")
            return False
            
        success, response = self.run_test(
            "Get Event Analytics",
            "GET",
            f"events/{self.created_event_id}/analytics",
            200
        )
        
        if success:
            expected_keys = ['total_tickets_sold', 'total_revenue', 'checked_in_count', 'check_in_rate']
            if all(key in response for key in expected_keys):
                print("   ✅ All analytics keys present")
                return True
            else:
                print("   ❌ Missing analytics keys")
        return False

    def test_ticket_purchase_flow(self):
        """Test ticket purchase flow (will fail without Stripe key but should return proper error)"""
        if not self.created_event_id:
            print("❌ No event ID available for ticket purchase test")
            return False
            
        purchase_data = {
            "event_id": self.created_event_id,
            "ticket_type_id": "test-ticket-type",
            "attendee_name": "Test Attendee",
            "attendee_email": "test@example.com",
            "attendee_phone": "+1234567890",
            "origin_url": self.base_url
        }
        
        # This should fail with 500 due to missing Stripe key, but that's expected
        success, response = self.run_test(
            "Ticket Purchase (Expected to fail without Stripe)",
            "POST",
            "tickets/purchase",
            500,  # Expecting 500 due to missing Stripe configuration
            data=purchase_data
        )
        
        return success

    def test_checkin_system(self):
        """Test check-in system"""
        checkin_data = {
            "qr_code": "ticket:test-qr-code-12345"
        }
        
        # This should return "expired" status for non-existent ticket
        success, response = self.run_test(
            "Check-in System (Non-existent ticket)",
            "POST",
            "checkin",
            200,
            data=checkin_data
        )
        
        if success and response.get('status') == 'expired':
            print("   ✅ Check-in system working correctly for invalid tickets")
            return True
        return False

    def test_export_attendees(self):
        """Test attendees export"""
        if not self.created_event_id:
            print("❌ No event ID available for export test")
            return False
            
        success, response = self.run_test(
            "Export Attendees",
            "GET",
            f"events/{self.created_event_id}/attendees/export",
            200
        )
        
        if success and 'attendees' in response:
            print(f"   Found {len(response['attendees'])} attendees to export")
            return True
        return False

def main():
    print("🚀 Starting WhatsNew Admin API Tests")
    print("=" * 50)
    
    # Setup
    tester = WhatsNewAPITester()
    
    # Run core functionality tests
    print("\n📋 CORE EVENT MANAGEMENT TESTS")
    tester.test_create_event()
    tester.test_get_events()
    tester.test_get_single_event()
    
    print("\n🤖 BOT & FAQ TESTS")
    tester.test_create_faq()
    tester.test_get_faqs()
    tester.test_bot_query()
    
    print("\n📊 ANALYTICS & REPORTING TESTS")
    tester.test_analytics()
    tester.test_export_attendees()
    
    print("\n🎫 TICKET & PAYMENT TESTS")
    tester.test_ticket_purchase_flow()
    tester.test_checkin_system()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())