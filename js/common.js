/**
 * SALON VELLORA — COMMON APPLICATION HELPERS
 * Toast notifications, Confirm modals, Currency/Date formatters, and Navigation layout
 */

const common = {
  formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatTime(timeStr) {
    if (!timeStr) return "-";
    if (timeStr.length === 5) return timeStr; // HH:mm
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  },

  showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-custom ${type}`;
    
    let icon = "check-circle";
    if (type === "error") icon = "alert-triangle";
    if (type === "warning") icon = "alert-circle";
    if (type === "info") icon = "info";

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span class="toast-message">${message}</span>
      <button style="background:none;border:none;cursor:pointer;color:#9ca3af;" onclick="this.parentElement.remove()">
        <i data-lucide="x" style="width:16px;height:16px;"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  showConfirm({ title, message, confirmText = "Confirm", isDanger = false, onConfirm }) {
    let modal = document.getElementById("confirm-modal-wrapper");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "confirm-modal-wrapper";
      modal.className = "modal-overlay";
      modal.innerHTML = `
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header-custom">
            <h3 class="card-title-clean" id="confirm-modal-title">Confirm</h3>
            <button class="btn-close-modal" style="background:none;border:none;cursor:pointer;" onclick="common.closeConfirm()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body-custom">
            <p id="confirm-modal-body" style="color: var(--text-muted); font-size: 0.95rem;"></p>
          </div>
          <div class="modal-footer-custom">
            <button class="btn-secondary-custom" onclick="common.closeConfirm()">Cancel</button>
            <button class="btn-primary-custom" id="confirm-modal-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById("confirm-modal-title").innerText = title;
    document.getElementById("confirm-modal-body").innerText = message;
    
    const confirmBtn = document.getElementById("confirm-modal-btn");
    confirmBtn.innerText = confirmText;
    confirmBtn.style.background = isDanger ? "var(--danger)" : "var(--primary-gradient)";

    confirmBtn.onclick = async () => {
      common.closeConfirm();
      if (typeof onConfirm === "function") await onConfirm();
    };

    modal.classList.add("active");
    if (window.lucide) lucide.createIcons();
  },

  closeConfirm() {
    const modal = document.getElementById("confirm-modal-wrapper");
    if (modal) modal.classList.remove("active");
  },

  initLayout(activeMenuKey, pageTitle, pageSubtitle) {
    const user = auth.getUser() || { name: "Reception", role: "Manager", email: "salonvellora26@gmail.com" };
    
    const assetPrefix = window.location.pathname.includes('/pages/') ? '../' : '';

    // Inject Sidebar
    const sidebarContainer = document.getElementById("app-sidebar-placeholder");
    if (sidebarContainer) {
      sidebarContainer.innerHTML = `
        <aside class="app-sidebar" id="main-sidebar">
          <div class="sidebar-header">
            <img src="${assetPrefix}assets/logocircel.jpg" alt="Salon Vellora" class="sidebar-logo" onerror="this.src='${assetPrefix}assets/salonvelora.png'">
            <div>
              <div class="brand-title">Salon Vellora</div>
              <div class="brand-tagline">Ladies & Bridal Dressing</div>
            </div>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section-title">Core Operations</div>
            <a href="dashboard.html" class="nav-link-custom ${activeMenuKey === 'dashboard' ? 'active' : ''}" data-nav-permission="dashboard.view">
              <i data-lucide="layout-dashboard"></i> Dashboard
            </a>
            <a href="pos.html" class="nav-link-custom ${activeMenuKey === 'pos' ? 'active' : ''}" data-nav-permission="pos.view">
              <i data-lucide="shopping-cart"></i> POS & Billing
            </a>
            <a href="appointments.html" class="nav-link-custom ${activeMenuKey === 'appointments' ? 'active' : ''}" data-nav-permission="appointments.view">
              <i data-lucide="calendar"></i> Appointments
            </a>
            <a href="quotations.html" class="nav-link-custom ${activeMenuKey === 'quotations' ? 'active' : ''}" data-nav-permission="quotations.view">
              <i data-lucide="file-text"></i> Quotations
            </a>
            <a href="invoices.html" class="nav-link-custom ${activeMenuKey === 'invoices' ? 'active' : ''}" data-nav-permission="sales.view">
              <i data-lucide="receipt"></i> Sales & Invoices
            </a>

            <div class="nav-section-title">Salon Management</div>
            <a href="customers.html" class="nav-link-custom ${activeMenuKey === 'customers' ? 'active' : ''}" data-nav-permission="customers.view">
              <i data-lucide="users"></i> Customers & Loyalty
            </a>
            <a href="services.html" class="nav-link-custom ${activeMenuKey === 'services' ? 'active' : ''}" data-nav-permission="services.view">
              <i data-lucide="scissors"></i> Services & Packages
            </a>
            <a href="service-categories.html" class="nav-link-custom ${activeMenuKey === 'categories' ? 'active' : ''}" data-nav-permission="services.view">
              <i data-lucide="folder-heart"></i> Service Categories
            </a>
            <a href="staff.html" class="nav-link-custom ${activeMenuKey === 'staff' ? 'active' : ''}" data-nav-permission="staff.view">
              <i data-lucide="user-check"></i> Staff & Stylists
            </a>

            <div class="nav-section-title">Inventory & Stock</div>
            <a href="inventory.html" class="nav-link-custom ${activeMenuKey === 'inventory' ? 'active' : ''}" data-nav-permission="inventory.view">
              <i data-lucide="boxes"></i> Stock & Ledger
            </a>
            <a href="products.html" class="nav-link-custom ${activeMenuKey === 'products' ? 'active' : ''}" data-nav-permission="inventory.view">
              <i data-lucide="package"></i> Salon Products
            </a>
            <a href="purchases.html" class="nav-link-custom ${activeMenuKey === 'purchases' ? 'active' : ''}" data-nav-permission="purchases.view">
              <i data-lucide="truck"></i> Purchases
            </a>
            <a href="suppliers.html" class="nav-link-custom ${activeMenuKey === 'suppliers' ? 'active' : ''}" data-nav-permission="purchases.view">
              <i data-lucide="building-2"></i> Suppliers
            </a>

            <div class="nav-section-title">Finance & Intelligence</div>
            <a href="expenses.html" class="nav-link-custom ${activeMenuKey === 'expenses' ? 'active' : ''}" data-nav-permission="expenses.view">
              <i data-lucide="wallet"></i> Expenses
            </a>
            <a href="reports.html" class="nav-link-custom ${activeMenuKey === 'reports' ? 'active' : ''}" data-nav-permission="reports.view">
              <i data-lucide="bar-chart-3"></i> Reports & Analytics
            </a>
            <a href="catalog.html" target="_blank" class="nav-link-custom">
              <i data-lucide="external-link"></i> Public Catalog
            </a>

            <div class="nav-section-title">Administration</div>
            <a href="users.html" class="nav-link-custom ${activeMenuKey === 'users' ? 'active' : ''}" data-nav-permission="users.view">
              <i data-lucide="shield-check"></i> System Users
            </a>
            <a href="roles.html" class="nav-link-custom ${activeMenuKey === 'roles' ? 'active' : ''}" data-nav-permission="roles.view">
              <i data-lucide="key"></i> Roles & Permissions
            </a>
            <a href="audit-logs.html" class="nav-link-custom ${activeMenuKey === 'audit' ? 'active' : ''}" data-nav-permission="audit_logs.view">
              <i data-lucide="clipboard-list"></i> Audit Logs
            </a>
            <a href="settings.html" class="nav-link-custom ${activeMenuKey === 'settings' ? 'active' : ''}" data-nav-permission="settings.view">
              <i data-lucide="settings"></i> System Settings
            </a>
          </nav>

          <div class="sidebar-footer">
            <div class="user-profile-badge">
              <div class="avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
              <div class="user-info">
                <div class="name">${user.name || 'Staff User'}</div>
                <div class="role">${user.role || 'Staff'}</div>
              </div>
              <button onclick="auth.logout()" title="Logout" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;">
                <i data-lucide="log-out" style="width:18px;height:18px;"></i>
              </button>
            </div>
            <div class="sidebar-dev-credit">
              <div>Developed by <strong>Lunexa Software (PVT) LTD</strong></div>
              <div style="font-size:0.65rem; color:var(--text-light); margin-top:2px;">by <strong style="color:var(--text-main);">iTzme VihanGa</strong></div>
            </div>
          </div>
        </aside>
        <div class="sidebar-backdrop" id="sidebar-backdrop" onclick="common.toggleMobileSidebar()"></div>
      `;
    }

    // Inject Topbar
    const topbarContainer = document.getElementById("app-topbar-placeholder");
    if (topbarContainer) {
      topbarContainer.innerHTML = `
        <header class="app-topbar">
          <div class="topbar-left">
            <button class="mobile-nav-toggle" onclick="common.toggleMobileSidebar()">
              <i data-lucide="menu"></i>
            </button>
            <div class="page-headline">
              <h1>${pageTitle || 'Salon Vellora'}</h1>
              <p>${pageSubtitle || 'Ladies Salon & Bridal Dressing — Pinnaduwa, Galle'}</p>
            </div>
          </div>
          <div class="topbar-right">
            <a href="pos.html" class="btn-primary-custom" data-permission="pos.create">
              <i data-lucide="shopping-bag"></i> Quick POS
            </a>
            <a href="quotation-create.html" class="btn-soft-pink" data-permission="quotations.create">
              <i data-lucide="file-plus"></i> New Quote
            </a>
          </div>
        </header>
      `;
    }

    if (window.lucide) lucide.createIcons();
    permissions.applyUI();
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById("main-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.toggle("show");
    if (backdrop) backdrop.classList.toggle("show");
  }
};

window.common = common;
