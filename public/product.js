// Product Page JavaScript
class ProductManager {
    constructor() {
        this.product = null;
        this.shop = null;
        this.currentImageIndex = 0;
        this.quantity = 1;
        this.cart = JSON.parse(localStorage.getItem('flowerCart')) || [];

        this.init();
    }

    init() {
        this.loadProductData();
        this.setupEventListeners();
        this.updateCartCount();
    }

    async loadProductData() {
        try {
            // Get product ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');

            if (!productId) {
                this.showError('Товар не знайдено');
                return;
            }

            // Load product data
            const productResponse = await window.flowerAPI.getProductById(productId);

            if (!productResponse.success) {
                this.showError('Помилка завантаження товару');
                return;
            }

            this.product = productResponse.data;

            // Load shop data
            const shopResponse = await window.flowerAPI.getShopById(this.product.shop_id);
            if (shopResponse.success) {
                this.shop = shopResponse.data;
            }

            // Render product
            this.renderProduct();
            this.loadRelatedProducts();

        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Помилка завантаження даних');
        }
    }

    renderProduct() {
        if (!this.product) return;

        // Update page title
        document.title = `${this.product.name} - FlowerDelivery`;

        // Update breadcrumbs
        this.updateBreadcrumbs();

        // Update product info
        this.updateProductInfo();

        // Update gallery
        this.updateGallery();

        // Update shop info
        this.updateShopInfo();
    }

    updateBreadcrumbs() {
        const shopBreadcrumb = document.getElementById('shopBreadcrumb');
        const productBreadcrumb = document.getElementById('productBreadcrumb');

        if (shopBreadcrumb && this.shop) {
            shopBreadcrumb.textContent = this.shop.name;
            shopBreadcrumb.href = `index.html?shop=${this.shop._id}`;
        }

        if (productBreadcrumb) {
            productBreadcrumb.textContent = this.product.name;
        }
    }

    updateProductInfo() {
        const elements = {
            productName: document.getElementById('productName'),
            currentPrice: document.getElementById('currentPrice'),
            productDescription: document.getElementById('productDescription'),
            stockInfo: document.getElementById('stockInfo'),
            specList: document.getElementById('specList')
        };

        if (elements.productName) {
            elements.productName.textContent = this.product.name;
        }

        if (elements.currentPrice) {
            elements.currentPrice.textContent = `${this.product.price} ₴`;
        }

        if (elements.productDescription) {
            elements.productDescription.textContent = this.product.description;
        }

        if (elements.stockInfo) {
            elements.stockInfo.textContent = `В наявності: ${this.product.stock_quantity} шт.`;
            elements.stockInfo.className = this.product.stock_quantity > 0 ? 'stock-info in-stock' : 'stock-info out-of-stock';
        }

        if (elements.specList && this.product.specifications) {
            let specsHtml = '';
            Object.entries(this.product.specifications).forEach(([key, value]) => {
                const label = this.getSpecLabel(key);
                specsHtml += `
                    <div class="spec-item">
                        <span class="spec-label">${label}:</span>
                        <span class="spec-value">${value}</span>
                    </div>
                `;
            });
            elements.specList.innerHTML = specsHtml;
        }

        // Update quantity input max value
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            quantityInput.max = this.product.stock_quantity;
        }

