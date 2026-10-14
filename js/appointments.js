/**
 * SALON VELLORA — APPOINTMENT MANAGEMENT ENGINE
 * Conflict-free booking, stylist scheduling, and status lifecycle
 */

let allAppointments = [];
let allStylists = [];
let allClients = [];
let allServicesAndPackages = [];
let currentViewMode = 'list';

document.addEventListener("DOMContentLoaded", async () => {
  common.initLayout("appointments", "Client Appointments & Calendar", "Stylist schedules, bridal bookings & conflict-free appointment management");

  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById("cal-date-picker").value = todayStr;
  document.getElementById("book-date").value = todayStr;

  await loadStylists();
  await loadClients();
  await loadServicesForBooking();
  await loadAppointments();

  // Check if opened with ?action=new
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'new') {
    openBookModal();
  }
});

async function loadStylists() {
  try {
    const res = await api.get("/staff");
    if (res.success && res.data) {
      allStylists = res.data;
      const filterSelect = document.getElementById("cal-staff-filter");
      const bookSelect = document.getElementById("book-staff");

      filterSelect.innerHTML = `<option value="">All Stylists</option>` + allStylists.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
      bookSelect.innerHTML = `<option value="">-- Select Stylist --</option>` + allStylists.map(s => `<option value="${s.id}">${s.name} (${s.designation})</option>`).join("");
    }
  } catch (e) {}
}

async function loadClients() {
  try {
    const res = await api.get("/customers");
    if (res.success && res.data) {
      allClients = res.data.data || res.data;
      const select = document.getElementById("book-customer");
      select.innerHTML = `<option value="">-- Select Registered Client --</option>` + allClients.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join("");
    }
  } catch (e) {}
}

async function loadServicesForBooking() {
  try {
    const srvRes = await api.get("/services");
    const pkgRes = await api.get("/service-packages");

    allServicesAndPackages = [];
    if (pkgRes.success && pkgRes.data) {
      pkgRes.data.forEach(p => allServicesAndPackages.push({ ...p, is_pkg: true, display_name: `[Package] ${p.name}` }));
    }
    if (srvRes.success && srvRes.data) {
      srvRes.data.forEach(s => allServicesAndPackages.push({ ...s, is_pkg: false, display_name: s.name }));
    }

    const select = document.getElementById("book-service");
    select.innerHTML = `<option value="">-- Select Service --</option>` + allServicesAndPackages.map(i => `
      <option value="${i.is_pkg ? 'pkg_' + i.id : 'srv_' + i.id}" data-duration="${i.duration_minutes || 60}">${i.display_name} (${i.duration_minutes || 60}m)</option>
    `).join("");
  } catch (e) {}
}

function onBookServiceChanged() {
  const select = document.getElementById("book-service");
  const opt = select.options[select.selectedIndex];
  if (opt && opt.dataset.duration) {
    document.getElementById("book-duration").value = opt.dataset.duration;
  }
}

function onDateChanged() {
  loadAppointments();
}

