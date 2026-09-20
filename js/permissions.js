/**
 * SALON VELLORA — PERMISSION SYSTEM
 * Granular client-side RBAC verification & UI element filtering
 */

const permissions = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem("salon_user")) || null;
    } catch (e) {
      return null;
    }
  },

  getPermissions() {
    const user = this.getUser();
    if (!user) return [];
    if (user.role === "super_admin" || user.role === "Super Admin") {
      return ["*"]; // Super admin has global wildcard permission
    }
    return user.permissions || [];
  },

  can(permissionKey) {
    const perms = this.getPermissions();
    if (perms.includes("*")) return true;
    return perms.includes(permissionKey);
  },

  hasRole(...roleNames) {
    const user = this.getUser();
    if (!user) return false;
    const currentRole = (user.role || "").toLowerCase().replace(/\s+/g, "_");
    return roleNames.some(r => r.toLowerCase().replace(/\s+/g, "_") === currentRole);
  },

  applyUI() {
    // Hide or disable any element marked with data-permission="xxx" if user lacks permission
    const protectedElements = document.querySelectorAll("[data-permission]");
    protectedElements.forEach(el => {
      const requiredPerm = el.getAttribute("data-permission");
      if (!this.can(requiredPerm)) {
        el.style.display = "none";
      }
    });

    // Hide navigation items user has no access to
    const protectedNavs = document.querySelectorAll("[data-nav-permission]");
    protectedNavs.forEach(nav => {
      const requiredPerm = nav.getAttribute("data-nav-permission");
      if (!this.can(requiredPerm)) {
        nav.style.display = "none";
      }
    });
  }
};

window.permissions = permissions;
window.can = (key) => permissions.can(key);
window.hasRole = (...roles) => permissions.hasRole(...roles);
