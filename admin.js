/* ==========================================================================
   ABAZAR ADMIN DASHBOARD - LOGIC & CRUD ENGINE
   ========================================================================== */

const STORAGE_KEY = 'abazar_catalog_data';
const AUTH_KEY = 'abazar_admin_session';

const DEFAULT_PRODUCTS = [
  {
    id: 'abz-drl-01',
    sku: 'ABZ-LED-01',
    name: 'Bandes LED DRL Feux Diurnes Dynamiques Flexibles',
    category: 'lighting',
    priceRetail: 120,
    priceWholesale: 65,
    minQty: 10,
    cartonQty: 50,
    priceCartonUnit: 52,
    image: 'assets/products/led-drl-daytime-running.jpg'
  },
  {
    id: 'abz-curtain-02',
    sku: 'ABZ-CURT-02',
    name: 'Rideaux Pare-Soleil Latéraux Anti-UV (Pack 2 PCS)',
    category: 'interior',
    priceRetail: 90,
    priceWholesale: 45,
    minQty: 10,
    cartonQty: 40,
    priceCartonUnit: 38,
    image: 'assets/products/side-curtain-uv.jpg'
  },
  {
    id: 'abz-plate-03',
    sku: 'ABZ-PLT-03',
    name: 'Cadre Support Plaque d\'Immatriculation Noir Renforcé',
    category: 'styling',
    priceRetail: 40,
    priceWholesale: 18,
    minQty: 25,
    cartonQty: 100,
    priceCartonUnit: 14,
    image: 'assets/products/license-plate-frame.jpg'
  },
  {
    id: 'abz-wiper-04',
    sku: 'ABZ-WIP-04',
    name: 'Déflecteurs Spoilers Essuie-Glaces R-Sports Carbone',
    category: 'styling',
    priceRetail: 70,
    priceWholesale: 32,
    minQty: 12,
    cartonQty: 60,
    priceCartonUnit: 26,
    image: 'assets/products/carbon-wiper-spoilers.jpg'
  },
  {
    id: 'abz-chrome-vents-05',
    sku: 'ABZ-VNT-05',
    name: 'Évents Prises d\'Air Chrome V-623 Ailes & Carrosserie',
    category: 'styling',
    priceRetail: 85,
    priceWholesale: 38,
    minQty: 15,
    cartonQty: 50,
    priceCartonUnit: 30,
    image: 'assets/products/chrome-air-flow-vents.jpg'
  },
  {
    id: 'abz-black-intake-06',
    sku: 'ABZ-INT-06',
    name: 'Prises d\'Air Aérodynamiques Noires HD-706 / HD-707',
    category: 'styling',
    priceRetail: 75,
    priceWholesale: 35,
    minQty: 15,
    cartonQty: 50,
    priceCartonUnit: 28,
    image: 'assets/products/black-decorative-air-intakes.jpg'
  },
  {
    id: 'abz-wheel-cover-07',
    sku: 'ABZ-STW-07',
    name: 'Couvre-Volant Carbone Segmenté Sport Anti-Dérapant',
    category: 'interior',
    priceRetail: 110,
    priceWholesale: 55,
    minQty: 10,
    cartonQty: 50,
    priceCartonUnit: 46,
    image: 'assets/products/carbon-steering-wheel-cover.jpg'
  },
  {
    id: 'abz-varta-cr2025-08',
    sku: 'ABZ-VRT-2025',
    name: 'Pile Bouton Lithium VARTA CR2025 (Clés Télécommandes)',
    category: 'tools',
    priceRetail: 25,
    priceWholesale: 9.5,
    minQty: 50,
    cartonQty: 200,
    priceCartonUnit: 7.5,
    image: 'assets/products/varta-cr2025-battery.jpg'
  },
  {
    id: 'abz-varta-cr2032-09',
    sku: 'ABZ-VRT-2032',
    name: 'Pile Bouton Lithium VARTA CR2032 (+70% Énergie)',
    category: 'tools',
    priceRetail: 25,
    priceWholesale: 9.5,
    minQty: 50,
    cartonQty: 200,
    priceCartonUnit: 7.5,
    image: 'assets/products/varta-cr2032-battery.jpg'
  },
  {
    id: 'abz-letters-display-10',
    sku: 'ABZ-LET-3D',
    name: 'Présentoir Intégral Lettres & Chiffres 3D Chrome Métal',
    category: 'bulk',
    priceRetail: 450,
    priceWholesale: 280,
    minQty: 2,
    cartonQty: 5,
    priceCartonUnit: 240,
    image: 'assets/products/chrome-3d-letters-display.jpg'
  },
  {
    id: 'abz-spark-wrench-11',
    sku: 'ABZ-SPK-11',
    name: 'Clé à Bougie Articulée Universelle avec Poignée T',
    category: 'tools',
    priceRetail: 65,
    priceWholesale: 28,
    minQty: 12,
    cartonQty: 48,
    priceCartonUnit: 22,
    image: 'assets/products/spark-plug-t-wrench.jpg'
  },
  {
    id: 'abz-wheel-wrench-12',
    sku: 'ABZ-ORC-12',
    name: 'Clé Démonte-Roue Télescopique Renforcée ORCON',
    category: 'tools',
    priceRetail: 130,
    priceWholesale: 68,
    minQty: 10,
    cartonQty: 30,
    priceCartonUnit: 58,
    image: 'assets/products/extendable-wheel-wrench.jpg'
  },
  {
    id: 'abz-mirrors-display-13',
    sku: 'ABZ-MIR-54',
    name: 'Présentoir 48 Rétroviseurs Angle Mort Ronds 5.4cm',
    category: 'bulk',
    priceRetail: 380,
    priceWholesale: 210,
    minQty: 2,
    cartonQty: 6,
    priceCartonUnit: 180,
    image: 'assets/products/blind-spot-mirrors-display.jpg'
  }
];

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

// --- DATA MANAGEMENT (LOCALSTORAGE) ---
function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      productsList = JSON.parse(raw);
    } else {
      productsList = [...DEFAULT_PRODUCTS];
      saveProducts();
    }
  } catch (e) {
    productsList = [...DEFAULT_PRODUCTS];
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productsList));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

function resetToDefaults() {
  if (confirm('Voulez-vous vraiment réinitialiser le catalogue aux produits d\'origine ?')) {
    productsList = [...DEFAULT_PRODUCTS];
    saveProducts();
    renderProductsTable();
    updateKPIs();
    alert('Catalogue réinitialisé avec succès !');
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
            <button class="btn-action-edit" onclick="openEditProductModal('${p.id}')">✏️ Modifier</button>
            <button class="btn-action-delete" onclick="deleteProduct('${p.id}')">🗑️</button>
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
  showImagePreview(product.image || 'assets/products/led-drl-daytime-running.jpg');

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

    const image = currentImageBase64 || 'assets/products/led-drl-daytime-running.jpg';

    if (!name || !sku) {
      alert('Veuillez remplir le nom et la référence du produit.');
      return;
    }

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
      }
    } else {
      // Create new product
      const newId = 'abz-prod-' + Date.now();
      productsList.unshift({
        id: newId,
        sku,
        name,
        category,
        priceRetail,
        priceWholesale,
        minQty,
        image
      });
    }

    saveProducts();
    renderProductsTable();
    updateKPIs();
    closeProductModal();
    alert('✓ Produit enregistré et synchronisé avec succès !');
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
    renderProductsTable();
    updateKPIs();
  }
}
