/* ==========================================================================
   ABAZAR ADMIN DASHBOARD - LOGIC & CRUD ENGINE
   ========================================================================== */

const STORAGE_KEY = 'abazar_live_catalog_v2026';
try { localStorage.removeItem('abazar_catalog_data'); } catch(e) {}
const AUTH_KEY = 'abazar_admin_session';

const DEFAULT_PRODUCTS = [];

let productsList = [];
let currentImageBase64 = '';
let searchFilter = '';
let categoryFilter = 'all';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProducts();
  renderProductsTable();
  updateKPIs();
});

// --- AUTHENTICATION ---
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  const alertEl = document.getElementById('loginAlert');

  if (username === 'admin' && password === 'abazar2026') {
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
      const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        productsList = data.map(row => ({
          id: row.id,
          sku: row.sku,
          name: row.name,
          category: row.category,
          priceRetail: Number(row.price_retail || row.priceRetail || 0),
          priceWholesale: Number(row.price_wholesale || row.priceWholesale || 0),
          minQty: Number(row.min_qty || row.minQty || 10),
          rating: Number(row.rating || 5),
          image: row.image || 'assets/products/led-drl-daytime-running.jpg'
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
          alert(`✓ ${imported.length} produits importés avec succès !`);
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
