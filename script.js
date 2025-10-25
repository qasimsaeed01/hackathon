
// Navigation Menu
const menuIcon = document.getElementById('menu-icon');
const menu = document.getElementById('menu');
const cartIcon = document.getElementById('cartIcon');
const cartBadge = document.getElementById('cartBadge');
const loginIcon = document.getElementById('loginIcon');

menuIcon.addEventListener('click', () => {
    menu.classList.toggle('active');
    menuIcon.classList.toggle('fa-xmark');
});

// NEW: Login Icon Click
loginIcon.addEventListener('click', () => {
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
});

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

cartIcon.addEventListener('click', () => {
    updateCartModal();
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    cartModal.show();
});

// Product Slider
const titleEl = document.getElementById("product-title");
const descEl = document.getElementById("product-description");
const imageEl = document.getElementById("product-image");
const heroText = document.getElementById("hero-text");
const heroImg = document.getElementById("hero-img");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");

let products = [];
let index = 0;
let isTransitioning = false;

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("Image failed to load: " + url));
    });
}

async function showProduct(i = index) {
    if (!products.length) return;
    if (isTransitioning) return;

    const item = products[i];
    if (!item) return;

    isTransitioning = true;

    heroText.classList.add("fade");
    heroImg.classList.add("fade");

    await new Promise((r) => setTimeout(r, 300));

    try {
        await preloadImage(item.image);
        imageEl.src = item.image;
    } catch (err) {
        console.warn(err);
        imageEl.src = "";
    }

    titleEl.textContent = item.title;
    descEl.textContent = item.description.substring(0, 120) + '...';

    heroText.classList.remove("fade");
    heroImg.classList.remove("fade");

    setTimeout(() => {
        isTransitioning = false;
    }, 350);
}

async function fetchProducts() {
    try {
        const res = await fetch("https://fakestoreapi.com/products?limit=9");
        if (!res.ok) throw new Error("Network response was not ok");

        products = await res.json();
        if (!Array.isArray(products) || products.length === 0) {
            titleEl.textContent = "No products found";
            descEl.textContent = "";
            return;
        }

        index = 0;
        await showProduct(index);
        displayProductCards();

    } catch (err) {
        console.error("API Error:", err);
        titleEl.textContent = "Failed to load data!";
        descEl.textContent = "Check your internet connection or try again.";
    }
}

function displayProductCards() {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'card-wrapper';
        productCard.innerHTML = `
                    <div class="card">
                        <img src="${product.image}" class="card-img-top" alt="${product.title}">
                        <div class="card-body">
                            <h5 class="card-title">${product.title}</h5>
                            <p class="card-text">${product.description.substring(0, 80)}...</p>
                            <p class="price">$${product.price}</p>
                            <div class="card-buttons">
                                <button class="btn btn-outline-primary view-details" data-id="${product.id}">Details</button>
                                <button class="btn btn-primary add-to-cart" data-id="${product.id}">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                `;
        productList.appendChild(productCard);
    });

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });

    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', showProductDetails);
    });
}

function addToCart(event) {
    const productId = parseInt(event.target.dataset.id);
    const product = products.find(p => p.id === productId);

    if (product) {
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();

        event.target.textContent = 'Added!';
        event.target.disabled = true;
        setTimeout(() => {
            event.target.textContent = 'Add to Cart';
            event.target.disabled = false;
        }, 1500);
    }
}

function updateCartBadge() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartBadge.textContent = totalItems;
}

