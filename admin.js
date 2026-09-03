/* ==========================================================================
   ABAZAR ADMIN DASHBOARD - LOGIC & CRUD ENGINE
   ========================================================================== */

const STORAGE_KEY = 'abazar_live_catalog_v2026';
try { localStorage.removeItem('abazar_catalog_data'); } catch(e) {}
const AUTH_KEY = 'abazar_admin_session';

const DEFAULT_PRODUCTS = [];

let productsList = [];
let ordersList = [];
let currentImageBase64 = '';
let searchFilter = '';
let categoryFilter = 'all';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProducts();
  fetchOrders();
  renderProductsTable();
  updateKPIs();
});

// --- TAB NAVIGATION ---
function switchTab(tab) {
  const tabCatalog = document.getElementById('tabCatalog');
  const tabOrders = document.getElementById('tabOrders');
  const sectionCatalog = document.getElementById('catalogSection');
  const sectionOrders = document.getElementById('ordersSection');

  if (tab === 'catalog') {
    tabCatalog.style.color = 'white';
    tabCatalog.style.borderBottom = '2px solid var(--accent-red)';
    tabOrders.style.color = 'var(--text-muted)';
    tabOrders.style.borderBottom = '2px solid transparent';
    
    sectionCatalog.style.display = 'block';
    sectionOrders.style.display = 'none';
  } else {
    tabOrders.style.color = 'white';
    tabOrders.style.borderBottom = '2px solid var(--accent-red)';
    tabCatalog.style.color = 'var(--text-muted)';
    tabCatalog.style.borderBottom = '2px solid transparent';
    
    sectionCatalog.style.display = 'none';
    sectionOrders.style.display = 'block';
    fetchOrders(); // Refresh when opening tab
  }
}

// --- AUTHENTICATION ---
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  const alertEl = document.getElementById('loginAlert');

  if (username === 'ILHAK' && password === 'ILHAK@1998') {
    sessionStorage.setItem(AUTH_KEY, 'true');
    alertEl.style.display = 'none';
    checkAuth();
  } else {
    alertEl.style.display = 'block';
  }
}

function handleLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  checkAuth();
}

function checkAuth() {
  const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true';
  const loginView = document.getElementById('loginView');
  const adminApp = document.getElementById('adminApp');

  if (isAuth) {
    loginView.style.display = 'none';
    adminApp.style.display = 'flex';
  } else {
    loginView.style.display = 'flex';
    adminApp.style.display = 'none';
  }
}

// --- DATA MANAGEMENT (SUPABASE CLOUD + LOCAL CACHE) ---
async function loadProducts() {
  // 1. Instant local cache load
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      productsList = JSON.parse(raw);
    } else {
      productsList = [...DEFAULT_PRODUCTS];
    }
  } catch (e) {
    productsList = [...DEFAULT_PRODUCTS];
  }

  // 2. Fetch latest live from Supabase
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (sb) {
    try {
      const { data, error } = await sb.from('products').select('id,sku,name,category,price_retail,price_wholesale,min_qty,rating,variants');
      if (!error && Array.isArray(data)) {
        productsList = data.map(row => ({
          id: row.id,
          sku: row.sku,
          name: row.name,
          category: row.category,
          priceRetail: Number(row.price_retail || row.priceRetail || 0),
          priceWholesale: Number(row.price_wholesale || row.priceWholesale || 0),
          minQty: Number(row.min_qty || row.minQty || 10),
          rating: Number(row.rating || 5),
          image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='12' fill='%2364748b' text-anchor='middle' dominant-baseline='middle'%3EABAZAR%3C/text%3E%3C/svg%3E"
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productsList));
        renderProductsTable();
        updateKPIs();
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local:', err);
    }
  }
}

async function saveProductToCloud(product) {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) return;

  try {
    const row = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price_retail: product.priceRetail,
      price_wholesale: product.priceWholesale,
      min_qty: product.minQty || 10,
      rating: product.rating || 5,
      variants: product.variants || [],
      image: product.image
    };
    await sb.from('products').upsert([row]);
  } catch (e) {
    console.warn('Supabase cloud upsert warning:', e);
  }
}

async function deleteProductFromCloud(id) {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) return;

  try {
    await sb.from('products').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase cloud delete warning:', e);
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productsList));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

async function clearAllProducts() {
  if (confirm('Voulez-vous vraiment supprimer TOUS les articles et vider le catalogue ?')) {
    productsList = [];
    saveProducts();
    renderProductsTable();
    updateKPIs();

    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (sb) {
      try {
        await sb.from('products').delete().neq('id', '___');
      } catch (e) {
        console.warn('Supabase delete all error:', e);
      }
    }

    alert('✓ Le catalogue et la base de données ont été vidés avec succès !');
  }
}

