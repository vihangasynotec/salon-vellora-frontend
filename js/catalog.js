/**
 * Salon Vellora — Luxury Editorial Catalog & Interactive Details Modal Engine
 * Handles live categories, package and service cards with luxury images, and interactive details popup
 */

let allCategories = [];
let allPackages = [];
let allServices = [];
let allRentals = [];
let activeFilter = 'all';
let searchQuery = '';
let currentModalItem = null;

// Curated Editorial Image Mapping for Salon Vellora Services & Bridal Packages
const ITEM_IMAGE_MAP = {
  // Bridal Packages
  'pkg_1': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop', // Royal Kandyan Bride
  'pkg_2': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop', // Western Bridal Glow

  // Specific Service Codes
  'SV-BR-01': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop', // Kandyan Bridal Dressing
  'SV-BR-02': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop', // Western Bridal
  'SV-BR-03': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&auto=format&fit=crop', // Bridal Retouch
  'SV-HC-01': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format&fit=crop', // Haircut & Luxury Blow Dry
  'SV-HC-02': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format&fit=crop', // Hair Color
  'SV-HC-03': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format&fit=crop', // Balayage & Highlights
  'SV-HT-01': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80&auto=format&fit=crop', // Brazilian Keratin
  'SV-HT-02': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80&auto=format&fit=crop', // Permanent Smoothening
  'SV-FC-01': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&auto=format&fit=crop', // 24K Gold Facial
  'SV-FC-02': 'https://images.unsplash.com/photo-1512290900672-1f02e086780c?w=800&q=80&auto=format&fit=crop', // Hydra Radiance Facial
  'SV-NL-01': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&auto=format&fit=crop', // Gel Nail Art
  'SV-NL-02': 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&q=80&auto=format&fit=crop', // Manicure & Pedicure Spa
};

// Fallback Luxury Bridal & Item Rentals
const SAMPLE_CATALOG_RENTALS = [
  {
    id: 1,
    name: 'Royal Kanchipuram Pure Silk Bridal Saree (Crimson & Gold)',
    code: 'RNT-SAR-01',
    category: 'Bridal Saree',
    rental_price_per_day: 15000,
    security_deposit: 25000,
    available_qty: 3,
    description: 'Pure Kanchipuram zari silk bridal saree with heavy gold brocade pallu. Cleaned and steam pressed in bridal wardrobe.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Traditional Kandyan Mul Anduma 7-Necklace Gold-Plated Set',
    code: 'RNT-ACC-01',
    category: 'Jewellery Set',
    rental_price_per_day: 12000,
    security_deposit: 30000,
    available_qty: 2,
    description: 'Authentic 7-strand bridal necklace set (Peti Malaya, Agasti Malaya, Kadu Malaya) with earrings and armlets for traditional Kandyan brides.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Austrian Crystal Royal Bridal Tiara & Crown',
    code: 'RNT-ACC-02',
    category: 'Headpiece',
    rental_price_per_day: 4500,
    security_deposit: 10000,
    available_qty: 4,
    description: 'Handcrafted Austrian crystal tiara with diamond-cut sparkles, tailored for Western bridal hairstyles.',
    image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=800&q=80&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'Cathedral French Lace Bridal Veil (3.5 Meters)',
    code: 'RNT-ACC-03',
    category: 'Veil',
    rental_price_per_day: 5000,
    security_deposit: 12000,
    available_qty: 3,
    description: 'Extra-long 3.5m delicate French lace cathedral veil with soft illusion tulle and bridal comb.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Kandyan Bridal Nalalpatiya (Forehead Ornament)',
    code: 'RNT-ACC-04',
    category: 'Jewellery Set',
    rental_price_per_day: 6000,
    security_deposit: 15000,
    available_qty: 2,
    description: 'Traditional gold-plated Nalalpatiya with red stone inlays and temple filigree work.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80&auto=format&fit=crop'
  },
  {
    id: 6,
    name: 'Designer Champagne Reception Evening Gown',
    code: 'RNT-GWN-01',
    category: 'Evening Gown',
    rental_price_per_day: 18000,
    security_deposit: 25000,
    available_qty: 2,
    description: 'Exquisite floor-length champagne sequin reception gown with corset back, ideal for bridal homecomings.',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80&auto=format&fit=crop'
  }
];

