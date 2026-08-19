/* ==========================================================================
   ABAZAR AUTO ACCESSORIES - APPLICATION ENGINE (PROFESSIONAL NO-EMOJIS)
   ========================================================================== */

const STORAGE_KEY = 'abazar_live_catalog_v2026';
try { localStorage.removeItem('abazar_catalog_data'); } catch(e) {}

const DEFAULT_PRODUCTS = [];

let PRODUCTS = [];
let currentLang = 'fr';
let currentPriceMode = 'wholesale';
let currentCategory = 'all';
let searchQuery = '';
let cart = [];

const DICT = {
  fr: {
    add_to_cart: "Ajouter au Panier",
    order_wa: "Commander WhatsApp",
    cart_title: "Mon Panier de Commande",
    cart_empty: "Votre panier est actuellement vide.",
    cart_empty_sub: "Consultez notre sélection d'accessoires pour ajouter des produits.",
    btn_checkout: "Commander via WhatsApp",
    toast_added: "Produit ajouté au panier",
    stock_status: "En Stock",
    wholesale_label: "Tarif Grossiste",
    retail_label: "Prix Public Conseillé"
  },
  ar: {
    add_to_cart: "أضف إلى السلة",
    order_wa: "طلب عبر واتساب",
    cart_title: "سلة الطلبات وعروض الأسعار",
    cart_empty: "سلتكم فارغة حالياً.",
    cart_empty_sub: "تصفحوا الكتالوج لإضافة المنتجات بأسعار الجملة أو التقسيط.",
    btn_checkout: "تأكيد وإرسال الطلب عبر واتساب",
    toast_added: "تمت إضافة المنتج إلى السلة بنجاح",
    stock_status: "متوفر بالمخزن",
    wholesale_label: "سعر الجملة",
    retail_label: "سعر البيع المقترح"
  },
  en: {
    add_to_cart: "Add to Cart",
    order_wa: "Order on WhatsApp",
    cart_title: "My Order Cart",
    cart_empty: "Your cart is currently empty.",
    cart_empty_sub: "Browse our auto accessories catalog to add items.",
    btn_checkout: "Order via WhatsApp",
    toast_added: "Item added to cart",
    stock_status: "In Stock",
    wholesale_label: "Wholesale Rate",
    retail_label: "MSRP Retail Price"
  }
};

function loadCatalogData() {
  // 1. Initial immediate load from local cache or defaults
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        PRODUCTS = parsed;
      } else {
        PRODUCTS = [...DEFAULT_PRODUCTS];
      }
    } else {
      PRODUCTS = [...DEFAULT_PRODUCTS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
    }
  } catch (e) {
    PRODUCTS = [...DEFAULT_PRODUCTS];
  }

  renderProducts();

  // 2. Background sync from Supabase Cloud Database
  syncFromSupabase();
}

async function syncFromSupabase() {
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!sb) return;

  try {
    const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        PRODUCTS = data.map(row => ({
          id: row.id,
          sku: row.sku,
          name: row.name,
          category: row.category,
          priceRetail: Number(row.price_retail || row.priceRetail || 0),
          priceWholesale: Number(row.price_wholesale || row.priceWholesale || 0),
          minQty: Number(row.min_qty || row.minQty || 10),
          rating: Number(row.rating || 5),
          variants: row.variants || [],
          image: row.image || 'assets/hero_car.jpg'
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
        renderProducts();
      } else {
        // Supabase is empty, but if we have local products, maybe push them?
        // For now, just don't wipe out the local products if Supabase is empty.
        console.log('Supabase is empty. Keeping local products.');
      }
    }
  } catch (err) {
    console.warn('Supabase sync note:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCatalogData();
  loadCart();
  updateCartBadge();
  checkStoreStatus();

  // Listen for admin changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadCatalogData();
    }
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });
  }

  const cartOverlay = document.getElementById('cartOverlay');
  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) closeCartDrawer();
    });
  }
});

