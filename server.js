// Working Express.js Server with MongoDB Atlas
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection string - WORKING VERSION
const MONGODB_URI = 'mongodb+srv://par4di3e_db_user:cerber2003GB13@flower-delivery-cluster.8kycolo.mongodb.net/?retryWrites=true&w=majority&appName=flower-delivery-cluster';
const DB_NAME = 'flower_delivery';

let db;
let client;

// Demo data for fallback mode
const demoData = {
    shops: [
        {
            _id: "66e5a1b2c3d4e5f6a7b8c9d0",
            name: "Троянди і ",
            address: {
                street: "вул. Хрещатик, 25",
                city: "Київ",
                district: "Шевченківський",
                postal_code: "01001"
            },
            phone: "+380441234567",
            email: "info@roses-dreams.ua",
            rating: 4.8,
            working_hours: {
                monday: "09:00-20:00",
                tuesday: "09:00-20:00",
                wednesday: "09:00-20:00",
                thursday: "09:00-20:00",
                friday: "09:00-20:00",
                saturday: "10:00-18:00",
                sunday: "10:00-18:00"
            },
            is_active: true,
            created_at: new Date()
        },
        {
            _id: "66e5a1b2c3d4e5f6a7b8c9d1",
            name: "Квітковий Рай",
            address: {
                street: "вул. Велика Васильківська, 112",
                city: "Київ",
                district: "Голосіївський",
                postal_code: "03150"
            },
            phone: "+380442345678",
            email: "paradise@flowers.ua",
            rating: 4.6,
            working_hours: {
                monday: "09:00-20:00",
                tuesday: "09:00-20:00",
                wednesday: "09:00-20:00",
                thursday: "09:00-20:00",
                friday: "09:00-20:00",
                saturday: "10:00-18:00",
                sunday: "10:00-18:00"
            },
            is_active: true,
            created_at: new Date()
        }
    ],
    products: [
        {
            _id: "66e5a2b3c4d5e6f7a8b9c0d1",
            shop_id: "66e5a1b2c3d4e5f6a7b8c9d0",
            name: "Букет червоних троянд (15 шт)",
            description: "Елегантний букет з 15 свіжих червоних троянд у розкішній упаковці з атласною стрічкою. Ідеально для романтичних моментів.",
            category: "bouquet",
            price: 850.00,
            currency: "UAH",
            stock_quantity: 25,
            images: [
                "https://images.unsplash.com/photo-1518895312237-a20e5ff153cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            ],
            specifications: {
                flower_type: "Троянди",
                color: "Червоний",
                quantity: 15,
                size: "Великий"
            },
            is_available: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            _id: "66e5a2b3c4d5e6f7a8b9c0d2",
            shop_id: "66e5a1b2c3d4e5f6a7b8c9d1",
            name: "Букет тюльпанів мікс (21 шт)",
            description: "Весняний букет з 21 різнокольорових тюльпанів: червоні, жовті, рожеві та білі. Свіжість весни у вашому домі!",
            category: "bouquet",
            price: 420.00,
            currency: "UAH",
            stock_quantity: 30,
            images: [
                "https://images.unsplash.com/photo-1520637736862-4d197d17c50a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            ],
            specifications: {
                flower_type: "Тюльпани",
                color: "Мікс",
                quantity: 21,
                size: "Середній"
            },
            is_available: true,
            created_at: new Date(),
            updated_at: new Date()
        }
    ],
    orders: []
};

let useDemoMode = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files from public folder

// Connect to MongoDB
async function connectToDatabase() {
    try {
        client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            connectTimeoutMS: 10000,
        });

        await client.connect();
        await client.db("admin").command({ ping: 1 });

        db = client.db(DB_NAME);
        console.log('✅ Connected to MongoDB Atlas');
        console.log(`📊 Using database: ${DB_NAME}`);
        useDemoMode = false;

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('🎭 Switching to demo mode with test data');
        useDemoMode = true;
    }
}

// Helper function to get data (MongoDB or demo)
async function getData(collection, filter = {}) {
    if (useDemoMode) {
        let data = demoData[collection] || [];

        // Apply basic filtering for demo mode
        if (filter.name) {
            data = data.filter(item => 
                item.name.toLowerCase().includes(filter.name.toLowerCase())
            );
        }

        return { success: true, data, count: data.length };
    }

    try {
        const data = await db.collection(collection).find(filter).toArray();
        return { success: true, data, count: data.length };
    } catch (error) {
        console.error(`Error fetching ${collection}:`, error);
        return { success: false, message: error.message };
    }
}

