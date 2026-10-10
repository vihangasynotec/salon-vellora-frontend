/**
 * SALON VELLORA — QUOTATION SYSTEM ENGINE
 * Quotation pipeline, A4 quotation print engine, and single-click conversion
 */

let allLoadedQuotations = [];
let allCatalogServices = [];
let allCatalogPackages = [];
let allStaffList = [];
let currentViewingQuote = null;
let convertTargetQuoteId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("quotations-table-body")) {
    common.initLayout("quotations", "Quotation Pipeline", "Manage bridal dressing packages, custom event estimates & client conversion");
    loadQuotations();
    loadStaffForConversion();
  }
});

let searchDebounceTimeout = null;
function debounceSearch() {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    loadQuotations();
  }, 350);
}

async function loadQuotations() {
  const tbody = document.getElementById("quotations-table-body");
  if (!tbody) return;

  const search = document.getElementById("quote-search").value.trim();
  const status = document.getElementById("quote-status-filter").value;

  try {
    const res = await api.get("/quotations", { search, status, per_page: 50 });
    if (!res.success || !res.data) return;

    allLoadedQuotations = res.data.data || [];

    if (allLoadedQuotations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No quotations found.</td></tr>`;
      return;
    }

    tbody.innerHTML = allLoadedQuotations.map(q => `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--primary);">${q.quotation_number}</div>
        </td>
        <td>
          <div style="font-weight:600;">${q.customer_name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${q.customer_phone || '-'}</div>
        </td>
        <td>${common.formatDate(q.quotation_date)}</td>
        <td>${common.formatDate(q.valid_until)}</td>
        <td style="font-weight:700;">${common.formatCurrency(q.grand_total)}</td>
        <td><span class="badge-custom badge-${getQuoteStatusClass(q.status)}">${q.status}</span></td>
        <td>${q.preparer ? q.preparer.name : 'Salon Staff'}</td>
        <td style="text-align:right;">
          <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" onclick="viewQuotePreview(${q.id})" title="View / Print Quotation">
            <i data-lucide="eye" style="width:14px;"></i> View
          </button>
        </td>
      </tr>
    `).join("");

    if (window.lucide) lucide.createIcons();
    permissions.applyUI();

  } catch (err) {
    console.error("Load Quotes Error:", err);
    common.showToast("Failed to load quotations.", "error");
  }
}

function getQuoteStatusClass(status) {
  switch (status) {
    case 'Approved': return 'success';
    case 'Converted': return 'purple';
    case 'Sent': return 'primary';
    case 'Pending': return 'warning';
    case 'Rejected': return 'danger';
    case 'Draft': return 'info';
    default: return 'info';
  }
}

async function viewQuotePreview(id) {
  try {
    const res = await api.get(`/quotations/${id}`);
    if (!res.success || !res.data) return;

    const q = res.data;
    currentViewingQuote = q;

    const container = document.getElementById("quote-print-area");
    container.innerHTML = PrintEngine.generateA4Quotation(q);

    // Action buttons in modal
    let actionButtons = `
      <button class="btn-secondary-custom" onclick="downloadQuotationA4Pdf()">
        <i data-lucide="download"></i> Download Quotation (PDF)
      </button>
      <button class="btn-primary-custom" onclick="printQuotationA4()">
        <i data-lucide="printer"></i> Print Quotation (A4)
      </button>
    `;

    if (q.status !== 'Converted') {
      if (q.status !== 'Approved') {
        actionButtons += `
          <button class="btn-soft-pink" onclick="updateQuotationStatus(${q.id}, 'Approved')">
            <i data-lucide="check"></i> Approve Quote
          </button>
        `;
      }
      actionButtons += `
        <button class="btn-primary-custom" onclick="openConvertApptModal(${q.id})">
          <i data-lucide="calendar"></i> Convert to Appointment
        </button>
        <button class="btn-primary-custom" style="background:var(--purple);color:#fff;" onclick="convertQuoteToSale(${q.id})">
          <i data-lucide="shopping-cart"></i> Convert to POS Sale
        </button>
      `;
    } else {
      actionButtons += `<span class="badge-custom badge-purple" style="font-size:0.85rem;">Converted on ${common.formatDate(q.converted_at)}</span>`;
    }

    document.getElementById("quote-modal-actions").innerHTML = actionButtons;
    document.getElementById("quote-preview-modal").classList.add("active");
    if (window.lucide) lucide.createIcons();

  } catch (err) {
    common.showToast("Could not load quotation preview.", "error");
  }
}

function closeQuotePreview() {
  document.getElementById("quote-preview-modal").classList.remove("active");
}

function printQuotationA4() {
  if (!currentViewingQuote) return;
  const html = PrintEngine.generateA4Quotation(currentViewingQuote);
  PrintEngine.printA4(html);
}

function downloadQuotationA4Pdf() {
  if (!currentViewingQuote) return;
  const html = PrintEngine.generateA4Quotation(currentViewingQuote);
  PrintEngine.downloadAsPdf(html, `Salon_Vellora_Quotation_${currentViewingQuote.quotation_number}.pdf`, 'a4');
}

async function updateQuotationStatus(id, newStatus) {
  try {
    const res = await api.put(`/quotations/${id}/status`, { status: newStatus });
    if (res.success) {
      common.showToast(`Quotation status updated to ${newStatus}.`, "success");
      closeQuotePreview();
      loadQuotations();
    }
  } catch (err) {
    common.showToast(err.message || "Failed to update status.", "error");
  }
}

// Convert to Appointment
async function loadStaffForConversion() {
  try {
    const res = await api.get("/staff");
    if (res.success && res.data) {
      allStaffList = res.data;
      const select = document.getElementById("convert-appt-staff");
      if (select) {
        select.innerHTML = allStaffList.map(s => `<option value="${s.id}">${s.name} (${s.designation})</option>`).join("");
      }
    }
  } catch (e) {}
}

function openConvertApptModal(quoteId) {
  convertTargetQuoteId = quoteId;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("convert-appt-date").value = tomorrow.toISOString().split('T')[0];

  const select = document.getElementById("convert-appt-staff");
  if (allStaffList.length > 0) {
    select.innerHTML = allStaffList.map(s => `<option value="${s.id}">${s.name} (${s.designation})</option>`).join("");
  }

  document.getElementById("convert-appointment-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeConvertApptModal() {
  document.getElementById("convert-appointment-modal").classList.remove("active");
}

async function submitConvertToAppointment() {
  const staffId = document.getElementById("convert-appt-staff").value;
  const aptDate = document.getElementById("convert-appt-date").value;
  const aptTime = document.getElementById("convert-appt-time").value;
  const notes = document.getElementById("convert-appt-notes").value;

  if (!staffId || !aptDate || !aptTime) {
    common.showToast("Please specify stylist, date and time.", "warning");
    return;
  }

  const btn = document.getElementById("btn-submit-convert-appt");
  btn.disabled = true;

  try {
    const res = await api.post(`/quotations/${convertTargetQuoteId}/convert-to-appointment`, {
      staff_id: parseInt(staffId),
      appointment_date: aptDate,
      start_time: aptTime,
      notes,
    });

    if (res.success) {
      common.showToast("Quotation converted to appointment successfully!", "success");
      closeConvertApptModal();
      closeQuotePreview();
      loadQuotations();
    }
  } catch (err) {
    common.showToast(err.message || "Failed to convert to appointment.", "error");
  } finally {
    btn.disabled = false;
  }
}

async function convertQuoteToSale(quoteId) {
  common.showConfirm({
    title: "Convert Quotation to Sale?",
    message: "This will automatically generate a completed POS sale and invoice SV-INV-..., copy all items, and mark this quotation as Converted.",
    confirmText: "Convert to Sale",
    onConfirm: async () => {
      try {
        const res = await api.post(`/quotations/${quoteId}/convert-to-sale`);
        if (res.success) {
          common.showToast(`Quotation converted to Invoice #${res.data.invoice_number}!`, "success");
          closeQuotePreview();
          loadQuotations();
        }
      } catch (err) {
        common.showToast(err.message || "Failed to convert quotation to sale.", "error");
      }
    }
  });
}

