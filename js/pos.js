/**
 * SALON VELLORA — HIGH-SPEED POS & BILLING ENGINE
 * Rapid cart management, touch controls, split payments & thermal printing
 */

let allServices = [];
let allPackages = [];
let allProducts = [];
let allRentals = [];
let allCustomers = [];
let allStaff = [];

let currentCart = {
  customer_id: null,
  items: [],
  discount_type: 'fixed',
  discount_value: 0,
  discount_amount: 0,
  tax_percentage: 0,
  service_charge: 0,
  subtotal: 0,
  grand_total: 0,
};

let currentPaymentMethod = 'cash';
let lastCompletedSale = null;

document.addEventListener("DOMContentLoaded", async () => {
  common.initLayout("pos", "Point of Sale & Billing", "High-speed billing, service cart & 80mm thermal receipt generator");
  await loadPosCatalog();
  await loadStaffList();
  loadHeldBillsCount();
  recalculateTotals();
  if (window.lucide) lucide.createIcons();

  // Check if opened with quotation parameter (?load_quotation=ID)
  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get('load_quotation');
  if (quoteId) {
    loadQuotationIntoCart(quoteId);
  }
});

async function loadPosCatalog() {
  try {
    const res = await api.get("/pos/catalog");
    if (res && res.success && res.data) {
      allServices = [];
      (res.data.categories || []).forEach(cat => {
        if (cat.services) {
          cat.services.forEach(s => allServices.push({ ...s, category_name: cat.name }));
        }
      });

      allPackages = res.data.packages || [];
      allProducts = res.data.products || [];
      allRentals = res.data.rentals || [];
      allCustomers = res.data.customers || [];

      try {
        localStorage.setItem("salon_pos_catalog", JSON.stringify(res.data));
      } catch (storageErr) {
        console.warn("Could not cache catalog to localStorage:", storageErr);
      }
    }

    // Fallback rentals from localStorage if empty
    if (allRentals.length === 0) {
      const storedRentals = localStorage.getItem("salon_rental_catalog");
      if (storedRentals) {
        try {
          allRentals = JSON.parse(storedRentals);
        } catch (e) {}
      }
    }

    renderCategoryPills(res?.data?.categories || []);
    populateCustomerDropdown(allCustomers);
    renderPosItems(getAllCatalogItems());

  } catch (err) {
    console.error("POS Catalog Load Error:", err);
    // Offline fallback for entire catalog
    const cachedCatalogStr = localStorage.getItem("salon_pos_catalog");
    if (cachedCatalogStr) {
      try {
        const cached = JSON.parse(cachedCatalogStr);
        allServices = [];
        (cached.categories || []).forEach(cat => {
          if (cat.services) {
            cat.services.forEach(s => allServices.push({ ...s, category_name: cat.name }));
          }
        });
        allPackages = cached.packages || [];
        allProducts = cached.products || [];
        allRentals = cached.rentals || [];
        allCustomers = cached.customers || [];

        renderCategoryPills(cached.categories || []);
        populateCustomerDropdown(allCustomers);
        renderPosItems(getAllCatalogItems());
        common.showToast("Catalog loaded from offline cache.", "info");
        return;
      } catch (cacheErr) {
        console.warn("Could not parse offline catalog:", cacheErr);
      }
    }

    // Offline fallback for rentals if available
    const storedRentals = localStorage.getItem("salon_rental_catalog");
    if (storedRentals) {
      try {
        allRentals = JSON.parse(storedRentals);
        if (allRentals.length > 0) {
          renderPosItems(getAllCatalogItems());
          common.showToast("Rental catalog loaded with offline cache.", "info");
          return;
        }
      } catch (e) {}
    }

    const container = document.getElementById("pos-items-container");
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--text-muted);">
          <i data-lucide="alert-circle" style="width:36px;height:36px;margin-bottom:8px;color:var(--danger, #ef4444);"></i>
          <p style="margin:0;font-weight:600;color:#374151;">Failed to load catalog</p>
          <p style="font-size:0.85rem;margin-top:4px;color:var(--text-muted);">${escapeHtml(err.message || 'Check backend connection')}</p>
          <button class="btn-primary-custom" style="margin-top:12px;padding:6px 16px;cursor:pointer;" onclick="loadPosCatalog()">
            <i data-lucide="refresh-cw" style="width:14px;margin-right:6px;"></i> Retry
          </button>
        </div>`;
      if (window.lucide) lucide.createIcons();
    }
    common.showToast("Failed to load catalog: " + (err.message || "Connection error"), "danger");
  }
}

/**
 * Automatically resolves the default stylist ID matching the logged-in user account
 * Checks user.staff_id, staff.user_id, exact/partial staff name, and email
 */
function getDefaultStylistId() {
  const currentUser = (typeof auth !== 'undefined' && auth.getUser) ? auth.getUser() : null;
  if (!currentUser || !allStaff || allStaff.length === 0) return null;

  // 1. Direct staff_id on user object
  if (currentUser.staff_id) {
    const found = allStaff.find(s => s.id === Number(currentUser.staff_id));
    if (found) return found.id;
  }

  // 2. By staff.user_id matching currentUser.id
  const matchByUserId = allStaff.find(s => s.user_id && Number(s.user_id) === Number(currentUser.id));
  if (matchByUserId) return matchByUserId.id;

  // 3. Exact name match (case-insensitive)
  if (currentUser.name) {
    const curName = currentUser.name.trim().toLowerCase();
    const matchByName = allStaff.find(s => s.name && s.name.trim().toLowerCase() === curName);
    if (matchByName) return matchByName.id;

    // Partial/word match (e.g., "Bhagya" or "Sewwandi")
    const matchByPart = allStaff.find(s => {
      const sName = (s.name || '').trim().toLowerCase();
      if (!sName) return false;
      return curName.includes(sName) || sName.includes(curName);
    });
    if (matchByPart) return matchByPart.id;
  }

  // 4. By email match
  if (currentUser.email) {
    const curEmail = currentUser.email.trim().toLowerCase();
    const matchByEmail = allStaff.find(s => s.email && s.email.trim().toLowerCase() === curEmail);
    if (matchByEmail) return matchByEmail.id;
  }

  return null;
}

async function loadStaffList() {
  try {
    const res = await api.get("/staff");
    if (res.success && res.data) {
      allStaff = res.data;
      
      const defId = getDefaultStylistId();
      const indicator = document.getElementById("active-stylist-indicator");
      const nameEl = document.getElementById("active-stylist-name");

      if (defId) {
        const matched = allStaff.find(s => s.id === defId);
        if (matched && nameEl) {
          nameEl.innerText = matched.name;
          if (indicator) indicator.style.display = "flex";
        }

        // Auto-assign default stylist to any items in cart that don't have one yet
        currentCart.items.forEach(it => {
          if ((it.item_type === 'service' || it.item_type === 'package') && !it.staff_id) {
            it.staff_id = defId;
          }
        });
        renderCartItems();
      } else {
        const u = (typeof auth !== 'undefined' && auth.getUser) ? auth.getUser() : null;
        if (u && nameEl) {
          nameEl.innerText = u.name;
          if (indicator) indicator.style.display = "flex";
        }
      }
      if (window.lucide) lucide.createIcons();
    }
  } catch (err) {
    console.warn("Could not load staff for POS stylist assignment:", err);
  }
}

function getAllCatalogItems() {
  const items = [];
  allServices.forEach(s => items.push({ ...s, type: 'service', display_price: s.price }));
  allPackages.forEach(p => items.push({ ...p, type: 'package', display_price: p.package_price }));
  allProducts.forEach(pr => items.push({ ...pr, type: 'product', display_price: pr.retail_price }));
  allRentals.forEach(r => items.push({ ...r, type: 'rental', display_price: r.rental_price_per_24h, deposit: r.security_deposit }));
  return items;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderCategoryPills(categories) {
  const container = document.getElementById("pos-category-container");
  if (!container) return;

  let html = `
    <button class="category-pill active" onclick="selectCategory('all', this)">
      <i data-lucide="sparkles" style="width:13px;height:13px;"></i> All Items
    </button>
    <button class="category-pill" onclick="selectCategory('services', this)">
      <i data-lucide="scissors" style="width:13px;height:13px;"></i> All Services
    </button>
    <button class="category-pill" onclick="selectCategory('packages', this)">
      <i data-lucide="crown" style="width:13px;height:13px;"></i> Bridal Packages
    </button>
    <button class="category-pill" onclick="selectCategory('rentals', this)">
      <i data-lucide="gem" style="width:13px;height:13px;"></i> Bridal Rentals (24h)
    </button>
    <button class="category-pill" onclick="selectCategory('products', this)">
      <i data-lucide="package" style="width:13px;height:13px;"></i> Retail Products
    </button>
  `;

  categories.forEach(cat => {
    html += `<button class="category-pill" onclick="selectCategory('cat_${cat.id}', this)">${escapeHtml(cat.name)}</button>`;
  });

  container.innerHTML = html;

  // Smooth mouse-wheel horizontal scrolling
  container.onwheel = (evt) => {
    if (evt.deltaY !== 0) {
      evt.preventDefault();
      container.scrollLeft += evt.deltaY;
    }
  };

  if (window.lucide) {
    lucide.createIcons();
  }
}

let activeCategoryFilter = 'all';
let lastFilteredItems = [];

/**
 * Builds a comprehensive search string from any catalog item (Service, Package, Product, Rental)
 * Handles nested objects (category, brand) safely without TypeError
 */
function getItemSearchableString(item) {
  const parts = [];
  if (item.name) parts.push(String(item.name));
  if (item.code) parts.push(String(item.code));
  if (item.sku) parts.push(String(item.sku));
  if (item.barcode) parts.push(String(item.barcode));
  
  // Category Name (string or object)
  if (item.category_name) {
    parts.push(String(item.category_name));
  }
  if (typeof item.category === 'string') {
    parts.push(item.category);
  } else if (item.category && typeof item.category === 'object' && item.category.name) {
    parts.push(String(item.category.name));
  }

  // Brand Name (string or object)
  if (typeof item.brand === 'string') {
    parts.push(item.brand);
  } else if (item.brand && typeof item.brand === 'object' && item.brand.name) {
    parts.push(String(item.brand.name));
  }

  // Type (service, package, product, rental)
  if (item.type) {
    parts.push(String(item.type));
  }

  // Numerical Price
  if (item.display_price !== undefined && item.display_price !== null) {
    parts.push(String(Math.round(item.display_price)));
  }

  return parts.join(' ').toLowerCase();
}

function clearPosSearch() {
  const searchInput = document.getElementById("pos-search");
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }
  const clearBtn = document.getElementById("pos-search-clear");
  if (clearBtn) clearBtn.style.display = "none";
  filterPosItems();
}

function handlePosSearchKeydown(event) {
  if (event.key === 'Escape') {
    clearPosSearch();
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    const query = (document.getElementById("pos-search").value || "").trim();
    if (!query) return;

    const allItems = getAllCatalogItems();
    const queryLower = query.toLowerCase();

    // 1. Direct exact match on barcode or sku or code (vital for high-speed barcode scanners)
    const exactMatch = allItems.find(i => 
      (i.barcode && String(i.barcode).toLowerCase() === queryLower) ||
      (i.sku && String(i.sku).toLowerCase() === queryLower) ||
      (i.code && String(i.code).toLowerCase() === queryLower)
    );

    if (exactMatch) {
      addItemToCart(exactMatch.type, exactMatch.id);
      common.showToast(`Added '${exactMatch.name}' to bill!`, "success", 2000);
      clearPosSearch();
      return;
    }

    // 2. If exactly one item is matched by the search filter, add it directly to cart
    if (lastFilteredItems && lastFilteredItems.length === 1) {
      const singleItem = lastFilteredItems[0];
      addItemToCart(singleItem.type, singleItem.id);
      common.showToast(`Added '${singleItem.name}' to bill!`, "success", 2000);
      clearPosSearch();
      return;
    }
  }
}

function selectCategory(filterKey, buttonEl) {
  activeCategoryFilter = filterKey;
  document.querySelectorAll(".category-pill").forEach(b => b.classList.remove("active"));
  if (buttonEl) buttonEl.classList.add("active");
  filterPosItems();
}

function filterPosItems() {
  const searchInput = document.getElementById("pos-search");
  const query = (searchInput ? searchInput.value : "").trim();
  const clearBtn = document.getElementById("pos-search-clear");
  if (clearBtn) {
    clearBtn.style.display = query ? "block" : "none";
  }

  const allItems = getAllCatalogItems();
  let categoryFiltered = allItems;

  if (activeCategoryFilter === 'services') {
    categoryFiltered = allItems.filter(i => i.type === 'service');
  } else if (activeCategoryFilter === 'packages') {
    categoryFiltered = allItems.filter(i => i.type === 'package');
  } else if (activeCategoryFilter === 'products') {
    categoryFiltered = allItems.filter(i => i.type === 'product');
  } else if (activeCategoryFilter === 'rentals') {
    categoryFiltered = allItems.filter(i => i.type === 'rental');
  } else if (activeCategoryFilter.startsWith('cat_')) {
    const catId = parseInt(activeCategoryFilter.replace('cat_', ''));
    categoryFiltered = allItems.filter(i => i.type === 'service' && i.category_id === catId);
  }

  let finalItems = categoryFiltered;

  if (query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let matches = categoryFiltered.filter(item => {
      const text = getItemSearchableString(item);
      return terms.every(term => text.includes(term));
    });

    // Smart fallback: If no matches inside active category, search across the entire catalog!
    if (matches.length === 0 && activeCategoryFilter !== 'all') {
      const globalMatches = allItems.filter(item => {
        const text = getItemSearchableString(item);
        return terms.every(term => text.includes(term));
      });
      if (globalMatches.length > 0) {
        matches = globalMatches;
      }
    }

    finalItems = matches;
  }

  lastFilteredItems = finalItems;
  renderPosItems(finalItems);
}

function renderPosItems(items) {
  const container = document.getElementById("pos-items-container");
  const searchInput = document.getElementById("pos-search");
  const query = (searchInput ? searchInput.value : "").trim();

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--text-muted);">
        <i data-lucide="package-search" style="width:36px;height:36px;margin-bottom:8px;color:var(--text-light);"></i>
        <p style="margin:0;font-weight:600;color:#374151;">${query ? `No items found matching "${escapeHtml(query)}"` : 'No items found'}</p>
        <p style="font-size:0.8rem;margin-top:4px;">${query ? 'Check spelling, try another keyword, or clear your search.' : 'Try selecting another category.'}</p>
        ${query ? `<button class="btn-secondary-custom" style="margin-top:10px;padding:6px 14px;font-size:0.8rem;" onclick="clearPosSearch()"><i data-lucide="x" style="width:13px;margin-right:4px;"></i> Clear Search</button>` : ''}
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = items.map(item => {
    let badge = '';
    if (item.type === 'service') {
      badge = `<span class="pos-item-badge badge-primary"><i data-lucide="clock" style="width:10px;height:10px;"></i> ${item.duration_minutes || 45}m</span>`;
    } else if (item.type === 'package') {
      badge = `<span class="pos-item-badge badge-purple"><i data-lucide="crown" style="width:10px;height:10px;"></i> Package</span>`;
    } else if (item.type === 'product') {
      const isLow = item.stock_quantity <= item.alert_quantity;
      badge = `<span class="pos-item-badge ${isLow ? 'badge-danger' : 'badge-success'}">${item.stock_quantity} in stock</span>`;
    } else if (item.type === 'rental') {
      const avail = (item.available_quantity !== undefined && item.available_quantity !== null) ? item.available_quantity : 1;
      const isAvail = avail > 0;
      badge = `<span class="pos-item-badge ${isAvail ? 'badge-rental' : 'badge-danger'}"><i data-lucide="gem" style="width:10px;height:10px;"></i> 24h • ${avail} left</span>`;
    }

    const code = item.code || (item.type === 'product' ? (item.sku || 'PROD') : 'SV');

    return `
      <div class="pos-item-card ${item.type === 'rental' ? 'rental' : ''}" onclick="addItemToCart('${item.type}', ${item.id})">
        <div>
          <div class="pos-item-top">
            <span class="pos-item-code">${escapeHtml(code)}</span>
            ${badge}
          </div>
          <div class="pos-item-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
          <div class="pos-item-meta">
            ${item.type === 'product' ? (item.brand ? escapeHtml(item.brand.name) : 'Product') : (item.type === 'rental' ? escapeHtml(item.category || 'Bridal Rental') : escapeHtml(item.category_name || 'Salon Treatment'))}
          </div>
          ${item.type === 'rental' ? `
            <div class="pos-rental-deposit-pill" title="Security Deposit Refundable Upon Return">
              <i data-lucide="shield" style="width:10px;height:10px;"></i>
              <span>Deposit: ${common.formatCurrency(item.security_deposit || 0)}</span>
            </div>` : ''}
        </div>
        <div class="pos-item-bottom">
          <div class="pos-item-price">${common.formatCurrency(item.display_price)}</div>
          <div class="pos-item-add-btn" title="Add to Bill">
            <i data-lucide="plus" style="width:14px;height:14px;"></i>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}