// Helper function to get single item
async function getDataById(collection, id) {
    if (useDemoMode) {
        const item = demoData[collection]?.find(item => item._id === id);
        return item ? { success: true, data: item } : { success: false, message: 'Not found' };
    }

    try {
        if (!ObjectId.isValid(id)) {
            return { success: false, message: 'Invalid ID format' };
        }

        const item = await db.collection(collection).findOne({ _id: new ObjectId(id) });
        return item ? { success: true, data: item } : { success: false, message: 'Not found' };
    } catch (error) {
        console.error(`Error fetching ${collection} by ID:`, error);
        return { success: false, message: error.message };
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Flower Delivery API is running',
        timestamp: new Date().toISOString(),
        database: useDemoMode ? 'Demo Mode' : 'Connected',
        mode: useDemoMode ? 'demo' : 'production'
    });
});

// SHOPS API ROUTES
app.get('/api/shops', async (req, res) => {
    try {
        const { search, district, rating, isActive } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'address.street': { $regex: search, $options: 'i' } },
                { 'address.district': { $regex: search, $options: 'i' } }
            ];
        }

        if (district) filter['address.district'] = district;
        if (rating) filter.rating = { $gte: parseFloat(rating) };
        if (isActive !== undefined) filter.is_active = isActive === 'true';

        const result = await getData('shops', filter);
        res.json(result);

    } catch (error) {
        console.error('Error in /api/shops:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shops',
            error: error.message
        });
    }
});

app.get('/api/shops/:id', async (req, res) => {
    try {
        const result = await getDataById('shops', req.params.id);

        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Error in /api/shops/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shop',
            error: error.message
        });
    }
});

// PRODUCTS API ROUTES
app.get('/api/products', async (req, res) => {
    try {
        const { shop_id, category, search, minPrice, maxPrice, isAvailable } = req.query;
        let filter = {};

        if (shop_id) {
            if (useDemoMode) {
                filter.shop_id = shop_id;
            } else {
                if (!ObjectId.isValid(shop_id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid shop ID'
                    });
                }
                filter.shop_id = new ObjectId(shop_id);
            }
        }

        if (category) filter.category = category;
        if (isAvailable !== undefined) filter.is_available = isAvailable === 'true';

        const result = await getData('products', filter);

        // Apply additional filtering for demo mode
        if (useDemoMode && result.success) {
            let filteredData = result.data;

            if (search) {
                filteredData = filteredData.filter(product =>
                    product.name.toLowerCase().includes(search.toLowerCase()) ||
                    product.description.toLowerCase().includes(search.toLowerCase())
                );
            }

            if (minPrice) {
                filteredData = filteredData.filter(product => product.price >= parseFloat(minPrice));
            }

            if (maxPrice) {
                filteredData = filteredData.filter(product => product.price <= parseFloat(maxPrice));
            }

            result.data = filteredData;
            result.count = filteredData.length;
        }

        res.json(result);

    } catch (error) {
        console.error('Error in /api/products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const result = await getDataById('products', req.params.id);

        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Error in /api/products/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// Get related products
app.get('/api/products/:id/related', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 4;

        // Get the original product first
        const productResult = await getDataById('products', id);

        if (!productResult.success) {
            return res.status(404).json(productResult);
        }

        const product = productResult.data;

        // Get all products for filtering
        const allProductsResult = await getData('products');

        if (!allProductsResult.success) {
            return res.status(500).json(allProductsResult);
        }

        // Filter related products
        const relatedProducts = allProductsResult.data
            .filter(p => p._id !== id && (p.shop_id === product.shop_id || p.category === product.category))
            .slice(0, limit);

        res.json({
            success: true,
            data: relatedProducts,
            count: relatedProducts.length
        });

    } catch (error) {
        console.error('Error in /api/products/:id/related:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching related products',
            error: error.message
        });
    }
});