// --- SEARCH & VEHICLE FILTER ---
function triggerSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchQuery = searchInput.value.toLowerCase().trim();
    renderProducts();
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
}

function filterByVehicle() {
  const cat = document.getElementById('vehicleCategory')?.value || 'all';
  filterCat(cat);
  const catalogEl = document.getElementById('catalog');
  if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
}

function updateVehicleModels() {}

// --- CATALOG RENDERING ---
function renderCategoryFilters() {
  const filterBar = document.querySelector('.cat-filter-pills-bar');
  if (!filterBar) return;

  if (PRODUCTS.length === 0) {
    filterBar.innerHTML = '';
    return;
  }

  const uniqueCats = new Set(PRODUCTS.map(p => p.category));
  
  // Clear existing (except the 'all' button if you want to keep it, but let's just rebuild all)
  const allLabel = DICT[currentLang].cat_all || 'Tous les produits';
  let html = `<button class="cat-filter-btn ${currentCategory === 'all' ? 'active' : ''}" onclick="filterCat('all')">${allLabel}</button>`;
  
  const catLabels = {
    lighting: 'Éclairage LED',
    styling: 'Tuning & Styling',
    interior: 'Intérieur & Confort',
    tools: 'Outillage',
    bulk: 'Lots B2B'
  };

  uniqueCats.forEach(cat => {
    const label = catLabels[cat] || cat;
    const isActive = currentCategory === cat ? 'active' : '';
    html += `<button class="cat-filter-btn ${isActive}" onclick="filterCat('${cat}')">${label}</button>`;
  });

  filterBar.innerHTML = html;

  // Also update the vehicleCategory select if it exists
  const vehicleCatSelect = document.getElementById('vehicleCategory');
  if (vehicleCatSelect) {
    let selectHtml = `<option value="all">Toutes les catégories</option>`;
    uniqueCats.forEach(cat => {
      const label = catLabels[cat] || cat;
      selectHtml += `<option value="${cat}">${label}</option>`;
    });
    // Keep the current selection if possible
    const currentVal = vehicleCatSelect.value;
    vehicleCatSelect.innerHTML = selectHtml;
    vehicleCatSelect.value = currentVal;
  }
}