function populateCustomerDropdown(customers) {
  const select = document.getElementById("cart-customer-select");
  let options = `<option value="">Walk-in Client</option>`;
  customers.forEach(c => {
    options += `<option value="${c.id}">${c.name} (${c.phone})</option>`;
  });
  select.innerHTML = options;
}

function onCustomerChange() {
  const custId = document.getElementById("cart-customer-select").value;
  currentCart.customer_id = custId ? parseInt(custId) : null;

  const loyaltyBox = document.getElementById("customer-loyalty-info");
  if (currentCart.customer_id) {
    const cust = allCustomers.find(c => c.id === currentCart.customer_id);
    if (cust) {
      document.getElementById("client-points").innerText = cust.loyalty_points || 0;
      document.getElementById("client-visits").innerText = cust.total_visits || 0;
      loyaltyBox.style.display = "block";
      return;
    }
  }
  loyaltyBox.style.display = "none";
}

function addItemToCart(type, id) {
  let sourceItem = null;
  if (type === 'service') sourceItem = allServices.find(s => s.id === id);
  if (type === 'package') sourceItem = allPackages.find(p => p.id === id);
  if (type === 'product') sourceItem = allProducts.find(pr => pr.id === id);
  if (type === 'rental') sourceItem = allRentals.find(r => r.id === id);

  if (!sourceItem) return;

  // Stock check for products
  if (type === 'product') {
    const existingInCart = currentCart.items.find(i => i.item_type === 'product' && i.item_id === id);
    const requestedQty = (existingInCart ? existingInCart.quantity : 0) + 1;
    if (sourceItem.stock_quantity < requestedQty) {
      common.showToast(`Insufficient stock! Only ${sourceItem.stock_quantity} available for '${sourceItem.name}'.`, "warning");
      return;
    }
  }

  // Stock check for rentals
  if (type === 'rental') {
    const existingInCart = currentCart.items.find(i => i.item_type === 'rental' && i.item_id === id);
    const requestedQty = (existingInCart ? existingInCart.quantity : 0) + 1;
    const available = sourceItem.available_quantity !== undefined ? sourceItem.available_quantity : 1;
    if (available < requestedQty) {
      common.showToast(`Rental item '${sourceItem.name}' is currently rented out or unavailable.`, "warning");
      return;
    }
  }

  const defaultStaffId = (type === 'service' || type === 'package') ? getDefaultStylistId() : null;

  const existingIndex = currentCart.items.findIndex(i => i.item_type === type && i.item_id === id);
  if (existingIndex > -1) {
    currentCart.items[existingIndex].quantity += 1;
    if (!currentCart.items[existingIndex].staff_id && defaultStaffId) {
      currentCart.items[existingIndex].staff_id = defaultStaffId;
    }
  } else {
    currentCart.items.push({
      item_type: type,
      item_id: id,
      name: sourceItem.name,
      unit_price: parseFloat(sourceItem.display_price || sourceItem.price || sourceItem.package_price || sourceItem.retail_price || sourceItem.rental_price_per_24h),
      deposit_amount: parseFloat(sourceItem.security_deposit || 0),
      duration_hours: 24,
      quantity: 1,
      staff_id: defaultStaffId,
      discount_amount: 0,
    });
  }

  renderCartItems();
  recalculateTotals();
}

