/* Admin-only script: manages products.json locally. */
(function(){
let products = [];
let editingProductId = null;

function isLocal() {
    return window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (response.ok) {
            const data = await response.json();
            products = data.products || [];
            showSuccessMessage('✅ Loaded products.json');
            renderAdminProducts();
            return;
        }
    } catch (e) {
        // ignore
    }
    const saved = localStorage.getItem('products');
    if (saved) {
        products = JSON.parse(saved);
        showSuccessMessage('✅ Loaded products from localStorage');
    } else {
        products = [];
    }
    renderAdminProducts();
}

function saveProductsToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(products));
}

function exportProducts() {
    const dataStr = JSON.stringify({ products: products }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccessMessage('✅ products.json downloaded (export)');
}

function importProductsFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.products && Array.isArray(data.products)) {
                products = data.products;
                saveProductsToLocalStorage();
                renderAdminProducts();
                showSuccessMessage('✅ Products imported successfully');
            } else {
                alert('Invalid JSON format. Expected {"products": [...]}');
            }
        } catch (err) {
            alert('Error reading JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
}

async function saveToDisk() {
    const content = JSON.stringify({ products: products }, null, 2);
    // File System Access API
    if (window.showSaveFilePicker) {
        try {
            const opts = { suggestedName: 'products.json', types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] };
            const handle = await window.showSaveFilePicker(opts);
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            showSuccessMessage('✅ Saved products.json to disk');
            return;
        } catch (e) {
            console.warn('Save to disk failed', e);
            alert('Unable to save directly. Browser may have denied permission. Using download fallback.');
        }
    }
    // fallback: download
    exportProducts();
}

function showSuccessMessage(message) {
    const successContainer = document.getElementById('successMessage');
    if (!successContainer) return;
    successContainer.innerHTML = `<div class="success-message">${message}</div>`;
    setTimeout(() => { if (successContainer) successContainer.innerHTML = ''; }, 4000);
}

function renderAdminProducts() {
    const adminGrid = document.getElementById('adminProductGrid');
    if (!adminGrid) return;
    adminGrid.innerHTML = '';
    if (!products || products.length === 0) {
        adminGrid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No products yet</h3><p>Click "Add New Product" to get started</p></div>`;
        return;
    }
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        const isImageUrl = product.image && product.image.startsWith('http');
        const imageContent = isImageUrl ? `<img src="${product.image}" alt="${product.title}">` : (product.image || '📦');
        card.innerHTML = `
            <div class="admin-product-image">${imageContent}</div>
            <div class="admin-product-info">
                <h3>${product.title}</h3>
                <p>${product.description}</p>
                <div class="admin-product-meta">
                    ${product.badge ? `<span>🏷️ ${product.badge}</span>` : ''}
                    <span style="margin-left:8px; font-size:0.9rem; color:${product.visible === false ? '#888' : '#2d8a4d'}">${product.visible === false ? 'Private' : 'Public'}</span>
                </div>
            </div>
            <div class="admin-actions">
                <button class="edit-btn" data-id="${product.id}">Edit</button>
                <button class="delete-btn" data-id="${product.id}">Delete</button>
                <button class="toggle-btn" data-id="${product.id}">${product.visible === false ? 'Make Public' : 'Make Private'}</button>
            </div>
        `;
        adminGrid.appendChild(card);
    });
}

function openAddModal() {
    editingProductId = null;
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Add New Product';
    const form = document.getElementById('productForm');
    if (form) form.reset();
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
    if (!confirm('Are you sure you want to delete this product?')) return;
    products = products.filter(p => p.id !== id);
    saveProductsToLocalStorage();
    renderAdminProducts();
    showSuccessMessage('✅ Product deleted');
}

function toggleVisibility(id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return;
    products[idx].visible = !(products[idx].visible === undefined ? true : products[idx].visible);
    saveProductsToLocalStorage();
    renderAdminProducts();
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    editingProductId = null;
}

// Event wiring
function initAdmin() {
    // buttons
    const saveDiskBtn = document.getElementById('saveDiskBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtnEl = document.getElementById('importBtn');
    const addNewBtn = document.getElementById('addNewBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (!isLocal()) {
        // notify and hide direct-save button
        const notice = document.getElementById('localNotice');
        if (notice) { notice.style.display = 'inline'; notice.textContent = 'Admin recommended for local use only.'; }
        if (saveDiskBtn) saveDiskBtn.style.display = 'none';
    }

    if (saveDiskBtn) saveDiskBtn.addEventListener('click', saveToDisk);
    if (exportBtn) exportBtn.addEventListener('click', exportProducts);
    if (importBtnEl) importBtnEl.addEventListener('click', () => document.getElementById('fileInput').click());
    if (addNewBtn) addNewBtn.addEventListener('click', openAddModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            importProductsFromFile(e.target.files[0]);
            fileInput.value = '';
        });
    }

    // delegate admin grid actions
    const adminGrid = document.getElementById('adminProductGrid');
    if (adminGrid) {
        adminGrid.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.edit-btn')) {
                const id = Number(target.getAttribute('data-id'));
                editProduct(id);
            } else if (target.matches('.delete-btn')) {
                const id = Number(target.getAttribute('data-id'));
                deleteProduct(id);
            } else if (target.matches('.toggle-btn')) {
                const id = Number(target.getAttribute('data-id'));
                toggleVisibility(id);
            }
        });
    }

    // form submit
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
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
                const idx = products.findIndex(p => p.id === editingProductId);
                if (idx !== -1) products[idx] = { ...products[idx], ...productData };
                showSuccessMessage('✅ Product updated');
            } else {
                productData.id = Date.now();
                products.push(productData);
                showSuccessMessage('✅ Product added');
            }
            saveProductsToLocalStorage();
            renderAdminProducts();
            closeModal();
        });
    }

    // modal backdrop click
    const productModal = document.getElementById('productModal');
    if (productModal) productModal.addEventListener('click', (e) => { if (e.target === productModal) closeModal(); });

    // initial load
    loadProducts();
}

// Ensure init runs whether DOMContentLoaded already fired or not
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    // If admin.js is loaded after injection, run init immediately
    try { initAdmin(); } catch (e) { console.warn('admin init failed', e); }
}

})();