// Fallback Images by Category
const CATEGORY_FALLBACK_IMAGES = {
  'bridal-dressing': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop',
  'hair-care': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format&fit=crop',
  'hair-treatments': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80&auto=format&fit=crop',
  'facial-skincare': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&auto=format&fit=crop',
  'nails-spa': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&auto=format&fit=crop',
  'makeup-beauty': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&auto=format&fit=crop',
  'rentals': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80&auto=format&fit=crop',
};

// Category Icon Mapping
const CATEGORY_ICONS = {
  'all': 'sparkles',
  'packages': 'crown',
  'rentals': 'gem',
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

  // Modal event listeners
  const modalOverlay = document.getElementById('detail-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeDetailModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });

  // Set default date picker value to tomorrow
  const dateInput = document.getElementById('detail-client-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }
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
      allRentals = (data.rentals && data.rentals.length) ? data.rentals : SAMPLE_CATALOG_RENTALS;
      
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
    console.warn('Backend offline, using sample luxury catalog & rentals:', err);
    allRentals = SAMPLE_CATALOG_RENTALS;
    renderCategoryPills();
    renderCatalog();
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
    <button class="category-pill ${activeFilter === 'rentals' ? 'active' : ''}" onclick="filterCatalog('rentals', this)">
      <i data-lucide="gem" style="width:14px;height:14px;color:#d946ef;"></i> 24h Bridal Rentals
    </button>
  `;

  allCategories.forEach(cat => {
    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const isActive = activeFilter === slug;
    const iconName = CATEGORY_ICONS[slug] || 'sparkle';

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

  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  }

  renderCatalog();

  if (filterKey === 'packages') {
    const pkgSec = document.getElementById('packages-section');
    if (pkgSec) pkgSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (filterKey === 'rentals') {
    const rntSec = document.getElementById('rentals-section');
    if (rntSec) rntSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          pkgGrid.innerHTML = filteredPackages.map(pkg => renderPackageCardWithImage(pkg)).join('');
        }
      }
    }
  }

  // Render Services Section
  if (srvSection && srvGrid) {
    if (activeFilter === 'packages' || activeFilter === 'rentals') {
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
        if (activeFilter === 'all' && !query) {
          srvGrid.innerHTML = renderGroupedServicesWithImage(filteredServices);
        } else {
          srvGrid.innerHTML = filteredServices.map(srv => renderTreatmentCardWithImage(srv)).join('');
        }
      }
    }
  }

  // 3. Filter & Render 24h Bridal Rentals Section
  const rntSection = document.getElementById('rentals-section');
  const rntGrid = document.getElementById('rentals-grid');
  const rntCountLabel = document.getElementById('rentals-count-label');

  let filteredRentals = allRentals.filter(rnt => {
    if (activeFilter !== 'all' && activeFilter !== 'rentals') return false;
    if (!query) return true;
    const nameMatch = (rnt.name || '').toLowerCase().includes(query);
    const catMatch = (rnt.category || '').toLowerCase().includes(query);
    const codeMatch = (rnt.code || '').toLowerCase().includes(query);
    const descMatch = (rnt.description || '').toLowerCase().includes(query);
    return nameMatch || catMatch || codeMatch || descMatch;
  });

  if (rntSection && rntGrid) {
    if (activeFilter !== 'all' && activeFilter !== 'rentals') {
      rntSection.style.display = 'none';
    } else {
      rntSection.style.display = 'block';
      if (rntCountLabel) {
        rntCountLabel.textContent = `Showing ${filteredRentals.length} Luxury Rental Items (Standard 24h Duration)`;
      }

      if (filteredRentals.length === 0) {
        rntGrid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:2.5rem; background:#ffffff; border-radius:16px; border:1px solid var(--border); color:var(--text-muted);">
            <i data-lucide="gem" style="width:32px;height:32px;margin-bottom:8px;color:var(--text-light);"></i>
            <p style="margin:0;">No bridal rental items matching "${escapeHtml(query)}".</p>
          </div>`;
      } else {
        rntGrid.innerHTML = filteredRentals.map(rnt => renderRentalCardWithImage(rnt)).join('');
      }
    }
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Render luxury rental item card for public catalog
 */
function renderRentalCardWithImage(rnt) {
  const imgUrl = rnt.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80&auto=format&fit=crop';
  const price = parseFloat(rnt.rental_price_per_day) || 0;
  const deposit = parseFloat(rnt.security_deposit) || 0;

  return `
    <div class="luxury-catalog-card treatment-card" onclick="openCardDetailModal('rental', ${rnt.id})">
      <div class="card-media-wrapper treatment-card-media">
        <img src="${imgUrl}" alt="${escapeHtml(rnt.name)}" class="card-img" loading="lazy">
        <div class="card-media-scrim"></div>
        <div class="card-floating-tags">
          <span class="tag-category-pill" style="background:#fdf2f8; color:#be185d;">
            <i data-lucide="gem" style="width:11px;height:11px;"></i> ${escapeHtml(rnt.category || 'Rental')}
          </span>
          <span class="tag-duration-chip" style="background:rgba(217, 70, 239, 0.88);">
            <i data-lucide="clock" style="width:11px;height:11px;"></i> 24h Period
          </span>
        </div>
        <span class="card-code-float">${escapeHtml(rnt.code || 'RNT')}</span>
        <span class="card-tap-hint">Rent details <i data-lucide="chevron-right" style="width:13px;height:13px;"></i></span>
      </div>

      <div class="card-body-content">
        <h3 class="card-item-title">${escapeHtml(rnt.name)}</h3>
        <p class="card-item-desc">${escapeHtml(rnt.description || 'Pristine luxury bridal wardrobe rental with 24-hour return policy & security deposit clearance.')}</p>
      </div>

      <div class="card-bottom-strip">
        <div class="price-box-wrap">
          <div class="price-sub-label">Rental Rate / 24h</div>
          <div class="final-bold-price">${formatCatalogCurrency(price)}</div>
          <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600; margin-top:2px;">
            Deposit: ${formatCatalogCurrency(deposit)}
          </div>
        </div>

        <button type="button" class="btn-view-card-detail" onclick="event.stopPropagation(); openCardDetailModal('rental', ${rnt.id})">
          <span>Rent</span>
          <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Get curated image URL for a package or service
 */
function getItemImage(item, type) {
  if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
    return item.image;
  }
  if (type === 'package') {
    const key = `pkg_${item.id}`;
    if (ITEM_IMAGE_MAP[key]) return ITEM_IMAGE_MAP[key];
    return 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop';
  }
  if (item.code && ITEM_IMAGE_MAP[item.code]) {
    return ITEM_IMAGE_MAP[item.code];
  }
  if (item.category_slug && CATEGORY_FALLBACK_IMAGES[item.category_slug]) {
    return CATEGORY_FALLBACK_IMAGES[item.category_slug];
  }
  return '../assets/women.png';
}

/**
 * Format duration text
 */
function formatDuration(minutes) {
  const m = parseInt(minutes) || 45;
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  if (hours > 0) {
    return rem > 0 ? `${hours}h ${rem}m` : `${hours} Hours`;
  }
  return `${m} mins`;
}

/**
 * Render Next-Level Luxury Bridal Package Card
 */
function renderPackageCardWithImage(pkg) {
  const original = parseFloat(pkg.original_total) || 0;
  const price = parseFloat(pkg.package_price || pkg.price) || 0;
  const discountVal = original > price ? original - price : 0;
  const imgUrl = getItemImage(pkg, 'package');
  const durationText = formatDuration(pkg.duration_minutes || 360);

  // Inclusions preview pills (first 3)
  const services = pkg.services || [];
  const previewPills = services.slice(0, 3).map(s => `
    <span class="preview-service-tag">
      <i data-lucide="check" style="width:10px;height:10px;color:var(--primary);vertical-align:middle;"></i> ${escapeHtml(s.name)}
    </span>
  `).join('');
  const extraCount = services.length > 3 ? `<span class="preview-service-tag">+${services.length - 3} more</span>` : '';

  return `
    <div class="luxury-catalog-card" onclick="openCardDetailModal('package', ${pkg.id})">
      <!-- Media Header with Floating Badges -->
      <div class="card-media-wrap package-card-media">
        <img src="${imgUrl}" alt="${escapeHtml(pkg.name)}" class="card-img" onerror="this.src='../assets/women.png'" loading="lazy">
        <div class="card-media-scrim"></div>
        <div class="card-floating-tags">
          <span class="tag-package-pill">
            <i data-lucide="crown" style="width:12px;height:12px;"></i> Signature Bridal
          </span>
          <span class="tag-duration-chip">
            <i data-lucide="clock" style="width:11px;height:11px;"></i> ${durationText}
          </span>
        </div>
        <span class="card-code-float">SV-PKG-${pkg.id}</span>
        <span class="card-tap-hint">Tap for details <i data-lucide="chevron-right" style="width:13px;height:13px;"></i></span>
      </div>

      <!-- Card Body -->
      <div class="card-body-content">
        <h3 class="card-item-title package-card-title">${escapeHtml(pkg.name)}</h3>
        <p class="card-item-desc">${escapeHtml(pkg.description || 'Exclusive bridal makeover, jewelry setting & pre-bridal care curated for your special day.')}</p>
        
        <div class="package-inclusions-preview">
          <div class="preview-header">
            <i data-lucide="award" style="width:12px;height:12px;"></i> Curated Inclusions:
          </div>
          <div class="preview-pills-row">
            ${previewPills} ${extraCount}
          </div>
        </div>
      </div>

      <!-- Price & Action Strip -->
      <div class="card-bottom-strip">
        <div class="price-box-wrap">
          <div class="price-sub-label">
            Package Investment ${original > price ? `<span class="original-strike">${formatCatalogCurrency(original)}</span>` : ''}
          </div>
          <div class="final-bold-price">${formatCatalogCurrency(price)}</div>
          ${discountVal > 0 ? `<div class="savings-chip-green">Save ${formatCatalogCurrency(discountVal)}</div>` : ''}
        </div>

        <button type="button" class="btn-view-card-detail" onclick="event.stopPropagation(); openCardDetailModal('package', ${pkg.id})">
          <span>Details</span>
          <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Next-Level Luxury Salon Treatment Card
 */
function renderTreatmentCardWithImage(srv) {
  const regularPrice = parseFloat(srv.price) || 0;
  const discountAmount = parseFloat(srv.discount) || 0;
  const finalPrice = discountAmount > 0 ? Math.max(0, regularPrice - discountAmount) : regularPrice;
  const imgUrl = getItemImage(srv, 'service');
  const durationText = formatDuration(srv.duration_minutes || 45);

  return `
    <div class="luxury-catalog-card" onclick="openCardDetailModal('service', ${srv.id})">
      <!-- Media Header with Floating Badges -->
      <div class="card-media-wrap">
        <img src="${imgUrl}" alt="${escapeHtml(srv.name)}" class="card-img" onerror="this.src='../assets/women.png'" loading="lazy">
        <div class="card-media-scrim"></div>
        <div class="card-floating-tags">
          <span class="tag-category-pill">
            <i data-lucide="sparkle" style="width:11px;height:11px;color:var(--primary);"></i> ${escapeHtml(srv.category_name || 'Treatment')}
          </span>
          <span class="tag-duration-chip">
            <i data-lucide="clock" style="width:11px;height:11px;"></i> ${durationText}
          </span>
        </div>
        <span class="card-code-float">${escapeHtml(srv.code || 'SV-SRV')}</span>
        <span class="card-tap-hint">Tap for details <i data-lucide="chevron-right" style="width:13px;height:13px;"></i></span>
      </div>

      <!-- Card Body -->
      <div class="card-body-content">
        <h3 class="card-item-title">${escapeHtml(srv.name)}</h3>
        <p class="card-item-desc">${escapeHtml(srv.description || 'Authentic salon treatment using certified luxury products and professional styling techniques.')}</p>
      </div>

      <!-- Price & Action Strip -->
      <div class="card-bottom-strip">
        <div class="price-box-wrap">
          <div class="price-sub-label">
            Service Price ${discountAmount > 0 ? `<span class="original-strike">${formatCatalogCurrency(regularPrice)}</span>` : ''}
          </div>
          <div class="final-bold-price">${formatCatalogCurrency(finalPrice)}</div>
          ${discountAmount > 0 ? `<div class="savings-chip-green">Save LKR ${discountAmount.toLocaleString()}</div>` : ''}
        </div>

        <button type="button" class="btn-view-card-detail" onclick="event.stopPropagation(); openCardDetailModal('service', ${srv.id})">
          <span>Details</span>
          <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Group services by category for structured luxury presentation
 */
function renderGroupedServicesWithImage(services) {
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
        <h3 class="cat-group-title">
          <i data-lucide="${iconName}" style="width:20px;height:20px;color:var(--primary);"></i>
          ${escapeHtml(catName)}
        </h3>
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600; background:#f9fafb; padding:0.25rem 0.65rem; border-radius:var(--radius-pill); border:1px solid var(--border);">
          ${list.length} Service${list.length === 1 ? '' : 's'}
        </span>
      </div>
    `;

    list.forEach(srv => {
      html += renderTreatmentCardWithImage(srv);
    });
  });

  return html;
}

