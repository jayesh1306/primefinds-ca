let products = [];
let editingProductId = null;

const sampleProducts = [
    {
        id: Date.now() + 1,
        title: 'Premium Wireless Headphones',
        description: 'Crystal clear sound with active noise cancellation. 30-hour battery life.',
        price: '$89.99',
        image: '🎧',
        badge: 'Best Seller',
        link: 'https://amazon.com',
        visible: true
    },
    {
        id: Date.now() + 2,
        title: 'Laptop Stand Pro',
        description: 'Ergonomic aluminum stand for better posture and cooling.',
        price: '$49.99',
        image: '💻',
        badge: 'New',
        link: 'https://amazon.com',
        visible: true
    },
    {
        id: Date.now() + 3,
        title: 'Smart Fitness Watch',
        description: 'Track your health, workouts, and stay connected on the go.',
        price: '$129.99',
        image: '⌚',
        badge: 'Trending',
        link: 'https://amazon.com',
        visible: true
    }
];

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (response.ok) {
            const data = await response.json();
            products = data.products || [];
            console.log('✅ Products loaded from products.json');
            renderProducts();
            renderAdminProducts();
            return;
        }
    } catch (error) {
        console.log('ℹ️ No products.json file found, using localStorage');
    }

    const saved = localStorage.getItem('products');
    if (saved) {
        products = JSON.parse(saved);
        console.log('✅ Products loaded from localStorage');
    } else {
        products = sampleProducts;
        console.log('✅ Using sample products');
    }

    renderProducts();
    renderAdminProducts();
}

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
    console.log('✅ Products saved to localStorage');
}

function exportProducts() {
    const dataStr = JSON.stringify({ products: products }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccessMessage('✅ products.json downloaded! Upload it to your web server.');
}

function importProducts(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.products && Array.isArray(data.products)) {
                products = data.products;
                saveProducts();
                renderAdminProducts();
                renderProducts();
                showSuccessMessage('✅ Products imported successfully!');
            } else {
                alert('Invalid JSON format. Expected: {"products": [...]}');
            }
        } catch (error) {
            alert('Error reading JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function showSuccessMessage(message) {
    const container = document.getElementById('successMessage');
    if (!container) return;
    container.innerHTML = `<div class="success-message">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function checkRoute() {
    const hash = window.location.hash;
    if (hash === '#admin' || hash === '#admin-panel') {
        showAdminPanel();
    } else {
        showPublicSite();
    }
}

function showAdminPanel() {
    document.getElementById('publicSite').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    renderAdminProducts();
}

function showPublicSite() {
    document.getElementById('publicSite').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    renderProducts();
}

function goToPublicSite() {
    window.location.hash = '';
    showPublicSite();
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const visibleProducts = products.filter(p => p.visible !== false);

    if (visibleProducts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No products yet</h3>
                <p>Products will appear here once added</p>
            </div>
        `;
        return;
    }

    visibleProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const isImageUrl = product.image && product.image.startsWith('http');
        const imageContent = isImageUrl 
            ? `<img src="${product.image}" alt="${product.title}">`
            : (product.image || '📦');

        card.innerHTML = `
            <div class="product-image">
                ${imageContent}
                ${product.badge ? `<span class="badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-footer">
                    <span class="price">${product.price}</span>
                    <button class="buy-btn" onclick="window.open('${product.link}', '_blank')">View on Amazon</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderAdminProducts() {
    const grid = document.getElementById('adminProductGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No products yet</h3>
                <p>Click "Add New Product" to get started</p>
            </div>
        `;
        return;
    }
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        
        const isImageUrl = product.image && product.image.startsWith('http');
        const imageContent = isImageUrl 
            ? `<img src="${product.image}" alt="${product.title}">`
            : (product.image || '📦');
        card.innerHTML = `
            <div class="admin-product-image">
                ${imageContent}
            </div>
            <div class="admin-product-info">
                <h3>${product.title}</h3>
                <p>${product.description}</p>
                <div class="admin-product-meta">
                    <span>💰 ${product.price}</span>
                    ${product.badge ? `<span>🏷️ ${product.badge}</span>` : ''}
                    <span style="margin-left:8px; font-size:0.9rem; color:${product.visible === false ? '#888' : '#2d8a4d'}">${product.visible === false ? 'Private' : 'Public'}</span>
                </div>
            </div>
            <div class="admin-actions">
                <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                <button class="back-btn" style="margin-left:6px;" onclick="toggleVisibility(${product.id})">${product.visible === false ? 'Make Public' : 'Make Private'}</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openAddModal() {
    editingProductId = null;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Add New Product';
    const form = document.getElementById('productForm');
    if (form) form.reset();
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('active');
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Product';
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productDesc').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productBadge').value = product.badge || '';
    document.getElementById('productLink').value = product.link;
    const visibleCheckbox = document.getElementById('productVisible');
    if (visibleCheckbox) visibleCheckbox.checked = product.visible !== false;
    
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('active');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderAdminProducts();
        renderProducts();
        showSuccessMessage('✅ Product deleted successfully!');
    }
}

function toggleVisibility(id) {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return;
    products[index].visible = !(products[index].visible === undefined ? true : products[index].visible);
    saveProducts();
    renderAdminProducts();
    renderProducts();
    showSuccessMessage(products[index].visible ? '✅ Product is now public' : '✅ Product is now private');
}

// Attempt to save products.json to the server. This requires the server to accept PUT/POST
// requests to /products.json (and proper CORS/permissions). If you're hosting on static
// file hosts (GitHub Pages), this will fail — use Export JSON to download and upload manually.
async function saveToServer() {
    // New flow: call Netlify function to commit to GitHub. This avoids direct PUT to static file.
    try {
        const res = await fetch('/.netlify/functions/saveProducts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: products }, null, 2)
        });

        const text = await res.text();
        if (res.ok) {
            showSuccessMessage('✅ products.json saved to repository (via function)');
        } else {
            showSuccessMessage('⚠️ Save to server failed: ' + res.status + ' ' + res.statusText + ' - ' + text);
        }
    } catch (err) {
        showSuccessMessage('⚠️ Save to server failed: ' + err.message + '. Use Export JSON to download and upload manually.');
    }
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    editingProductId = null;
}

const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const productData = {
            title: document.getElementById('productTitle').value,
            description: document.getElementById('productDesc').value,
            price: document.getElementById('productPrice').value,
            image: document.getElementById('productImage').value || '📦',
            badge: document.getElementById('productBadge').value,
            link: document.getElementById('productLink').value,
            visible: (document.getElementById('productVisible') ? document.getElementById('productVisible').checked : true)
        };

        if (editingProductId) {
            const index = products.findIndex(p => p.id === editingProductId);
            products[index] = { ...products[index], ...productData };
            showSuccessMessage('✅ Product updated successfully!');
        } else {
            productData.id = Date.now();
            products.push(productData);
            showSuccessMessage('✅ Product added successfully!');
        }

        saveProducts();
        renderAdminProducts();
        renderProducts();
        closeModal();
    });
}

const productModal = document.getElementById('productModal');
if (productModal) {
    productModal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

window.addEventListener('hashchange', checkRoute);

loadProducts();
checkRoute();
