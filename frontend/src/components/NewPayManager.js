import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Plus, Edit, Trash2, ShoppingBag, DollarSign, Package, TrendingUp, Coffee, Utensils } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API } from '../App';
import Sidebar from './Sidebar';

function NewPayManager() {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    name: '',
    description: ''
  });
  const [productFormData, setProductFormData] = useState({
    name: '',
    price: 0,
    stock: 100,
    description: '',
    image_url: ''
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
    fetchStores();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    // Mock data for now - in real implementation, this would fetch from API
    const mockStores = [
      {
        id: 'store1',
        name: 'Bar Principal',
        description: 'Bebidas y cocteles',
        is_active: true,
        products: [
          { id: 'p1', name: 'Cerveza Artesanal', price: 8.50, stock: 200, description: 'Cerveza local premium' },
          { id: 'p2', name: 'Cóctel Mojito', price: 12.00, stock: 150, description: 'Mojito clásico con menta fresca' },
          { id: 'p3', name: 'Agua Premium', price: 3.00, stock: 300, description: 'Agua mineral con gas' }
        ]
      },
      {
        id: 'store2',
        name: 'Food Truck Gourmet',
        description: 'Comida gourmet y snacks',
        is_active: true,
        products: [
          { id: 'p4', name: 'Burger Deluxe', price: 15.00, stock: 100, description: 'Hamburguesa gourmet con papas' },
          { id: 'p5', name: 'Tacos Fusion', price: 12.00, stock: 80, description: 'Tacos de fusión asiática' },
          { id: 'p6', name: 'Ensalada Caesar', price: 10.00, stock: 60, description: 'Ensalada fresca con pollo' }
        ]
      }
    ];
    setStores(mockStores);
    if (mockStores.length > 0) {
      setSelectedStore(mockStores[0]);
      setProducts(mockStores[0].products);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    const newStore = {
      id: `store_${Date.now()}`,
      ...storeFormData,
      is_active: true,
      products: []
    };
    
    setStores([...stores, newStore]);
    setShowStoreForm(false);
    setStoreFormData({ name: '', description: '' });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const newProduct = {
      id: `product_${Date.now()}`,
      ...productFormData,
      price: parseFloat(productFormData.price),
      stock: parseInt(productFormData.stock),
      is_active: true
    };
    
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    
    // Update the store's products
    const updatedStores = stores.map(store => 
      store.id === selectedStore.id 
        ? { ...store, products: updatedProducts }
        : store
    );
    setStores(updatedStores);
    setSelectedStore({ ...selectedStore, products: updatedProducts });
    
    setShowProductForm(false);
    setProductFormData({ name: '', price: 0, stock: 100, description: '', image_url: '' });
  };

  const selectStore = (store) => {
    setSelectedStore(store);
    setProducts(store.products || []);
  };

  const mockSalesData = {
    totalSales: 2450.00,
    totalTransactions: 87,
    topProducts: [
      { name: 'Cerveza Artesanal', sales: 680.00, quantity: 80 },
      { name: 'Burger Deluxe', sales: 450.00, quantity: 30 },
      { name: 'Cóctel Mojito', sales: 360.00, quantity: 30 }
    ],
    storeBreakdown: [
      { name: 'Bar Principal', sales: 1350.00, transactions: 55 },
      { name: 'Food Truck Gourmet', sales: 1100.00, transactions: 32 }
    ]
  };

  const storeIcons = {
    'Bar Principal': Coffee,
    'Food Truck Gourmet': Utensils,
    default: Store
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
            Cargando NewPay...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">NewPay Manager</h1>
            <p className="page-subtitle">
              {event?.name} - Gestiona tiendas de consumo y productos
            </p>
          </div>
          <Link to="/events" className="btn btn-secondary">
            ← Volver a Eventos
          </Link>
        </div>

        {/* NewPay Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">${mockSalesData.totalSales.toFixed(2)}</div>
            <div className="stat-label">Ventas Totales NewPay</div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              +28% vs promedio
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{mockSalesData.totalTransactions}</div>
            <div className="stat-label">Transacciones</div>
            <div className="stat-change positive">
              <ShoppingBag size={14} />
              Compras realizadas
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stores.length}</div>
            <div className="stat-label">Tiendas Activas</div>
            <div className="stat-change positive">
              <Store size={14} />
              Puntos de venta
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${(mockSalesData.totalSales / mockSalesData.totalTransactions).toFixed(2)}</div>
            <div className="stat-label">Ticket Promedio</div>
            <div className="stat-change positive">
              <DollarSign size={14} />
              Por transacción
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          {/* Stores Management */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Tiendas de Consumo</h2>
              <button 
                onClick={() => setShowStoreForm(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                Nueva Tienda
              </button>
            </div>

            {showStoreForm && (
              <div className="fade-in" style={{ marginBottom: '24px', padding: '20px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '16px' }}>Crear Nueva Tienda</h3>
                <form onSubmit={handleCreateStore}>
                  <div className="form-group">
                    <label className="form-label">Nombre de la Tienda</label>
                    <input
                      type="text"
                      className="form-input"
                      value={storeFormData.name}
                      onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
                      required
                      placeholder="Ej: Bar VIP, Food Truck Zona A"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-input form-textarea"
                      value={storeFormData.description}
                      onChange={(e) => setStoreFormData({ ...storeFormData, description: e.target.value })}
                      placeholder="Describe los productos que vende esta tienda..."
                      rows="3"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Plus size={16} />
                      Crear Tienda
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowStoreForm(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {stores.map((store) => {
                const StoreIcon = storeIcons[store.name] || storeIcons.default;
                const storeStats = mockSalesData.storeBreakdown.find(s => s.name === store.name) || { sales: 0, transactions: 0 };
                
                return (
                  <div
                    key={store.id}
                    className={`slide-up ${selectedStore?.id === store.id ? 'selected' : ''}`}
                    style={{
                      padding: '16px',
                      border: `2px solid ${selectedStore?.id === store.id ? 'var(--whatsapp-green)' : 'var(--gray-200)'}`,
                      borderRadius: '12px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: selectedStore?.id === store.id ? 'rgba(37, 211, 102, 0.05)' : 'white'
                    }}
                    onClick={() => selectStore(store)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <StoreIcon size={20} style={{ color: 'var(--whatsapp-green)', marginRight: '8px' }} />
                          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                            {store.name}
                          </h3>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                          {store.description}
                        </p>
                        <div className="grid grid-2" style={{ gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>
                              ${storeStats.sales.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Ventas</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--blue)' }}>
                              {storeStats.transactions}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Transacciones</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                          <Edit size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {stores.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                <Store size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
                <h3 style={{ marginBottom: '8px' }}>No hay tiendas</h3>
                <p style={{ marginBottom: '20px' }}>Crea tu primera tienda de consumo</p>
                <button 
                  onClick={() => setShowStoreForm(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  Crear Primera Tienda
                </button>
              </div>
            )}
          </div>

          {/* Products Management */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Productos {selectedStore && `- ${selectedStore.name}`}
              </h2>
              {selectedStore && (
                <button 
                  onClick={() => setShowProductForm(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  Nuevo Producto
                </button>
              )}
            </div>

            {showProductForm && (
              <div className="fade-in" style={{ marginBottom: '24px', padding: '20px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '16px' }}>Agregar Producto a {selectedStore?.name}</h3>
                <form onSubmit={handleCreateProduct}>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Nombre del Producto</label>
                      <input
                        type="text"
                        className="form-input"
                        value={productFormData.name}
                        onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                        required
                        placeholder="Ej: Cerveza Premium"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Precio ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={productFormData.price}
                        onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Inicial</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productFormData.stock}
                      onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                      required
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-input form-textarea"
                      value={productFormData.description}
                      onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                      placeholder="Describe el producto..."
                      rows="3"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Plus size={16} />
                      Agregar Producto
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {selectedStore ? (
              products.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {products.map((product) => (
                    <div key={product.id} className="slide-up" style={{ 
                      padding: '16px', 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: '12px', 
                      marginBottom: '12px',
                      background: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                              {product.name}
                            </h4>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--whatsapp-green)' }}>
                              ${product.price.toFixed(2)}
                            </div>
                          </div>
                          
                          {product.description && (
                            <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                              {product.description}
                            </p>
                          )}
                          
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div>
                              <span className={`badge ${product.stock > 20 ? 'badge-success' : product.stock > 5 ? 'badge-warning' : 'badge-error'}`}>
                                <Package size={12} />
                                Stock: {product.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                            <Edit size={12} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                  <Package size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
                  <h3 style={{ marginBottom: '8px' }}>No hay productos</h3>
                  <p style={{ marginBottom: '20px' }}>Agrega productos a {selectedStore.name}</p>
                  <button 
                    onClick={() => setShowProductForm(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={16} />
                    Agregar Primer Producto
                  </button>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
                <h3 style={{ marginBottom: '8px' }}>Selecciona una tienda</h3>
                <p>Elige una tienda para ver y gestionar sus productos</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Report */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Reporte de Ventas NewPay</h2>
          </div>

          <div className="grid grid-2">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Productos Más Vendidos
              </h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Ventas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSalesData.topProducts.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>{product.quantity}</td>
                        <td style={{ fontWeight: '600', color: 'var(--success)' }}>
                          ${product.sales.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Ventas por Tienda
              </h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tienda</th>
                      <th>Transacciones</th>
                      <th>Ventas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSalesData.storeBreakdown.map((store, index) => (
                      <tr key={index}>
                        <td>{store.name}</td>
                        <td>{store.transactions}</td>
                        <td style={{ fontWeight: '600', color: 'var(--success)' }}>
                          ${store.sales.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewPayManager;