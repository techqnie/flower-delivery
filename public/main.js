// Working Main Page JavaScript
class FlowerShopsApp {
    constructor() {
        this.shops = [];
        this.products = [];
        this.filteredShops = [];
        this.cart = JSON.parse(localStorage.getItem('flowerCart')) || [];
        this.currentView = 'grid';
        this.currentFilter = 'all';
        this.currentShop = null;
        this.isLoading = false;

        this.init();
    }

    async init() {
        console.log('🌸 Initializing Flower Shops App...');

        this.setupEventListeners();
        this.updateCartUI();
        this.handleScrollEffects();

        // Load data with error handling
        await this.loadData();
    }

    async loadData() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            console.log('📡 Loading shops and products...');

            // Load shops and products from API
            const [shopsResponse, productsResponse] = await Promise.all([
                window.flowerAPI.getShops({ isActive: true }),
                window.flowerAPI.getProducts({ isAvailable: true })
            ]);

            if (shopsResponse && shopsResponse.success) {
                this.shops = shopsResponse.data || [];
                this.filteredShops = [...this.shops];
                console.log(`✅ Loaded ${this.shops.length} shops`);
            } else {
                throw new Error('Failed to load shops data');
            }

            if (productsResponse && productsResponse.success) {
                this.products = productsResponse.data || [];
                console.log(`✅ Loaded ${this.products.length} products`);
            } else {
                console.warn('⚠️  Failed to load products, continuing without them');
                this.products = [];
            }

