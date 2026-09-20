/**
 * SALON VELLORA — SERVICES & PACKAGES ENGINE
 */

let allServicesData = [];
let allCategoriesData = [];

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
        filterSelect.innerHTML = `<option value="">All Categories</option>` + allCategoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
      }
      if (formSelect) {
        formSelect.innerHTML = `<option value="">-- Select Category --</option>` + allCategoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
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

  if (services.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted);">No services found.</td></tr>`;
    return;
  }

  tbody.innerHTML = services.map(s => `
    <tr>
      <td>
        <div style="font-weight:700;color:var(--text-main);">${s.name}</div>
        ${s.is_featured ? '<span class="badge-custom badge-purple" style="font-size:0.68rem;padding:1px 6px;">Featured</span>' : ''}
      </td>
      <td><span class="badge-custom badge-primary">${s.category ? s.category.name : 'General'}</span></td>
      <td style="font-family:monospace;font-size:0.8rem;color:var(--text-muted);">${s.code || '-'}</td>
      <td style="font-weight:700;color:var(--primary-dark);">${common.formatCurrency(s.price)}</td>
      <td>${s.duration_minutes} mins</td>
      <td><span class="badge-custom badge-${s.status === 'active' ? 'success' : 'danger'}">${s.status}</span></td>
      <td style="text-align:right;">
        <button class="btn-secondary-custom" style="padding:4px 8px;font-size:0.75rem;" onclick="openEditServiceModal(${s.id})">
          <i data-lucide="edit-3" style="width:14px;"></i> Edit
        </button>
        <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" onclick="deleteService(${s.id})">
          <i data-lucide="trash-2" style="width:14px;"></i>
        </button>
      </td>
    </tr>
  `).join("");

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
      (s.code && s.code.toLowerCase().includes(search))
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
  document.getElementById("srv-duration").value = "60";
  document.getElementById("srv-desc").value = "";
  document.getElementById("srv-featured").checked = false;

  document.getElementById("service-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function openEditServiceModal(id) {
  const srv = allServicesData.find(s => s.id === id);
  if (!srv) return;

  document.getElementById("service-modal-title").innerText = "Edit Service";
  document.getElementById("srv-id").value = srv.id;
  document.getElementById("srv-name").value = srv.name;
  document.getElementById("srv-cat").value = srv.category_id;
  document.getElementById("srv-code").value = srv.code || "";
  document.getElementById("srv-price").value = srv.price;
  document.getElementById("srv-duration").value = srv.duration_minutes;
  document.getElementById("srv-desc").value = srv.description || "";
  document.getElementById("srv-featured").checked = !!srv.is_featured;

  document.getElementById("service-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeServiceModal() {
  document.getElementById("service-modal").classList.remove("active");
}

async function handleSaveService(e) {
  e.preventDefault();

  const id = document.getElementById("srv-id").value;
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
  common.showConfirm({
    title: "Delete Service?",
    message: "Are you sure you want to remove this service from the catalog?",
    confirmText: "Delete Service",
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/services/${id}`);
        common.showToast("Service removed.", "info");
        loadServices();
      } catch (e) {
        common.showToast("Failed to delete service.", "error");
      }
    }
  });
}

// Package Creator
function populatePackageServicesSelect(services) {
  const select = document.getElementById("pkg-services-select");
  if (!select) return;
  select.innerHTML = services.map(s => `<option value="${s.id}">${s.name} (LKR ${parseFloat(s.price).toLocaleString()})</option>`).join("");
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
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:3rem;">No categories yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(c => `
      <tr>
        <td style="font-weight:700;color:var(--primary);">${c.display_order || 1}</td>
        <td style="font-weight:700;">${c.name}</td>
        <td style="font-family:monospace;font-size:0.8rem;color:var(--text-muted);">${c.slug}</td>
        <td>${c.description || '-'}</td>
        <td><span class="badge-custom badge-info">${c.services_count || 0} services</span></td>
      </tr>
    `).join("");

  } catch (e) {
    common.showToast("Failed to load categories.", "error");
  }
}

function openCategoryModal() {
  document.getElementById("category-modal").classList.add("active");
}
function closeCategoryModal() {
  document.getElementById("category-modal").classList.remove("active");
}

async function handleSaveCategory(e) {
  e.preventDefault();
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