// ORDERS API ROUTES - МІНІМАЛЬНІ ВИПРАВЛЕННЯ
// ORDERS API ROUTES - ВИПРАВЛЕНО ДЛЯ MONGODB VALIDATION
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;

        // Validate required fields according to schema
        const requiredFields = ['customer', 'delivery_address', 'items', 'total_amount'];
        const missingFields = requiredFields.filter(field => !orderData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Generate order number
        const orderCount = useDemoMode ? demoData.orders.length : await db.collection('orders').countDocuments();
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

        // ВИПРАВЛЕННЯ: Структура відповідно до MongoDB схеми
        const order = {
            order_number: orderNumber,
            customer: {
                email: String(orderData.customer.email || ''),
                phone: String(orderData.customer.phone || ''),
                name: orderData.customer.name ? String(orderData.customer.name).substring(0, 100) : undefined
            },
            delivery_address: {
                street: String(orderData.delivery_address.street || ''),
                city: String(orderData.delivery_address.city || ''),
                district: orderData.delivery_address.district ? String(orderData.delivery_address.district) : undefined,
                apartment: orderData.delivery_address.apartment ? String(orderData.delivery_address.apartment) : undefined,
                postal_code: orderData.delivery_address.postal_code ? String(orderData.delivery_address.postal_code) : undefined,
                notes: orderData.delivery_address.notes ? String(orderData.delivery_address.notes).substring(0, 500) : undefined
            },
            total_amount: parseFloat(orderData.total_amount || 0),
            currency: orderData.currency || 'UAH',
            status: orderData.status || 'pending',
            delivery_date: new Date(orderData.delivery_date || new Date()),
            special_instructions: orderData.special_instructions ? String(orderData.special_instructions).substring(0, 1000) : undefined,
            created_at: new Date(),
            updated_at: new Date()
        };

        if (useDemoMode) {
            order._id = `order_${Date.now()}`;
            order.items = orderData.items.map(item => ({
                product_id: item.product_id,
                shop_id: item.shop_id,
                product_name: String(item.product_name || item.name || ''),
                price: parseFloat(item.price || 0),
                quantity: parseInt(item.quantity || 1),
                subtotal: parseFloat(item.subtotal || (item.price * item.quantity) || 0)
            }));
            
            demoData.orders.push(order);
            
            res.status(201).json({
                success: true,
                data: order
            });
        } else {
            // КРИТИЧНО: Правильна структура items для MongoDB
            order.items = orderData.items.map((item) => {
                try {
                    let productId = item.product_id;
                    let shopId = item.shop_id;

                    // Конвертуємо в ObjectId тільки якщо валідні
                    if (typeof productId === 'string' && ObjectId.isValid(productId)) {
                        productId = new ObjectId(productId);
                    }

                    if (typeof shopId === 'string' && ObjectId.isValid(shopId)) {
                        shopId = new ObjectId(shopId);
                    }

                    return {
                        product_id: productId,
                        shop_id: shopId,
                        product_name: String(item.product_name || item.name || ''), // КРИТИЧНО: product_name
                        price: parseFloat(item.price || 0),
                        quantity: parseInt(item.quantity || 1),
                        subtotal: parseFloat(item.subtotal || (item.price * item.quantity) || 0) // КРИТИЧНО: subtotal
                    };
                } catch (err) {
                    console.error('Error processing item:', err);
                    return {
                        product_id: item.product_id,
                        shop_id: item.shop_id,
                        product_name: String(item.product_name || item.name || ''),
                        price: parseFloat(item.price || 0),
                        quantity: parseInt(item.quantity || 1),
                        subtotal: parseFloat(item.subtotal || (item.price * item.quantity) || 0)
                    };
                }
            });

            const result = await db.collection('orders').insertOne(order);
            
            if (!result.insertedId) {
                throw new Error('Failed to insert order into database');
            }

            const createdOrder = await db.collection('orders').findOne({ _id: result.insertedId });

            res.status(201).json({
                success: true,
                data: createdOrder
            });
        }

    } catch (error) {
        console.error('Error creating order:', error);
        
        let errorMessage = 'Error creating order';
        
        if (error.message.includes('Document failed validation')) {
            errorMessage = 'Order data does not match database schema requirements';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// SEARCH API
app.get('/api/search', async (req, res) => {
    try {
        const { q: query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const [shopsResult, productsResult] = await Promise.all([
            getData('shops'),
            getData('products')
        ]);

        // Filter results based on query
        const shops = shopsResult.success ? shopsResult.data.filter(shop =>
            shop.name.toLowerCase().includes(query.toLowerCase()) ||
            shop.address.street.toLowerCase().includes(query.toLowerCase())
        ) : [];

        const products = productsResult.success ? productsResult.data.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        ) : [];

        res.json({
            success: true,
            data: { shops, products }
        });

    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing search',
            error: error.message
        });
    }
});

// STATISTICS API
app.get('/api/stats', async (req, res) => {
    try {
        if (useDemoMode) {
            res.json({
                success: true,
                data: {
                    totalShops: demoData.shops.length,
                    totalProducts: demoData.products.length,
                    totalOrders: demoData.orders.length,
                    activeShops: demoData.shops.filter(s => s.is_active).length,
                    availableProducts: demoData.products.filter(p => p.is_available).length
                }
            });
        } else {
            const [totalShops, totalProducts, totalOrders, activeShops, availableProducts] = await Promise.all([
                db.collection('shops').countDocuments(),
                db.collection('products').countDocuments(),
                db.collection('orders').countDocuments(),
                db.collection('shops').countDocuments({ is_active: true }),
                db.collection('products').countDocuments({ is_available: true })
            ]);

            res.json({
                success: true,
                data: {
                    totalShops,
                    totalProducts,
                    totalOrders,
                    activeShops,
                    availableProducts
                }
            });
        }

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
async function startServer() {
    try {
        await connectToDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`🔌 API: http://localhost:${PORT}/api`);
            console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);

            if (useDemoMode) {
                console.log('🎭 Running in DEMO MODE with test data');
                console.log('💡 To use real database, check MongoDB connection');
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    if (client && !useDemoMode) {
        await client.close();
        console.log('📊 MongoDB connection closed');
    }
    process.exit(0);
});

// Start the server
startServer();