// --------------------------------------------------------------------------
// QUOTATION CREATE FORM ENGINE
// --------------------------------------------------------------------------
async function initQuotationCreateForm() {
  common.initLayout("quotations", "New Bridal Quotation", "Build customized quotation for wedding or event packages");

  // Set today & default valid until (30 days from today)
  const today = new Date();
  const validUntil = new Date();
  validUntil.setDate(today.getDate() + 30);

  document.getElementById("q-date").value = today.toISOString().split('T')[0];
  document.getElementById("q-valid-until").value = validUntil.toISOString().split('T')[0];

  // Load Customers
  try {
    const custRes = await api.get("/customers");
    if (custRes.success && custRes.data) {
      const select = document.getElementById("q-customer-select");
      (custRes.data.data || custRes.data).forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.innerText = `${c.name} (${c.phone})`;
        opt.dataset.cust = JSON.stringify(c);
        select.appendChild(opt);
      });
    }
  } catch (e) {}

  // Load Catalog Items (Services & Packages)
  try {
    const srvRes = await api.get("/services");
    if (srvRes.success) allCatalogServices = srvRes.data;

    const pkgRes = await api.get("/service-packages");
    if (pkgRes.success) allCatalogPackages = pkgRes.data;
  } catch (e) {}

  // Add first row
  addQuoteRow();
}