function renderProducts() {
  renderCategoryFilters();
  
  const container = document.getElementById('productsContainer');
  if (!container) return;

  const filtered = PRODUCTS.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchSearch = !searchQuery || 
      (p.name && p.name.toLowerCase().includes(searchQuery)) || 
      (p.sku && p.sku.toLowerCase().includes(searchQuery));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    const toolbar = document.getElementById('catalogToolbar');
    if (toolbar && PRODUCTS.length === 0) toolbar.style.display = 'none';

    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <p style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin-bottom: 0.4rem;">Aucun article dans le catalogue pour le moment.</p>
        <p style="font-size: 0.88rem; max-width: 420px; margin-inline: auto;">Ajoutez vos produits depuis le panneau d'administration pour les afficher ici.</p>
      </div>
    `;
    return;
  }

  const toolbar = document.getElementById('catalogToolbar');
  if (toolbar) toolbar.style.display = 'flex';

  container.innerHTML = filtered.map(p => {
    const isWholesale = currentPriceMode === 'wholesale';
    const price = isWholesale ? p.priceWholesale : p.priceRetail;
    const subtext = isWholesale 
      ? `${DICT[currentLang].wholesale_label} (min. ${p.minQty || 10} pcs)` 
      : DICT[currentLang].retail_label;

    const orderMsg = encodeURIComponent(
      `Bonjour ABAZAR, je souhaite commander l'accessoire : ${p.name} (Réf: ${p.sku}) au prix de ${price} DH.`
    );
    const waLink = `https://api.whatsapp.com/send/?phone=212666349813&text=${orderMsg}`;

    const ratingVal = p.rating || 5;
    const starsHtml = '★'.repeat(ratingVal) + '☆'.repeat(5 - ratingVal);

    // Build variant selector if product has variants
    const hasVariants = p.variants && p.variants.length > 0;
    const variantHtml = hasVariants ? `
      <div style="margin-bottom: 0.5rem;">
        <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 0.3rem;">Option / Taille</label>
        <select id="variant-${p.id}" class="variant-select" style="width: 100%; padding: 0.45rem 0.65rem; background: var(--bg-input); border: 1px solid var(--border-subtle); color: #fff; border-radius: var(--radius-xs); font-size: 0.82rem; font-weight: 600;">
          ${p.variants.map((v, i) => `<option value="${v}" ${i === 0 ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
    ` : '';

    return `
      <article class="product-item-card">
        <div class="product-image-container">
          <span class="badge-flag-stock">
            ${DICT[currentLang].stock_status}
          </span>
          <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
        </div>

        <div class="product-card-body">
          <span class="product-sku-code">Réf : ${p.sku}</span>
          <h3 class="product-item-title">${p.name}</h3>

          <div class="product-rating-stars">${starsHtml}</div>

          <div class="product-pricing-wrap">
            <div>
              <span class="price-big-amount">${price} DH</span>
            </div>
            <span class="price-sub-note">${subtext}</span>
          </div>

          ${variantHtml}

          <div class="product-card-buttons">
            <button class="btn-card-add-cart" onclick="addToCart('${p.id}')">
              ${DICT[currentLang].add_to_cart}
            </button>
            <a href="${waLink}" target="_blank" class="btn-card-wa-order">
              ${DICT[currentLang].order_wa}
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function filterCat(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  renderProducts();
}

function setPriceMode(mode) {
  currentPriceMode = mode;
  document.getElementById('btnWholesale')?.classList.toggle('active', mode === 'wholesale');
  document.getElementById('btnRetail')?.classList.toggle('active', mode === 'retail');
  renderProducts();
}

// --- CART MANAGEMENT SYSTEM ---
function addToCart(productId) {
  const p = PRODUCTS.find(item => item.id === productId) || DEFAULT_PRODUCTS.find(item => item.id === productId);
  if (!p) return;

  const isWholesale = currentPriceMode === 'wholesale';
  const unitPrice = isWholesale ? p.priceWholesale : p.priceRetail;
  const packQty = isWholesale ? (p.minQty || 10) : 1;
  const tierLabel = isWholesale ? `Lot Grossiste (${packQty} pcs)` : '1 Pièce';

  // Get selected variant if available
  const variantSelect = document.getElementById(`variant-${p.id}`);
  const selectedVariant = variantSelect ? variantSelect.value : '';

  const existingIndex = cart.findIndex(item => item.id === productId && item.isWholesale === isWholesale && item.variant === selectedVariant);

  if (existingIndex > -1) {
    cart[existingIndex].packCount += 1;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      sku: p.sku,
      image: p.image,
      isWholesale: isWholesale,
      tierLabel: tierLabel,
      unitPrice: unitPrice,
      packQty: packQty,
      packCount: 1,
      variant: selectedVariant
    });
  }

  saveCart();
  updateCartBadge();
  showToast(DICT[currentLang].toast_added);
}

