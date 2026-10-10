/**
 * SALON VELLORA — STAFF & COMMISSION ENGINE
 */

let allStaffMembers = [];

document.addEventListener("DOMContentLoaded", () => {
  common.initLayout("staff", "Staff & Stylists", "Manage stylists, base salaries, commission tiers and individual performance");
  loadStaff();
});

async function loadStaff() {
  const tbody = document.getElementById("staff-table-body");
  if (!tbody) return;

  try {
    const res = await api.get("/staff");
    if (!res.success || !res.data) return;

    allStaffMembers = res.data;

    if (allStaffMembers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No staff registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allStaffMembers.map(s => `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--text-main);">${s.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${s.email || ''}</div>
        </td>
        <td><span class="badge-custom badge-primary">${s.designation}</span></td>
        <td>${s.specialization || '-'}</td>
        <td>${s.phone || '-'}</td>
        <td style="font-weight:600;">${common.formatCurrency(s.base_salary || 0)}</td>
        <td><span class="badge-custom badge-${s.status === 'active' ? 'success' : 'danger'}">${s.status}</span></td>
        <td style="text-align:right; white-space:nowrap;">
          <div style="display:inline-flex; gap:6px; justify-content:flex-end;">
            <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" onclick="viewStaffPerformance(${s.id})" title="View Commission & Sales">
              <i data-lucide="bar-chart-2" style="width:14px;height:14px;"></i> Performance
            </button>
            <button class="btn-secondary-custom" style="padding:4px 8px;font-size:0.75rem;" onclick="openEditStaffModal(${s.id})" title="Edit Profile">
              <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
            </button>
            <button class="btn-secondary-custom" style="padding:4px 8px;font-size:0.75rem; color:var(--danger);" onclick="deleteStaffMember(${s.id}, '${escapeHtml(s.name)}')" title="Delete Staff Member">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    if (window.lucide) lucide.createIcons();
    permissions.applyUI();

  } catch (err) {
    console.error("Load staff error:", err);
    common.showToast("Failed to load staff list.", "error");
  }
}

function openStaffModal() {
  document.getElementById("staff-modal-title").innerText = "Add Team Member";
  document.getElementById("staff-id").value = "";
  document.getElementById("s-name").value = "";
  document.getElementById("s-desig").value = "Senior Stylist";
  document.getElementById("s-phone").value = "";
  document.getElementById("s-spec").value = "";
  document.getElementById("s-salary").value = "20000";
  document.getElementById("s-email").value = "";

  document.getElementById("staff-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function openEditStaffModal(id) {
  const s = allStaffMembers.find(st => st.id === id);
  if (!s) return;

  document.getElementById("staff-modal-title").innerText = "Edit Stylist Profile";
  document.getElementById("staff-id").value = s.id;
  document.getElementById("s-name").value = s.name;
  document.getElementById("s-desig").value = s.designation;
  document.getElementById("s-phone").value = s.phone || "";
  document.getElementById("s-spec").value = s.specialization || "";
  document.getElementById("s-salary").value = s.base_salary;
  document.getElementById("s-email").value = s.email || "";

  document.getElementById("staff-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeStaffModal() {
  document.getElementById("staff-modal").classList.remove("active");
}

async function handleSaveStaff(e) {
  e.preventDefault();

  const id = document.getElementById("staff-id").value;
  const payload = {
    name: document.getElementById("s-name").value.trim(),
    designation: document.getElementById("s-desig").value.trim(),
    phone: document.getElementById("s-phone").value.trim() || undefined,
    specialization: document.getElementById("s-spec").value.trim() || undefined,
    base_salary: parseFloat(document.getElementById("s-salary").value) || 20000,
    email: document.getElementById("s-email").value.trim() || undefined,
  };

  const btn = document.getElementById("btn-save-staff");
  btn.disabled = true;

  try {
    if (id) {
      await api.put(`/staff/${id}`, payload);
      common.showToast("Stylist profile updated!", "success");
    } else {
      await api.post("/staff", payload);
      common.showToast("Team member added successfully!", "success");
    }

    closeStaffModal();
    loadStaff();
  } catch (err) {
    common.showToast(err.message || "Failed to save staff member.", "error");
  } finally {
    btn.disabled = false;
  }
}

async function viewStaffPerformance(id) {
  try {
    const res = await api.get(`/staff/${id}/performance`);
    if (!res.success || !res.data) return;

    const { staff, total_services, total_revenue, commission_earned, recent_services } = res.data;

    document.getElementById("staff-perf-name").innerText = `${staff.name} — Performance`;

    const container = document.getElementById("staff-perf-body");
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:1.5rem;">
        <div style="background:var(--bg-main);padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:0.75rem;color:var(--text-muted);">SERVICES DONE</div>
          <div style="font-size:1.3rem;font-weight:800;color:var(--text-main);">${total_services}</div>
        </div>
        <div style="background:#eff6ff;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:0.75rem;color:#1e40af;">SALES GENERATED</div>
          <div style="font-size:1.1rem;font-weight:800;color:#2563eb;">${common.formatCurrency(total_revenue)}</div>
        </div>
        <div style="background:#ecfdf5;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:0.75rem;color:#065f46;">COMMISSION (${staff.commission_rate}%)</div>
          <div style="font-size:1.1rem;font-weight:800;color:#059669;">${common.formatCurrency(commission_earned)}</div>
        </div>
      </div>

      <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:8px;">Recent Assigned Services</h4>
      <div class="table-custom-container" style="max-height:240px;overflow-y:auto;">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Service</th>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(!recent_services || recent_services.length === 0) ? '<tr><td colspan="3" style="text-align:center;padding:1.5rem;color:var(--text-muted);">No services performed yet.</td></tr>' : recent_services.map(rs => `
              <tr>
                <td><b>${rs.name}</b></td>
                <td>${common.formatDate(rs.created_at)}</td>
                <td style="font-weight:700;">${common.formatCurrency(rs.total_price)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("staff-perf-modal").classList.add("active");
  } catch (err) {
    common.showToast("Could not load performance stats.", "error");
  }
}

function closeStaffPerfModal() {
  document.getElementById("staff-perf-modal").classList.remove("active");
}

/**
 * Delete a staff member
 */
function deleteStaffMember(id, name) {
  common.showConfirm({
    title: "Delete Staff Member?",
    message: `Are you sure you want to delete "${name || 'this stylist'}"? This staff profile will be removed from active staff records.`,
    confirmText: "Yes, Delete",
    isDanger: true,
    onConfirm: async () => {
      try {
        const apiClient = window.api || window.API;
        const res = await apiClient.delete(`/staff/${id}`);
        if (res && res.success) {
          common.showToast(res.message || "Staff member deleted successfully.", "success");
          loadStaff();
        } else {
          common.showToast(res?.message || "Failed to delete staff member.", "error");
        }
      } catch (err) {
        console.error("Delete staff error:", err);
        common.showToast(err.message || "Failed to delete staff member.", "error");
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.deleteStaffMember = deleteStaffMember;
window.openStaffModal = openStaffModal;
window.closeStaffModal = closeStaffModal;
window.openEditStaffModal = openEditStaffModal;
window.viewStaffPerformance = viewStaffPerformance;
window.closeStaffPerfModal = closeStaffPerfModal;
window.handleSaveStaff = handleSaveStaff;
