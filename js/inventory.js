/**
 * SALON VELLORA — INVENTORY & PRODUCTS ENGINE
 */

let allInventoryProducts = [];
let allMovements = [];

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
    const res = await api.get("/inventory/products", { per_page: 50 });
    if (!res.success || !res.data) return;

    allInventoryProducts = res.data.data || res.data;

    let totalVal = 0;
    let lowCount = 0;
    allInventoryProducts.forEach(p => {
      totalVal += (p.stock_quantity * p.retail_price);
      if (p.stock_quantity <= p.alert_quantity) lowCount++;
    });

    document.getElementById("inv-total-items").innerText = allInventoryProducts.length;
    document.getElementById("inv-low-stock-count").innerText = lowCount;
    document.getElementById("inv-total-value").innerText = common.formatCurrency(totalVal);

    if (allInventoryProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No products in stock.</td></tr>`;
      return;
    }

    tbody.innerHTML = allInventoryProducts.map(p => {
      const isLow = p.stock_quantity <= p.alert_quantity;
      return `
        <tr>
          <td>
            <div style="font-weight:700;">${p.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${p.unit || 'pcs'}</div>
          </td>
          <td>${p.category ? p.category.name : '-'}</td>
          <td>${p.brand ? p.brand.name : '-'}</td>
          <td style="font-family:monospace;font-size:0.8rem;">${p.sku || p.barcode || '-'}</td>
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
        <td><b>${m.product ? m.product.name : 'Product'}</b></td>
        <td><span class="badge-custom badge-info">${m.movement_type}</span></td>
        <td style="font-weight:700;color:${m.quantity >= 0 ? 'var(--success)' : 'var(--danger)'};">
          ${m.quantity >= 0 ? '+' : ''}${m.quantity}
        </td>
        <td style="font-weight:700;">${m.balance_after}</td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${m.notes || '-'}</td>
        <td>${m.user ? m.user.name : 'System'}</td>
      </tr>
    `).join("");

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
  select.innerHTML = allInventoryProducts.map(p => `<option value="${p.id}">${p.name} (In Hand: ${p.stock_quantity})</option>`).join("");
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
// PRODUCTS PAGE ENGINE
// --------------------------------------------------------------------------
async function loadProductsPage() {
  common.initLayout("products", "Salon Retail Products", "Hair care, serums, styling conditioners and retail product catalog");
  const tbody = document.getElementById("products-table-body");

  try {
    const res = await api.get("/inventory/products", { per_page: 50 });
    if (!res.success || !res.data) return;

    allInventoryProducts = res.data.data || res.data;

    if (allInventoryProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text-muted);">No products registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allInventoryProducts.map(p => `
      <tr>
        <td><b>${p.name}</b></td>
        <td>${p.category ? p.category.name : '-'}</td>
        <td>${p.brand ? p.brand.name : '-'}</td>
        <td style="font-family:monospace;font-size:0.8rem;">${p.sku || '-'}</td>
        <td style="font-family:monospace;font-size:0.8rem;">${p.barcode || '-'}</td>
        <td>${common.formatCurrency(p.cost_price)}</td>
        <td style="font-weight:700;color:var(--primary-dark);">${common.formatCurrency(p.retail_price)}</td>
        <td style="font-weight:700;">${p.stock_quantity}</td>
        <td style="text-align:right;">
          <button class="btn-secondary-custom" style="padding:4px 8px;font-size:0.75rem;" onclick="openEditProductModal(${p.id})">
            <i data-lucide="edit-3" style="width:14px;"></i>
          </button>
        </td>
      </tr>
    `).join("");

    if (window.lucide) lucide.createIcons();

  } catch (e) {
    common.showToast("Failed to load products.", "error");
  }
}

function openProductModal() {
  document.getElementById("product-modal-title").innerText = "Add Salon Product";
  document.getElementById("p-id").value = "";
  document.getElementById("p-name").value = "";
  document.getElementById("p-cat").value = "";
  document.getElementById("p-brand").value = "";
  document.getElementById("p-sku").value = "";
  document.getElementById("p-barcode").value = "";
  document.getElementById("p-cost").value = "0";
  document.getElementById("p-retail").value = "0";
  document.getElementById("p-stock").value = "10";
  document.getElementById("p-alert").value = "5";

  document.getElementById("product-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function openEditProductModal(id) {
  const p = allInventoryProducts.find(pr => pr.id === id);
  if (!p) return;

  document.getElementById("product-modal-title").innerText = "Edit Salon Product";
  document.getElementById("p-id").value = p.id;
  document.getElementById("p-name").value = p.name;
  document.getElementById("p-cat").value = p.category ? p.category.name : "";
  document.getElementById("p-brand").value = p.brand ? p.brand.name : "";
  document.getElementById("p-sku").value = p.sku || "";
  document.getElementById("p-barcode").value = p.barcode || "";
  document.getElementById("p-cost").value = p.cost_price;
  document.getElementById("p-retail").value = p.retail_price;
  document.getElementById("p-stock").value = p.stock_quantity;
  document.getElementById("p-alert").value = p.alert_quantity;

  document.getElementById("product-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeProductModal() {
  document.getElementById("product-modal").classList.remove("active");
}

async function handleSaveProduct(e) {
  e.preventDefault();

  const id = document.getElementById("p-id").value;
  const payload = {
    name: document.getElementById("p-name").value.trim(),
    cost_price: parseFloat(document.getElementById("p-cost").value) || 0,
    retail_price: parseFloat(document.getElementById("p-retail").value) || 0,
    sku: document.getElementById("p-sku").value.trim() || undefined,
    barcode: document.getElementById("p-barcode").value.trim() || undefined,
    stock_quantity: parseInt(document.getElementById("p-stock").value) || 0,
    alert_quantity: parseInt(document.getElementById("p-alert").value) || 5,
  };

  const btn = document.getElementById("btn-save-prod");
  btn.disabled = true;

  try {
    if (id) {
      await api.put(`/inventory/products/${id}`, payload);
      common.showToast("Product updated!", "success");
    } else {
      await api.post("/inventory/products", payload);
      common.showToast("Product added to inventory!", "success");
    }

    closeProductModal();
    loadProductsPage();
  } catch (err) {
    common.showToast(err.message || "Failed to save product.", "error");
  } finally {
    btn.disabled = false;
  }
}
