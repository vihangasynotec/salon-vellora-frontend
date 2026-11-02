/**
 * SALON VELLORA — SERVICES & PACKAGES ENGINE
 */

let allServicesData = [];
let allCategoriesData = [];

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

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("services-table-body")) {
    common.initLayout("services", "Services & Packages", "Price catalog, treatment durations, and luxury bridal package bundling");
    loadServicesPage();
  }
});

async function loadServicesPage() {
  await loadCategoriesDropdown();
  await loadServices();
}

async function loadCategoriesDropdown() {
  try {
    const res = await api.get("/service-categories");
    if (res.success && res.data) {
      allCategoriesData = res.data;

      const filterSelect = document.getElementById("srv-cat-filter");
      const formSelect = document.getElementById("srv-cat");

      if (filterSelect) {
        filterSelect.innerHTML = `<option value="">All Categories (8)</option>` + 
          allCategoriesData.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.services_count || 0})</option>`).join("");
      }
      if (formSelect) {
        formSelect.innerHTML = `<option value="">-- Select Category --</option>` + 
          allCategoriesData.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
      }
    }
  } catch (e) {}
}

async function loadServices() {
  const tbody = document.getElementById("services-table-body");
  if (!tbody) return;

  try {
    const res = await api.get("/services");
    if (!res.success || !res.data) return;

    allServicesData = res.data;
    renderServicesTable(allServicesData);
    populatePackageServicesSelect(allServicesData);
  } catch (err) {
    console.error("Load services error:", err);
    common.showToast("Failed to load salon services.", "error");
  }
}

function renderServicesTable(services) {
  const tbody = document.getElementById("services-table-body");
  if (!tbody) return;

  const countBadge = document.getElementById("srv-count-badge");
  if (countBadge) {
    countBadge.innerText = `Showing ${services.length} of ${allServicesData.length} services`;
  }

  if (services.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted);">No services found.</td></tr>`;
    return;
  }

  const superAdmin = isUserSuperAdmin();

  tbody.innerHTML = services.map(s => {
    let actionButtons = "";
    if (superAdmin) {
      actionButtons = `
        <div style="display:flex;gap:6px;justify-content:flex-end;">
          <button class="btn-secondary-custom" title="Edit Service & Price (Super Admin)" style="padding:5px 8px;font-size:0.75rem;cursor:pointer;" onclick="openEditServiceModal(${s.id})">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i> Edit
          </button>
          <button class="btn-soft-pink" title="Delete Service (Super Admin)" style="padding:5px 8px;font-size:0.75rem;color:var(--danger);border-color:rgba(220,53,69,0.25);background:rgba(220,53,69,0.08);cursor:pointer;" onclick="deleteService(${s.id})">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      `;
    } else {
      actionButtons = `
        <span style="font-size:0.75rem;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px;" title="Only Super Admin has access to edit or delete services">
          <i data-lucide="lock" style="width:13px;height:13px;"></i> Super Admin only
        </span>
      `;
    }

    return `
      <tr>
        <td>
          <div style="font-weight:700;color:var(--text-main);">${escapeHtml(s.name)}</div>
          ${s.description ? `<div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(s.description)}</div>` : ''}
          ${s.is_featured ? '<span class="badge-custom badge-purple" style="font-size:0.68rem;padding:1px 6px;">Featured</span>' : ''}
        </td>
        <td><span class="badge-custom badge-primary">${s.category ? escapeHtml(s.category.name) : 'General'}</span></td>
        <td style="font-family:monospace;font-size:0.8rem;color:var(--text-muted);">${escapeHtml(s.code || '-')}</td>
        <td style="font-weight:800;font-size:1rem;color:var(--primary-dark);">${common.formatCurrency(s.price)}</td>
        <td>${s.duration_minutes} mins</td>
        <td><span class="badge-custom badge-${s.status === 'active' ? 'success' : 'danger'}">${escapeHtml(s.status || 'active')}</span></td>
        <td style="text-align:right;">
          ${actionButtons}
        </td>
      </tr>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
  permissions.applyUI();
}

function filterServices() {
  const search = (document.getElementById("srv-search").value || "").toLowerCase().trim();
  const catId = document.getElementById("srv-cat-filter").value;

  let filtered = allServicesData;

  if (catId) {
    filtered = filtered.filter(s => s.category_id === parseInt(catId));
  }

  if (search) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search) || 
      (s.code && s.code.toLowerCase().includes(search)) ||
      (s.category && s.category.name.toLowerCase().includes(search))
    );
  }

  renderServicesTable(filtered);
}

function openServiceModal() {
  document.getElementById("service-modal-title").innerText = "Add New Service";
  document.getElementById("srv-id").value = "";
  document.getElementById("srv-name").value = "";
  document.getElementById("srv-cat").value = "";
  document.getElementById("srv-code").value = "";
  document.getElementById("srv-price").value = "";
  document.getElementById("srv-duration").value = "45";
  document.getElementById("srv-desc").value = "";
  document.getElementById("srv-featured").checked = false;

  const note = document.getElementById("srv-super-admin-note");
  if (note) note.style.display = "none";

  document.getElementById("service-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function openEditServiceModal(id) {
  if (!isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can edit services or modify prices.", "error");
    return;
  }

  const srv = allServicesData.find(s => s.id === id);
  if (!srv) return;

  document.getElementById("service-modal-title").innerText = "Edit Service & Pricing";
  document.getElementById("srv-id").value = srv.id;
  document.getElementById("srv-name").value = srv.name;
  document.getElementById("srv-cat").value = srv.category_id;
  document.getElementById("srv-code").value = srv.code || "";
  document.getElementById("srv-price").value = srv.price;
  document.getElementById("srv-duration").value = srv.duration_minutes;
  document.getElementById("srv-desc").value = srv.description || "";
  document.getElementById("srv-featured").checked = !!srv.is_featured;

  const note = document.getElementById("srv-super-admin-note");
  if (note) note.style.display = "block";

  document.getElementById("service-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeServiceModal() {
  document.getElementById("service-modal").classList.remove("active");
}

async function handleSaveService(e) {
  e.preventDefault();

  const id = document.getElementById("srv-id").value;

  if (id && !isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can edit services or change prices.", "error");
    return;
  }

  const payload = {
    name: document.getElementById("srv-name").value.trim(),
    category_id: parseInt(document.getElementById("srv-cat").value),
    code: document.getElementById("srv-code").value.trim() || undefined,
    price: parseFloat(document.getElementById("srv-price").value),
    duration_minutes: parseInt(document.getElementById("srv-duration").value),
    description: document.getElementById("srv-desc").value.trim() || undefined,
    is_featured: document.getElementById("srv-featured").checked,
  };

  const btn = document.getElementById("btn-save-srv");
  btn.disabled = true;

  try {
    if (id) {
      await api.put(`/services/${id}`, payload);
      common.showToast("Service updated successfully.", "success");
    } else {
      await api.post("/services", payload);
      common.showToast("Service added successfully.", "success");
    }

    closeServiceModal();
    loadServices();
  } catch (err) {
    common.showToast(err.message || "Failed to save service.", "error");
  } finally {
    btn.disabled = false;
  }
}

async function deleteService(id) {
  if (!isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can delete services.", "error");
    return;
  }

  const srv = allServicesData.find(s => s.id === id);
  const name = srv ? srv.name : `Service #${id}`;

  if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action can only be performed by Super Admin.`)) {
    return;
  }

  try {
    const res = await api.delete(`/services/${id}`);
    if (res.success) {
      common.showToast(res.message || "Service removed successfully.", "success");
      loadServices();
    } else {
      common.showToast(res.message || "Failed to delete service.", "error");
    }
  } catch (e) {
    common.showToast(e.message || "Failed to delete service.", "error");
  }
}

// Package Creator
function populatePackageServicesSelect(services) {
  const select = document.getElementById("pkg-services-select");
  if (!select) return;
  select.innerHTML = services.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (LKR ${parseFloat(s.price).toLocaleString()})</option>`).join("");
}