// --- TABLE & KPI RENDERING ---
function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  const filtered = productsList.filter(p => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchSearch = !searchFilter || 
      p.name.toLowerCase().includes(searchFilter) || 
      p.sku.toLowerCase().includes(searchFilter);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          Aucun produit trouvé.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const catLabels = {
      lighting: '💡 Éclairage LED',
      styling: '🏎️ Tuning & Styling',
      interior: '🛡️ Intérieur',
      tools: '🔧 Outillage',
      bulk: '📦 Présentoirs B2B'
    };

    return `
      <tr>
        <td>
          <div class="table-thumb">
            <img src="${p.image}" alt="${p.name}">
          </div>
        </td>
        <td><span class="sku-tag">${p.sku}</span></td>
        <td style="font-weight: 700; color: #fff;">${p.name}</td>
        <td><span class="cat-pill">${catLabels[p.category] || p.category}</span></td>
        <td><span class="price-hl">${p.priceRetail} DH</span></td>
        <td>
          <strong style="color: #34d399;">${p.priceWholesale} DH</strong>
          <span style="font-size: 0.72rem; color: var(--text-dim); display: block;">(min. ${p.minQty || 10} pcs)</span>
        </td>
        <td style="text-align: right;">
          <div class="action-btn-group" style="justify-content: flex-end;">
            <button class="btn-action-edit" onclick="openEditProductModal('${p.id}')">Modifier</button>
            <button class="btn-action-delete" onclick="deleteProduct('${p.id}')">Supprimer</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateKPIs() {
  const totalProductsEl = document.getElementById('kpiTotalProducts');
  const categoriesEl = document.getElementById('kpiCategories');
  const wholesaleEl = document.getElementById('kpiWholesaleDeals');

  if (totalProductsEl) totalProductsEl.textContent = productsList.length;
  if (categoriesEl) {
    const uniqueCats = new Set(productsList.map(p => p.category));
    categoriesEl.textContent = uniqueCats.size;
    
    // Update Datalist options dynamically
    const dataList = document.getElementById('categoryOptions');
    if (dataList) {
      dataList.innerHTML = Array.from(uniqueCats).map(cat => `<option value="${cat}"></option>`).join('');
    }
  }
  if (wholesaleEl) {
    wholesaleEl.textContent = productsList.filter(p => p.priceWholesale).length;
  }
}

// --- SEARCH & FILTER ---
function handleAdminSearch(e) {
  searchFilter = e.target.value.toLowerCase().trim();
  renderProductsTable();
}

function handleAdminCategoryFilter(e) {
  categoryFilter = e.target.value;
  renderProductsTable();
}

// --- IMAGE UPLOAD (FILE READER BASE64) ---
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    currentImageBase64 = event.target.result;
    const urlInput = document.getElementById('productImageUrl');
    if (urlInput) urlInput.value = '';
    showImagePreview(currentImageBase64);
  };
  reader.readAsDataURL(file);
}

function updateImagePreviewFromUrl() {
  const url = document.getElementById('productImageUrl')?.value.trim();
  if (url) {
    currentImageBase64 = url;
    showImagePreview(url);
  }
}

function showImagePreview(src) {
  const img = document.getElementById('imagePreview');
  const placeholder = document.getElementById('imagePreviewPlaceholder');
  if (img && placeholder) {
    img.src = src;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  }
}

function resetImagePreview() {
  currentImageBase64 = '';
  const img = document.getElementById('imagePreview');
  const placeholder = document.getElementById('imagePreviewPlaceholder');
  const fileInput = document.getElementById('productImageFile');
  const urlInput = document.getElementById('productImageUrl');

  if (img) img.style.display = 'none';
  if (placeholder) placeholder.style.display = 'block';
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
}

// --- PRODUCT MODAL (ADD / EDIT / DELETE) ---
function openAddProductModal() {
  document.getElementById('modalTitle').textContent = 'Ajouter un Nouveau Produit';
  const form = document.getElementById('productForm');
  if (form) form.reset();
  document.getElementById('editProductId').value = '';
  resetImagePreview();
  document.getElementById('productModal').classList.add('open');
}

function openEditProductModal(id) {
  const product = productsList.find(p => p.id === id);
  if (!product) return;

  document.getElementById('modalTitle').textContent = 'Modifier le Produit';
  document.getElementById('editProductId').value = product.id;
  document.getElementById('productName').value = product.name || '';
  document.getElementById('productSku').value = product.sku || '';
  document.getElementById('productCategory').value = product.category || 'lighting';
  document.getElementById('priceRetail').value = product.priceRetail || 0;
  document.getElementById('priceWholesale').value = product.priceWholesale || 0;

  const minQtyEl = document.getElementById('minQty');
  if (minQtyEl) minQtyEl.value = product.minQty || 10;

  const variantsEl = document.getElementById('productVariants');
  if (variantsEl) variantsEl.value = (product.variants || []).join(', ');

  currentImageBase64 = product.image || '';
  const urlInput = document.getElementById('productImageUrl');
  if (urlInput) {
    urlInput.value = (product.image && !product.image.startsWith('data:')) ? product.image : '';
  }
  showImagePreview(product.image || '');

  document.getElementById('productModal').classList.add('open');
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.remove('open');
}

function handleSaveProduct(e) {
  e.preventDefault();

  try {
    const editId = document.getElementById('editProductId')?.value;
    const name = document.getElementById('productName')?.value.trim();
    const sku = document.getElementById('productSku')?.value.trim();
    const category = document.getElementById('productCategory')?.value || 'lighting';
    const priceRetail = parseFloat(document.getElementById('priceRetail')?.value) || 0;
    const priceWholesale = parseFloat(document.getElementById('priceWholesale')?.value) || 0;
    const minQty = parseInt(document.getElementById('minQty')?.value) || 10;
    const variantsRaw = document.getElementById('productVariants')?.value.trim() || '';
    const variants = variantsRaw ? variantsRaw.split(',').map(v => v.trim()).filter(v => v) : [];

    const urlInput = document.getElementById('productImageUrl')?.value.trim();
    const image = currentImageBase64 || urlInput || '';

    if (!name || !sku) {
      alert('Veuillez remplir le nom et la référence du produit.');
      return;
    }

    let savedProduct = null;

    if (editId) {
      // Edit existing product
      const index = productsList.findIndex(p => p.id === editId);
      if (index > -1) {
        productsList[index] = {
          ...productsList[index],
          name,
          sku,
          category,
          priceRetail,
          priceWholesale,
          minQty,
          variants,
          image
        };
        savedProduct = productsList[index];
      }
    } else {
      // Create new product
      const newId = 'abz-prod-' + Date.now();
      savedProduct = {
        id: newId,
        sku,
        name,
        category,
        priceRetail,
        priceWholesale,
        minQty,
        variants,
        image
      };
      productsList.unshift(savedProduct);
    }

    saveProducts();
    if (savedProduct) saveProductToCloud(savedProduct);
    renderProductsTable();
    updateKPIs();
    closeProductModal();
    alert('✓ Produit enregistré et synchronisé avec la base Supabase !');
  } catch (err) {
    console.error('Error saving product:', err);
    alert('Erreur lors de l\'enregistrement : ' + err.message);
  }
}

function deleteProduct(id) {
  const p = productsList.find(item => item.id === id);
  if (!p) return;

  if (confirm(`Voulez-vous vraiment supprimer "${p.name}" du catalogue ?`)) {
    productsList = productsList.filter(item => item.id !== id);
    saveProducts();
    deleteProductFromCloud(id);
    renderProductsTable();
    updateKPIs();
  }
}

// --- EXPORT & IMPORT CATALOG DATA ---
function exportCatalogJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(productsList, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `abazar_catalog_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importCatalogJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported) && imported.length > 0) {
        if (confirm(`Voulez-vous importer ${imported.length} produits et remplacer le catalogue actuel ?`)) {
          productsList = imported;
          saveProducts();
          renderProductsTable();
          updateKPIs();
          
          // Also sync to Supabase
          const sb = typeof getSupabase === 'function' ? getSupabase() : null;
          if (sb) {
            const rows = imported.map(p => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              category: p.category,
              price_retail: p.priceRetail,
              price_wholesale: p.priceWholesale,
              min_qty: p.minQty || 10,
              rating: p.rating || 5,
              variants: p.variants || [],
              image: p.image
            }));
            sb.from('products').upsert(rows).then(({error}) => {
              if (error) console.warn('Supabase bulk upsert error:', error);
            });
          }

          alert(`✓ ${imported.length} produits importés avec succès et synchronisés avec le cloud !`);
        }
      } else {
        alert('Le fichier JSON ne contient pas une liste valide de produits.');
      }
    } catch(err) {
      alert('Erreur lors de la lecture du fichier JSON : ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ==========================================================================
// ORDERS MANAGEMENT
// ==========================================================================

async function fetchOrders() {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) return;
  try {
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    ordersList = data || [];
    renderOrdersTable();
  } catch (err) {
    console.error("Erreur chargement commandes:", err);
  }
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (ordersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">Aucune commande pour le moment</td></tr>`;
    return;
  }

  ordersList.forEach(order => {
    const date = new Date(order.created_at).toLocaleString('fr-FR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    const statusColor = order.status === 'shipped' ? 'var(--accent-cyan)' : 'var(--accent-amber)';
    const statusText = order.status === 'shipped' ? 'Expédiée' : 'En attente';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${date}</td>
      <td style="font-weight: bold;">${order.customer_name}</td>
      <td><a href="tel:${order.customer_phone}" style="color: var(--accent-cyan); text-decoration: none;">${order.customer_phone}</a></td>
      <td>${order.customer_address}</td>
      <td style="font-weight: bold; color: var(--accent-red);">${order.total_amount} DH</td>
      <td><span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">${statusText}</span></td>
      <td style="text-align: right;">
        <button class="btn-edit" onclick="viewOrderDetails('${order.id}')" style="background: var(--surface-light); border: 1px solid var(--border-dark);">Voir Détails</button>
        <button class="btn-action-delete" onclick="deleteOrder('${order.id}')" style="margin-left: 5px;">Supprimer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function viewOrderDetails(id) {
  const order = ordersList.find(o => o.id === id);
  if (!order) return;

  const modal = document.getElementById('orderModal');
  const body = document.getElementById('orderDetailsBody');
  const btnShipped = document.getElementById('btnMarkShipped');
  
  let itemsHtml = '<ul style="list-style: none; padding: 0; margin-top: 10px;">';
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      itemsHtml += `<li style="padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 5px; border-radius: 4px; display: flex; justify-content: space-between;">
        <span>${item.qty}x ${item.name} (Réf: ${item.sku})</span>
        <span style="font-weight: bold;">${item.price * item.qty} DH</span>
      </li>`;
    });
  }
  itemsHtml += '</ul>';

  body.innerHTML = `
    <div style="margin-bottom: 15px;"><strong>Client :</strong> ${order.customer_name}</div>
    <div style="margin-bottom: 15px;"><strong>Téléphone :</strong> <a href="tel:${order.customer_phone}" style="color: var(--accent-cyan);">${order.customer_phone}</a></div>
    <div style="margin-bottom: 15px;"><strong>Adresse / Localisation :</strong> ${order.customer_address}</div>
    <div style="margin-bottom: 15px;"><strong>Statut :</strong> ${order.status === 'shipped' ? 'Expédiée' : 'En attente'}</div>
    <hr style="border: 0; border-top: 1px solid var(--border-dark); margin: 15px 0;">
    <div><strong>Produits commandés :</strong></div>
    ${itemsHtml}
    <div style="text-align: right; margin-top: 15px; font-size: 1.2rem;">
      <strong>Total : <span style="color: var(--accent-red);">${order.total_amount} DH</span></strong>
    </div>
  `;

  btnShipped.style.display = order.status === 'shipped' ? 'none' : 'inline-block';
  btnShipped.onclick = () => markOrderShipped(order.id);
  currentViewedOrderId = order.id;

  modal.classList.add('open');
}

function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) modal.classList.remove('open');
}

