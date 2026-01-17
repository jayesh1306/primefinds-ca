// store.js — public store behavior
const store = {
    KEY: 'affiliateProducts',
    products: [],
    affiliateId: '131806087-20',

    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.renderStore();
    },

    loadProducts() {
        const raw = localStorage.getItem(this.KEY);
        try { this.products = raw ? JSON.parse(raw) : []; } catch(e) { this.products = []; }
    },

    saveProducts() {
        localStorage.setItem(this.KEY, JSON.stringify(this.products));
    },

    getAmazonLink(asin) {
        return `https://amazon.com/dp/${asin}?tag=${this.affiliateId}`;
    },

    setupEventListeners() {
        const search = document.getElementById('searchInput');
        if (search) {
            search.addEventListener('input', (e) => this.renderStore(e.target.value));
        }
    },

    renderStore(search = '') {
        const grid = document.getElementById('productsGrid');
        const empty = document.getElementById('emptyState');
        if (!grid) return;

        const filtered = this.products.filter(p =>
            (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(search.toLowerCase())
        );

        if (filtered.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (empty) empty.style.display = 'none';

        grid.innerHTML = filtered.map(product => `
            <div class="product-card">
                ${product.image ? `<div class="product-image"><img src="${product.image}" alt="${product.name}"></div>` : '<div class="product-image">No Image</div>'}
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price}</div>
                    ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                    ${product.category ? `<div class="product-asin">Category: ${product.category}</div>` : ''}
                    <div class="product-actions">
                        <a href="${this.getAmazonLink(product.asin)}" target="_blank" rel="noopener noreferrer" class="buy-btn">Buy on Amazon</a>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => store.init());