function autoFillCustomerInfo() {
  const select = document.getElementById("q-customer-select");
  const selectedOpt = select.options[select.selectedIndex];
  if (!selectedOpt || !selectedOpt.dataset.cust) {
    document.getElementById("q-customer-name").value = "";
    document.getElementById("q-customer-phone").value = "";
    document.getElementById("q-customer-email").value = "";
    document.getElementById("q-customer-address").value = "";
    return;
  }

  const cust = JSON.parse(selectedOpt.dataset.cust);
  document.getElementById("q-customer-name").value = cust.name || "";
  document.getElementById("q-customer-phone").value = cust.phone || "";
  document.getElementById("q-customer-email").value = cust.email || "";
  document.getElementById("q-customer-address").value = cust.address || "";
}

let quoteRowCounter = 0;

function addQuoteRow() {
  quoteRowCounter++;
  const tbody = document.getElementById("quote-rows-body");
  const rowId = `quote-row-${quoteRowCounter}`;

  let serviceOptions = `<option value="">-- Choose from Catalog or Type Custom --</option>`;
  serviceOptions += `<optgroup label="✨ Bridal Packages">`;
  allCatalogPackages.forEach(p => {
    serviceOptions += `<option value="pkg_${p.id}" data-price="${p.package_price}" data-duration="${p.duration_minutes}">${p.name} (LKR ${parseFloat(p.package_price).toLocaleString()})</option>`;
  });
  serviceOptions += `</optgroup>`;

  serviceOptions += `<optgroup label="💇 Services">`;
  allCatalogServices.forEach(s => {
    serviceOptions += `<option value="srv_${s.id}" data-price="${s.price}" data-duration="${s.duration_minutes}">${s.name} (LKR ${parseFloat(s.price).toLocaleString()})</option>`;
  });
  serviceOptions += `</optgroup>`;

  const tr = document.createElement("tr");
  tr.id = rowId;
  tr.innerHTML = `
    <td>
      <select class="form-select-custom" style="margin-bottom:4px;" onchange="onCatalogSelect('${rowId}', this)">
        ${serviceOptions}
      </select>
      <input type="text" class="form-control-custom q-row-desc" placeholder="Custom Service Description / Title" required>
    </td>
    <td>
      <input type="number" class="form-control-custom q-row-dur" value="60" min="15">
    </td>
    <td>
      <input type="number" class="form-control-custom q-row-price" value="0" min="0" oninput="calcQuoteTotals()">
    </td>
    <td>
      <input type="number" class="form-control-custom q-row-qty" value="1" min="1" oninput="calcQuoteTotals()" style="width:60px;">
    </td>
    <td>
      <input type="number" class="form-control-custom q-row-disc" value="0" min="0" oninput="calcQuoteTotals()" style="width:80px;">
    </td>
    <td style="font-weight:700; color:var(--primary-dark);" class="q-row-total">
      LKR 0.00
    </td>
    <td style="text-align:center;">
      <button type="button" class="btn-soft-pink" style="padding:4px 8px;" onclick="removeQuoteRow('${rowId}')">
        <i data-lucide="trash-2" style="width:14px;"></i>
      </button>
    </td>
  `;

  tbody.appendChild(tr);
  if (window.lucide) lucide.createIcons();
  calcQuoteTotals();
}

function removeQuoteRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
  calcQuoteTotals();
}

function onCatalogSelect(rowId, selectEl) {
  const row = document.getElementById(rowId);
  const selectedOpt = selectEl.options[selectEl.selectedIndex];
  if (!selectedOpt || !selectedOpt.value) return;

  const price = selectedOpt.dataset.price || 0;
  const duration = selectedOpt.dataset.duration || 60;
  const name = selectedOpt.text.split(' (LKR')[0];

  row.querySelector(".q-row-desc").value = name;
  row.querySelector(".q-row-price").value = price;
  row.querySelector(".q-row-dur").value = duration;

  calcQuoteTotals();
}

function calcQuoteTotals() {
  let subtotal = 0;
  const rows = document.querySelectorAll("#quote-rows-body tr");

  rows.forEach(r => {
    const price = parseFloat(r.querySelector(".q-row-price").value) || 0;
    const qty = parseInt(r.querySelector(".q-row-qty").value) || 1;
    const disc = parseFloat(r.querySelector(".q-row-disc").value) || 0;

    const lineTotal = (price * qty) - disc;
    r.querySelector(".q-row-total").innerText = common.formatCurrency(lineTotal);
    subtotal += lineTotal;
  });

  const overallDiscount = parseFloat(document.getElementById("q-total-discount").value) || 0;
  const grandTotal = Math.max(0, subtotal - overallDiscount);

  document.getElementById("q-subtotal-disp").innerText = common.formatCurrency(subtotal);
  document.getElementById("q-grand-total-disp").innerText = common.formatCurrency(grandTotal);
}

async function handleCreateQuotation(e) {
  e.preventDefault();

  const rows = document.querySelectorAll("#quote-rows-body tr");
  if (rows.length === 0) {
    common.showToast("Please add at least one service item.", "warning");
    return;
  }

  const items = [];
  rows.forEach(r => {
    const desc = r.querySelector(".q-row-desc").value.trim();
    const dur = parseInt(r.querySelector(".q-row-dur").value) || 60;
    const price = parseFloat(r.querySelector(".q-row-price").value) || 0;
    const qty = parseInt(r.querySelector(".q-row-qty").value) || 1;
    const disc = parseFloat(r.querySelector(".q-row-disc").value) || 0;

    items.push({
      description: desc,
      duration_minutes: dur,
      unit_price: price,
      quantity: qty,
      discount_amount: disc,
    });
  });

  const custId = document.getElementById("q-customer-select").value;
  const payload = {
    customer_id: custId ? parseInt(custId) : null,
    customer_name: document.getElementById("q-customer-name").value.trim(),
    customer_phone: document.getElementById("q-customer-phone").value.trim(),
    customer_email: document.getElementById("q-customer-email").value.trim() || null,
    customer_address: document.getElementById("q-customer-address").value.trim() || null,
    quotation_date: document.getElementById("q-date").value,
    valid_until: document.getElementById("q-valid-until").value,
    status: document.getElementById("q-status").value,
    discount_amount: parseFloat(document.getElementById("q-total-discount").value) || 0,
    items,
    notes: document.getElementById("q-notes").value.trim() || null,
    terms: document.getElementById("q-terms").value.trim() || null,
  };

  const btn = document.getElementById("btn-save-quote");
  btn.disabled = true;
  btn.innerText = "Generating Quotation...";

  try {
    const res = await api.post("/quotations", payload);
    if (res.success && res.data) {
      common.showToast(`Quotation #${res.data.quotation_number} generated successfully!`, "success");
      setTimeout(() => {
        window.location.href = "quotations.html";
      }, 700);
    }
  } catch (err) {
    common.showToast(err.message || "Failed to generate quotation.", "error");
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="check-circle"></i> Save & Generate Quotation`;
    if (window.lucide) lucide.createIcons();
  }
}