function updateCartItemCount(index, delta) {
  if (!cart[index]) return;
  cart[index].packCount += delta;
  if (cart[index].packCount <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeCartItem(index) {
  if (!cart[index]) return;
  cart.splice(index, 1);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function updateCartBadge() {
  const totalPacks = cart.reduce((sum, item) => sum + item.packCount, 0);
  const totalSum = cart.reduce((sum, item) => sum + (item.unitPrice * item.packQty * item.packCount), 0);

  const badge = document.getElementById('headerCartBadge');
  if (badge) badge.textContent = totalPacks;

  const totalEl = document.getElementById('headerCartTotal');
  if (totalEl) totalEl.textContent = `${totalSum.toFixed(0)} DH`;
}

function openCartDrawer() {
  renderCartDrawer();
  const overlay = document.getElementById('cartOverlay');
  if (overlay) overlay.classList.add('open');
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  if (overlay) overlay.classList.remove('open');
}

function renderCartDrawer() {
  const body = document.getElementById('cartBody');
  const totalEl = document.getElementById('cartDrawerTotal');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 3.5rem 1.5rem;">
        <h3 style="color: #ffffff; font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem;">${DICT[currentLang].cart_empty}</h3>
        <p style="font-size: 0.85rem; max-width: 260px; margin-inline: auto;">${DICT[currentLang].cart_empty_sub}</p>
        <button class="btn-hero-cta" style="margin-top: 1.5rem; font-size: 0.85rem;" onclick="closeCartDrawer()">
          Continuer mes achats
        </button>
      </div>
    `;
    if (totalEl) totalEl.textContent = '0 DH';
    return;
  }

  let cartTotal = 0;

  const itemsHtml = cart.map((item, index) => {
    const itemTotal = item.unitPrice * item.packQty * item.packCount;
    cartTotal += itemTotal;

    const variantTag = item.variant ? `<span style="display: inline-block; background: rgba(225,29,72,0.15); color: var(--primary-red); padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; margin-top: 3px;">${item.variant}</span>` : '';

    return `
      <div class="cart-row-item">
        <div class="cart-thumb-box">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-info-box">
          <h4>${item.name}</h4>
          <span>${item.tierLabel} • ${item.unitPrice} DH/u</span>
          ${variantTag}
          <div class="cart-qty-ctrls">
            <button class="btn-ctrl-qty" onclick="updateCartItemCount(${index}, -1)">-</button>
            <span class="cart-qty-val">${item.packCount}</span>
            <button class="btn-ctrl-qty" onclick="updateCartItemCount(${index}, 1)">+</button>
          </div>
        </div>
        <div class="cart-side-subtotal">
          <div class="cart-subtotal-price">${itemTotal.toFixed(0)} DH</div>
          <button class="btn-del-item" onclick="removeCartItem(${index})" title="Supprimer">✕</button>
        </div>
      </div>
    `;
  }).join('');

  const customerBox = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 1rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.65rem;">
      <span style="font-size: 0.78rem; font-weight: 800; color: #ffffff; text-transform: uppercase;">
        Coordonnées de Livraison / Devis :
      </span>
      <input type="text" id="cartClientName" placeholder="Nom ou Nom du Garage / Magasin" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--border-subtle); background: var(--bg-darkest); color: #ffffff; border-radius: 4px; font-size: 0.85rem;">
      <input type="tel" id="cartClientPhone" placeholder="Numéro de Téléphone (ex: 06 66 34 98 13)" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--border-subtle); background: var(--bg-darkest); color: #ffffff; border-radius: 4px; font-size: 0.85rem;">
      <input type="text" id="cartClientCity" placeholder="Ville de Livraison (ex: Agadir / Casablanca / Marrakech)" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--border-subtle); background: var(--bg-darkest); color: #ffffff; border-radius: 4px; font-size: 0.85rem;">
    </div>
  `;

  body.innerHTML = itemsHtml + customerBox;
  if (totalEl) totalEl.textContent = `${cartTotal.toFixed(0)} DH`;
}

function showCheckoutForm() {
  if (cart.length === 0) {
    alert(DICT[currentLang].cart_empty);
    return;
  }
  
  document.getElementById('checkoutForm').style.display = 'flex';
  document.getElementById('btnShowCheckout').style.display = 'none';
  document.getElementById('btnConfirmOrder').style.display = 'block';
}

async function submitOrderToSupabase() {
  const name = document.getElementById('cartClientName')?.value.trim() || document.getElementById('checkoutName')?.value.trim() || '';
  const phone = document.getElementById('cartClientPhone')?.value.trim() || document.getElementById('checkoutPhone')?.value.trim() || '';
  const address = document.getElementById('cartClientCity')?.value.trim() || document.getElementById('checkoutAddress')?.value.trim() || '';

  if (!name || !phone || !address) {
    alert('Veuillez remplir tous les champs (Nom, Téléphone, Ville) dans la section "Coordonnées de Livraison" pour valider la commande.');
    return;
  }

  if (cart.length === 0) return;

  const btnConfirm = document.getElementById('btnConfirmOrder');
  btnConfirm.innerHTML = 'Envoi en cours...';
  btnConfirm.disabled = true;

  let totalAmount = 0;
  const itemsList = cart.map(item => {
    const lineTotal = item.unitPrice * item.packQty * item.packCount;
    totalAmount += lineTotal;
    return {
      sku: item.sku,
      name: item.name,
      variant: item.variant || '',
      qty: item.packCount * item.packQty,
      price: item.unitPrice,
      total: lineTotal
    };
  });

  try {
    if (!window.supabaseClient) {
      throw new Error("Erreur de connexion à la base de données. Supabase est indisponible.");
    }

    const { error } = await window.supabaseClient
      .from('orders')
      .insert([
        {
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          total_amount: totalAmount,
          items: itemsList,
          status: 'pending'
        }
      ]);

    if (error) throw error;

    showToast('Commande envoyée avec succès !');
    cart = [];
    saveCart();
    updateCartCount();
    renderCart();
    closeCartDrawer();
    
    // Reset form
    document.getElementById('checkoutName').value = '';
    document.getElementById('checkoutPhone').value = '';
    document.getElementById('checkoutAddress').value = '';
    document.getElementById('checkoutForm').style.display = 'none';
    document.getElementById('btnShowCheckout').style.display = 'block';
    document.getElementById('btnConfirmOrder').style.display = 'none';

  } catch (err) {
    alert("Une erreur s'est produite lors de l'envoi de la commande. " + err.message);
    console.error(err);
  } finally {
    btnConfirm.innerHTML = '<span>Confirmer et Envoyer</span>';
    btnConfirm.disabled = false;
  }
}

function saveCart() {
  try {
    localStorage.setItem('abazar_cart_v3', JSON.stringify(cart));
  } catch(e) {}
}

function loadCart() {
  try {
    const data = localStorage.getItem('abazar_cart_v3');
    if (data) cart = JSON.parse(data);
  } catch(e) {}
}

function showToast(msg) {
  const existing = document.getElementById('appToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'appToast';
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-darkest);
    color: #ffffff;
    border: 2px solid var(--primary-red);
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-full);
    font-size: 0.88rem;
    font-weight: 700;
    z-index: 2000;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = '0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// --- LANGUAGE & STORE STATUS ---
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.setAttribute('lang', lang);
  document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  const cartDrawerTitle = document.getElementById('cartDrawerTitle');
  if (cartDrawerTitle) cartDrawerTitle.textContent = DICT[lang].cart_title;

  const btnCheckoutLabel = document.getElementById('btnCheckoutLabel');
  if (btnCheckoutLabel) btnCheckoutLabel.textContent = DICT[lang].btn_checkout;

  renderProducts();
}

function checkStoreStatus() {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const mins = now.getMinutes();
  const time = hours + mins / 60;

  // Mon-Sat: 09:00 - 19:30
  const isOpen = (day >= 1 && day <= 6) && (time >= 9.0 && time <= 19.5);
  const statusBadge = document.getElementById('storeLiveStatus');
  const statusText = document.getElementById('storeStatusText');
  if (statusBadge && statusText) {
    if (isOpen) {
      statusBadge.className = 'store-live-pill';
      statusText.textContent = "Ouvert actuellement • 09:00 - 19:30";
    } else {
      statusBadge.className = 'store-live-pill closed';
      statusText.textContent = "Fermé actuellement • Réouverture Lun 09:00";
    }
  }
}
