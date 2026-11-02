/**
 * SALON VELLORA — INVENTORY & PRODUCTS ENGINE
 */

let allInventoryProducts = [];
let filteredProducts = [];
let allMovements = [];
let productCategoriesList = [];
let productBrandsList = [];

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("stock-table-body")) {
    common.initLayout("inventory", "Stock & Inventory Ledger", "Monitor salon inventory levels, stock audits and product movement ledger");
    loadInventoryPage();
  }
});

async function loadInventoryPage() {
  await loadStockLevels();
  await loadMovements();
  populateAdjustProductsDropdown();
}

async function loadStockLevels() {
  const tbody = document.getElementById("stock-table-body");
  if (!tbody) return;

  try {
    const res = await api.get("/inventory/products", { per_page: 500 });
    if (!res.success || !res.data) return;

    allInventoryProducts = res.data.data || res.data;

    let totalVal = 0;
    let lowCount = 0;
    allInventoryProducts.forEach(p => {
      totalVal += (p.stock_quantity * p.retail_price);
      if (p.stock_quantity <= p.alert_quantity) lowCount++;
    });

    const elTotal = document.getElementById("inv-total-items");
    if (elTotal) elTotal.innerText = allInventoryProducts.length;

    const elLow = document.getElementById("inv-low-stock-count");
    if (elLow) elLow.innerText = lowCount;

    const elVal = document.getElementById("inv-total-value");
    if (elVal) elVal.innerText = common.formatCurrency(totalVal);

    if (allInventoryProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No products in stock.</td></tr>`;
      return;
    }

    tbody.innerHTML = allInventoryProducts.map(p => {
      const isLow = p.stock_quantity <= p.alert_quantity;
      return `
        <tr>
          <td>
            <div style="font-weight:700;">${escapeHtml(p.name)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(p.unit || 'pcs')}</div>
          </td>
          <td>${p.category ? escapeHtml(p.category.name) : '-'}</td>
          <td>${p.brand ? escapeHtml(p.brand.name) : '-'}</td>
          <td style="font-family:monospace;font-size:0.8rem;">${escapeHtml(p.sku || p.barcode || '-')}</td>
          <td style="font-weight:700;">${common.formatCurrency(p.retail_price)}</td>
          <td>
            <span style="font-size:1.1rem;font-weight:800;color:${isLow ? 'var(--danger)' : 'var(--text-main)'};">
              ${p.stock_quantity}
            </span>
            <span style="font-size:0.75rem;color:var(--text-light);"> / min ${p.alert_quantity}</span>
          </td>
          <td>
            <span class="badge-custom badge-${isLow ? 'danger' : 'success'}">
              ${isLow ? 'Low Stock' : 'In Stock'}
            </span>
          </td>
          <td style="text-align:right;">
            <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" onclick="quickAdjustForProduct(${p.id})">
              Adjust
            </button>
          </td>
        </tr>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();

  } catch (e) {
    common.showToast("Failed to load inventory stock.", "error");
  }
}

async function loadMovements() {
  const tbody = document.getElementById("ledger-table-body");
  if (!tbody) return;

  try {
    const res = await api.get("/inventory/movements");
    if (!res.success || !res.data) return;

    allMovements = res.data.data || res.data;

    if (allMovements.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted);">No stock movements recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allMovements.map(m => `
      <tr>
        <td>
          <div style="font-weight:600;">${common.formatDate(m.created_at)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${common.formatTime(m.created_at)}</div>
        </td>
        <td><b>${m.product ? escapeHtml(m.product.name) : 'Product'}</b></td>
        <td><span class="badge-custom badge-info">${escapeHtml(m.movement_type)}</span></td>
        <td style="font-weight:700;color:${m.quantity >= 0 ? 'var(--success)' : 'var(--danger)'};">
          ${m.quantity >= 0 ? '+' : ''}${m.quantity}
        </td>
        <td style="font-weight:700;">${m.balance_after}</td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(m.notes || '-')}</td>
        <td>${m.user ? escapeHtml(m.user.name) : 'System'}</td>
      </tr>
    `).join("");

    if (window.lucide) lucide.createIcons();

  } catch (e) {}
}

function switchInvTab(tab) {
  if (tab === 'stock') {
    document.getElementById("inv-stock-view").style.display = "block";
    document.getElementById("inv-ledger-view").style.display = "none";
    document.getElementById("tab-btn-stock").classList.add("active");
    document.getElementById("tab-btn-ledger").classList.remove("active");
  } else {
    document.getElementById("inv-stock-view").style.display = "none";
    document.getElementById("inv-ledger-view").style.display = "block";
    document.getElementById("tab-btn-stock").classList.remove("active");
    document.getElementById("tab-btn-ledger").classList.add("active");
    loadMovements();
  }
}

function populateAdjustProductsDropdown() {
  const select = document.getElementById("adj-product");
  if (!select) return;
  select.innerHTML = allInventoryProducts.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (In Hand: ${p.stock_quantity})</option>`).join("");
}

function openStockAdjustModal() {
  populateAdjustProductsDropdown();
  document.getElementById("adjust-stock-modal").classList.add("active");
}
function closeStockAdjustModal() {
  document.getElementById("adjust-stock-modal").classList.remove("active");
}

function quickAdjustForProduct(prodId) {
  openStockAdjustModal();
  document.getElementById("adj-product").value = prodId;
}

async function handleStockAdjust(e) {
  e.preventDefault();

  const payload = {
    product_id: parseInt(document.getElementById("adj-product").value),
    type: document.getElementById("adj-type").value,
    quantity: parseInt(document.getElementById("adj-qty").value),
    notes: document.getElementById("adj-notes").value.trim(),
  };

  const btn = document.getElementById("btn-save-adj");
  btn.disabled = true;

  try {
    const res = await api.post("/inventory/adjust", payload);
    if (res.success) {
      common.showToast(res.message || "Stock adjusted successfully!", "success");
      closeStockAdjustModal();
      loadInventoryPage();
    }
  } catch (err) {
    common.showToast(err.message || "Failed to adjust stock.", "error");
  } finally {
    btn.disabled = false;
  }
}

// --------------------------------------------------------------------------
// PRODUCTS PAGE ENGINE (WITH STRICT SUPER-ADMIN RESTRICTION FOR EDIT/DELETE)
// --------------------------------------------------------------------------

function isUserSuperAdmin() {
  if (window.permissions && typeof permissions.hasRole === 'function') {
    return permissions.hasRole('super_admin', 'Super Admin');
  }
  try {
    const user = JSON.parse(localStorage.getItem("salon_user") || "{}");
    const role = (user.role || "").toLowerCase().replace(/\s+/g, "_");
    return role === "super_admin";
  } catch (e) {
    return false;
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadProductsPage() {
  common.initLayout("products", "Salon Retail Products", "Hair care, serums, styling conditioners and retail product catalog");
  
  // Load Categories & Brands first for filters and modal selects
  await Promise.all([
    loadProductCategories(),
    loadProductBrands()
  ]);

  await fetchAndRenderProducts();
}

async function loadProductCategories() {
  try {
    const res = await api.get("/inventory/categories");
    if (res.success && res.data) {
      productCategoriesList = res.data;
      
      // Populate category filter
      const filterSelect = document.getElementById("product-category-filter");
      if (filterSelect) {
        filterSelect.innerHTML = `<option value="">All Categories</option>` +
          productCategoriesList.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
      }

      // Populate modal category select
      const modalSelect = document.getElementById("p-cat-select");
      if (modalSelect) {
        modalSelect.innerHTML = `<option value="">Select Category</option>` +
          productCategoriesList.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
      }
    }
  } catch (e) {
    console.warn("Could not load categories:", e);
  }
}

async function loadProductBrands() {
  try {
    const res = await api.get("/inventory/brands");
    if (res.success && res.data) {
      productBrandsList = res.data;
      
      // Populate brand filter
      const filterSelect = document.getElementById("product-brand-filter");
      if (filterSelect) {
        filterSelect.innerHTML = `<option value="">All Brands</option>` +
          productBrandsList.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");
      }

      // Populate modal brand select
      const modalSelect = document.getElementById("p-brand-select");
      if (modalSelect) {
        modalSelect.innerHTML = `<option value="">Select Brand</option>` +
          productBrandsList.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");
      }
    }
  } catch (e) {
    console.warn("Could not load brands:", e);
  }
}

async function fetchAndRenderProducts() {
  const tbody = document.getElementById("products-table-body");
  if (!tbody) return;

  try {
    const res = await api.get("/inventory/products", { per_page: 500 });
    if (!res.success || !res.data) return;

    allInventoryProducts = res.data.data || res.data;
    handleProductFilter();
  } catch (e) {
    common.showToast("Failed to load products list.", "error");
  }
}

function handleProductFilter() {
  const searchInput = document.getElementById("product-search-input");
  const brandSelect = document.getElementById("product-brand-filter");
  const categorySelect = document.getElementById("product-category-filter");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedBrand = brandSelect ? brandSelect.value : "";
  const selectedCategory = categorySelect ? categorySelect.value : "";

  filteredProducts = allInventoryProducts.filter(p => {
    // Brand filter
    if (selectedBrand && String(p.brand_id) !== String(selectedBrand)) {
      return false;
    }
    // Category filter
    if (selectedCategory && String(p.category_id) !== String(selectedCategory)) {
      return false;
    }
    // Search query
    if (query) {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const barcode = (p.barcode || "").toLowerCase();
      const brand = p.brand ? p.brand.name.toLowerCase() : "";
      if (!name.includes(query) && !sku.includes(query) && !barcode.includes(query) && !brand.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const countBadge = document.getElementById("product-count-badge");
  if (countBadge) {
    countBadge.innerText = `Showing ${filteredProducts.length} of ${allInventoryProducts.length} items`;
  }

  renderProductsTable(filteredProducts);
}

function renderProductsTable(products) {
  const tbody = document.getElementById("products-table-body");
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text-muted);">No products match your search/filter.</td></tr>`;
    return;
  }

  const superAdmin = isUserSuperAdmin();

  tbody.innerHTML = products.map(p => {
    const isLow = p.stock_quantity <= p.alert_quantity;
    const isZeroPrice = (parseFloat(p.retail_price) === 0);

    // Action buttons: Only Super Admin gets Edit and Delete buttons!
    let actionButtons = "";
    if (superAdmin) {
      actionButtons = `
        <div style="display:flex;gap:6px;justify-content:flex-end;">
          <button class="btn-secondary-custom" title="Edit Product (Super Admin)" style="padding:6px 10px;font-size:0.75rem;cursor:pointer;" onclick="openEditProductModal(${p.id})">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn-soft-pink" title="Delete Product (Super Admin)" style="padding:6px 10px;font-size:0.75rem;color:var(--danger);border-color:rgba(220,53,69,0.25);background:rgba(220,53,69,0.08);cursor:pointer;" onclick="deleteProductConfirm(${p.id})">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      `;
    } else {
      actionButtons = `
        <span style="font-size:0.75rem;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px;" title="Only Super Admin has access to edit or delete products">
          <i data-lucide="lock" style="width:13px;height:13px;"></i> Super Admin only
        </span>
      `;
    }

    return `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--text-main);">${escapeHtml(p.name)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(p.unit || 'pcs')}</div>
        </td>
        <td>
          <span class="badge-custom" style="background:#f1f5f9;color:#334155;font-weight:600;">
            ${p.brand ? escapeHtml(p.brand.name) : '-'}
          </span>
        </td>
        <td>${p.category ? escapeHtml(p.category.name) : '-'}</td>
        <td style="font-family:monospace;font-size:0.8rem;color:var(--text-muted);">${escapeHtml(p.sku || '-')}</td>
        <td style="font-size:0.85rem;">${common.formatCurrency(p.cost_price)}</td>
        <td style="font-weight:700;color:${isZeroPrice ? 'var(--text-muted)' : 'var(--primary-dark)'};">
          ${isZeroPrice ? '<span style="color:#d97706;font-size:0.75rem;background:#fef3c7;padding:2px 6px;border-radius:4px;">Not Set (0.00)</span>' : common.formatCurrency(p.retail_price)}
        </td>
        <td>
          <span style="font-size:1.05rem;font-weight:800;color:${isLow ? 'var(--danger)' : 'var(--text-main)'};">
            ${p.stock_quantity}
          </span>
          <span style="font-size:0.72rem;color:var(--text-light);"> / min ${p.alert_quantity}</span>
        </td>
        <td>
          <span class="badge-custom badge-${p.status === 'active' ? 'success' : 'danger'}">
            ${escapeHtml(p.status || 'active')}
          </span>
        </td>
        <td style="text-align:right;">
          ${actionButtons}
        </td>
      </tr>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function openProductModal() {
  document.getElementById("product-modal-title").innerText = "Add Salon Product";
  document.getElementById("p-id").value = "";
  document.getElementById("p-name").value = "";
  document.getElementById("p-brand-select").value = "";
  document.getElementById("p-cat-select").value = "";
  document.getElementById("p-sku").value = "";
  document.getElementById("p-barcode").value = "";
  document.getElementById("p-cost").value = "0";
  document.getElementById("p-retail").value = "0";
  document.getElementById("p-stock").value = "0";
  document.getElementById("p-alert").value = "2";
  document.getElementById("p-unit").value = "pcs";

  const note = document.getElementById("super-admin-badge-note");
  if (note) note.style.display = "none";

  document.getElementById("product-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function openEditProductModal(id) {
  if (!isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can edit products or change prices.", "error");
    return;
  }

  const p = allInventoryProducts.find(pr => pr.id === id);
  if (!p) return;

  document.getElementById("product-modal-title").innerText = "Edit Salon Product & Pricing";
  document.getElementById("p-id").value = p.id;
  document.getElementById("p-name").value = p.name || "";
  document.getElementById("p-brand-select").value = p.brand_id || "";
  document.getElementById("p-cat-select").value = p.category_id || "";
  document.getElementById("p-sku").value = p.sku || "";
  document.getElementById("p-barcode").value = p.barcode || "";
  document.getElementById("p-cost").value = p.cost_price || 0;
  document.getElementById("p-retail").value = p.retail_price || 0;
  document.getElementById("p-stock").value = p.stock_quantity || 0;
  document.getElementById("p-alert").value = p.alert_quantity || 2;
  document.getElementById("p-unit").value = p.unit || "pcs";

  const note = document.getElementById("super-admin-badge-note");
  if (note) note.style.display = "block";

  document.getElementById("product-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeProductModal() {
  document.getElementById("product-modal").classList.remove("active");
}

async function deleteProductConfirm(id) {
  if (!isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can delete products.", "error");
    return;
  }

  const p = allInventoryProducts.find(pr => pr.id === id);
  const prodName = p ? p.name : `Product #${id}`;

  if (!confirm(`Are you sure you want to delete "${prodName}"?\n\nThis action can only be performed by Super Admin.`)) {
    return;
  }

  try {
    const res = await api.delete(`/inventory/products/${id}`);
    if (res.success) {
      common.showToast(res.message || `Product "${prodName}" deleted successfully!`, "success");
      await fetchAndRenderProducts();
    } else {
      common.showToast(res.message || "Failed to delete product.", "error");
    }
  } catch (err) {
    common.showToast(err.message || "Error deleting product.", "error");
  }
}

async function handleSaveProduct(e) {
  e.preventDefault();

  const id = document.getElementById("p-id").value;

  // Strict check on front-end for editing
  if (id && !isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can modify products.", "error");
    return;
  }

  const brandId = document.getElementById("p-brand-select").value;
  const catId = document.getElementById("p-cat-select").value;

  const payload = {
    name: document.getElementById("p-name").value.trim(),
    brand_id: brandId ? parseInt(brandId) : null,
    category_id: catId ? parseInt(catId) : null,
    cost_price: parseFloat(document.getElementById("p-cost").value) || 0,
    retail_price: parseFloat(document.getElementById("p-retail").value) || 0,
    sku: document.getElementById("p-sku").value.trim() || undefined,
    barcode: document.getElementById("p-barcode").value.trim() || undefined,
    stock_quantity: parseInt(document.getElementById("p-stock").value) || 0,
    alert_quantity: parseInt(document.getElementById("p-alert").value) || 2,
    unit: document.getElementById("p-unit").value || "pcs",
  };

  const btn = document.getElementById("btn-save-prod");
  btn.disabled = true;

  try {
    if (id) {
      const res = await api.put(`/inventory/products/${id}`, payload);
      common.showToast(res.message || "Product updated successfully!", "success");
    } else {
      const res = await api.post("/inventory/products", payload);
      common.showToast(res.message || "Product added to inventory!", "success");
    }

    closeProductModal();
    await fetchAndRenderProducts();
  } catch (err) {
    common.showToast(err.message || "Failed to save product.", "error");
  } finally {
    btn.disabled = false;
  }
}
