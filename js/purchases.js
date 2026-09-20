/**
 * SALON VELLORA — PURCHASING & SUPPLIERS ENGINE
 */

let allPurchases = [];
let allSuppliers = [];
let allProductsForPO = [];
let purchaseRowCounter = 0;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("purchases-table-body")) {
    common.initLayout("purchases", "Purchasing & Stock Inward", "Receive vendor consignments, update stock quantities & manage payables");
    loadPurchasesPage();
  }
});

async function loadPurchasesPage() {
  await loadSuppliersList();
  await loadProductsForPO();
  await loadPurchases();
}

async function loadSuppliersList() {
  try {
    const res = await api.get("/suppliers");
    if (res.success && res.data) {
      allSuppliers = res.data;
      const select = document.getElementById("po-supplier");
      if (select) {
        select.innerHTML = `<option value="">-- Choose Supplier --</option>` + allSuppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
      }
    }
  } catch (e) {}
}

async function loadProductsForPO() {
  try {
    const res = await api.get("/inventory/products");
    if (res.success && res.data) {
      allProductsForPO = res.data.data || res.data;
    }
  } catch (e) {}
}

async function loadPurchases() {
  const tbody = document.getElementById("purchases-table-body");
  if (!tbody) return;

  try {
    const res = await api.get("/purchases");
    if (!res.success || !res.data) return;

    allPurchases = res.data.data || res.data;

    if (allPurchases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No purchases recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = allPurchases.map(p => `
      <tr>
        <td style="font-weight:700;color:var(--primary);">${p.purchase_number}</td>
        <td><b>${p.supplier ? p.supplier.name : 'Supplier'}</b></td>
        <td style="font-family:monospace;font-size:0.8rem;">${p.invoice_reference || '-'}</td>
        <td>${common.formatDate(p.purchase_date)}</td>
        <td style="font-weight:700;">${common.formatCurrency(p.total_amount)}</td>
        <td>${common.formatCurrency(p.paid_amount)}</td>
        <td><span class="badge-custom badge-${p.payment_status === 'paid' ? 'success' : 'warning'}">${p.payment_status}</span></td>
        <td>${p.creator ? p.creator.name : 'Staff'}</td>
      </tr>
    `).join("");

  } catch (e) {
    common.showToast("Failed to load purchases.", "error");
  }
}

function openNewPurchaseModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("po-date").value = today;
  document.getElementById("po-items-list").innerHTML = "";
  purchaseRowCounter = 0;
  addPurchaseItemRow();
  document.getElementById("purchase-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}
function closePurchaseModal() {
  document.getElementById("purchase-modal").classList.remove("active");
}

function addPurchaseItemRow() {
  purchaseRowCounter++;
  const container = document.getElementById("po-items-list");
  const rowId = `po-row-${purchaseRowCounter}`;

  const row = document.createElement("div");
  row.id = rowId;
  row.style = "display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:center;margin-bottom:6px;";
  row.innerHTML = `
    <select class="form-select-custom po-item-prod" required>
      <option value="">-- Choose Product --</option>
      ${allProductsForPO.map(p => `<option value="${p.id}" data-cost="${p.cost_price}">${p.name} (Cost: LKR ${parseFloat(p.cost_price).toLocaleString()})</option>`).join("")}
    </select>
    <input type="number" class="form-control-custom po-item-cost" placeholder="Unit Cost" required min="0">
    <input type="number" class="form-control-custom po-item-qty" placeholder="Quantity" value="10" required min="1">
    <button type="button" class="btn-soft-pink" style="padding:6px 8px;" onclick="document.getElementById('${rowId}').remove()"><i data-lucide="trash-2" style="width:14px;"></i></button>
  `;

  container.appendChild(row);
  if (window.lucide) lucide.createIcons();

  // Auto-fill cost price on product selection
  row.querySelector(".po-item-prod").addEventListener("change", function () {
    const opt = this.options[this.selectedIndex];
    if (opt && opt.dataset.cost) {
      row.querySelector(".po-item-cost").value = opt.dataset.cost;
    }
  });
}

async function handleSavePurchase(e) {
  e.preventDefault();

  const rows = document.querySelectorAll("#po-items-list > div");
  if (rows.length === 0) {
    common.showToast("Please add at least one product line.", "warning");
    return;
  }

  const items = [];
  rows.forEach(r => {
    const prodId = r.querySelector(".po-item-prod").value;
    const unitCost = parseFloat(r.querySelector(".po-item-cost").value) || 0;
    const qty = parseInt(r.querySelector(".po-item-qty").value) || 1;

    if (prodId) {
      items.push({
        product_id: parseInt(prodId),
        unit_cost: unitCost,
        quantity: qty,
      });
    }
  });

  const payload = {
    supplier_id: parseInt(document.getElementById("po-supplier").value),
    invoice_reference: document.getElementById("po-ref").value.trim() || undefined,
    purchase_date: document.getElementById("po-date").value,
    paid_amount: parseFloat(document.getElementById("po-paid").value) || 0,
    items,
  };

  const btn = document.getElementById("btn-save-po");
  btn.disabled = true;

  try {
    const res = await api.post("/purchases", payload);
    if (res.success) {
      common.showToast("Stock inward recorded and inventory increased!", "success");
      closePurchaseModal();
      loadPurchases();
    }
  } catch (err) {
    common.showToast(err.message || "Failed to record purchase.", "error");
  } finally {
    btn.disabled = false;
  }
}

// --------------------------------------------------------------------------
// SUPPLIERS PAGE ENGINE
// --------------------------------------------------------------------------
async function loadSuppliersPage() {
  common.initLayout("suppliers", "Suppliers & Vendors", "Manage beauty product distributors and payment balances");
  const tbody = document.getElementById("suppliers-table-body");

  try {
    const res = await api.get("/suppliers");
    if (!res.success || !res.data) return;

    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;">No suppliers found.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(s => `
      <tr>
        <td style="font-weight:700;color:var(--text-main);">${s.name}</td>
        <td>${s.contact_person || '-'}</td>
        <td>${s.phone || '-'}</td>
        <td>${s.email || '-'}</td>
        <td>${s.address || '-'}</td>
        <td style="font-weight:700;color:${s.current_balance > 0 ? 'var(--danger)' : 'var(--success)'};">
          ${common.formatCurrency(s.current_balance || 0)}
        </td>
      </tr>
    `).join("");

  } catch (e) {
    common.showToast("Failed to load suppliers.", "error");
  }
}

function openSupplierModal() {
  document.getElementById("supplier-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}
function closeSupplierModal() {
  document.getElementById("supplier-modal").classList.remove("active");
}

async function handleSaveSupplier(e) {
  e.preventDefault();

  const payload = {
    name: document.getElementById("sup-name").value.trim(),
    contact_person: document.getElementById("sup-contact").value.trim() || undefined,
    phone: document.getElementById("sup-phone").value.trim() || undefined,
    email: document.getElementById("sup-email").value.trim() || undefined,
    address: document.getElementById("sup-address").value.trim() || undefined,
  };

  const btn = document.getElementById("btn-save-sup");
  btn.disabled = true;

  try {
    await api.post("/suppliers", payload);
    common.showToast("Supplier added successfully!", "success");
    closeSupplierModal();
    loadSuppliersPage();
  } catch (err) {
    common.showToast(err.message || "Failed to add supplier.", "error");
  } finally {
    btn.disabled = false;
  }
}
