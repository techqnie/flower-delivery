// Fixed API Client for Flower Delivery App with Correct Port
class FlowerAPI {
    constructor() {
        // Auto-detect base URL with correct port
        this.baseURL = this.detectBaseURL();
        this.isDemo = false;

        console.log('🔌 FlowerAPI initialized');
        console.log('📍 Base URL:', this.baseURL);
    }

    detectBaseURL() {
        const { protocol, hostname, port } = window.location;

        // If running on same server (production or local server)
        if (port === '5000' || hostname !== 'localhost') {
            return '/api';
        }

        // Development mode - connect to backend on correct port
        return 'http://localhost:5000/api'; 
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        try {
            console.log(`🔌 API Request: ${options.method || 'GET'} ${url}`);

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            console.log('📡 Response status:', response.status);

            const data = await response.json();

            if (!response.ok) {
                console.error(`❌ API Error (${response.status}):`, data);
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            console.log(`✅ API Success:`, data);
            return data;

        } catch (error) {
            console.error('🚨 API Request failed:', error);

            // If it's a network error, show user-friendly message
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                throw new Error('Не можу підключитися до сервера. Перевірте чи запущений backend на порту 3001.');
            }

            throw error;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            console.log('💓 Health Check:', response);
            return response;
        } catch (error) {
            console.warn('⚠️ Health check failed:', error.message);
            throw error;
        }
    }

    // SHOPS API
    async getShops(params = {}) {
        try {
            let endpoint = '/shops';
            const queryParams = new URLSearchParams();

            if (params.search) queryParams.append('search', params.search);
            if (params.district) queryParams.append('district', params.district);
            if (params.rating) queryParams.append('rating', params.rating);
            if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

            if (queryParams.toString()) {
                endpoint += `?${queryParams.toString()}`;
            }

            return await this.makeRequest(endpoint);
        } catch (error) {
            console.error('Error fetching shops:', error);
            throw error;
        }
    }

    async getShopById(id) {
        try {
            return await this.makeRequest(`/shops/${id}`);
        } catch (error) {
            console.error('Error fetching shop:', error);
            throw error;
        }
    }

    // PRODUCTS API
    async getProducts(params = {}) {
        try {
            let endpoint = '/products';
            const queryParams = new URLSearchParams();

            if (params.shopId) queryParams.append('shop_id', params.shopId);
            if (params.category) queryParams.append('category', params.category);
            if (params.search) queryParams.append('search', params.search);
            if (params.minPrice) queryParams.append('minPrice', params.minPrice);
            if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
            if (params.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable);

            if (queryParams.toString()) {
                endpoint += `?${queryParams.toString()}`;
            }

            return await this.makeRequest(endpoint);
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    async getProductById(id) {
        try {
            return await this.makeRequest(`/products/${id}`);
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    async getRelatedProducts(productId, limit = 4) {
        try {
            return await this.makeRequest(`/products/${productId}/related?limit=${limit}`);
        } catch (error) {
            console.error('Error fetching related products:', error);
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            console.log('📦 Creating order via API:', orderData);

            const response = await this.makeRequest('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            console.log('✅ Order created successfully:', response);
            return response;

        } catch (error) {
            console.error('❌ Error creating order:', error);

            // Enhanced error messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Не можу підключитися до сервера замовлень. Перевірте підключення.');
            } else if (error.message.includes('500')) {
                throw new Error('Помилка сервера при створенні замовлення. Спробуйте ще раз.');
            } else if (error.message.includes('400')) {
                throw new Error('Неправильні дані замовлення. Перевірте заповнення форми.');
            }

            throw error;
        }
    }

    async getOrder(orderId) {
        try {
            return await this.makeRequest(`/orders/${orderId}`);
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    }

    async getOrders(params = {}) {
        try {
            let endpoint = '/orders';
            const queryParams = new URLSearchParams();

            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);

            if (queryParams.toString()) {
                endpoint += `?${queryParams.toString()}`;
            }

            return await this.makeRequest(endpoint);
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    // SEARCH API
    async searchAll(query) {
        try {
            return await this.makeRequest(`/search?q=${encodeURIComponent(query)}`);
        } catch (error) {
            console.error('Error searching:', error);
            throw error;
        }
    }

    // STATISTICS API
    async getStats() {
        try {
            return await this.makeRequest('/stats');
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }

    // Utility methods
    setBaseURL(url) {
        this.baseURL = url;
        console.log(`🔧 API Base URL updated to: ${url}`);
    }

    getConfig() {
        return {
            baseURL: this.baseURL,
            isDemo: this.isDemo,
            timestamp: new Date().toISOString()
        };
    }

    // Connection test method
    async testConnection() {
        try {
            console.log('🧪 Testing API connection...');
            const response = await this.healthCheck();
            console.log('✅ Connection test successful:', response);
            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error.message);
            return false;
        }
    }
}

// Create global API instance
window.flowerAPI = new FlowerAPI();

// Initialize and test connection when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Flower Delivery API...');
    console.log('⚙️ Configuration:', window.flowerAPI.getConfig());

    try {
        const connected = await window.flowerAPI.testConnection();

        if (connected) {
            console.log('✅ API connection successful');
        } else {
            console.error('⚠️ API connection failed');

            // Show user-friendly error message
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ff6b6b;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 9999;
                    max-width: 350px;
                    font-family: system-ui, -apple-system, sans-serif;
                ">
                    <strong>⚠️ Помилка підключення</strong><br>
                    Не можу підключитися до сервера на порту 3001.<br>
                    Перевірте чи запущений backend.
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: 10px;">×</button>
                </div>
            `;
            document.body.appendChild(errorDiv);

            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 10000);
        }
    } catch (error) {
        console.error('⚠️ API initialization failed:', error.message);
    }
});