function openPackageModal() {
  document.getElementById("package-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}
function closePackageModal() {
  document.getElementById("package-modal").classList.remove("active");
}

async function handleSavePackage(e) {
  e.preventDefault();

  const select = document.getElementById("pkg-services-select");
  const selectedServiceIds = Array.from(select.selectedOptions).map(opt => parseInt(opt.value));

  if (selectedServiceIds.length === 0) {
    common.showToast("Please select at least one service for the package.", "warning");
    return;
  }

  const payload = {
    name: document.getElementById("pkg-name").value.trim(),
    package_price: parseFloat(document.getElementById("pkg-price").value),
    duration_minutes: parseInt(document.getElementById("pkg-duration").value),
    description: document.getElementById("pkg-desc").value.trim() || undefined,
    service_ids: selectedServiceIds,
    is_featured: true,
  };

  const btn = document.getElementById("btn-save-pkg");
  btn.disabled = true;

  try {
    await api.post("/service-packages", payload);
    common.showToast("Bridal Package created successfully!", "success");
    closePackageModal();
    loadServices();
  } catch (err) {
    common.showToast(err.message || "Failed to create package.", "error");
  } finally {
    btn.disabled = false;
  }
}

// --------------------------------------------------------------------------
// CATEGORIES PAGE ENGINE
// --------------------------------------------------------------------------
async function loadCategoriesPage() {
  common.initLayout("categories", "Service Categories", "Category grouping for haircutting, bridal makeovers, nail art & treatments");
  const tbody = document.getElementById("categories-table-body");

  try {
    const res = await api.get("/service-categories");
    if (!res.success || !res.data) return;

    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;">No categories yet.</td></tr>`;
      return;
    }

    const superAdmin = isUserSuperAdmin();

    tbody.innerHTML = res.data.map(c => {
      let actions = "";
      if (superAdmin) {
        actions = `
          <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;color:var(--danger);border-color:rgba(220,53,69,0.2);background:rgba(220,53,69,0.08);cursor:pointer;" onclick="deleteCategoryConfirm(${c.id}, '${escapeHtml(c.name)}')">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
          </button>
        `;
      } else {
        actions = `<span style="font-size:0.75rem;color:var(--text-muted);"><i data-lucide="lock" style="width:12px;height:12px;"></i> Super Admin</span>`;
      }

      return `
        <tr>
          <td style="font-weight:700;color:var(--primary);">${c.display_order || 1}</td>
          <td style="font-weight:700;">${escapeHtml(c.name)}</td>
          <td style="font-family:monospace;font-size:0.8rem;color:var(--text-muted);">${escapeHtml(c.slug)}</td>
          <td>${escapeHtml(c.description || '-')}</td>
          <td><span class="badge-custom badge-info">${c.services_count || 0} services</span></td>
          <td style="text-align:right;">${actions}</td>
        </tr>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();

  } catch (e) {
    common.showToast("Failed to load categories.", "error");
  }
}

async function deleteCategoryConfirm(id, name) {
  if (!isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can delete service categories.", "error");
    return;
  }

  if (!confirm(`Are you sure you want to delete category "${name}"?\nAll associated services will also be removed.`)) {
    return;
  }

  try {
    const res = await api.delete(`/service-categories/${id}`);
    if (res.success) {
      common.showToast(res.message || "Category deleted.", "success");
      loadCategoriesPage();
    } else {
      common.showToast(res.message || "Failed to delete category.", "error");
    }
  } catch (e) {
    common.showToast(e.message || "Error deleting category.", "error");
  }
}

function openCategoryModal() {
  if (!isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can create categories.", "error");
    return;
  }
  document.getElementById("category-modal").classList.add("active");
}
function closeCategoryModal() {
  document.getElementById("category-modal").classList.remove("active");
}

async function handleSaveCategory(e) {
  e.preventDefault();
  if (!isUserSuperAdmin()) {
    common.showToast("Access Denied: Only Super Administrator can create categories.", "error");
    return;
  }

  const name = document.getElementById("cat-name").value.trim();
  const display_order = parseInt(document.getElementById("cat-order").value) || 1;
  const description = document.getElementById("cat-desc").value.trim() || undefined;

  try {
    await api.post("/service-categories", { name, display_order, description });
    common.showToast("Category created!", "success");
    closeCategoryModal();
    loadCategoriesPage();
  } catch (err) {
    common.showToast(err.message || "Failed to create category.", "error");
  }
}