function updateItemQuantity(index, delta) {
  const item = currentCart.items[index];
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeItemFromCart(index);
    return;
  }

  // Stock check if product
  if (item.item_type === 'product' && delta > 0) {
    const prod = allProducts.find(p => p.id === item.item_id);
    if (prod && prod.stock_quantity < newQty) {
      common.showToast(`Cannot add more. Stock limit reached (${prod.stock_quantity} units).`, "warning");
      return;
    }
  }

  // Stock check if rental
  if (item.item_type === 'rental' && delta > 0) {
    const rentItem = allRentals.find(r => r.id === item.item_id);
    if (rentItem && (rentItem.available_quantity !== undefined) && rentItem.available_quantity < newQty) {
      common.showToast(`Cannot add more. Rental stock limit reached (${rentItem.available_quantity} available).`, "warning");
      return;
    }
  }

  item.quantity = newQty;
  renderCartItems();
  recalculateTotals();
}

function removeItemFromCart(index) {
  currentCart.items.splice(index, 1);
  renderCartItems();
  recalculateTotals();
}

function updateItemStaff(index, staffId) {
  if (currentCart.items[index]) {
    currentCart.items[index].staff_id = staffId ? parseInt(staffId) : null;
  }
}

function clearCart() {
  if (currentCart.items.length === 0) return;
  common.showConfirm({
    title: "Clear Current Cart?",
    message: "Are you sure you want to remove all items from the current bill?",
    confirmText: "Yes, Clear Cart",
    isDanger: true,
    onConfirm: () => {
      currentCart.items = [];
      document.getElementById("cart-discount-val").value = 0;
      renderCartItems();
      recalculateTotals();
      common.showToast("Cart cleared.", "info");
    }
  });
}

