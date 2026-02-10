let products = [];
let editingProductId = null;
let currentSearch = '';
let currentPage = 1;
const itemsPerPage = 12;

const sampleProducts = [
];

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (response.ok) {
            const data = await response.json();
            products = data.products || [];
            console.log('✅ Products loaded from products.json');
            renderProducts();
            if (document.getElementById('adminProductGrid')) renderAdminProducts();
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
    if (document.getElementById('adminProductGrid')) renderAdminProducts();
}

// Initialize search input behavior (if present)
function initSearch() {
    const input = document.getElementById('productSearch');
    const clearBtn = document.getElementById('clearSearch');
    if (!input) return;
    input.addEventListener('input', (e) => {
        currentSearch = (e.target.value || '').trim();
        currentPage = 1;  // Reset to page 1 when searching
        if (clearBtn) clearBtn.style.display = currentSearch ? 'inline' : 'none';
        renderProducts();
    });
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            currentSearch = '';
            currentPage = 1;  // Reset to page 1 when clearing
            clearBtn.style.display = 'none';
            renderProducts();
            input.focus();
        });
    }
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
    // If ?admin=1 is present, we do not toggle the (removed) admin panel here.
    // The embedded admin loader in index.html will handle authentication and injection.
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('admin') === '1' || params.get('admin') === 'true';
    if (isAdmin) {
        // keep the public site visible; embedded admin will be injected after auth
        return;
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
    // Remove admin query param from URL (so no #admin or ?admin remains)
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {
        // fallback: remove hash only
        try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    }
    showPublicSite();
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Start with public-visible products
    let visibleProducts = products.filter(p => p.visible !== false);

    // Apply search filter across title, description, badge (case-insensitive)
    if (currentSearch && currentSearch.length > 0) {
        const q = currentSearch.toLowerCase();
        visibleProducts = visibleProducts.filter(p => {
            const title = (p.title || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const badge = (p.badge || '').toLowerCase();
            return title.includes(q) || desc.includes(q) || badge.includes(q);
        });
    }

    if (visibleProducts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No products yet</h3>
                <p>Products will appear here once added</p>
            </div>
        `;
        renderPagination(0);
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(visibleProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = visibleProducts.slice(startIndex, endIndex);

    paginatedProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.onclick = () => window.open(product.link, '_blank');
        
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
                    <button class="buy-btn" onclick="event.stopPropagation(); window.open('${product.link}', '_blank')">View on Amazon</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;

    const nav = document.createElement('nav');
    nav.className = 'pagination-nav';
    nav.setAttribute('aria-label', 'Product pagination');

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    nav.appendChild(prevBtn);

    // Page numbers
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pagination-pages';

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.disabled = i === currentPage;
        pageBtn.onclick = () => {
            currentPage = i;
            renderProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        pagesContainer.appendChild(pageBtn);
    }
    nav.appendChild(pagesContainer);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    nav.appendChild(nextBtn);

    paginationContainer.appendChild(nav);
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
            products.unshift(productData);
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
window.addEventListener('popstate', checkRoute);

loadProducts();
checkRoute();
// wire search if present
initSearch();