/**
 * ==========================================================================
 * OPEN NEXT-LEVEL CARD DETAILS POPUP (MODAL)
 * Shows full image, description, inclusions, pricing & direct WhatsApp booking
 * ==========================================================================
 */
function openCardDetailModal(type, id) {
  const modal = document.getElementById('detail-modal');
  if (!modal) return;

  let item = null;
  if (type === 'package') {
    item = allPackages.find(p => p.id === id);
    if (item) {
      item._isPackage = true;
      item._isRental = false;
      const orig = parseFloat(item.original_total) || 0;
      const pkgPrice = parseFloat(item.package_price || item.price) || 0;
      item._displayPrice = pkgPrice;
      item._originalPrice = orig;
      item._discount = orig > pkgPrice ? orig - pkgPrice : 0;
      item._durationText = formatDuration(item.duration_minutes || 360);
      item._code = `SV-PKG-0${item.id}`;
      item._categoryName = 'Signature Bridal Atelier';
      item._imageUrl = getItemImage(item, 'package');
    }
  } else if (type === 'rental') {
    item = allRentals.find(r => r.id === id);
    if (item) {
      item._isPackage = false;
      item._isRental = true;
      const price = parseFloat(item.rental_price_per_day) || 0;
      const deposit = parseFloat(item.security_deposit) || 0;
      item._displayPrice = price;
      item._deposit = deposit;
      item._originalPrice = 0;
      item._discount = 0;
      item._durationText = 'Standard 24-Hour Period';
      item._code = item.code || 'RNT-ITEM';
      item._categoryName = `Bridal & Item Rental (${item.category || 'Wardrobe'})`;
      item._imageUrl = item.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80&auto=format&fit=crop';
    }
  } else {
    item = allServices.find(s => s.id === id);
    if (item) {
      item._isPackage = false;
      item._isRental = false;
      const regular = parseFloat(item.price) || 0;
      const disc = parseFloat(item.discount) || 0;
      item._displayPrice = disc > 0 ? (regular - disc) : regular;
      item._originalPrice = disc > 0 ? regular : 0;
      item._discount = disc;
      item._durationText = formatDuration(item.duration_minutes || 45);
      item._code = item.code || 'SV-SRV';
      item._categoryName = item.category_name || 'Salon Treatment';
      item._imageUrl = getItemImage(item, 'service');
    }
  }

  if (!item) return;
  currentModalItem = item;

  // Populate Hero Image & Captions
  const coverImg = document.getElementById('modal-cover-img');
  if (coverImg) coverImg.src = item._imageUrl;

  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-cat-tag').textContent = item._categoryName;
  document.getElementById('modal-code-tag').textContent = item._code;
  document.getElementById('modal-duration-tag').innerHTML = `<i data-lucide="clock" style="width:12px;height:12px;"></i> ${item._durationText}`;

  // Populate Specs Strip
  document.getElementById('modal-price-val').textContent = formatCatalogCurrency(item._displayPrice) + (item._isRental ? ' / 24h' : '');
  document.getElementById('modal-duration-val').textContent = item._durationText;

  const savingsPill = document.getElementById('modal-savings-pill');
  if (item._isRental) {
    savingsPill.style.display = 'inline-block';
    savingsPill.style.background = '#fdf2f8';
    savingsPill.style.color = '#be185d';
    savingsPill.textContent = `Security Deposit: ${formatCatalogCurrency(item._deposit)}`;
  } else if (item._discount > 0) {
    savingsPill.style.display = 'inline-block';
    savingsPill.style.background = '#ecfdf5';
    savingsPill.style.color = '#059669';
    savingsPill.textContent = `Save ${formatCatalogCurrency(item._discount)}`;
  } else {
    savingsPill.style.display = 'none';
  }

  // Populate Detailed Description
  let desc = item.description || 'Exclusive luxury beauty treatment at Salon Vellora. Executed with premium authentic cosmetics, certified senior stylists, and high standards of cleanliness.';
  if (item._isRental) {
    desc += ` Standard 24-hour rental duration applies. Security deposit of ${formatCatalogCurrency(item._deposit)} is required at pickup and fully refunded upon return inspection.`;
  }
  document.getElementById('modal-long-desc').textContent = desc;

  // Inclusions Section (For Packages) vs Highlights (For Services/Rentals)
  const inclusionsSec = document.getElementById('modal-inclusions-section');
  const inclusionsList = document.getElementById('modal-inclusions-list');
  const countSpan = document.getElementById('modal-inclusions-count');
  const highlightsSec = document.getElementById('modal-highlights-section');

  if (item._isPackage && item.services && item.services.length) {
    inclusionsSec.style.display = 'block';
    highlightsSec.style.display = 'none';
    countSpan.textContent = item.services.length;

    inclusionsList.innerHTML = item.services.map(s => `
      <li class="modal-inclusion-item">
        <div class="inclusion-check-round">
          <i data-lucide="check" style="width:14px;height:14px;"></i>
        </div>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <strong style="color:#111827; font-size:0.92rem;">${escapeHtml(s.name)}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">
              ${s.duration_minutes ? s.duration_minutes + ' mins' : ''}
            </span>
          </div>
          ${s.description ? `<p style="margin:4px 0 0; font-size:0.8rem; color:#6b7280; line-height:1.4;">${escapeHtml(s.description)}</p>` : ''}
        </div>
      </li>
    `).join('');
  } else {
    inclusionsSec.style.display = 'none';
    highlightsSec.style.display = 'block';
  }

  // Open Modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
  currentModalItem = null;
}

