// admin.js — logic for secret-admin.html
(function(){
    const ADMIN_PASSWORD = 'CHANGE_THIS_SECRET'; // change this locally

    const entered = prompt('Enter admin password:');
    if (entered !== ADMIN_PASSWORD) {
        document.body.innerHTML = '<h2>Access denied</h2>';
        return;
    }

    const AdminApp = {
        key: 'affiliateProducts',
        products: [],
        currentEditId: null,

        init() { this.load(); this.renderList(); this.bind(); },

        load() { const raw = localStorage.getItem(this.key); try { this.products = raw ? JSON.parse(raw) : []; } catch(e) { this.products = []; } },
        save() { localStorage.setItem(this.key, JSON.stringify(this.products)); },

        parseImages(raw) { if (!raw) return []; return raw.split(',').map(s=>s.trim()).filter(Boolean); },

        add() {
            const name = document.getElementById('productName').value.trim();
            const asin = document.getElementById('productASIN').value.trim();
            const price = document.getElementById('productPrice').value.trim();
            if(!name||!asin||!price){ alert('Name, ASIN and Price required'); return; }
            const imgs = this.parseImages(document.getElementById('productImages').value);
            const p = { id: Date.now(), name, asin, price, images: imgs, description: document.getElementById('productDescription').value.trim(), category: document.getElementById('productCategory').value.trim() };
            this.products.unshift(p); this.save(); this.renderList(); this.clearForm(); alert('Added');
        },

        clearForm() { ['productName','productASIN','productPrice','productImages','productDescription','productCategory'].forEach(id => document.getElementById(id).value=''); },

        renderList() {
            const el = document.getElementById('productList');
            if(this.products.length===0){ el.innerHTML='<p>No products yet</p>'; return; }
            el.innerHTML = this.products.map(p=>`
                <div class="admin-product-item">
                    <div>
                        <div style="font-weight:700">${p.name}</div>
                        <div style="font-size:12px;color:#666">ASIN: ${p.asin} | ${p.price}</div>
                    </div>
                    <div style="display:flex;gap:6px">
                        <button onclick="window.AdminApp.edit(${p.id})">Edit</button>
                        <button onclick="window.AdminApp.remove(${p.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        },

        edit(id){ const p = this.products.find(x=>x.id===id); if(!p) return; this.currentEditId = id; document.getElementById('editName').value = p.name||''; document.getElementById('editASIN').value = p.asin||''; document.getElementById('editPrice').value = p.price||''; document.getElementById('editImages').value = (p.images||[]).join(', '); document.getElementById('editDesc').value = p.description||''; document.getElementById('editModal').classList.add('active'); },

        saveEdit(){ if(!this.currentEditId) return; const idx = this.products.findIndex(x=>x.id===this.currentEditId); if(idx===-1) return; this.products[idx].name = document.getElementById('editName').value.trim(); this.products[idx].asin = document.getElementById('editASIN').value.trim(); this.products[idx].price = document.getElementById('editPrice').value.trim(); this.products[idx].images = this.parseImages(document.getElementById('editImages').value); this.products[idx].description = document.getElementById('editDesc').value.trim(); this.save(); this.renderList(); this.currentEditId=null; document.getElementById('editModal').classList.remove('active'); },

        remove(id){ if(!confirm('Delete?')) return; this.products = this.products.filter(x=>x.id!==id); this.save(); this.renderList(); },

        exportJSON(){ const data = JSON.stringify({ products: this.products }, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download='products.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); },

        bind(){ document.getElementById('addBtn').addEventListener('click', ()=>this.add()); document.getElementById('exportBtn').addEventListener('click', ()=>this.exportJSON()); document.getElementById('saveEdit').addEventListener('click', ()=>this.saveEdit()); document.getElementById('cancelEdit').addEventListener('click', ()=>{ document.getElementById('editModal').classList.remove('active'); this.currentEditId=null; }); }
    };

    // expose for inline handlers in renderList
    window.AdminApp = AdminApp;
    document.addEventListener('DOMContentLoaded', () => AdminApp.init());
})();