function renderCartItems() {
  const container = document.getElementById("cart-items-container");
  if (currentCart.items.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 4.5rem 1rem; color: var(--text-muted);">
        <div style="width:52px; height:52px; border-radius:50%; background:#fff5f8; border:1px dashed #fce7ec; display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;">
          <i data-lucide="shopping-bag" style="width:24px;height:24px;color:#C95D7E;"></i>
        </div>
        <p style="font-weight:700; font-size:0.95rem; color:#1e293b; margin:0;">Current Bill is Empty</p>
        <p style="font-size:0.8rem; color:#64748b; margin-top:4px;">Tap any service, package, or retail product to start billing.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = currentCart.items.map((item, idx) => {
    let typeBadgeClass = 'badge-primary';
    let typeIcon = 'scissors';
    let typeLabel = 'Service';

    if (item.item_type === 'package') {
      typeBadgeClass = 'badge-purple';
      typeIcon = 'crown';
      typeLabel = 'Package';
    } else if (item.item_type === 'product') {
      typeBadgeClass = 'badge-success';
      typeIcon = 'package';
      typeLabel = 'Retail Product';
    } else if (item.item_type === 'rental') {
      typeBadgeClass = 'badge-warning';
      typeIcon = 'gem';
      typeLabel = '24h Rental';
    }

    const itemTotal = (item.unit_price * item.quantity) - (item.discount_amount || 0);

    return `
      <div class="cart-item-card">
        <!-- Top Row: Badge, Title & Delete -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px; flex-wrap:wrap;">
              <span class="badge-custom ${typeBadgeClass}" style="font-size:0.65rem; padding:1.5px 6px; font-weight:700; border-radius:4px; text-transform:uppercase; letter-spacing:0.4px;">
                <i data-lucide="${typeIcon}" style="width:10px;height:10px;margin-right:3px;vertical-align:-1px;"></i>${typeLabel}
              </span>
              ${item.item_type === 'rental' ? `
                <span style="font-size:0.68rem; color:#b45309; font-weight:700; background:#fffbeb; border:1px solid #fde68a; padding:1px 5px; border-radius:4px;">
                  Deposit: ${common.formatCurrency(item.deposit_amount || 0)}
                </span>` : ''}
            </div>
            <div class="cart-item-title" title="${escapeHtml(item.name)}">
              ${escapeHtml(item.name)}
            </div>
          </div>

          <button type="button" class="cart-item-del-btn" onclick="removeItemFromCart(${idx})" title="Remove item">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
          </button>
        </div>

        <!-- Middle Row: Stylist Selector (Only for Services & Packages) -->
        ${(item.item_type === 'service' || item.item_type === 'package') ? `
          <div class="cart-stylist-pill">
            <span style="color:#C95D7E; display:flex; align-items:center; gap:4px; font-size:0.73rem; font-weight:700; flex-shrink:0;">
              <i data-lucide="scissors" style="width:12px; height:12px;"></i> Stylist:
            </span>
            <select class="form-select-custom cart-stylist-select" style="font-size:0.78rem; font-weight:600; padding:2px 4px; height:26px; border:none; background:transparent; color:#1e293b; width:100%; cursor:pointer; outline:none;" onchange="updateItemStaff(${idx}, this.value)">
              <option value="">Choose Stylist...</option>
              ${allStaff.map(s => `
                <option value="${s.id}" ${item.staff_id === s.id ? 'selected' : ''}>
                  ${escapeHtml(s.name)}${s.specialization ? ` (${escapeHtml(s.specialization)})` : ''}
                </option>
              `).join("")}
            </select>
          </div>
        ` : ''}

        <!-- Bottom Row: Stepper, Unit Rate & Line Total -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px; border-top:1px dashed #fce7ec; margin-top:${(item.item_type === 'service' || item.item_type === 'package') ? '0' : '8px'};">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="qty-control">
              <button type="button" class="qty-btn" onclick="updateItemQuantity(${idx}, -1)" title="Decrease quantity">−</button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly>
              <button type="button" class="qty-btn" onclick="updateItemQuantity(${idx}, 1)" title="Increase quantity">+</button>
            </div>
            ${item.quantity > 1 ? `
              <span style="font-size:0.72rem; color:#64748b; font-weight:600;">
                @ ${common.formatCurrency(item.unit_price)}
              </span>` : ''}
          </div>

          <div style="text-align:right;">
            <div style="font-weight:900; font-size:0.95rem; color:#0f172a; letter-spacing:0.2px;">
              ${common.formatCurrency(itemTotal)}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function setDiscountType(type) {
  const hiddenInput = document.getElementById("cart-discount-type");
  const btnFixed = document.getElementById("disc-btn-fixed");
  const btnPercent = document.getElementById("disc-btn-percent");

  if (hiddenInput) hiddenInput.value = type;

  if (btnFixed && btnPercent) {
    if (type === 'fixed') {
      btnFixed.classList.add("active");
      btnPercent.classList.remove("active");
    } else {
      btnPercent.classList.add("active");
      btnFixed.classList.remove("active");
    }
  }

  recalculateTotals();
}

function recalculateTotals() {
  let subtotal = 0;
  let totalItemsCount = 0;
  currentCart.items.forEach(item => {
    const qty = item.quantity || 1;
    totalItemsCount += qty;
    subtotal += (item.unit_price * qty) - (item.discount_amount || 0);
  });

  const discTypeEl = document.getElementById("cart-discount-type");
  const discType = discTypeEl ? discTypeEl.value : 'fixed';
  const discVal = parseFloat(document.getElementById("cart-discount-val")?.value) || 0;

  let discountAmount = 0;
  if (discType === 'percentage') {
    discountAmount = subtotal * (discVal / 100);
  } else {
    discountAmount = discVal;
  }

  discountAmount = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = 0; // Configurable tax
  const grandTotal = taxableAmount + taxAmount;

  currentCart.subtotal = subtotal;
  currentCart.discount_type = discType;
  currentCart.discount_value = discVal;
  currentCart.discount_amount = discountAmount;
  currentCart.tax_percentage = 0;
  currentCart.grand_total = grandTotal;

  // Format numbers nicely
  const subtotalEl = document.getElementById("cart-subtotal");
  if (subtotalEl) subtotalEl.innerText = common.formatCurrency(subtotal);

  const itemsCountEl = document.getElementById("cart-items-count");
  if (itemsCountEl) itemsCountEl.innerText = totalItemsCount;

  const taxEl = document.getElementById("cart-tax");
  if (taxEl) taxEl.innerText = common.formatCurrency(taxAmount);

  const grandTotalEl = document.getElementById("cart-grand-total");
  if (grandTotalEl) {
    grandTotalEl.innerText = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const checkoutBadge = document.getElementById("btn-checkout-amount-badge");
  if (checkoutBadge) {
    checkoutBadge.innerText = common.formatCurrency(grandTotal);
  }
}

// Payment Modal & Methods (Next-Level Luxury UX)
function openPaymentModal() {
  if (currentCart.items.length === 0) {
    common.showToast("Cart is empty. Please add items before checking out.", "warning");
    return;
  }

  recalculateTotals();

  // Populate client badge & items count badge
  const custName = currentCart.customer ? currentCart.customer.name : "Walk-in Client";
  const totalItemsCount = currentCart.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const clientInfoEl = document.getElementById("modal-client-info");
  if (clientInfoEl) {
    clientInfoEl.innerHTML = `<i data-lucide="user" style="width:12px;height:12px;"></i> ${custName} &bull; ${totalItemsCount} item${totalItemsCount > 1 ? 's' : ''}`;
  }

  document.getElementById("modal-due-amount").innerText = common.formatCurrency(currentCart.grand_total);
  document.getElementById("tendered-amount").value = currentCart.grand_total;
  calculateChange();
  renderQuickCashSuggestions(currentCart.grand_total);

  setPaymentMethod('cash');
  document.getElementById("payment-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();

  // Auto-focus tendered input for fast typing
  setTimeout(() => {
    const input = document.getElementById("tendered-amount");
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
}

function closePaymentModal() {
  document.getElementById("payment-modal").classList.remove("active");
}

function setPaymentMethod(method, btn) {
  currentPaymentMethod = method;
  document.querySelectorAll(".pay-method-card").forEach(b => b.classList.remove("active-method"));
  
  const targetBtn = btn || document.getElementById(`pay-method-${method === 'bank_transfer' ? 'bank' : method}`);
  if (targetBtn) targetBtn.classList.add("active-method");

  const cashFields = document.getElementById("cash-payment-fields");
  const splitFields = document.getElementById("split-payment-fields");

  if (method === 'split') {
    cashFields.style.display = 'none';
    splitFields.style.display = 'block';
    const half = Math.round((currentCart.grand_total / 2) * 100) / 100;
    const remainder = Math.round((currentCart.grand_total - half) * 100) / 100;
    document.getElementById("split-cash-amount").value = half;
    document.getElementById("split-card-amount").value = remainder;
    calculateSplitChange();
  } else {
    cashFields.style.display = 'block';
    splitFields.style.display = 'none';
    
    // If card or bank transfer, default tendered amount to exact total
    if (method === 'card' || method === 'bank_transfer') {
      document.getElementById("tendered-amount").value = currentCart.grand_total;
      calculateChange();
    }
  }
}

function renderQuickCashSuggestions(total) {
  const container = document.getElementById("quick-cash-pills");
  if (!container) return;

  const suggestions = [
    { label: `Exact (LKR ${total.toLocaleString()})`, val: total, isExact: true },
  ];

  // Useful cash increments
  if (total > 0) {
    const next1k = Math.ceil(total / 1000) * 1000;
    if (next1k > total) suggestions.push({ label: `LKR ${next1k.toLocaleString()}`, val: next1k });

    const next5k = Math.ceil(total / 5000) * 5000;
    if (next5k > total && next5k !== next1k) suggestions.push({ label: `LKR ${next5k.toLocaleString()}`, val: next5k });

    const next10k = Math.ceil(total / 10000) * 10000;
    if (next10k > total && next10k !== next5k && next10k !== next1k) suggestions.push({ label: `LKR ${next10k.toLocaleString()}`, val: next10k });

    // Also quick +1,000 and +5,000 buttons
    suggestions.push({ label: `+ 1,000`, val: total + 1000 });
    suggestions.push({ label: `+ 5,000`, val: total + 5000 });
  }

  // De-duplicate values
  const seen = new Set();
  const uniqueSugg = suggestions.filter(s => {
    if (seen.has(s.val)) return false;
    seen.add(s.val);
    return true;
  });

  container.innerHTML = uniqueSugg.map(s => `
    <button type="button" class="quick-cash-chip ${s.isExact ? 'exact-chip' : ''}" onclick="setTendered(${s.val})">
      ${s.label}
    </button>
  `).join("");
}

function setTendered(val) {
  document.getElementById("tendered-amount").value = val;
  calculateChange();
}

function calculateChange() {
  const tendered = parseFloat(document.getElementById("tendered-amount").value) || 0;
  const grandTotal = currentCart.grand_total || 0;
  const banner = document.getElementById("change-due-banner");
  if (!banner) return;

  if (tendered > grandTotal) {
    const change = tendered - grandTotal;
    banner.style.background = "#ecfdf5";
    banner.style.borderColor = "#a7f3d0";
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:#065f46;font-weight:700;">
        <i data-lucide="arrow-down-right" style="width:20px;height:20px;"></i>
        <span>Change Due to Client:</span>
      </div>
      <span id="change-due-amount" style="font-weight:800;font-size:1.35rem;color:#059669;">${common.formatCurrency(change)}</span>
    `;
  } else if (tendered === grandTotal) {
    banner.style.background = "#f0fdf4";
    banner.style.borderColor = "#bbf7d0";
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:#166534;font-weight:700;font-size:0.88rem;">
        <i data-lucide="check-circle-2" style="width:18px;height:18px;color:#16a34a;"></i>
        <span>Exact Payment Received &bull; No Change Required</span>
      </div>
      <span id="change-due-amount" style="font-weight:800;font-size:1.15rem;color:#16a34a;">LKR 0.00</span>
    `;
  } else {
    const diff = grandTotal - tendered;
    banner.style.background = "#fff1f2";
    banner.style.borderColor = "#fecdd3";
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:#9f1239;font-weight:700;font-size:0.88rem;">
        <i data-lucide="alert-circle" style="width:18px;height:18px;color:#e11d48;"></i>
        <span>Remaining Balance Due:</span>
      </div>
      <span id="change-due-amount" style="font-weight:800;font-size:1.25rem;color:#e11d48;">${common.formatCurrency(diff)}</span>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function calculateSplitChange() {
  const cash = parseFloat(document.getElementById("split-cash-amount").value) || 0;
  const card = parseFloat(document.getElementById("split-card-amount").value) || 0;
  const total = cash + card;
  const grandTotal = currentCart.grand_total || 0;
  const diff = grandTotal - total;
  const notice = document.getElementById("split-balance-notice");
  if (!notice) return;

  if (Math.abs(diff) < 0.01) {
    notice.style.background = "#ecfdf5";
    notice.innerHTML = `<span style="color:#059669;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check-circle" style="width:14px;height:14px;"></i> Split matches total (LKR ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>`;
  } else if (diff > 0) {
    notice.style.background = "#fff1f2";
    notice.innerHTML = `<span style="color:#e11d48;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="alert-circle" style="width:14px;height:14px;"></i> Underallocated by: LKR ${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`;
  } else {
    notice.style.background = "#fffbeb";
    notice.innerHTML = `<span style="color:#d97706;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="info" style="width:14px;height:14px;"></i> Overallocated by: LKR ${(-diff).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`;
  }

  if (window.lucide) lucide.createIcons();
}

// Global Enter key listener for payment modal checkout
document.addEventListener("keydown", function(e) {
  const payModal = document.getElementById("payment-modal");
  if (payModal && payModal.classList.contains("active") && e.key === "Enter") {
    // If not in bill-notes text field
    if (document.activeElement && document.activeElement.id === "bill-notes") return;
    e.preventDefault();
    processSaleCheckout();
  }
});

async function processSaleCheckout() {
  const btn = document.getElementById("btn-process-sale");
  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:18px;height:18px;"></i> Processing Transaction...`;
  if (window.lucide) lucide.createIcons();

  try {
    let paidAmount = currentCart.grand_total;
    let payments = [];

    if (currentPaymentMethod === 'cash') {
      paidAmount = parseFloat(document.getElementById("tendered-amount").value) || currentCart.grand_total;
    } else if (currentPaymentMethod === 'split') {
      const cash = parseFloat(document.getElementById("split-cash-amount").value) || 0;
      const card = parseFloat(document.getElementById("split-card-amount").value) || 0;
      paidAmount = cash + card;
      payments = [
        { payment_method: 'cash', amount: cash },
        { payment_method: 'card', amount: card }
      ];
    }

    const payload = {
      customer_id: currentCart.customer_id,
      items: currentCart.items,
      discount_type: currentCart.discount_type,
      discount_value: currentCart.discount_value,
      discount_amount: currentCart.discount_amount,
      tax_percentage: currentCart.tax_percentage,
      service_charge: currentCart.service_charge,
      grand_total: currentCart.grand_total,
      payment_method: currentPaymentMethod,
      paid_amount: paidAmount,
      payments: payments.length > 0 ? payments : undefined,
      notes: document.getElementById("bill-notes").value.trim() || undefined,
    };

    const res = await api.post("/pos/checkout", payload);
    if (!res.success || !res.data) throw new Error(res.message || "Failed to complete sale.");

    lastCompletedSale = res.data;

    closePaymentModal();
    common.showToast(`Invoice ${res.data.invoice_number} completed successfully!`, "success");

    // Reset Cart
    currentCart.items = [];
    document.getElementById("cart-discount-val").value = 0;
    renderCartItems();
    recalculateTotals();

    // Trigger Print Receipt Dialog
    showReceiptModal(lastCompletedSale);

  } catch (err) {
    console.error("POS Checkout Error:", err);
    common.showToast(err.message || "Checkout failed.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <i data-lucide="sparkles" style="width:18px;height:18px;"></i>
      <span>Confirm & Complete Sale</span>
      <span class="kbd-enter-hint">↵ Enter</span>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

// Luxury Receipt & A4 Invoice Engine Integration
let currentReceiptFormat = 'thermal';

function showReceiptModal(sale) {
  lastCompletedSale = sale;
  currentReceiptFormat = 'thermal';

  // Populate dynamic header subtitle
  const metaEl = document.getElementById("receipt-modal-meta");
  if (metaEl && sale) {
    const invNum = sale.invoice_number || `SV-INV-${sale.id}`;
    const total = common.formatCurrency(sale.grand_total || 0);
    const method = (sale.payment_method || 'Cash').toUpperCase();
    metaEl.innerHTML = `Invoice: <b style="color:#0f172a; font-family:monospace;">${invNum}</b> &bull; Paid <b style="color:#059669;">${total}</b> via ${method}`;
  }

  renderReceiptPreview();
  document.getElementById("receipt-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function switchReceiptTab(format) {
  currentReceiptFormat = format;
  const btnA4Half = document.getElementById("tab-btn-a4-half");
  const btnA4Dual = document.getElementById("tab-btn-a4-dual");
  const btnThermal = document.getElementById("tab-btn-thermal");

  const tabs = [
    { btn: btnA4Half, id: 'a4-half' },
    { btn: btnA4Dual, id: 'a4-dual' },
    { btn: btnThermal, id: 'thermal' }
  ];

  tabs.forEach(t => {
    if (!t.btn) return;
    if (t.id === format) {
      t.btn.classList.add("active");
    } else {
      t.btn.classList.remove("active");
    }
  });

  renderReceiptPreview();
}

function renderReceiptPreview() {
  if (!lastCompletedSale) return;
  const container = document.getElementById("receipt-print-area");
  const actionsContainer = document.getElementById("receipt-action-buttons");

  // Scroll preview back to top so header/logo is always immediately visible
  const previewBody = document.querySelector(".receipt-preview-body");
  if (previewBody) previewBody.scrollTop = 0;

  if (currentReceiptFormat === 'thermal') {
    container.innerHTML = PrintEngine.generateThermalReceipt(lastCompletedSale);
    actionsContainer.innerHTML = `
      <button type="button" class="btn-receipt-action btn-wa" onclick="handleShareReceiptWhatsApp()">
        <i data-lucide="message-circle" style="width:15px; height:15px;"></i>
        <span>Share WhatsApp</span>
      </button>
      <button type="button" class="btn-receipt-action btn-pdf" onclick="handleDownloadReceiptPdf()">
        <i data-lucide="download" style="width:15px; height:15px;"></i>
        <span>Download PDF</span>
      </button>
      <button type="button" class="btn-receipt-action btn-print" onclick="handlePrintReceipt()">
        <i data-lucide="printer" style="width:15px; height:15px;"></i>
        <span>Print Receipt</span>
      </button>
    `;
  } else if (currentReceiptFormat === 'a4-dual') {
    container.innerHTML = PrintEngine.generateDualA4Invoice(lastCompletedSale);
    actionsContainer.innerHTML = `
      <button type="button" class="btn-receipt-action btn-wa" onclick="handleShareReceiptWhatsApp()">
        <i data-lucide="message-circle" style="width:15px; height:15px;"></i>
        <span>Share WhatsApp</span>
      </button>
      <button type="button" class="btn-receipt-action btn-pdf" onclick="handleDownloadDualA4Pdf()">
        <i data-lucide="download" style="width:15px; height:15px;"></i>
        <span>Download PDF</span>
      </button>
      <button type="button" class="btn-receipt-action btn-print" onclick="handlePrintDualA4()">
        <i data-lucide="printer" style="width:15px; height:15px;"></i>
        <span>Print 2-in-1 A4</span>
      </button>
    `;
  } else {
    // Default: Half-A4 (Landscape)
    container.innerHTML = PrintEngine.generateA4Invoice(lastCompletedSale, "HALF A4 TAX INVOICE", false);
    actionsContainer.innerHTML = `
      <button type="button" class="btn-receipt-action btn-wa" onclick="handleShareReceiptWhatsApp()">
        <i data-lucide="message-circle" style="width:15px; height:15px;"></i>
        <span>Share WhatsApp</span>
      </button>
      <button type="button" class="btn-receipt-action btn-pdf" onclick="handleDownloadA4Pdf()">
        <i data-lucide="download" style="width:15px; height:15px;"></i>
        <span>Download PDF</span>
      </button>
      <button type="button" class="btn-receipt-action btn-print" onclick="handlePrintA4()">
        <i data-lucide="printer" style="width:15px; height:15px;"></i>
        <span>Print Half A4</span>
      </button>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function handleShareReceiptWhatsApp() {
  if (!lastCompletedSale) return;
  WhatsAppShare.shareSaleReceipt(lastCompletedSale);
}

function handlePrintReceipt() {
  if (!lastCompletedSale) return;
  const container = document.getElementById("receipt-print-area");
  const target = (container && container.firstElementChild) ? container.firstElementChild : PrintEngine.generateThermalReceipt(lastCompletedSale);
  PrintEngine.printThermal(target);
}

function handleDownloadReceiptPdf() {
  if (!lastCompletedSale) return;
  const container = document.getElementById("receipt-print-area");
  const html = PrintEngine.generateThermalReceipt(lastCompletedSale);
  PrintEngine.downloadAsPdf(html, `Salon_Vellora_Receipt_${lastCompletedSale.invoice_number}.pdf`, true);
}

function handlePrintA4() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateA4Invoice(lastCompletedSale, "HALF A4 TAX INVOICE", false);
  PrintEngine.printA4Half(html);
}

function handleDownloadA4Pdf() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateA4Invoice(lastCompletedSale, "HALF A4 TAX INVOICE", false);
  PrintEngine.downloadAsPdf(html, `Salon_Vellora_Invoice_${lastCompletedSale.invoice_number}.pdf`, 'half-a4-landscape');
}

function handlePrintDualA4() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateDualA4Invoice(lastCompletedSale);
  PrintEngine.printDualA4(html);
}

function handleDownloadDualA4Pdf() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateDualA4Invoice(lastCompletedSale);
  PrintEngine.downloadAsPdf(html, `Salon_Vellora_Dual_Invoice_${lastCompletedSale.invoice_number}.pdf`, 'dual-a4');
}

function closeReceiptModal() {
  document.getElementById("receipt-modal").classList.remove("active");
}

// Hold & Resume
function openHoldBillModal() {
  if (currentCart.items.length === 0) {
    common.showToast("Cannot hold an empty cart.", "warning");
    return;
  }
  document.getElementById("hold-bill-modal").classList.add("active");
}
function closeHoldBillModal() {
  document.getElementById("hold-bill-modal").classList.remove("active");
}

async function confirmHoldBill() {
  const ref = document.getElementById("hold-bill-reference").value.trim();
  if (!ref) {
    common.showToast("Please enter a hold reference.", "warning");
    return;
  }

  try {
    const res = await api.post("/pos/hold", {
      hold_reference: ref,
      cart_data: currentCart,
    });
    if (res.success) {
      common.showToast("Bill placed on hold.", "success");
      closeHoldBillModal();
      currentCart.items = [];
      renderCartItems();
      recalculateTotals();
      loadHeldBillsCount();
    }
  } catch (err) {
    common.showToast("Failed to hold bill.", "error");
  }
}

async function loadHeldBillsCount() {
  try {
    const res = await api.get("/pos/held");
    if (res.success && res.data) {
      document.getElementById("held-bills-count").innerText = res.data.length;
    }
  } catch (e) {}
}

async function openHeldBillsModal() {
  try {
    const res = await api.get("/pos/held");
    const container = document.getElementById("held-bills-list-body");

    if (!res.success || res.data.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">No bills currently on hold.</div>`;
    } else {
      container.innerHTML = res.data.map(h => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-bottom:1px solid var(--border-subtle);">
          <div>
            <div style="font-weight:700;">${h.hold_reference}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${common.formatDate(h.created_at)} ${common.formatTime(h.created_at)}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn-primary-custom" style="padding:4px 10px;font-size:0.75rem;" onclick="resumeHeldBill(${h.id})">Resume</button>
            <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" onclick="deleteHeldBill(${h.id})"><i data-lucide="trash-2" style="width:14px;"></i></button>
          </div>
        </div>
      `).join("");
      if (window.lucide) lucide.createIcons();
    }

    document.getElementById("held-bills-modal").classList.add("active");
  } catch (err) {
    common.showToast("Failed to fetch held bills.", "error");
  }
}

function closeHeldBillsModal() {
  document.getElementById("held-bills-modal").classList.remove("active");
}

async function resumeHeldBill(id) {
  try {
    const res = await api.post(`/pos/resume/${id}`);
    if (res.success && res.data) {
      currentCart = res.data;
      if (currentCart.customer_id) {
        document.getElementById("cart-customer-select").value = currentCart.customer_id;
        onCustomerChange();
      }
      renderCartItems();
      recalculateTotals();
      closeHeldBillsModal();
      loadHeldBillsCount();
      common.showToast("Bill resumed.", "success");
    }
  } catch (err) {
    common.showToast("Could not resume bill.", "error");
  }
}

async function deleteHeldBill(id) {
  try {
    await api.delete(`/pos/held/${id}`);
    common.showToast("Held bill removed.", "info");
    openHeldBillsModal();
    loadHeldBillsCount();
  } catch (e) {
    common.showToast("Failed to delete held bill.", "error");
  }
}

// Quick Customer Modal
function openQuickCustomerModal() {
  document.getElementById("quick-customer-modal").classList.add("active");
}
function closeQuickCustomerModal() {
  document.getElementById("quick-customer-modal").classList.remove("active");
}

async function saveQuickCustomer() {
  const name = document.getElementById("quick-cust-name").value.trim();
  const phone = document.getElementById("quick-cust-phone").value.trim();
  const email = document.getElementById("quick-cust-email").value.trim() || undefined;

  if (!name || !phone) {
    common.showToast("Please provide both name and phone number.", "warning");
    return;
  }

  try {
    const res = await api.post("/customers", { name, phone, email });
    if (res.success && res.data) {
      allCustomers.push(res.data);
      populateCustomerDropdown(allCustomers);
      document.getElementById("cart-customer-select").value = res.data.id;
      onCustomerChange();
      closeQuickCustomerModal();
      common.showToast(`Client ${res.data.name} added and selected!`, "success");
    }
  } catch (err) {
    common.showToast(err.message || "Failed to add client.", "error");
  }
}

// Convert Quotation to POS Cart
async function loadQuotationIntoCart(quoteId) {
  try {
    const res = await api.get(`/quotations/${quoteId}`);
    if (res.success && res.data) {
      const q = res.data;
      if (q.customer_id) {
        document.getElementById("cart-customer-select").value = q.customer_id;
        onCustomerChange();
      }

      currentCart.items = q.items.map(item => ({
        item_type: item.package_id ? 'package' : 'service',
        item_id: item.package_id || item.service_id || 0,
        name: item.description,
        unit_price: parseFloat(item.unit_price),
        quantity: item.quantity,
        staff_id: item.staff_id,
        discount_amount: parseFloat(item.discount_amount || 0),
      }));

      document.getElementById("cart-discount-val").value = q.discount_amount || 0;
      renderCartItems();
      recalculateTotals();
      common.showToast(`Quotation #${q.quotation_number} loaded into bill.`, "success");
    }
  } catch (e) {
    console.error("Load quote into POS failed:", e);
  }
}

function openQuotationsDrawer() {
  window.location.href = "quotations.html";
}