async function markOrderShipped(id) {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) return;
  if (!confirm("Marquer cette commande comme expédiée / traitée ?")) return;
  
  try {
    const { error } = await sb
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', id);
      
    if (error) throw error;
    
    closeOrderModal();
    fetchOrders(); // Refresh table
  } catch (err) {
    alert("Erreur lors de la mise à jour du statut.");
    console.error(err);
  }
}

async function deleteOrder(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) return;
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) return;

  try {
    const { error } = await sb.from('orders').delete().eq('id', id);
    if (error) throw error;
    fetchOrders();
  } catch (err) {
    alert("Erreur lors de la suppression de la commande.");
    console.error(err);
  }
}

// ==========================================================================
// RECEIPT / BON DE LIVRAISON
// ==========================================================================

let currentViewedOrderId = null;

function printCurrentReceipt() {
  if (!currentViewedOrderId) return;
  const order = ordersList.find(o => o.id === currentViewedOrderId);
  if (!order) return;

  const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const orderNum = String(order.id).slice(-6).toUpperCase();

  let itemsRows = '';
  let grandTotal = 0;

  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      const qty = item.qty || 1;
      const unitPrice = item.price || 0;
      const lineTotal = qty * unitPrice;
      grandTotal += lineTotal;
      itemsRows += `
        <tr>
          <td style="text-align: center;">${qty}</td>
          <td>${item.name || ''} ${item.variant ? '(' + item.variant + ')' : ''}<br><small style="color:#888;">Réf: ${item.sku || ''}</small></td>
          <td style="text-align: center;">${unitPrice > 0 ? unitPrice.toFixed(2) : '-'}</td>
          <td style="text-align: center;">${lineTotal > 0 ? lineTotal.toFixed(2) : '-'}</td>
        </tr>`;
    });
  }

  // Pad empty rows to match physical receipt look
  const minRows = 12;
  const currentRows = (order.items && order.items.length) || 0;
  for (let i = currentRows; i < minRows; i++) {
    itemsRows += `<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>`;
  }

  const receiptHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bon de Livraison - ABAZAR #${orderNum}</title>
  <style>
    @media print {
      body { margin: 0; padding: 10mm; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; color: #000; background: #fff; padding: 15mm; max-width: 210mm; }

    .receipt-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid #c00; padding-bottom: 12px; margin-bottom: 15px;
    }
    .brand-block h1 { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #000; }
    .brand-block p { font-size: 11px; color: #333; line-height: 1.6; }
    .receipt-title-block { text-align: right; }
    .receipt-title-block .ar { font-size: 18px; font-weight: 700; }
    .receipt-title-block .fr { font-size: 16px; font-weight: 700; color: #c00; }
    .receipt-title-block .num { font-size: 22px; font-weight: 900; color: #c00; margin-top: 4px; }

    .client-row {
      display: flex; justify-content: space-between; margin: 12px 0 15px;
      font-size: 13px; border-bottom: 1px dashed #aaa; padding-bottom: 8px;
    }
    .client-row span { font-weight: 700; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    th { background: #f5f5f5; font-size: 11px; padding: 8px 6px; text-transform: uppercase; }
    th.ar { font-size: 13px; font-weight: 700; }
    td { padding: 7px 6px; font-size: 12px; }
    table, th, td { border: 1px solid #333; }

    .total-row { background: #c00; color: #fff; }
    .total-row td { font-size: 16px; font-weight: 900; padding: 10px 6px; }

    .footer-note {
      margin-top: 20px; text-align: center; font-size: 10px; color: #666;
      border-top: 1px solid #ccc; padding-top: 10px;
    }
    .print-btn {
      display: block; margin: 20px auto; padding: 12px 40px; font-size: 16px;
      background: #c00; color: #fff; border: none; border-radius: 6px; cursor: pointer;
    }
  </style>
</head>
<body>

  <div class="receipt-header">
    <div class="brand-block">
      <h1>ABAZAR</h1>
      <p>Accessoires et pièces Autos<br>
        Route de Biougra Km 1, Ait Melloul<br>
        Tél.: 05 28 24 55 43 / 06 66 34 98 13</p>
    </div>
    <div class="receipt-title-block">
      <div class="ar">ورقة التسليم</div>
      <div class="fr">Bon de Livraison</div>
      <div class="num">${orderNum}</div>
    </div>
  </div>

  <div class="client-row">
    <div><span>السيد / Client :</span> ${order.customer_name}</div>
    <div><span>Tél :</span> ${order.customer_phone}</div>
    <div><span>في / Le :</span> ${orderDate}</div>
  </div>

  <div class="client-row" style="border-bottom: none; padding-bottom: 0; margin-bottom: 5px;">
    <div><span>Ville / Adresse :</span> ${order.customer_address}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 12%;"><span class="ar">العدد</span><br>Quantité</th>
        <th style="width: 46%;"><span class="ar">نوع البضاعة</span><br>Désignation</th>
        <th style="width: 18%;"><span class="ar">الثمن</span><br>Prix U.T</th>
        <th style="width: 24%;"><span class="ar">الواجب</span><br>Prix Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2" style="text-align: left; border-color: #c00;">Total / المجموع :</td>
        <td colspan="2" style="text-align: center; border-color: #c00;">${grandTotal > 0 ? grandTotal.toFixed(2) : order.total_amount || '—'} DH</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer-note">
    ABAZAR - Accessoires et pièces Autos | Route de Biougra Km 1, Ait Melloul | Tél.: 06 66 34 98 13
  </div>

  <button class="print-btn no-print" onclick="window.print()">Imprimer ce Bon</button>

</body>
</html>`;

  const receiptWindow = window.open('', '_blank', 'width=800,height=1000');
  receiptWindow.document.write(receiptHtml);
  receiptWindow.document.close();
}
