let allLoadedClients = [];

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("customers-table-body")) {
    common.initLayout("customers", "Clients & Loyalty Rewards", "Client profiles, lifetime spending, booking history & loyalty point ledger");
    loadCustomers();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      openCreateCustomerModal();
    }
  }
});

let searchTimer = null;
function debounceCustomerSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadCustomers();
  }, 300);
}

async function loadCustomers() {
  const tbody = document.getElementById("customers-table-body");
  if (!tbody) return;

  const search = document.getElementById("cust-search").value.trim();

  try {
    const res = await api.get("/customers", { search, per_page: 50 });
    if (!res.success || !res.data) return;

    allLoadedClients = res.data.data || res.data;

    if (allLoadedClients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No clients registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allLoadedClients.map(c => `
      <tr>
        <td>
          <a href="customer-details.html?id=${c.id}" style="font-weight:700;color:var(--primary-dark);">${c.name}</a>
        </td>
        <td>${c.phone}</td>
        <td>${c.email || '-'}</td>
        <td><span class="badge-custom badge-primary">${c.loyalty_points || 0} pts</span></td>
        <td style="font-weight:600;">${common.formatCurrency(c.total_spend || 0)}</td>
        <td>${c.total_visits || 0}</td>
        <td><span class="badge-custom badge-${c.status === 'active' ? 'success' : 'danger'}">${c.status}</span></td>
        <td style="text-align:right;">
          <a href="customer-details.html?id=${c.id}" class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" title="View Profile">
            <i data-lucide="user" style="width:14px;"></i> Profile
          </a>
          <button class="btn-secondary-custom" style="padding:4px 8px;font-size:0.75rem;" onclick="openEditCustomerModal(${c.id})" title="Edit Details">
            <i data-lucide="edit-3" style="width:14px;"></i>
          </button>
        </td>
      </tr>
    `).join("");

    if (window.lucide) lucide.createIcons();
    permissions.applyUI();

  } catch (err) {
    console.error("Load customers error:", err);
    common.showToast("Failed to load clients.", "error");
  }
}

function openCreateCustomerModal() {
  document.getElementById("customer-modal-title").innerText = "Register New Client";
  document.getElementById("cust-id").value = "";
  document.getElementById("cust-name").value = "";
  document.getElementById("cust-phone").value = "";
  document.getElementById("cust-email").value = "";
  document.getElementById("cust-birthday").value = "";
  document.getElementById("cust-address").value = "";
  document.getElementById("cust-notes").value = "";

  document.getElementById("customer-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function openEditCustomerModal(id) {
  const cust = allLoadedClients.find(c => c.id === id);
  if (!cust) return;

  document.getElementById("customer-modal-title").innerText = "Edit Client Details";
  document.getElementById("cust-id").value = cust.id;
  document.getElementById("cust-name").value = cust.name;
  document.getElementById("cust-phone").value = cust.phone;
  document.getElementById("cust-email").value = cust.email || "";
  document.getElementById("cust-birthday").value = cust.birthday ? cust.birthday.split('T')[0] : "";
  document.getElementById("cust-address").value = cust.address || "";
  document.getElementById("cust-notes").value = cust.notes || "";

  document.getElementById("customer-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeCustomerModal() {
  document.getElementById("customer-modal").classList.remove("active");
}

async function handleSaveCustomer(e) {
  e.preventDefault();

  const id = document.getElementById("cust-id").value;
  const payload = {
    name: document.getElementById("cust-name").value.trim(),
    phone: document.getElementById("cust-phone").value.trim(),
    email: document.getElementById("cust-email").value.trim() || undefined,
    birthday: document.getElementById("cust-birthday").value || undefined,
    address: document.getElementById("cust-address").value.trim() || undefined,
    notes: document.getElementById("cust-notes").value.trim() || undefined,
  };

  const btn = document.getElementById("btn-save-cust");
  btn.disabled = true;

  try {
    if (id) {
      await api.put(`/customers/${id}`, payload);
      common.showToast("Client details updated successfully!", "success");
    } else {
      await api.post("/customers", payload);
      common.showToast("Client registered successfully!", "success");
    }

    closeCustomerModal();
    loadCustomers();
  } catch (err) {
    common.showToast(err.message || "Failed to save client.", "error");
  } finally {
    btn.disabled = false;
  }
}

// --------------------------------------------------------------------------
// CUSTOMER DETAILS PAGE ENGINE
// --------------------------------------------------------------------------
async function initCustomerDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const custId = urlParams.get('id');
  if (!custId) {
    window.location.href = "customers.html";
    return;
  }

  common.initLayout("customers", "Client Profile & History", "Complete transaction history, appointment visits, and loyalty statement");

  try {
    const res = await api.get(`/customers/${custId}`);
    if (!res.success || !res.data) throw new Error("Client not found.");

    const c = res.data;

    // Header info
    document.getElementById("c-name").innerText = c.name;
    document.getElementById("c-phone").innerText = c.phone;
    document.getElementById("c-email").innerText = c.email || "No email";
    document.getElementById("c-address").innerText = c.address || "No address specified";
    document.getElementById("c-avatar").innerText = c.name.charAt(0).toUpperCase();

    document.getElementById("c-loyalty-pts").innerText = `${c.loyalty_points || 0} PTS`;
    document.getElementById("c-total-spend").innerText = common.formatCurrency(c.total_spend || 0);
    document.getElementById("c-total-visits").innerText = c.total_visits || 0;

    // Store client globally for receipt sharing
    window._currentClientProfile = c;

    // Sales table
    const salesTbody = document.getElementById("client-sales-tbody");
    if (!c.sales || c.sales.length === 0) {
      salesTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-muted);">No sales recorded yet.</td></tr>`;
    } else {
      salesTbody.innerHTML = c.sales.map(s => `
        <tr>
          <td style="font-weight:700;color:var(--primary);">${s.invoice_number}</td>
          <td>${common.formatDate(s.created_at)}</td>
          <td style="font-weight:700;">${common.formatCurrency(s.grand_total)}</td>
          <td><span class="badge-custom badge-success">${s.status}</span></td>
          <td style="text-align:right;">
            <button class="btn-whatsapp-sm" onclick="shareCustomerSaleWhatsApp(${s.id})" title="Share Receipt on WhatsApp">
              <i data-lucide="message-circle" style="width:13px;height:13px;"></i>
            </button>
          </td>
        </tr>
      `).join("");
    }

    // Appointments table
    const aptTbody = document.getElementById("client-appointments-tbody");
    if (!c.appointments || c.appointments.length === 0) {
      aptTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-muted);">No past appointments.</td></tr>`;
    } else {
      aptTbody.innerHTML = c.appointments.map(a => `
        <tr>
          <td>
            <div style="font-weight:600;">${common.formatDate(a.appointment_date)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${common.formatTime(a.start_time)}</div>
          </td>
          <td>${a.service ? a.service.name : 'Salon Service'}</td>
          <td>${a.staff ? a.staff.name : '-'}</td>
          <td><span class="badge-custom badge-primary">${a.status}</span></td>
          <td style="text-align:right;">
            <button class="btn-whatsapp-sm" onclick="shareCustomerAppointmentWhatsApp(${a.id})" title="Share Confirmation via WhatsApp">
              <i data-lucide="message-circle" style="width:13px;height:13px;"></i>
            </button>
          </td>
        </tr>
      `).join("");
    }

    // Loyalty transactions table
    const loyaltyTbody = document.getElementById("client-loyalty-tbody");
    if (!c.loyalty_transactions || c.loyalty_transactions.length === 0) {
      loyaltyTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:var(--text-muted);">No points activity recorded.</td></tr>`;
    } else {
      loyaltyTbody.innerHTML = c.loyalty_transactions.map(lt => `
        <tr>
          <td>${common.formatDate(lt.created_at)}</td>
          <td>${lt.description || 'Loyalty activity'}</td>
          <td style="font-weight:700;color:${lt.points >= 0 ? 'var(--success)' : 'var(--danger)'};">
            ${lt.points >= 0 ? '+' : ''}${lt.points} pts
          </td>
          <td style="font-weight:700;">${lt.balance_after} pts</td>
        </tr>
      `).join("");
    }

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    common.showToast(err.message || "Failed to load client profile.", "error");
  }
}

async function shareCustomerSaleWhatsApp(saleId) {
  if (!window.WhatsAppShare) {
    common.showToast("WhatsApp module not available.", "error");
    return;
  }
  try {
    const res = await api.get(`/sales/${saleId}`);
    if (res.success && res.data) {
      window.WhatsAppShare.shareSaleReceipt(res.data);
    } else {
      common.showToast("Could not load invoice details.", "error");
    }
  } catch (e) {
    common.showToast("Failed to share invoice via WhatsApp.", "error");
  }
}

function shareCustomerAppointmentWhatsApp(aptId) {
  if (!window.WhatsAppShare) {
    common.showToast("WhatsApp module not available.", "error");
    return;
  }
  const client = window._currentClientProfile;
  if (!client || !client.appointments) return;
  const apt = client.appointments.find(a => a.id === aptId);
  if (apt) {
    const clone = { ...apt, customer: client };
    window.WhatsAppShare.shareAppointmentConfirmation(clone);
  }
}