function updateCartModal() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center">Your cart is empty</p>';
        cartTotal.textContent = '0.00';
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Proceed to Checkout';
        return;
    }

    let itemsHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemsHTML += `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.title}">
                        <div class="cart-item-details">
                            <div class="cart-item-title">${item.title}</div>
                            <div class="cart-item-price">$${item.price}</div>
                            <div class="quantity-controls">
                                <button class="quantity-btn decrease-quantity" data-index="${index}">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="quantity-btn increase-quantity" data-index="${index}">+</button>
                            </div>
                        </div>
                        <button class="delete-btn remove-item" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
    });

    cartItems.innerHTML = itemsHTML;
    cartTotal.textContent = total.toFixed(2);
    checkoutBtn.disabled = false;

    // Add event listeners for cart controls
    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', increaseCartQuantity);
    });

    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', decreaseCartQuantity);
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', removeFromCart);
    });
}

function increaseCartQuantity(event) {
    const index = parseInt(event.target.dataset.index);
    cart[index].quantity += 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartModal();
    updateCartBadge();
}

function decreaseCartQuantity(event) {
    const index = parseInt(event.target.dataset.index);
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartModal();
    updateCartBadge();
}

function removeFromCart(event) {
    const index = parseInt(event.target.dataset.index);
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartModal();
    updateCartBadge();
}

function showProductDetails(event) {
    const productId = parseInt(event.target.dataset.id);
    const product = products.find(p => p.id === productId);

    if (product) {
        document.getElementById('modalProductTitle').textContent = product.title;
        document.getElementById('modalProductName').textContent = product.title;
        document.getElementById('modalProductImage').src = product.image;
        document.getElementById('modalProductPrice').textContent = `$${product.price}`;
        document.getElementById('modalProductDescription').textContent = product.description;

        const modalAddToCart = document.getElementById('modalAddToCart');
        modalAddToCart.dataset.id = product.id;
        modalAddToCart.onclick = function () {
            addToCart({ target: modalAddToCart });
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
        };

        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        productModal.show();
    }
}

// NEW: Checkout Functionality
document.getElementById('checkoutBtn').addEventListener('click', function () {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Simulate checkout process
    this.textContent = 'Processing...';
    this.disabled = true;

    setTimeout(() => {
        alert('Checkout successful! Your order has been placed.');
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        updateCartModal();

        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        cartModal.hide();
    }, 2000);
});

// NEW: Sign In/Sign Up Functionality
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');

        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active form
        authForms.forEach(form => {
            form.classList.remove('active');
            if (form.id === `${targetTab}Form`) {
                form.classList.add('active');
            }
        });

        // Clear messages
        document.getElementById('formMessage').className = 'form-message';
    });
});

// Switch between login and signup
document.querySelector('.switch-to-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="signup"]').click();
});

document.querySelector('.switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="login"]').click();
});

// Toggle Password Visibility
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });
});

// Form Validation and Submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simulate login process
    const message = document.getElementById('formMessage');
    message.textContent = 'Signing in...';
    message.className = 'form-message success';

    setTimeout(() => {
        message.textContent = `Welcome back! Signed in as ${email}`;
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        setTimeout(() => authModal.hide(), 1500);
    }, 1000);
});

document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    const message = document.getElementById('formMessage');

    if (password !== confirmPassword) {
        message.textContent = 'Passwords do not match!';
        message.className = 'form-message error';
        return;
    }

    // Simulate signup process
    message.textContent = 'Creating your account...';
    message.className = 'form-message success';

    setTimeout(() => {
        message.textContent = `Account created successfully for ${name}!`;
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        setTimeout(() => authModal.hide(), 1500);
    }, 1000);
});

nextBtn.addEventListener("click", () => {
    if (!products.length || isTransitioning) return;
    index = (index + 1) % products.length;
    showProduct(index);
});

prevBtn.addEventListener("click", () => {
    if (!products.length || isTransitioning) return;
    index = (index - 1 + products.length) % products.length;
    showProduct(index);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextBtn.click();
    if (e.key === "ArrowLeft") prevBtn.click();
});

// Newsletter form submission
document.querySelector('.newsletter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = this.querySelector('.newsletter-input').value;
    if (email) {
        alert('Thank you for subscribing with: ' + email);
        this.querySelector('.newsletter-input').value = '';
    }
});

// Simple Loader Functionality
function showLoader() {
    document.getElementById('simpleLoader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('simpleLoader').classList.add('hidden');
}

// Show loader when page starts loading
document.addEventListener('DOMContentLoaded', function() {
    showLoader();
    
    // Hide loader after 2 seconds (or when your content is loaded)
    setTimeout(function() {
        hideLoader();
    }, 1000);
});



// Simple checkout - direct implementation
document.getElementById('simpleCheckout').addEventListener('click', function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const btn = this;
    const originalText = btn.innerHTML;
    
    // Show processing
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    
    setTimeout(() => {
        alert('Order placed successfully! Thank you for your purchase.');
        
        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        updateCartModal();
        
        // Close modal
        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        cartModal.hide();
        
        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
});



// Initialize
fetchProducts();
updateCartBadge();