            this.renderShops();
            this.updateStats();

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError(error.message || 'Помилка завантаження даних');
        } finally {
            this.showLoading(false);
            this.isLoading = false;
        }
    }

    updateStats() {
        const totalShopsElement = document.getElementById('totalShops');
        const totalProductsElement = document.getElementById('totalProducts');

        if (totalShopsElement) {
            totalShopsElement.textContent = `${this.shops.length}+`;
        }

        if (totalProductsElement) {
            totalProductsElement.textContent = `${this.products.length}+`;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e.target.dataset.filter);
                this.updateActiveFilter(e.target);
            });
        });

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleViewChange(e.target.dataset.view);
                this.updateActiveView(e.target);
            });
        });

        // Cart functionality
        const cartBtn = document.querySelector('.cart-btn');
        const closeCart = document.querySelector('.close-cart');
        const overlay = document.getElementById('overlay');

        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.cart.length > 0) {
                    window.location.href = 'order.html';
                } else {
                    this.toggleCart();
                }
            });
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => this.closeCart());
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeCart();
                this.closeShopModal();
            });
        }

        // Mobile menu
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu);
        }
    }

    handleSearch(query) {
        const lowercaseQuery = query.toLowerCase().trim();

        if (lowercaseQuery === '') {
            this.filteredShops = [...this.shops];
        } else {
            this.filteredShops = this.shops.filter(shop => 
                shop.name.toLowerCase().includes(lowercaseQuery) ||
                shop.address.street.toLowerCase().includes(lowercaseQuery) ||
                shop.address.district.toLowerCase().includes(lowercaseQuery) ||
                shop.email.toLowerCase().includes(lowercaseQuery)
            );
        }

        this.renderShops();
    }

    handleFilter(filter) {
        this.currentFilter = filter;

        switch (filter) {
            case 'all':
                this.filteredShops = [...this.shops];
                break;
            case 'rating':
                this.filteredShops = [...this.shops].sort((a, b) => b.rating - a.rating);
                break;
            case 'district':
                this.filteredShops = [...this.shops].sort((a, b) => 
                    a.address.district.localeCompare(b.address.district, 'uk')
                );
                break;
            case 'delivery':
                this.filteredShops = this.shops.filter(shop => 
                    shop.working_hours.monday.includes('20:00') || 
                    shop.working_hours.monday.includes('22:00')
                );
                break;
        }
        this.renderShops();
    }

    handleViewChange(view) {
        this.currentView = view;
        const grid = document.getElementById('shopsGrid');
        if (grid) {
            if (view === 'list') {
                grid.classList.add('list-view');
            } else {
                grid.classList.remove('list-view');
            }
        }
    }

    updateActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    updateActiveView(activeBtn) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    showLoading(show) {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            if (show) {
                loading.classList.add('show');
            } else {
                loading.classList.remove('show');
            }
        }
    }

    renderShops() {
        const grid = document.getElementById('shopsGrid');
        const noResults = document.getElementById('noResults');

        if (!grid) return;

        if (this.filteredShops.length === 0) {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        grid.innerHTML = '';

        this.filteredShops.forEach((shop, index) => {
            const shopCard = this.createShopCard(shop, index);
            grid.appendChild(shopCard);
        });
    }

    createShopCard(shop, index) {
        const card = document.createElement('div');
        card.className = 'shop-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const isOpen = this.isShopOpen(shop.working_hours);
        const statusClass = isOpen ? 'open' : 'closed';
        const statusText = isOpen ? 'Відкрито' : 'Зачинено';

        // Get shop's products count
        const shopProductsCount = this.products.filter(p => p.shop_id === shop._id).length;

        // Default image if no image provided
        const shopImage = shop.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';

        card.innerHTML = `
            <div class="shop-image">
                <img src="${shopImage}" 
                     alt="${shop.name}" 
                     onload="this.style.opacity=1" 
                     onerror="this.src='https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'"
                     style="opacity:0;transition:opacity 0.3s ease;width:100%;height:200px;object-fit:cover;">
                <div class="shop-status ${statusClass}">${statusText}</div>
            </div>
            <div class="shop-info">
                <div class="shop-header">
                    <div>
                        <h3 class="shop-name">${shop.name}</h3>
                        <div class="shop-rating">
                            <i class="fas fa-star"></i>
                            <span>${shop.rating}</span>
                        </div>
                    </div>
                </div>
                <div class="shop-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${shop.address.street}, ${shop.address.district}</span>
                </div>
                <div class="shop-contact">
                    <i class="fas fa-phone"></i>
                    <span>${shop.phone}</span>
                </div>
                <div class="shop-features">
                    <span class="feature-tag">${shopProductsCount} товарів</span>
                    <span class="feature-tag">${shop.address.district}</span>
                    ${isOpen ? '<span class="feature-tag delivery-tag">Доставка</span>' : ''}
                </div>
                <div class="shop-actions">
                    <button class="btn btn-primary" onclick="window.app.viewShop('${shop._id}')">
                        <i class="fas fa-eye"></i>
                        Переглянути товари
                    </button>
                    <button class="btn btn-secondary" onclick="window.app.callShop('${shop.phone}')">
                        <i class="fas fa-phone"></i>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    isShopOpen(workingHours) {
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const todayHours = workingHours[currentDay];
        if (todayHours === 'выходной' || !todayHours) return false;

        const [openTime, closeTime] = todayHours.split('-').map(time => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 100 + minutes;
        });

        return currentTime >= openTime && currentTime <= closeTime;
    }

    async viewShop(shopId) {
        try {
            const shop = this.shops.find(s => s._id === shopId);
            if (!shop) {
                this.showNotification('Магазин не знайдено', 'error');
                return;
            }

            this.currentShop = shop;

            // Get shop products
            const productsResponse = await window.flowerAPI.getProducts({ 
                shopId: shopId, 
                isAvailable: true 
            });

            const shopProducts = productsResponse && productsResponse.success ? productsResponse.data : [];

            this.showShopModal(shop, shopProducts);

        } catch (error) {
            console.error('Error loading shop details:', error);
            this.showNotification('Помилка завантаження даних магазину', 'error');
        }
    }

    showShopModal(shop, products) {
        const modal = document.getElementById('shopModal');
        const modalShopName = document.getElementById('modalShopName');
        const modalShopDetails = document.getElementById('modalShopDetails');
        const modalProductsGrid = document.getElementById('modalProductsGrid');
        const overlay = document.getElementById('overlay');

        if (!modal) return;

        // Update shop name
        if (modalShopName) {
            modalShopName.textContent = shop.name;
        }

        // Update shop details
        if (modalShopDetails) {
            modalShopDetails.innerHTML = `
                <div class="shop-info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${shop.address.street}, ${shop.address.district}, ${shop.address.city}</span>
                </div>
                <div class="shop-info-row">
                    <i class="fas fa-phone"></i>
                    <span>${shop.phone}</span>
                </div>
                <div class="shop-info-row">
                    <i class="fas fa-envelope"></i>
                    <span>${shop.email}</span>
                </div>
                <div class="shop-info-row">
                    <i class="fas fa-star"></i>
                    <span>Рейтинг: ${shop.rating}/5</span>
                </div>
                <div class="shop-info-row">
                    <i class="fas fa-clock"></i>
                    <span>Графік: ${this.formatWorkingHours(shop.working_hours)}</span>
                </div>
            `;
        }

        // Update products
        if (modalProductsGrid) {
            if (products.length === 0) {
                modalProductsGrid.innerHTML = '<p class="no-products">У цьому магазині поки немає товарів</p>';
            } else {
                modalProductsGrid.innerHTML = products.map(product => `
                    <div class="product-card" onclick="window.app.viewProduct('${product._id}')">
                        <img src="${product.images?.[0] || 'https://via.placeholder.com/200x150'}" 
                             alt="${product.name}" 
                             class="product-image"
                             onload="this.style.opacity=1" 
                             onerror="this.src='https://via.placeholder.com/200x150'"
                             style="opacity:0;transition:opacity 0.3s ease;">
                        <div class="product-info">
                            <h4 class="product-name">${product.name}</h4>
                            <div class="product-price">${product.price} ₴</div>
                            <div class="product-category">${this.getCategoryName(product.category)}</div>
                            <button class="btn btn-primary add-to-cart" 
                                    onclick="event.stopPropagation(); window.app.addToCart('${product._id}', '${shop._id}')">
                                <i class="fas fa-shopping-cart"></i>
                                Додати в кошик
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Show modal
        modal.style.display = 'flex';
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    formatWorkingHours(workingHours) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

        // Simple format - just show Monday hours as example
        return workingHours.monday || 'Уточнюйте';
    }

    getCategoryName(category) {
        const categories = {
            'bouquet': 'Букет',
            'single_flower': 'Окрема квітка',
            'arrangement': 'Композиція',
            'plant': 'Рослина'
        };
        return categories[category] || category;
    }

    closeShopModal() {
        const modal = document.getElementById('shopModal');
        const overlay = document.getElementById('overlay');

        if (modal) {
            modal.style.display = 'none';
        }
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    viewProduct(productId) {
        window.location.href = `product.html?id=${productId}`;
    }

    async addToCart(productId, shopId) {
        try {
            const product = this.products.find(p => p._id === productId);
            const shop = this.shops.find(s => s._id === shopId);

            if (!product || !shop) {
                this.showNotification('Товар не знайдено', 'error');
                return;
            }

            if (product.stock_quantity === 0) {
                this.showNotification('Товар закінчився', 'error');
                return;
            }

            const cartItem = {
                id: productId,
                shopId: shopId,
                shopName: shop.name,
                productName: product.name,
                price: product.price,
                image: product.images?.[0] || 'https://via.placeholder.com/60x60',
                quantity: 1
            };

            const existingItem = this.cart.find(item => 
                item.id === productId && item.shopId === shopId
            );

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.cart.push(cartItem);
            }

            this.saveCart();
            this.updateCartUI();
            this.showAddToCartAnimation();
            this.showNotification('Товар додано в кошик', 'success');

        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Помилка додавання товару', 'error');
        }
    }

    removeFromCart(productId, shopId) {
        this.cart = this.cart.filter(item => 
            !(item.id === productId && item.shopId === shopId)
        );
        this.saveCart();
        this.updateCartUI();
    }

    updateCartQuantity(productId, shopId, newQuantity) {
        const item = this.cart.find(item => 
            item.id === productId && item.shopId === shopId
        );

        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId, shopId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const cartEmpty = document.getElementById('cartEmpty');

        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }

        if (cartItems && cartTotal) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `${total} ₴`;

            if (this.cart.length === 0) {
                if (cartEmpty) cartEmpty.style.display = 'block';
                cartItems.innerHTML = '';
            } else {
                if (cartEmpty) cartEmpty.style.display = 'none';
                cartItems.innerHTML = this.cart.map(item => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.productName}" class="cart-item-image">
                        <div class="cart-item-info">
                            <h4 class="cart-item-name">${item.productName}</h4>
                            <p class="cart-item-shop">${item.shopName}</p>
                            <div class="cart-item-controls">
                                <button class="quantity-btn" onclick="window.app.updateCartQuantity('${item.id}', '${item.shopId}', ${item.quantity - 1})">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="quantity-btn" onclick="window.app.updateCartQuantity('${item.id}', '${item.shopId}', ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="cart-item-price">
                            <span>${item.price * item.quantity} ₴</span>
                            <button class="remove-item" onclick="window.app.removeFromCart('${item.id}', '${item.shopId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    saveCart() {
        localStorage.setItem('flowerCart', JSON.stringify(this.cart));
    }

    toggleCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');

        if (sidebar && overlay) {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        }
    }

    closeCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');

        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        }
    }

    showAddToCartAnimation() {
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                cartBtn.style.animation = '';
            }, 300);
        }
    }

    callShop(phone) {
        window.open(`tel:${phone}`);
    }

    toggleMobileMenu() {
        console.log('Mobile menu toggled');
    }

    handleScrollEffects() {
        const header = document.querySelector('.header');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header?.classList.add('scrolled');
            } else {
                header?.classList.remove('scrolled');
            }
        });

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, observerOptions);

        // Observe shop cards for scroll animations
        setTimeout(() => {
            document.querySelectorAll('.shop-card').forEach(card => {
                observer.observe(card);
            });
        }, 100);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="close-notification">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not exists
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: white;
                    color: var(--text-dark);
                    padding: 1rem 1.5rem;
                    border-radius: var(--radius-small);
                    box-shadow: var(--shadow-medium);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                    border-left: 4px solid var(--primary-color);
                }

                .notification-error {
                    border-left-color: var(--accent-color);
                }

                .notification-success {
                    border-left-color: #27ae60;
                }

                .notification i:first-child {
                    color: var(--primary-color);
                    font-size: 1.2rem;
                }

                .notification-error i:first-child {
                    color: var(--accent-color);
                }

                .notification-success i:first-child {
                    color: #27ae60;
                }

                .close-notification {
                    background: none;
                    border: none;
                    color: var(--text-light);
                    cursor: pointer;
                    margin-left: auto;
                    padding: 0.25rem;
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);

        // Manual close
        const closeBtn = notification.querySelector('.close-notification');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }

    showError(message) {
        const grid = document.getElementById('shopsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-message" style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 4rem 2rem;
                    color: var(--text-light);
                ">
                    <i class="fas fa-exclamation-triangle" style="
                        font-size: 4rem;
                        margin-bottom: 1rem;
                        color: var(--accent-color);
                    "></i>
                    <h3 style="margin-bottom: 1rem; color: var(--text-dark);">Помилка завантаження</h3>
                    <p style="margin-bottom: 2rem;">${message}</p>
                    <button class="btn btn-primary" onclick="window.app.loadData()" style="
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: var(--radius-small);
                        cursor: pointer;
                    ">
                        <i class="fas fa-redo"></i> Спробувати ще раз
                    </button>
                </div>
            `;
        }
    }
}

// Global functions for onclick handlers
window.closeShopModal = function() {
    if (window.app) {
        window.app.closeShopModal();
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Flower Shops App...');
    window.app = new FlowerShopsApp();
});

// ДОДАТИ ДО КІНЦЯ main.js - Виправлення фільтрів

// Override the handleFilter method to fix filter functionality
if (window.app) {
    const originalHandleFilter = window.app.handleFilter;

    window.app.handleFilter = function(filter) {
        console.log('🔧 Filter applied:', filter);
        this.currentFilter = filter;

        let filteredShops = [...this.shops];

        switch (filter) {
            case 'all':
                // Show all shops
                break;
            case 'rating':
                // Sort by rating (highest first)
                filteredShops.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'district':
                // Sort alphabetically by district
                filteredShops.sort((a, b) => {
                    const districtA = a.address?.district || '';
                    const districtB = b.address?.district || '';
                    return districtA.localeCompare(districtB, 'uk');
                });
                break;
            case 'delivery':
                // Show only shops with delivery (extended hours or 24/7)
                filteredShops = filteredShops.filter(shop => {
                    if (!shop.working_hours) return false;
                    const hours = shop.working_hours.monday || shop.working_hours.sunday || '';
                    return hours.includes('20:') || hours.includes('21:') || hours.includes('22:') || hours === '24/7';
                });
                break;
        }

        this.filteredShops = filteredShops;
        this.renderShops();

        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    };

    // Also fix the handleViewChange method
    window.app.handleViewChange = function(view) {
        console.log('🔧 View changed to:', view);
        this.currentView = view;

        const grid = document.getElementById('shopsGrid');
        if (grid) {
            grid.classList.toggle('list-view', view === 'list');
        }

        // Update active view button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    };

    console.log('✅ Filters functionality enhanced');
}

// Enhanced search with better filtering
if (window.app && window.app.handleSearch) {
    const originalHandleSearch = window.app.handleSearch;

    window.app.handleSearch = function(query) {
        console.log('🔍 Search query:', query);
        const lowercaseQuery = query.toLowerCase().trim();

        if (lowercaseQuery === '') {
            this.filteredShops = [...this.shops];
        } else {
            this.filteredShops = this.shops.filter(shop => {
                const name = (shop.name || '').toLowerCase();
                const street = (shop.address?.street || '').toLowerCase();
                const district = (shop.address?.district || '').toLowerCase();
                const email = (shop.email || '').toLowerCase();

                return name.includes(lowercaseQuery) ||
                       street.includes(lowercaseQuery) ||
                       district.includes(lowercaseQuery) ||
                       email.includes(lowercaseQuery);
            });
        }

        this.renderShops();
    };
}
