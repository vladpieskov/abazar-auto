/* ==========================================================================
   ABAZAR AUTO ACCESSORIES - AUTOMOTOBOUTIC THEME APPLICATION LOGIC
   ========================================================================== */

const STORAGE_KEY = 'abazar_catalog_data';

const DEFAULT_PRODUCTS = [
  {
    id: 'abz-drl-01',
    sku: 'ABZ-LED-01',
    name: 'Bandes LED DRL Feux Diurnes Dynamiques Flexibles',
    category: 'lighting',
    priceRetail: 120,
    priceWholesale: 65,
    minQty: 10,
    rating: 5,
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
    rating: 5,
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
    rating: 4,
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
    rating: 5,
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
    rating: 4,
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
    rating: 5,
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
    rating: 5,
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
    rating: 5,
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
    rating: 5,
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
    rating: 5,
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
    rating: 4,
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
    rating: 5,
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
    rating: 5,
    image: 'assets/products/blind-spot-mirrors-display.jpg'
let PRODUCTS = [];

async function loadCatalogData() {
  // 1. Initial fast local load
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      PRODUCTS = JSON.parse(raw);
    } else {
      PRODUCTS = [...DEFAULT_PRODUCTS];
    }
  } catch (e) {
    PRODUCTS = [...DEFAULT_PRODUCTS];
  }

  // 2. Fetch from Supabase Cloud Database
  const sb = typeof getSupabase === 'function' ? getSupabase() : null;
  if (sb) {
    try {
      const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        PRODUCTS = data.map(row => ({
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
        renderProducts();
      } else if (!error && data.length === 0) {
        // Auto-seed Supabase with default products on first run
        seedSupabaseDefaults(sb);
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local cache:', err);
    }
  }
}

async function seedSupabaseDefaults(sb) {
  try {
    const rows = DEFAULT_PRODUCTS.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      price_retail: p.priceRetail,
      price_wholesale: p.priceWholesale,
      min_qty: p.minQty,
      rating: p.rating,
      image: p.image
    }));
    await sb.from('products').upsert(rows);
  } catch (e) {
    console.warn('Supabase auto-seed warning:', e);
  }
}

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
    toast_added: "✓ Produit ajouté au panier !",
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
    toast_added: "✓ تمت إضافة المنتج إلى السلة بنجاح !",
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
    toast_added: "✓ Item added to cart!",
    stock_status: "In Stock",
    wholesale_label: "Wholesale Rate",
    retail_label: "MSRP Retail Price"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadCatalogData();
  loadCart();
  renderProducts();
  updateCartBadge();
  checkStoreStatus();

  // Listen for admin changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadCatalogData();
      renderProducts();
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

function updateVehicleModels() {
  // Vehicle selector helper
}

// --- CATALOG RENDERING ---
function renderProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;

  const filtered = PRODUCTS.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3.5rem 1.5rem; background: #ffffff; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
        <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-dark); margin-bottom: 0.35rem;">Aucun article ne correspond à votre recherche.</p>
        <p style="font-size: 0.88rem;">Essayez avec un autre mot clé ou réinitialisez les filtres.</p>
      </div>
    `;
    return;
  }

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

    const stars = '★'.repeat(p.rating || 5) + '☆'.repeat(5 - (p.rating || 5));

    return `
      <article class="product-item-card">
        <div class="product-image-container">
          <span class="badge-flag-stock">
            ● ${DICT[currentLang].stock_status}
          </span>
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>

        <div class="product-card-body">
          <span class="product-sku-code">Réf : ${p.sku}</span>
          <h3 class="product-item-title">${p.name}</h3>

          <div class="product-rating-stars">${stars}</div>

          <div class="product-pricing-wrap">
            <div>
              <span class="price-big-amount">${price} DH</span>
            </div>
            <span class="price-sub-note">${subtext}</span>
          </div>

          <div class="product-card-buttons">
            <button class="btn-card-add-cart" onclick="addToCart('${p.id}')">
              🛒 ${DICT[currentLang].add_to_cart}
            </button>
            <a href="${waLink}" target="_blank" class="btn-card-wa-order">
              💬 ${DICT[currentLang].order_wa}
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
  const p = PRODUCTS.find(item => item.id === productId);
  if (!p) return;

  const isWholesale = currentPriceMode === 'wholesale';
  const unitPrice = isWholesale ? p.priceWholesale : p.priceRetail;
  const packQty = isWholesale ? (p.minQty || 10) : 1;
  const tierLabel = isWholesale ? `Lot Grossiste (${packQty} pcs)` : '1 Pièce';

  const existingIndex = cart.findIndex(item => item.id === productId && item.isWholesale === isWholesale);

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
      packCount: 1
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
        <div style="font-size: 3rem; margin-bottom: 0.75rem;">🛒</div>
        <h3 style="color: var(--text-dark); font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem;">${DICT[currentLang].cart_empty}</h3>
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

    return `
      <div class="cart-row-item">
        <div class="cart-thumb-box">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-info-box">
          <h4>${item.name}</h4>
          <span>${item.tierLabel} • ${item.unitPrice} DH/u</span>
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
    <div style="background: #ffffff; border: 1px solid var(--border-light); border-radius: var(--radius-xs); padding: 1rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.65rem;">
      <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-dark); text-transform: uppercase;">
        📋 Vos Coordonnées de Livraison / Devis :
      </span>
      <input type="text" id="cartClientName" placeholder="Nom ou Nom du Garage / Magasin" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--border-light); border-radius: 4px; font-size: 0.85rem;">
      <input type="text" id="cartClientCity" placeholder="Ville de Livraison (ex: Agadir / Casablanca / Marrakech)" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--border-light); border-radius: 4px; font-size: 0.85rem;">
    </div>
  `;

  body.innerHTML = itemsHtml + customerBox;
  if (totalEl) totalEl.textContent = `${cartTotal.toFixed(0)} DH`;
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert(DICT[currentLang].cart_empty);
    return;
  }

  const nameInput = document.getElementById('cartClientName')?.value.trim() || 'Client';
  const cityInput = document.getElementById('cartClientCity')?.value.trim() || 'Maroc';

  let totalAmount = 0;
  let msg = `*COMMANDE / DEMANDE DE DEVIS - ABAZAR AUTO*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *Client / Garage :* ${nameInput}\n`;
  msg += `📍 *Ville de Destination :* ${cityInput}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 *DÉTAIL DU PANIER :*\n\n`;

  cart.forEach((item, i) => {
    const lineTotal = item.unitPrice * item.packQty * item.packCount;
    totalAmount += lineTotal;
    msg += `${i + 1}. *${item.name}*\n`;
    msg += `   • Réf: ${item.sku}\n`;
    msg += `   • Formule: ${item.tierLabel}\n`;
    msg += `   • Quantité: ${item.packCount} x ${item.packQty * item.unitPrice} DH = *${lineTotal.toFixed(0)} DH*\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL ESTIMÉ :* *${totalAmount.toFixed(0)} DH*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_Commande générée via abazar.ma_`;

  const waUrl = `https://api.whatsapp.com/send/?phone=212666349813&text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
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
    background: var(--bg-dark-nav);
    color: #ffffff;
    border: 2px solid var(--primary-red);
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-full);
    font-size: 0.88rem;
    font-weight: 700;
    z-index: 2000;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
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
