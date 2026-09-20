/**
 * Salon Vellora — Public Luxury Catalog & Bridal Menu Engine
 * Displays live categories, treatments, bridal packages, pricing & WhatsApp booking
 */

let allCategories = [];
let allPackages = [];
let allServices = [];
let activeFilter = 'all';
let searchQuery = '';
let currentInquiryItem = null;

// Category icons mapping
const CATEGORY_ICONS = {
  'all': 'sparkles',
  'packages': 'crown',
  'bridal-dressing': 'gem',
  'hair-care': 'scissors',
  'hair-treatments': 'wand-2',
  'facial-skincare': 'sparkle',
  'nails-spa': 'palette'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalog();
  if (window.lucide) {
    lucide.createIcons();
  }

  // Close modal on escape or background click
  const modal = document.getElementById('inquiry-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeInquiryModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInquiryModal();
  });
});

/**
 * Fetch full catalog from backend API
 */
async function loadCatalog() {
  const packagesGrid = document.getElementById('packages-grid');
  const servicesGrid = document.getElementById('services-grid');

  if (packagesGrid) {
    packagesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 3rem; color:var(--text-muted);">
        <i data-lucide="loader" class="spin" style="margin-bottom:8px; width:28px; height:28px; color:var(--primary);"></i>
        <p style="font-size:0.9rem;">Curating bridal packages & treatments...</p>
      </div>`;
  }
  if (servicesGrid) {
    servicesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 3rem; color:var(--text-muted);">
        <i data-lucide="loader" class="spin" style="margin-bottom:8px; width:28px; height:28px; color:var(--primary);"></i>
        <p style="font-size:0.9rem;">Loading luxury treatments menu...</p>
      </div>`;
  }
  if (window.lucide) lucide.createIcons();

  try {
    const res = await API.get('/catalog');
    if (res && res.success) {
      const data = res.data;
      allCategories = data.categories || [];
      allPackages = data.packages || [];
      
      // Flatten all services with category metadata
      allServices = [];
      allCategories.forEach(cat => {
        if (cat.services && cat.services.length) {
          cat.services.forEach(srv => {
            allServices.push({
              ...srv,
              category_name: cat.name,
              category_slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            });
          });
        }
      });

      renderCategoryPills();
      renderCatalog();
    } else {
      showCatalogError('Failed to load catalog data.');
    }
  } catch (err) {
    console.error('Failed to load catalog:', err);
    showCatalogError('Could not connect to Salon Vellora server. Please ensure the backend is running.');
  }
}