function switchView(mode, btn) {
  currentViewMode = mode;
  document.querySelectorAll(".view-pill").forEach(p => p.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (mode === 'list') {
    document.getElementById("view-list").style.display = 'block';
    document.getElementById("view-day").style.display = 'none';
    renderListView();
  } else {
    document.getElementById("view-list").style.display = 'none';
    document.getElementById("view-day").style.display = 'grid';
    renderDayScheduleView();
  }
}

async function loadAppointments() {
  const date = document.getElementById("cal-date-picker").value;
  const staffId = document.getElementById("cal-staff-filter").value;

  try {
    const params = { date };
    if (staffId) params.staff_id = staffId;

    const res = await api.get("/appointments", params);
    if (!res.success || !res.data) return;

    allAppointments = res.data;

    if (currentViewMode === 'list') {
      renderListView();
    } else {
      renderDayScheduleView();
    }
  } catch (err) {
    console.error("Load appointments error:", err);
    common.showToast("Failed to load appointments.", "error");
  }
}

function renderListView() {
  const tbody = document.getElementById("appointments-list-body");
  if (allAppointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No appointments booked for this date.</td></tr>`;
    return;
  }

  tbody.innerHTML = allAppointments.map(apt => `
    <tr>
      <td>
        <div style="font-weight:700;">${common.formatTime(apt.start_time)} - ${common.formatTime(apt.end_time)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${common.formatDate(apt.appointment_date)}</div>
      </td>
      <td>
        <div style="font-weight:600;">${apt.customer ? apt.customer.name : 'Walk-in Client'}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${apt.customer ? apt.customer.phone : ''}</div>
      </td>
      <td>${apt.service ? apt.service.name : (apt.package ? apt.package.name : 'Salon Service')}</td>
      <td><span class="badge-custom badge-info">${apt.staff ? apt.staff.name : 'Unassigned'}</span></td>
      <td>${apt.duration_minutes} mins</td>
      <td>
        <select class="form-select-custom" style="font-size:0.75rem;padding:2px 6px;height:28px;" onchange="updateAppointmentStatus(${apt.id}, this.value)">
          <option value="Pending" ${apt.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Confirmed" ${apt.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="In Progress" ${apt.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${apt.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${apt.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          <option value="No Show" ${apt.status === 'No Show' ? 'selected' : ''}>No Show</option>
        </select>
      </td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${apt.notes || '-'}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button class="btn-whatsapp-sm" onclick="shareAppointmentWhatsApp(${apt.id})" title="Share Confirmation via WhatsApp" style="margin-right:4px;">
          <i data-lucide="message-circle" style="width:13px;height:13px;"></i>
        </button>
        <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" onclick="deleteAppointment(${apt.id})" title="Cancel Booking">
          <i data-lucide="trash-2" style="width:14px;"></i>
        </button>
      </td>
    </tr>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

function renderDayScheduleView() {
  const labelsContainer = document.getElementById("day-grid-labels");
  const lanesContainer = document.getElementById("day-grid-lanes");

  const hours = [
    "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  labelsContainer.innerHTML = hours.map(h => `<div class="time-slot-label">${h}</div>`).join("");

  lanesContainer.innerHTML = hours.map(h => {
    const slotHour = parseInt(h.split(':')[0]);
    const matched = allAppointments.filter(apt => {
      const aptHour = parseInt(apt.start_time.split(':')[0]);
      return aptHour === slotHour;
    });

    let chips = matched.map(apt => `
      <div class="appointment-chip">
        <div style="flex:1;">
          <b>${apt.customer ? apt.customer.name : 'Client'}</b> (${apt.service ? apt.service.name : 'Service'})
          <div style="font-size:0.7rem;color:var(--text-muted);">${common.formatTime(apt.start_time)} - ${common.formatTime(apt.end_time)} | Stylist: ${apt.staff ? apt.staff.name : '-'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="badge-custom badge-${apt.status === 'Completed' ? 'success' : 'primary'}">${apt.status}</span>
          <button class="btn-whatsapp-sm" onclick="event.stopPropagation(); shareAppointmentWhatsApp(${apt.id})" title="Send WhatsApp Confirmation" style="padding:3px 6px;">
            <i data-lucide="message-circle" style="width:12px;height:12px;"></i>
          </button>
        </div>
      </div>
    `).join("");

    return `<div class="time-slot-lane">${chips || '<span style="color:#d1d5db;font-size:0.75rem;">Available</span>'}</div>`;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function openBookModal() {
  document.getElementById("book-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}
function closeBookModal() {
  document.getElementById("book-modal").classList.remove("active");
}

async function handleBookAppointment(e) {
  e.preventDefault();

  const customerId = document.getElementById("book-customer").value;
  const itemVal = document.getElementById("book-service").value;
  const staffId = document.getElementById("book-staff").value;
  const aptDate = document.getElementById("book-date").value;
  const aptTime = document.getElementById("book-time").value;
  const duration = parseInt(document.getElementById("book-duration").value) || 60;
  const notes = document.getElementById("book-notes").value.trim() || undefined;

  if (!customerId || !itemVal || !staffId || !aptDate || !aptTime) {
    common.showToast("Please fill all required fields.", "warning");
    return;
  }

  const payload = {
    customer_id: parseInt(customerId),
    staff_id: parseInt(staffId),
    appointment_date: aptDate,
    start_time: aptTime,
    duration_minutes: duration,
    notes,
  };

  if (itemVal.startsWith('pkg_')) {
    payload.package_id = parseInt(itemVal.replace('pkg_', ''));
  } else {
    payload.service_id = parseInt(itemVal.replace('srv_', ''));
  }

  const btn = document.getElementById("btn-save-appointment");
  btn.disabled = true;

  try {
    const res = await api.post("/appointments", payload);
    if (res.success && res.data) {
      common.showToast("Appointment booked successfully!", "success");
      const createdApt = res.data;
      closeBookModal();
      document.getElementById("cal-date-picker").value = aptDate;
      await loadAppointments();

      // Offer quick WhatsApp confirmation send
      if (window.WhatsAppShare) {
        const found = allAppointments.find(a => a.id === createdApt.id) || createdApt;
        if (!found.customer) {
          found.customer = allClients.find(c => c.id == customerId);
        }
        if (!found.staff) {
          found.staff = allStylists.find(s => s.id == staffId);
        }
        if (!found.service && !found.package) {
          const srv = allServicesAndPackages.find(i => (i.is_pkg ? 'pkg_' + i.id : 'srv_' + i.id) === itemVal);
          if (srv && srv.is_pkg) found.package = srv;
          else if (srv) found.service = srv;
        }
        window.WhatsAppShare.shareAppointmentConfirmation(found);
      }
    }
  } catch (err) {
    common.showToast(err.message || "Failed to book appointment. Check for stylist schedule conflict.", "error");
  } finally {
    btn.disabled = false;
  }
}

function shareAppointmentWhatsApp(aptId) {
  const apt = allAppointments.find(a => a.id === aptId);
  if (!apt) {
    common.showToast("Appointment details not found.", "error");
    return;
  }
  if (!window.WhatsAppShare) {
    common.showToast("WhatsApp module not available.", "error");
    return;
  }
  window.WhatsAppShare.shareAppointmentConfirmation(apt);
}

async function updateAppointmentStatus(id, newStatus) {
  try {
    const res = await api.put(`/appointments/${id}/status`, { status: newStatus });
    if (res.success) {
      common.showToast(`Status updated to ${newStatus}.`, "success");
    }
  } catch (err) {
    common.showToast(err.message || "Could not update status.", "error");
    loadAppointments();
  }
}

async function deleteAppointment(id) {
  common.showConfirm({
    title: "Remove Appointment?",
    message: "Are you sure you want to cancel and remove this scheduled appointment?",
    confirmText: "Yes, Cancel",
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/appointments/${id}`);
        common.showToast("Appointment cancelled.", "info");
        loadAppointments();
      } catch (e) {
        common.showToast("Failed to delete appointment.", "error");
      }
    }
  });
}
