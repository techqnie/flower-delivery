// Enhanced Order Page JavaScript with Cart Management
class OrderManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('flowerCart')) || [];
        this.currentOrder = null;
        this.districts = {
            'Київ': ['Шевченківський', 'Печерський', 'Подільський', 'Оболонський', 'Соломянський', 
                     'Святошинський', 'Голосіївський', 'Дарницький', 'Деснянський', 'Дніпровський'],
        };

        this.init();
    }

    init() {
        console.log('🛒 Initializing Order Manager...');
        this.loadOrderItems();
        this.setupEventListeners();
        this.setupFormValidation();
        this.setMinDeliveryDate();
        this.updateCartCount();
        this.checkCartStatus();
    }

    setupEventListeners() {
        // City change handler
        const citySelect = document.getElementById('city');
        if (citySelect) {
            citySelect.addEventListener('change', (e) => {
                this.updateDistricts(e.target.value);
            });
        }

        // Form submission
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleOrderSubmit();
            });
        }

        // Phone input formatting
        const phoneInput = document.getElementById('customerPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', this.formatPhoneNumber);
        }

        // Back button functionality
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Success modal close
        const successModal = document.getElementById('successModal');
        if (successModal) {
            const modalOverlay = successModal.querySelector('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.addEventListener('click', () => {
                    this.closeSuccessModal();
                });
            }
        }
    }

    setupFormValidation() {
        const form = document.getElementById('orderForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    this.validateField(input);
                }
                this.updateSubmitButton();
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                errorMessage = 'Введіть правильний email';
                break;

            case 'tel':
                const phoneRegex = /^\+380[0-9]{9}$/;
                isValid = phoneRegex.test(value);
                errorMessage = 'Введіть номер у форматі +380XXXXXXXXX';
                break;

            case 'text':
                if (field.name === 'name') {
                    isValid = value.length >= 2;
                    errorMessage = 'Мінімум 2 символи';
                } else if (field.name === 'street') {
                    isValid = value.length >= 5;
                    errorMessage = 'Введіть повну адресу';
                } else {
                    isValid = value !== '';
                    errorMessage = 'Поле обов\'язкове для заповнення';
                }
                break;

            case 'date':
                const selectedDate = new Date(value);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                isValid = selectedDate >= tomorrow;
                errorMessage = 'Дата доставки має бути не раніше завтра';
                break;

            default:
                if (field.tagName === 'SELECT') {
                    isValid = value !== '';
                    errorMessage = 'Виберіть значення';
                } else {
                    isValid = value !== '';
                    errorMessage = 'Поле обов\'язкове для заповнення';
                }
        }

        this.updateFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    updateFieldValidation(field, isValid, errorMessage) {
        const errorElement = field.parentNode.querySelector('.field-error');

        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            if (errorElement) {
                errorElement.remove();
            }
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            if (!errorElement) {
                const error = document.createElement('div');
                error.className = 'field-error';
                error.textContent = errorMessage;
                error.style.cssText = `
                    color: var(--accent-color);
                    font-size: 0.8rem;
                    margin-top: 0.25rem;
                    display: block;
                `;
                field.parentNode.appendChild(error);
            } else {
                errorElement.textContent = errorMessage;
            }
        }
    }

    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.startsWith('380')) {
            value = '+' + value;
        } else if (value.startsWith('80')) {
            value = '+3' + value;
        } else if (value.startsWith('0')) {
            value = '+38' + value;
        } else if (value.length > 0 && !value.startsWith('380')) {
            value = '+380' + value;
        }

        // Limit to correct length
        if (value.length > 13) {
            value = value.substr(0, 13);
        }

        e.target.value = value;
    }

    updateDistricts(city) {
        const districtSelect = document.getElementById('district');
        if (!districtSelect || !city) return;

        districtSelect.innerHTML = '<option value="">Оберіть район</option>';

        if (this.districts[city]) {
            this.districts[city].forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                districtSelect.appendChild(option);
            });
        }
    }

    setMinDeliveryDate() {
        const deliveryDateInput = document.getElementById('deliveryDate');
        if (!deliveryDateInput) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');

        deliveryDateInput.min = `${year}-${month}-${day}`;
        deliveryDateInput.value = `${year}-${month}-${day}`;
    }

    checkCartStatus() {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const emptyCart = document.getElementById('emptyCart');
        const orderTotals = document.getElementById('orderTotals');

        if (this.cart.length === 0) {
            if (placeOrderBtn) placeOrderBtn.disabled = true;
            if (emptyCart) emptyCart.style.display = 'block';
            if (orderTotals) orderTotals.style.display = 'none';
        } else {
            if (emptyCart) emptyCart.style.display = 'none';
            if (orderTotals) orderTotals.style.display = 'block';
            this.updateSubmitButton();
        }
    }

    updateSubmitButton() {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (!placeOrderBtn) return;

        const form = document.getElementById('orderForm');
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let allValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim() || field.classList.contains('invalid')) {
                allValid = false;
            }
        });

        placeOrderBtn.disabled = !allValid || this.cart.length === 0;
    }

    async loadOrderItems() {
        console.log('📦 Loading order items...');
        const orderItemsContainer = document.getElementById('orderItems');
        const subtotalElement = document.getElementById('subtotal');
        const totalAmountElement = document.getElementById('totalAmount');
        const deliveryFeeElement = document.getElementById('deliveryFee');

        if (!orderItemsContainer) return;

        if (this.cart.length === 0) {
            this.checkCartStatus();
            return;
        }

        let html = '';
        let subtotal = 0;

        for (const item of this.cart) {
            subtotal += item.price * item.quantity;
            html += `
                <div class="order-item" data-item-id="${item.id}" data-shop-id="${item.shopId}">
                    <img src="${item.image || 'https://images.unsplash.com/photo-1518895312237-a20e5ff153cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" 
                         alt="${item.productName}" class="item-image" 
                         onerror="this.src='https://images.unsplash.com/photo-1518895312237-a20e5ff153cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'">
                    <div class="item-info">
                        <div class="item-name">${item.productName}</div>
                        <div class="item-shop">${item.shopName}</div>
                        <div class="item-quantity">
                            <div class="quantity-controls">
                                <button type="button" class="quantity-btn minus" onclick="orderManager.updateItemQuantity('${item.id}', '${item.shopId}', ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-display">Кількість: ${item.quantity}</span>
                                <button type="button" class="quantity-btn plus" onclick="orderManager.updateItemQuantity('${item.id}', '${item.shopId}', ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <div class="item-price">${(item.price * item.quantity).toFixed(2)} ₴</div>
                        <button type="button" class="remove-item-btn" onclick="orderManager.removeItem('${item.id}', '${item.shopId}')" title="Видалити товар">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        orderItemsContainer.innerHTML = html;

        // Update totals
        const deliveryFee = subtotal >= 500 ? 0 : 50;
        const total = subtotal + deliveryFee;

        if (subtotalElement) subtotalElement.textContent = `${subtotal.toFixed(2)} ₴`;
        if (deliveryFeeElement) deliveryFeeElement.textContent = deliveryFee === 0 ? 'Безкоштовно' : `${deliveryFee} ₴`;
        if (totalAmountElement) totalAmountElement.textContent = `${total.toFixed(2)} ₴`;

        this.checkCartStatus();
    }

    updateItemQuantity(productId, shopId, newQuantity) {
        console.log(`🔄 Updating quantity for ${productId} to ${newQuantity}`);

        if (newQuantity <= 0) {
            this.removeItem(productId, shopId);
            return;
        }

        const itemIndex = this.cart.findIndex(item => item.id === productId && item.shopId === shopId);
        if (itemIndex !== -1) {
            this.cart[itemIndex].quantity = newQuantity;
            this.saveCart();
            this.loadOrderItems();
            this.updateCartCount();
            this.showNotification('Кількість товару оновлено', 'success');
        }
    }

    removeItem(productId, shopId) {
        console.log(`🗑️ Removing item ${productId} from cart`);

        const itemIndex = this.cart.findIndex(item => item.id === productId && item.shopId === shopId);
        if (itemIndex !== -1) {
            const itemName = this.cart[itemIndex].productName;
            this.cart.splice(itemIndex, 1);
            this.saveCart();
            this.loadOrderItems();
            this.updateCartCount();
            this.showNotification(`"${itemName}" видалено з кошика`, 'info');
        }
    }

    saveCart() {
        localStorage.setItem('flowerCart', JSON.stringify(this.cart));
        console.log('💾 Cart saved to localStorage');
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`🛒 Cart has ${totalItems} items`);
    }


async handleOrderSubmit() {
    const form = document.getElementById('orderForm');
    const submitBtn = document.getElementById('placeOrderBtn');
    
    if (!form || this.cart.length === 0) {
        this.showNotification('Корзина порожня', 'error');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Оформлення замовлення...';

    try {
        const formData = new FormData(form);
        
        // ВИПРАВЛЕННЯ ВІДПОВІДНО ДО MONGODB СХЕМИ
        const orderData = {
            // customer - ОБОВ'ЯЗКОВО: email, phone, name(опційно)
            customer: {
                email: formData.get('email')?.trim() || '',
                phone: formData.get('phone')?.trim() || '',
                name: formData.get('name')?.trim() || '' // maxLength: 100
            },
            // delivery_address - ОБОВ'ЯЗКОВО: street, city
            delivery_address: {
                street: formData.get('street')?.trim() || '',
                city: formData.get('city')?.trim() || '',
                district: formData.get('district')?.trim() || '',
                apartment: formData.get('apartment')?.trim() || '',
                postal_code: this.formatPostalCode(formData.get('district')), // 5 digits або ""
                notes: formData.get('notes')?.trim()?.substring(0, 500) || '' // maxLength: 500
            },
            // items - КРИТИЧНО: product_name замість name, обов'язковий subtotal
            items: this.cart.map(item => ({
                product_id: item.id || item.product_id || '',
                shop_id: item.shop_id || item.shopId || '',
                 product_name: item.name || item.product_name || item.title || 'Товар без назви', // 
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity) || 1,
                subtotal: parseFloat((item.price * item.quantity).toFixed(2)) // ДОДАНО: обов'язкове поле
            })),
            total_amount: parseFloat(
                (this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                 (this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) >= 1000 ? 0 : 50)).toFixed(2)
            ),
            // Опціональні поля
            currency: 'UAH', // enum: ['UAH', 'USD', 'EUR']
            status: 'pending', // enum: ['pending', 'confirmed', ...]
            delivery_date: new Date(formData.get('deliveryDate') || new Date()), // bsonType: date
            special_instructions: formData.get('notes')?.trim()?.substring(0, 1000) || '', // maxLength: 1000
            created_at: new Date(), // bsonType: date
            updated_at: new Date() // bsonType: date
        };

        // Валідація відповідно до схеми
        if (!this.validateOrderData(orderData)) {
            return;
        }

        console.log('📦 Sending order data:', orderData);

        // Send to API
        const response = await window.flowerAPI.createOrder(orderData);

        if (response.success) {
            console.log('✅ Order created:', response.data);
            
            // Clear cart
            localStorage.removeItem('flowerCart');
            this.cart = [];
            
            // Show success modal
            this.showSuccessModal(response.data.order_number);
        } else {
            throw new Error(response.message || 'Failed to create order');
        }

    } catch (error) {
        console.error('❌ Order submission error:', error);
        
        let errorMessage = 'Помилка при створенні замовлення. Спробуйте ще раз.';
        
        if (error.message.includes('validation')) {
            errorMessage = 'Дані не відповідають вимогам. Перевірте заповнення форми.';
        }
        
        this.showNotification(errorMessage, 'error');
        
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Підтвердити замовлення';
    }
}

// ДОДАЙТЕ ЦІ НОВІ МЕТОДИ:
formatPostalCode(district) {
    // Генеруємо 5-значний поштовий код або повертаємо пусту стрічку
    const postalCodes = {
        'Шевченківський': '01001',
        'Печерський': '01010', 
        'Подільський': '04070',
        'Оболонський': '04210',
        'Соломянський': '03110',
        'Святошинський': '02000',
        'Голосіївський': '03039',
        'Дарницький': '02094',
        'Деснянський': '02000',
        'Дніпровський': '02094'
    };
    return postalCodes[district] || '';
}

validateOrderData(orderData) {
    // Валідація email pattern
    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(orderData.customer.email)) {
        this.showNotification('Неправильний формат email', 'error');
        return false;
    }

    // Валідація phone pattern
    const phonePattern = /^\+380[0-9]{9}$/;
    if (!phonePattern.test(orderData.customer.phone)) {
        this.showNotification('Номер телефону має бути у форматі +380XXXXXXXXX', 'error');
        return false;
    }

    // Валідація name maxLength
    if (orderData.customer.name && orderData.customer.name.length > 100) {
        this.showNotification('Ім\'я не може бути довшим за 100 символів', 'error');
        return false;
    }

    // Валідація обов'язкових полів delivery_address
    if (!orderData.delivery_address.street) {
        this.showNotification('Вкажіть вулицю доставки', 'error');
        return false;
    }

    if (!orderData.delivery_address.city) {
        this.showNotification('Вкажіть місто доставки', 'error');
        return false;
    }

    // Валідація postal_code pattern (5 digits або пусто)
    if (orderData.delivery_address.postal_code && !/^[0-9]{5}$/.test(orderData.delivery_address.postal_code)) {
        this.showNotification('Поштовий код має містити рівно 5 цифр', 'error');
        return false;
    }

    // Валідація items
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
        this.showNotification('Корзина не може бути порожньою', 'error');
        return false;
    }

    // Валідація кожного item
    for (const item of orderData.items) {
        if (!item.product_name) {
            this.showNotification('Назва товару відсутня', 'error');
            return false;
        }
        if (typeof item.price !== 'number' || item.price < 0) {
            this.showNotification('Неправильна ціна товару', 'error');
            return false;
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            this.showNotification('Неправильна кількість товару', 'error');
            return false;
        }
        if (typeof item.subtotal !== 'number' || item.subtotal < 0) {
            this.showNotification('Неправильна сума товару', 'error');
            return false;
        }
    }

    return true;
}

// ДОДАЙТЕ ЦІ НОВІ МЕТОДИ:
formatPostalCode(district) {
    // Генеруємо 5-значний поштовий код або повертаємо пусту стрічку
    const postalCodes = {
        'Шевченківський': '01001',
        'Печерський': '01010', 
        'Подільський': '04070',
        'Оболонський': '04210',
        'Соломянський': '03110',
        'Святошинський': '02000',
        'Голосіївський': '03039',
        'Дарницький': '02094',
        'Деснянський': '02000',
        'Дніпровський': '02094'
    };
    return postalCodes[district] || '';
}

validateOrderData(orderData) {
    // Валідація email pattern
    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(orderData.customer.email)) {
        this.showNotification('Неправильний формат email', 'error');
        return false;
    }

    // Валідація phone pattern
    const phonePattern = /^\+380[0-9]{9}$/;
    if (!phonePattern.test(orderData.customer.phone)) {
        this.showNotification('Номер телефону має бути у форматі +380XXXXXXXXX', 'error');
        return false;
    }

    // Валідація name maxLength
    if (orderData.customer.name && orderData.customer.name.length > 100) {
        this.showNotification('Ім\'я не може бути довшим за 100 символів', 'error');
        return false;
    }

    // Валідація обов'язкових полів delivery_address
    if (!orderData.delivery_address.street) {
        this.showNotification('Вкажіть вулицю доставки', 'error');
        return false;
    }

    if (!orderData.delivery_address.city) {
        this.showNotification('Вкажіть місто доставки', 'error');
        return false;
    }

    // Валідація postal_code pattern (5 digits або пусто)
    if (orderData.delivery_address.postal_code && !/^[0-9]{5}$/.test(orderData.delivery_address.postal_code)) {
        this.showNotification('Поштовий код має містити рівно 5 цифр', 'error');
        return false;
    }

    // Валідація items
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
        this.showNotification('Корзина не може бути порожньою', 'error');
        return false;
    }

    // Валідація кожного item
    for (const item of orderData.items) {
        if (!item.product_name) {
            this.showNotification('Назва товару відсутня', 'error');
            return false;
        }
        if (typeof item.price !== 'number' || item.price < 0) {
            this.showNotification('Неправильна ціна товару', 'error');
            return false;
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            this.showNotification('Неправильна кількість товару', 'error');
            return false;
        }
        if (typeof item.subtotal !== 'number' || item.subtotal < 0) {
            this.showNotification('Неправильна сума товару', 'error');
            return false;
        }
    }

    return true;
}




    validateForm(form) {
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    collectOrderData(form) {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Calculate totals
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = subtotal >= 500 ? 0 : 50;
        const total = subtotal + deliveryFee;

        // Створюємо структуру даних відповідно до MongoDB схеми
        const orderData = {
            order_number: this.generateOrderNumber(), // ✅ Додаємо order_number
            customer: {
                name: data.name,
                email: data.email,
                phone: data.phone
            },
            delivery_address: {
                street: data.street,
                apartment: data.apartment || '',
                city: data.city,
                district: data.district || '',
                postal_code: data.postalCode || '',
                notes: data.notes || ''
            },
            items: this.cart.map(item => ({
                product_id: item.id,
                shop_id: item.shopId,
                product_name: item.productName,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            total_amount: total,
            subtotal: subtotal,
            delivery_fee: deliveryFee,
            currency: 'UAH',
            delivery_date: data.deliveryDate ? new Date(data.deliveryDate + 'T12:00:00') : null, // ✅ Виправлено Date
            delivery_time_preference: data.deliveryTime || null,
            special_instructions: data.specialInstructions || '',
            payment_method: 'cash_on_delivery',
            status: 'pending',
            created_at: new Date() // ✅ Змінено на Date об'єкт
        };

        return orderData;
    }

    generateOrderNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const timestamp = now.getTime().toString().slice(-6);
        return `ORD-${year}-${timestamp}`;
    }

    showSuccessModal(orderNumber) {
        const modal = document.getElementById('successModal');
        const orderNumberElement = document.getElementById('orderNumber');

        if (modal && orderNumberElement) {
            orderNumberElement.textContent = orderNumber;
            modal.classList.add('show');

            console.log(`🎉 Success modal shown for order ${orderNumber}`);

            // Auto-hide modal after 15 seconds
            setTimeout(() => {
                this.closeSuccessModal();
            }, 15000);
        }
    }

    closeSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('show');
            // Redirect to homepage after closing
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 300);
        }
    }

    clearCart() {
        this.cart = [];
        localStorage.removeItem('flowerCart');
        this.updateCartCount();
        console.log('🧹 Cart cleared');
    }

    showNotification(message, type = 'info') {
        console.log(`🔔 Notification: ${message} (${type})`);

        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const iconClass = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle'
        }[type] || 'fa-info-circle';

        notification.innerHTML = `
            <i class="fas ${iconClass}"></i>
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
                .notification-error { border-left-color: var(--accent-color); }
                .notification-success { border-left-color: #27ae60; }
                .notification-warning { border-left-color: #f39c12; }
                .notification i:first-child {
                    color: var(--primary-color);
                    font-size: 1.2rem;
                }
                .notification-error i:first-child { color: var(--accent-color); }
                .notification-success i:first-child { color: #27ae60; }
                .notification-warning i:first-child { color: #f39c12; }
                .close-notification {
                    background: none;
                    border: none;
                    color: var(--text-light);
                    cursor: pointer;
                    margin-left: auto;
                    padding: 0.25rem;
                    border-radius: var(--radius-small);
                    transition: all var(--transition-fast);
                }
                .close-notification:hover {
                    color: var(--text-dark);
                    background: var(--light-bg);
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Manual close
        const closeBtn = notification.querySelector('.close-notification');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
    }
}

// Initialize order manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Order Manager...');
    window.orderManager = new OrderManager();
});