/**
 * Submit Booking from Detail Modal to WhatsApp
 */
function submitDetailWhatsApp() {
  if (!currentModalItem) return;

  const nameInput = document.getElementById('detail-client-name');
  const dateInput = document.getElementById('detail-client-date');
  const timeInput = document.getElementById('detail-client-time');

  const clientName = nameInput ? nameInput.value.trim() : '';
  const prefDate = dateInput ? dateInput.value : '';
  const prefTime = timeInput ? timeInput.value : '';

  let message = `Hello Salon Vellora,`;
  if (clientName) {
    message += ` my name is ${clientName}.`;
  }

  if (currentModalItem._isRental) {
    message += ` I would like to inquire about reserving a 24-hour rental item:`;
    message += `\n✨ *${currentModalItem.name}* (${currentModalItem._code})`;
    message += `\n💰 24h Rental Rate: ${formatCatalogCurrency(currentModalItem._displayPrice)}`;
    message += `\n🛡️ Refundable Deposit: ${formatCatalogCurrency(currentModalItem._deposit)}`;
    if (prefDate) {
      message += `\n📅 Event / Pickup Date: ${prefDate}`;
    }
    if (prefTime) {
      message += `\n⏰ Preferred Pickup Time: ${prefTime}`;
    }
    message += `\n\nCould you please confirm availability for my date? Thank you!`;
  } else {
    message += ` I would like to book the "${currentModalItem.name}" (${formatCatalogCurrency(currentModalItem._displayPrice)}).`;
    if (prefDate) {
      message += `\n📅 Preferred Date: ${prefDate}`;
    }
    if (prefTime) {
      message += `\n⏰ Time Slot: ${prefTime}`;
    }
    message += `\n\nCould you please confirm appointment availability? Thank you!`;
  }

  const url = `https://wa.me/94740844739?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  closeDetailModal();
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