function showCatalogError(msg) {
  const packagesGrid = document.getElementById('packages-grid');
  const servicesGrid = document.getElementById('services-grid');
  if (packagesGrid) {
    packagesGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:2rem; background:#fff2f2; border:1px solid #fed7d7; border-radius:12px; color:var(--danger);">
        <i data-lucide="alert-circle" style="width:24px;height:24px;margin-bottom:6px;"></i>
        <p style="margin:0; font-weight:600;">${msg}</p>
        <button onclick="loadCatalog()" class="btn-primary-custom" style="margin-top:10px; padding:0.4rem 1rem; font-size:0.8rem;">
          Retry
        </button>
      </div>`;
  }
  if (servicesGrid) servicesGrid.innerHTML = '';
  if (window.lucide) lucide.createIcons();
}

/**
 * Render category pills dynamically with icons and active state
 */
function renderCategoryPills() {
  const wrap = document.getElementById('cat-pills-wrap');
  if (!wrap) return;

  let html = `
    <button class="category-pill ${activeFilter === 'all' ? 'active' : ''}" onclick="filterCatalog('all', this)">
      <i data-lucide="sparkles" style="width:14px;height:14px;"></i> All Treatments
    </button>
    <button class="category-pill ${activeFilter === 'packages' ? 'active' : ''}" onclick="filterCatalog('packages', this)">
      <i data-lucide="crown" style="width:14px;height:14px;"></i> Signature Packages
    </button>
  `;

  allCategories.forEach(cat => {
    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const isActive = activeFilter === slug;
    const iconName = CATEGORY_ICONS[slug] || 'flower-2';

    html += `
      <button class="category-pill ${isActive ? 'active' : ''}" onclick="filterCatalog('${slug}', this)">
        <i data-lucide="${iconName}" style="width:14px;height:14px;"></i> ${escapeHtml(cat.name)}
      </button>
    `;
  });

  wrap.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

/**
 * Category filter handler
 */
function filterCatalog(filterKey, btnEl) {
  activeFilter = filterKey;

  // Update button active states
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  }

  renderCatalog();

  // Smooth scroll to relevant section if clicking specific category
  if (filterKey === 'packages') {
    const pkgSec = document.getElementById('packages-section');
    if (pkgSec) pkgSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (filterKey !== 'all') {
    const srvSec = document.getElementById('services-section');
    if (srvSec) srvSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Live search input
 */
function onSearchInput() {
  const input = document.getElementById('catalog-search');
  if (!input) return;
  searchQuery = input.value.trim().toLowerCase();

  const feedback = document.getElementById('search-feedback');
  const label = document.getElementById('search-query-label');
  if (searchQuery) {
    if (feedback) feedback.style.display = 'flex';
    if (label) label.textContent = `"${searchQuery}"`;
  } else {
    if (feedback) feedback.style.display = 'none';
  }

  renderCatalog();
}

function clearSearch() {
  const input = document.getElementById('catalog-search');
  if (input) input.value = '';
  searchQuery = '';
  const feedback = document.getElementById('search-feedback');
  if (feedback) feedback.style.display = 'none';
  renderCatalog();
}

/**
 * Master catalog render
 */
function renderCatalog() {
  const pkgSection = document.getElementById('packages-section');
  const srvSection = document.getElementById('services-section');
  const pkgGrid = document.getElementById('packages-grid');
  const srvGrid = document.getElementById('services-grid');
  const countLabel = document.getElementById('services-count-label');

  const query = searchQuery;

  // 1. Filter packages
  let filteredPackages = allPackages.filter(pkg => {
    if (activeFilter !== 'all' && activeFilter !== 'packages') return false;
    if (!query) return true;
    const nameMatch = (pkg.name || '').toLowerCase().includes(query);
    const descMatch = (pkg.description || '').toLowerCase().includes(query);
    return nameMatch || descMatch;
  });

  // 2. Filter services
  let filteredServices = allServices.filter(srv => {
    if (activeFilter === 'packages') return false;
    if (activeFilter !== 'all' && srv.category_slug !== activeFilter) return false;
    if (!query) return true;
    const nameMatch = (srv.name || '').toLowerCase().includes(query);
    const descMatch = (srv.description || '').toLowerCase().includes(query);
    const codeMatch = (srv.code || '').toLowerCase().includes(query);
    const catMatch = (srv.category_name || '').toLowerCase().includes(query);
    return nameMatch || descMatch || codeMatch || catMatch;
  });

  // Render Packages Section
  if (pkgSection && pkgGrid) {
    if (activeFilter !== 'all' && activeFilter !== 'packages') {
      pkgSection.style.display = 'none';
    } else {
      if (filteredPackages.length === 0 && query) {
        pkgSection.style.display = 'none';
      } else {
        pkgSection.style.display = 'block';
        if (filteredPackages.length === 0) {
          pkgGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:2.5rem; background:#ffffff; border-radius:16px; border:1px solid var(--border); color:var(--text-muted);">
              <i data-lucide="package-x" style="width:32px;height:32px;margin-bottom:8px;color:var(--text-light);"></i>
              <p style="margin:0;">No bridal packages found matching your criteria.</p>
            </div>`;
        } else {
          pkgGrid.innerHTML = filteredPackages.map(pkg => renderPackageCard(pkg)).join('');
        }
      }
    }
  }

  // Render Services Section
  if (srvSection && srvGrid) {
    if (activeFilter === 'packages') {
      srvSection.style.display = 'none';
    } else {
      srvSection.style.display = 'block';
      if (countLabel) {
        countLabel.textContent = `Showing ${filteredServices.length} treatment${filteredServices.length === 1 ? '' : 's'}`;
      }

      if (filteredServices.length === 0) {
        srvGrid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:3rem; background:#ffffff; border-radius:16px; border:1px solid var(--border); color:var(--text-muted);">
            <i data-lucide="search-x" style="width:36px;height:36px;margin-bottom:8px;color:var(--text-light);"></i>
            <p style="font-size:1rem; font-weight:600; color:#374151; margin-bottom:4px;">No treatments found</p>
            <p style="font-size:0.85rem; margin:0;">We couldn't find any treatments matching "${escapeHtml(query)}". Try another search or filter.</p>
          </div>`;
      } else {
        // If filter is 'all' and no query, group by category for luxury presentation
        if (activeFilter === 'all' && !query) {
          srvGrid.innerHTML = renderGroupedServices(filteredServices);
        } else {
          srvGrid.innerHTML = filteredServices.map(srv => renderTreatmentCard(srv)).join('');
        }
      }
    }
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Render single Luxury Bridal Package Card
 */
function renderPackageCard(pkg) {
  const original = parseFloat(pkg.original_total) || 0;
  const price = parseFloat(pkg.package_price || pkg.price) || 0;
  const discountVal = original > price ? original - price : 0;
  const duration = pkg.duration_minutes || 300;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationText = hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''} Comprehensive` : `${duration} mins`;

  // WhatsApp prefilled message
  const waMsg = encodeURIComponent(`Hello Salon Vellora, I would like to inquire about booking the "${pkg.name}" (LKR ${price.toLocaleString('en-US')}). Please let me know available dates!`);
  const waUrl = `https://wa.me/94740844739?text=${waMsg}`;

  // Inclusions HTML
  const servicesList = (pkg.services || []).map(s => `
    <li class="inclusion-item">
      <span class="check-icon-circle">
        <i data-lucide="check" style="width:12px;height:12px;"></i>
      </span>
      <div>
        <strong style="color:#1f2937;">${escapeHtml(s.name)}</strong>
        ${s.description ? `<div style="font-size:0.76rem; color:#6b7280;">${escapeHtml(s.description)}</div>` : ''}
      </div>
    </li>
  `).join('');

  return `
    <div class="package-card">
      <div class="package-top-banner">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="package-badge">
            <i data-lucide="sparkles" style="width:12px;height:12px;"></i> Signature Bridal
          </span>
          <span class="duration-chip">
            <i data-lucide="clock" style="width:12px;height:12px;color:var(--primary);"></i> ${durationText}
          </span>
        </div>
        <h3 class="package-name">${escapeHtml(pkg.name)}</h3>
        <p class="package-desc">${escapeHtml(pkg.description || 'Exclusive bridal makeover and complete beauty package tailored for your wedding day.')}</p>
      </div>

      <div class="package-body">
        <div class="inclusions-title">
          <i data-lucide="award" style="width:13px;height:13px;"></i> Curated Package Inclusions:
        </div>
        <ul class="inclusions-list">
          ${servicesList || '<li style="font-size:0.82rem; color:var(--text-muted);">Customized bridal services combination.</li>'}
        </ul>
      </div>

      <div class="package-footer">
        <div class="price-strip">
          <div>
            ${original > price ? `
              <div class="original-price-wrap">
                Total Value: <span class="strike-price">${formatCatalogCurrency(original)}</span>
              </div>
              <div class="savings-pill">
                Save ${formatCatalogCurrency(discountVal)}
              </div>
            ` : `
              <div class="original-price-wrap" style="color:var(--text-muted);">Package Investment</div>
            `}
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Special Price</div>
            <div class="final-package-price">${formatCatalogCurrency(price)}</div>
          </div>
        </div>

        <div class="package-actions">
          <a href="${waUrl}" target="_blank" class="btn-whatsapp">
            <i data-lucide="message-circle" style="width:15px;height:15px;"></i> WhatsApp
          </a>
          <button type="button" class="btn-details" onclick="openInquiryModal('package', ${pkg.id})">
            <i data-lucide="calendar" style="width:15px;height:15px;color:var(--primary);"></i> Inquire / Book
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render single Treatment Card
 */
function renderTreatmentCard(srv) {
  const regularPrice = parseFloat(srv.price) || 0;
  const discountAmount = parseFloat(srv.discount) || 0;
  const finalPrice = discountAmount > 0 ? Math.max(0, regularPrice - discountAmount) : regularPrice;
  const duration = srv.duration_minutes || 45;

  return `
    <div class="treatment-card">
      <div>
        <div class="treatment-meta">
          <span class="treatment-code">${escapeHtml(srv.code || 'SV-SRV')}</span>
          <span class="treatment-duration">
            <i data-lucide="clock" style="width:12px;height:12px;"></i> ${duration} mins
          </span>
        </div>

        <h4 class="treatment-name">${escapeHtml(srv.name)}</h4>
        <div class="treatment-category-badge">${escapeHtml(srv.category_name || 'Salon Treatment')}</div>
        <p class="treatment-desc">${escapeHtml(srv.description || 'Authentic salon treatment using certified luxury products and professional styling techniques.')}</p>
      </div>

      <div class="treatment-footer">
        <div>
          <div class="treatment-price-label">Price</div>
          <div style="display:flex; align-items:baseline; gap:4px;">
            <span class="treatment-price">${formatCatalogCurrency(finalPrice)}</span>
            ${discountAmount > 0 ? `
              <span style="font-size:0.75rem; text-decoration:line-through; color:#9ca3af;">${formatCatalogCurrency(regularPrice)}</span>
              <span class="treatment-discount-pill">Save LKR ${discountAmount.toLocaleString()}</span>
            ` : ''}
          </div>
        </div>

        <button type="button" class="btn-book-treatment" onclick="openInquiryModal('service', ${srv.id})">
          <i data-lucide="calendar-plus" style="width:13px;height:13px;"></i> Book
        </button>
      </div>
    </div>
  `;
}

/**
 * Group services by category for structured luxury presentation
 */
function renderGroupedServices(services) {
  // Group by category_name
  const groups = {};
  services.forEach(srv => {
    const cat = srv.category_name || 'Other Treatments';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(srv);
  });

  let html = '';
  Object.keys(groups).forEach(catName => {
    const list = groups[catName];
    const catSlug = list[0]?.category_slug || '';
    const iconName = CATEGORY_ICONS[catSlug] || 'sparkles';

    html += `
      <div style="grid-column: 1/-1;" class="cat-group-header">
        <div class="cat-group-title">
          <i data-lucide="${iconName}" style="width:18px;height:18px;color:var(--primary);"></i>
          ${escapeHtml(catName)}
        </div>
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600; background:#f9fafb; padding:0.25rem 0.65rem; border-radius:var(--radius-pill); border:1px solid var(--border);">
          ${list.length} Service${list.length === 1 ? '' : 's'}
        </span>
      </div>
    `;

    list.forEach(srv => {
      html += renderTreatmentCard(srv);
    });
  });

  return html;
}

/**
 * Open Quick Booking / Inquiry Modal
 */
function openInquiryModal(type, id) {
  const modal = document.getElementById('inquiry-modal');
  if (!modal) return;

  let item = null;
  if (type === 'package') {
    item = allPackages.find(p => p.id === id);
    if (item) {
      item._isPackage = true;
      item._displayPrice = parseFloat(item.package_price || item.price) || 0;
    }
  } else {
    item = allServices.find(s => s.id === id);
    if (item) {
      item._isPackage = false;
      const regular = parseFloat(item.price) || 0;
      const disc = parseFloat(item.discount) || 0;
      item._displayPrice = disc > 0 ? (regular - disc) : regular;
    }
  }

  if (!item) return;
  currentInquiryItem = item;

  // Populate modal
  document.getElementById('modal-item-name').textContent = item.name;
  document.getElementById('modal-item-badge').textContent = item._isPackage ? 'Bridal Package' : (item.category_name || 'Salon Treatment');
  document.getElementById('modal-item-meta').textContent = `Duration: ${item.duration_minutes || 45} mins`;
  document.getElementById('modal-item-price').textContent = formatCatalogCurrency(item._displayPrice);
  document.getElementById('modal-item-desc').textContent = item.description || 'Exclusive luxury beauty treatment at Salon Vellora.';

  const inclBox = document.getElementById('modal-item-inclusions');
  if (item._isPackage && item.services && item.services.length) {
    inclBox.style.display = 'block';
    inclBox.innerHTML = `
      <div style="font-size:0.75rem; font-weight:700; color:var(--primary-dark); margin-bottom:4px;">Includes:</div>
      <div style="font-size:0.78rem; color:#4b5563;">
        ${item.services.map(s => `• ${escapeHtml(s.name)}`).join('<br>')}
      </div>
    `;
  } else {
    inclBox.style.display = 'none';
    inclBox.innerHTML = '';
  }

  modal.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeInquiryModal() {
  const modal = document.getElementById('inquiry-modal');
  if (modal) modal.classList.remove('active');
  currentInquiryItem = null;
}

/**
 * Submit Inquiry to WhatsApp
 */
function submitInquiryWhatsApp() {
  if (!currentInquiryItem) return;

  const nameInput = document.getElementById('inquiry-client-name');
  const dateInput = document.getElementById('inquiry-client-date');
  const clientName = nameInput ? nameInput.value.trim() : '';
  const prefDate = dateInput ? dateInput.value : '';

  let message = `Hello Salon Vellora,`;
  if (clientName) {
    message += ` my name is ${clientName}.`;
  }
  message += ` I would like to inquire about booking: "${currentInquiryItem.name}" (${formatCatalogCurrency(currentInquiryItem._displayPrice)}).`;

  if (prefDate) {
    message += ` Preferred Date: ${prefDate}.`;
  }
  message += ` Could you please confirm available time slots? Thank you!`;

  const url = `https://wa.me/94740844739?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  closeInquiryModal();
}

/**
 * Currency Formatter
 */
function formatCatalogCurrency(val) {
  const num = parseFloat(val) || 0;
  return 'LKR ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
