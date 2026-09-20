/**
 * SALON VELLORA — HIGH-SPEED POS & BILLING ENGINE
 * Rapid cart management, touch controls, split payments & thermal printing
 */

let allServices = [];
let allPackages = [];
let allProducts = [];
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
    if (!res.success || !res.data) return;

    allServices = [];
    res.data.categories.forEach(cat => {
      if (cat.services) {
        cat.services.forEach(s => allServices.push({ ...s, category_name: cat.name }));
      }
    });

    allPackages = res.data.packages || [];
    allProducts = res.data.products || [];
    allCustomers = res.data.customers || [];

    renderCategoryPills(res.data.categories);
    populateCustomerDropdown(allCustomers);
    renderPosItems(getAllCatalogItems());

  } catch (err) {
    console.error("POS Catalog Load Error:", err);
    common.showToast("Failed to load POS catalog.", "error");
  }
}

async function loadStaffList() {
  try {
    const res = await api.get("/staff");
    if (res.success && res.data) {
      allStaff = res.data;
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

function selectCategory(filterKey, buttonEl) {
  activeCategoryFilter = filterKey;
  document.querySelectorAll(".category-pill").forEach(b => b.classList.remove("active"));
  if (buttonEl) buttonEl.classList.add("active");
  filterPosItems();
}

function filterPosItems() {
  const query = (document.getElementById("pos-search").value || "").toLowerCase().trim();
  let items = getAllCatalogItems();

  if (activeCategoryFilter === 'services') {
    items = items.filter(i => i.type === 'service');
  } else if (activeCategoryFilter === 'packages') {
    items = items.filter(i => i.type === 'package');
  } else if (activeCategoryFilter === 'products') {
    items = items.filter(i => i.type === 'product');
  } else if (activeCategoryFilter.startsWith('cat_')) {
    const catId = parseInt(activeCategoryFilter.replace('cat_', ''));
    items = items.filter(i => i.type === 'service' && i.category_id === catId);
  }

  if (query) {
    items = items.filter(i => 
      i.name.toLowerCase().includes(query) ||
      (i.code && i.code.toLowerCase().includes(query)) ||
      (i.barcode && i.barcode.toLowerCase().includes(query)) ||
      (i.sku && i.sku.toLowerCase().includes(query))
    );
  }

  renderPosItems(items);
}

function renderPosItems(items) {
  const container = document.getElementById("pos-items-container");
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--text-muted);">
        <i data-lucide="package-search" style="width:36px;height:36px;margin-bottom:8px;color:var(--text-light);"></i>
        <p style="margin:0;font-weight:600;color:#374151;">No items found</p>
        <p style="font-size:0.8rem;margin-top:4px;">Try selecting another category or clearing your search.</p>
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
    }

    const code = item.code || (item.type === 'product' ? (item.sku || 'PROD') : 'SV');

    return `
      <div class="pos-item-card" onclick="addItemToCart('${item.type}', ${item.id})">
        <div>
          <div class="pos-item-top">
            <span class="pos-item-code">${escapeHtml(code)}</span>
            ${badge}
          </div>
          <div class="pos-item-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
          <div class="pos-item-meta">
            ${item.type === 'product' ? (item.brand ? escapeHtml(item.brand.name) : 'Product') : escapeHtml(item.category_name || 'Salon Treatment')}
          </div>
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

  const existingIndex = currentCart.items.findIndex(i => i.item_type === type && i.item_id === id);
  if (existingIndex > -1) {
    currentCart.items[existingIndex].quantity += 1;
  } else {
    currentCart.items.push({
      item_type: type,
      item_id: id,
      name: sourceItem.name,
      unit_price: parseFloat(sourceItem.display_price || sourceItem.price || sourceItem.package_price || sourceItem.retail_price),
      quantity: 1,
      staff_id: null,
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
      <div style="text-align:center; padding: 4rem 1rem; color: var(--text-muted);">
        <i data-lucide="shopping-cart" style="width:40px;height:40px;color:var(--border);margin-bottom:8px;"></i>
        <p style="font-size:0.85rem;">Cart is empty.<br>Tap any service or product to add.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = currentCart.items.map((item, idx) => {
    let staffSelect = '';
    if (item.item_type === 'service' || item.item_type === 'package') {
      staffSelect = `
        <select class="form-select-custom" style="font-size:0.72rem;padding:2px 4px;height:26px;width:125px;" onchange="updateItemStaff(${idx}, this.value)">
          <option value="">Stylist...</option>
          ${allStaff.map(s => `<option value="${s.id}" ${item.staff_id === s.id ? 'selected' : ''}>${s.name}</option>`).join("")}
        </select>
      `;
    }

    const itemTotal = (item.unit_price * item.quantity) - (item.discount_amount || 0);

    return `
      <div class="cart-item-row">
        <div class="cart-item-top">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-del" onclick="removeItemFromCart(${idx})">
            <i data-lucide="x" style="width:16px;height:16px;"></i>
          </div>
        </div>
        <div class="cart-item-controls">
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="qty-control">
              <button class="qty-btn" onclick="updateItemQuantity(${idx}, -1)">-</button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly>
              <button class="qty-btn" onclick="updateItemQuantity(${idx}, 1)">+</button>
            </div>
            ${staffSelect}
          </div>
          <div style="font-weight:700;font-size:0.88rem;color:var(--primary-dark);">
            ${common.formatCurrency(itemTotal)}
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function recalculateTotals() {
  let subtotal = 0;
  currentCart.items.forEach(item => {
    subtotal += (item.unit_price * item.quantity) - (item.discount_amount || 0);
  });

  const discType = document.getElementById("cart-discount-type").value;
  const discVal = parseFloat(document.getElementById("cart-discount-val").value) || 0;

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

  document.getElementById("cart-subtotal").innerText = common.formatCurrency(subtotal);
  document.getElementById("cart-tax").innerText = common.formatCurrency(taxAmount);
  document.getElementById("cart-grand-total").innerText = common.formatCurrency(grandTotal);
}

// Payment Modal & Methods
function openPaymentModal() {
  if (currentCart.items.length === 0) {
    common.showToast("Cart is empty. Please add items before checking out.", "warning");
    return;
  }

  recalculateTotals();

  document.getElementById("modal-due-amount").innerText = common.formatCurrency(currentCart.grand_total);
  document.getElementById("tendered-amount").value = currentCart.grand_total;
  calculateChange();
  renderQuickCashSuggestions(currentCart.grand_total);

  setPaymentMethod('cash');
  document.getElementById("payment-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closePaymentModal() {
  document.getElementById("payment-modal").classList.remove("active");
}

function setPaymentMethod(method, btn) {
  currentPaymentMethod = method;
  document.querySelectorAll("[id^='pay-method-']").forEach(b => b.classList.remove("btn-primary-custom"));
  document.getElementById(`pay-method-${method === 'bank_transfer' ? 'bank' : method}`).classList.add("btn-primary-custom");

  const cashFields = document.getElementById("cash-payment-fields");
  const splitFields = document.getElementById("split-payment-fields");

  if (method === 'split') {
    cashFields.style.display = 'none';
    splitFields.style.display = 'block';
    document.getElementById("split-cash-amount").value = Math.round(currentCart.grand_total / 2);
    document.getElementById("split-card-amount").value = Math.round(currentCart.grand_total / 2);
  } else {
    cashFields.style.display = 'block';
    splitFields.style.display = 'none';
  }
}

function renderQuickCashSuggestions(total) {
  const container = document.getElementById("quick-cash-pills");
  const suggestions = [
    Math.ceil(total),
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 1000,
  ];

  const uniqueSugg = [...new Set(suggestions)].filter(s => s >= total);

  container.innerHTML = uniqueSugg.map(s => `
    <button type="button" class="role-quick-btn" onclick="setTendered(${s})">LKR ${s.toLocaleString()}</button>
  `).join("");
}

function setTendered(val) {
  document.getElementById("tendered-amount").value = val;
  calculateChange();
}

function calculateChange() {
  const tendered = parseFloat(document.getElementById("tendered-amount").value) || 0;
  const change = Math.max(0, tendered - currentCart.grand_total);
  document.getElementById("change-due-amount").innerText = common.formatCurrency(change);
}

function calculateSplitChange() {
  const cash = parseFloat(document.getElementById("split-cash-amount").value) || 0;
  const card = parseFloat(document.getElementById("split-card-amount").value) || 0;
  // Live validation
}

async function processSaleCheckout() {
  const btn = document.getElementById("btn-process-sale");
  btn.disabled = true;
  btn.innerText = "Processing Transaction...";

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
    common.showToast(`Invoice ${res.data.invoice_number} created successfully!`, "success");

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
    btn.innerHTML = `<i data-lucide="check"></i> Confirm Payment & Complete Sale`;
    if (window.lucide) lucide.createIcons();
  }
}

// Luxury Receipt & A4 Invoice Engine Integration
let currentReceiptFormat = 'thermal';

function showReceiptModal(sale) {
  lastCompletedSale = sale;
  currentReceiptFormat = 'thermal';
  renderReceiptPreview();
  document.getElementById("receipt-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function switchReceiptTab(format) {
  currentReceiptFormat = format;
  const btnThermal = document.getElementById("tab-btn-thermal");
  const btnA4 = document.getElementById("tab-btn-a4");

  if (format === 'thermal') {
    btnThermal.style.background = "#fff";
    btnThermal.style.fontWeight = "700";
    btnThermal.style.color = "var(--primary)";
    btnThermal.style.opacity = "1";
    btnThermal.style.borderBottomColor = "transparent";

    btnA4.style.background = "transparent";
    btnA4.style.fontWeight = "500";
    btnA4.style.color = "var(--text-dark)";
    btnA4.style.opacity = "0.75";
    btnA4.style.borderBottomColor = "#fce7ec";
  } else {
    btnA4.style.background = "#fff";
    btnA4.style.fontWeight = "700";
    btnA4.style.color = "var(--primary)";
    btnA4.style.opacity = "1";
    btnA4.style.borderBottomColor = "transparent";

    btnThermal.style.background = "transparent";
    btnThermal.style.fontWeight = "500";
    btnThermal.style.color = "var(--text-dark)";
    btnThermal.style.opacity = "0.75";
    btnThermal.style.borderBottomColor = "#fce7ec";
  }

  renderReceiptPreview();
}

function renderReceiptPreview() {
  if (!lastCompletedSale) return;
  const container = document.getElementById("receipt-print-area");
  const actionsContainer = document.getElementById("receipt-action-buttons");

  if (currentReceiptFormat === 'thermal') {
    container.innerHTML = PrintEngine.generateThermalReceipt(lastCompletedSale);
    actionsContainer.innerHTML = `
      <button class="btn-secondary-custom" onclick="handleDownloadReceiptPdf()" style="font-size:0.85rem;">
        <i data-lucide="download"></i> Download Receipt (PDF)
      </button>
      <button class="btn-primary-custom" onclick="handlePrintReceipt()" style="font-size:0.85rem;">
        <i data-lucide="printer"></i> Print 80mm Receipt
      </button>
    `;
  } else {
    container.innerHTML = PrintEngine.generateA4Invoice(lastCompletedSale);
    actionsContainer.innerHTML = `
      <button class="btn-secondary-custom" onclick="handleDownloadA4Pdf()" style="font-size:0.85rem;">
        <i data-lucide="download"></i> Download Invoice (PDF)
      </button>
      <button class="btn-primary-custom" onclick="handlePrintA4()" style="font-size:0.85rem;">
        <i data-lucide="printer"></i> Print A4 Invoice
      </button>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function handlePrintReceipt() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateThermalReceipt(lastCompletedSale);
  PrintEngine.printThermal(html);
}

function handleDownloadReceiptPdf() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateThermalReceipt(lastCompletedSale);
  PrintEngine.downloadAsPdf(html, `Salon_Vellora_Receipt_${lastCompletedSale.invoice_number}.pdf`, true);
}

function handlePrintA4() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateA4Invoice(lastCompletedSale);
  PrintEngine.printA4(html);
}

function handleDownloadA4Pdf() {
  if (!lastCompletedSale) return;
  const html = PrintEngine.generateA4Invoice(lastCompletedSale);
  PrintEngine.downloadAsPdf(html, `Salon_Vellora_Invoice_${lastCompletedSale.invoice_number}.pdf`, false);
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