        // Update add to cart button state
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            if (this.product.stock_quantity === 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.innerHTML = '<i class="fas fa-times"></i> Немає в наявності';
            } else {
                addToCartBtn.disabled = false;
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Додати в кошик';
            }
        }
    }

    getSpecLabel(key) {
        const labels = {
            flower_type: 'Тип квітки',
            color: 'Колір',
            quantity: 'Кількість',
            size: 'Розмір',
            height: 'Висота',
            packaging: 'Упаковка',
            care_instructions: 'Догляд'
        };
        return labels[key] || key;
    }

    updateGallery() {
        const mainImage = document.getElementById('mainImage');
        const thumbnailsContainer = document.getElementById('thumbnails');

        if (!this.product.images || this.product.images.length === 0) {
            const defaultImage = 'https://via.placeholder.com/600x600?text=No+Image';
            if (mainImage) {
                mainImage.src = defaultImage;
                mainImage.alt = this.product.name;
            }
            return;
        }

        // Set main image
        if (mainImage) {
            mainImage.src = this.product.images[this.currentImageIndex];
            mainImage.alt = this.product.name;
        }

        // Create thumbnails
        if (thumbnailsContainer && this.product.images.length > 1) {
            let thumbnailsHtml = '';
            this.product.images.forEach((image, index) => {
                thumbnailsHtml += `
                    <div class="thumbnail ${index === this.currentImageIndex ? 'active' : ''}" 
                         data-index="${index}">
                        <img src="${image}" alt="${this.product.name}">
                    </div>
                `;
            });
            thumbnailsContainer.innerHTML = thumbnailsHtml;
        }
    }

    updateShopInfo() {
        if (!this.shop) return;

        const elements = {
            shopImage: document.getElementById('shopImage'),
            shopName: document.getElementById('shopName'),
            shopRating: document.getElementById('shopRating'),
            shopRatingText: document.getElementById('shopRatingText'),
            shopAddress: document.getElementById('shopAddress'),
            deliveryTime: document.getElementById('deliveryTime')
        };

        if (elements.shopImage) {
            elements.shopImage.src = this.shop.image_url || 'https://via.placeholder.com/80x80';
            elements.shopImage.alt = this.shop.name;
        }

        if (elements.shopName) {
            elements.shopName.textContent = this.shop.name;
        }

        if (elements.shopRating) {
            elements.shopRating.innerHTML = this.generateStars(this.shop.rating);
        }

        if (elements.shopRatingText) {
            elements.shopRatingText.textContent = this.shop.rating.toFixed(1);
        }

        if (elements.shopAddress) {
            elements.shopAddress.textContent = `${this.shop.address.street}, ${this.shop.address.district}`;
        }

        if (elements.deliveryTime) {
            // Calculate delivery time based on shop (this would come from the shop data in real app)
            const deliveryTime = this.calculateDeliveryTime();
            elements.deliveryTime.textContent = deliveryTime;
        }
    }

    generateStars(rating) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }

        return starsHtml;
    }

    calculateDeliveryTime() {
        // This would be calculated based on shop location, current time, etc.
        return '30-60 хвилин';
    }

    async loadRelatedProducts() {
        try {
            const response = await window.flowerAPI.getRelatedProducts(this.product._id, 4);

            if (response.success && response.data.length > 0) {
                this.renderRelatedProducts(response.data);
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }

    renderRelatedProducts(products) {
        const container = document.getElementById('relatedProducts');
        if (!container) return;

        let html = '';
        products.forEach(product => {
            html += `
                <div class="related-product-card" data-product-id="${product._id}">
                    <img src="${product.images?.[0] || 'https://via.placeholder.com/250x200'}" 
                         alt="${product.name}" class="related-product-image">
                    <div class="related-product-info">
                        <h4 class="related-product-name">${product.name}</h4>
                        <div class="related-product-price">${product.price} ₴</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    setupEventListeners() {
        // Thumbnail clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.thumbnail')) {
                const thumbnail = e.target.closest('.thumbnail');
                const index = parseInt(thumbnail.dataset.index);
                this.changeImage(index);
            }
        });

        // Quantity controls
        const decreaseBtn = document.getElementById('decreaseBtn');
        const increaseBtn = document.getElementById('increaseBtn');
        const quantityInput = document.getElementById('quantityInput');

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                this.changeQuantity(-1);
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                this.changeQuantity(1);
            });
        }

        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                this.quantity = parseInt(e.target.value) || 1;
                this.validateQuantity();
            });
        }

        // Add to cart
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                this.addToCart();
            });
        }

        // Wishlist toggle
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                this.toggleWishlist();
            });
        }

        // Share product
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareProduct();
            });
        }

        // Shop actions
        const viewShopBtn = document.getElementById('viewShopBtn');
        const callShopBtn = document.getElementById('callShopBtn');

        if (viewShopBtn) {
            viewShopBtn.addEventListener('click', () => {
                window.location.href = `index.html?shop=${this.shop._id}`;
            });
        }

        if (callShopBtn) {
            callShopBtn.addEventListener('click', () => {
                if (this.shop && this.shop.phone) {
                    window.open(`tel:${this.shop.phone}`);
                }
            });
        }

        // Image zoom
        const zoomBtn = document.querySelector('.zoom-btn');
        const zoomModal = document.getElementById('zoomModal');
        const closeZoom = document.querySelector('.close-zoom');

        if (zoomBtn) {
            zoomBtn.addEventListener('click', () => {
                this.openImageZoom();
            });
        }

        if (closeZoom) {
            closeZoom.addEventListener('click', () => {
                this.closeImageZoom();
            });
        }

        if (zoomModal) {
            zoomModal.addEventListener('click', (e) => {
                if (e.target === zoomModal || e.target.classList.contains('zoom-overlay')) {
                    this.closeImageZoom();
                }
            });
        }

        // Related products click
        document.addEventListener('click', (e) => {
            if (e.target.closest('.related-product-card')) {
                const card = e.target.closest('.related-product-card');
                const productId = card.dataset.productId;
                window.location.href = `product.html?id=${productId}`;
            }
        });

        // Cart button
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                window.location.href = 'order.html';
            });
        }
    }

    changeImage(index) {
        if (!this.product.images || index < 0 || index >= this.product.images.length) return;

        this.currentImageIndex = index;

        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = this.product.images[index];
        }

        // Update thumbnails
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    changeQuantity(change) {
        const newQuantity = this.quantity + change;

        if (newQuantity >= 1 && newQuantity <= this.product.stock_quantity) {
            this.quantity = newQuantity;
            const quantityInput = document.getElementById('quantityInput');
            if (quantityInput) {
                quantityInput.value = this.quantity;
            }
        }
    }

    validateQuantity() {
        if (this.quantity < 1) {
            this.quantity = 1;
        } else if (this.quantity > this.product.stock_quantity) {
            this.quantity = this.product.stock_quantity;
        }

        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            quantityInput.value = this.quantity;
        }
    }

    addToCart() {
        if (!this.product || this.product.stock_quantity === 0) return;

        const cartItem = {
            id: this.product._id,
            shopId: this.product.shop_id,
            shopName: this.shop ? this.shop.name : 'Невідомий магазин',
            productName: this.product.name,
            price: this.product.price,
            image: this.product.images?.[0] || 'https://via.placeholder.com/60x60',
            quantity: this.quantity
        };

        const existingItemIndex = this.cart.findIndex(item => 
            item.id === cartItem.id && item.shopId === cartItem.shopId
        );

        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += this.quantity;
        } else {
            this.cart.push(cartItem);
        }

        this.saveCart();
        this.updateCartCount();
        this.showAddToCartNotification();
    }

    saveCart() {
        localStorage.setItem('flowerCart', JSON.stringify(this.cart));
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    showAddToCartNotification() {
        const notification = document.createElement('div');
        notification.className = 'add-to-cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Товар додано в кошик</span>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            background: 'var(--primary-color)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-small)',
            boxShadow: 'var(--shadow-medium)',
            zIndex: '3000',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'slideInRight 0.3s ease'
        });

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);

        // Animate cart button
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                cartBtn.style.animation = '';
            }, 300);
        }
    }

    toggleWishlist() {
        // Wishlist functionality would be implemented here
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (wishlistBtn) {
            const isActive = wishlistBtn.classList.contains('active');
            if (isActive) {
                wishlistBtn.classList.remove('active');
                wishlistBtn.style.color = 'var(--text-light)';
            } else {
                wishlistBtn.classList.add('active');
                wishlistBtn.style.color = 'var(--accent-color)';
            }
        }
    }

    shareProduct() {
        if (navigator.share) {
            navigator.share({
                title: this.product.name,
                text: this.product.description,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('Посилання скопійовано в буфер обміну');
            });
        }
    }

    openImageZoom() {
        const zoomModal = document.getElementById('zoomModal');
        const zoomedImage = document.getElementById('zoomedImage');

        if (zoomModal && zoomedImage && this.product.images) {
            zoomedImage.src = this.product.images[this.currentImageIndex];
            zoomModal.classList.add('show');
        }
    }

    closeImageZoom() {
        const zoomModal = document.getElementById('zoomModal');
        if (zoomModal) {
            zoomModal.classList.remove('show');
        }
    }

    showError(message) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 1rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-color);"></i>
                <h2>Помилка</h2>
                <p>${message}</p>
                <a href="index.html" class="btn btn-primary">Повернутись до магазинів</a>
            </div>
        `;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            background: 'var(--primary-color)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-small)',
            zIndex: '3000',
            animation: 'slideInRight 0.3s ease'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});