/**
 * SALON VELLORA — 24-HOUR BRIDAL & ATTIRE RENTALS ENGINE
 * Live 24h countdown tracking, catalog management, damage inspection,
 * deposit refunds & 1-click WhatsApp agreements and reminders.
 */

let allRentalOrders = [];
let allRentalCatalog = [];
let allCustomersList = [];
let activeView = 'orders'; // 'orders' or 'catalog'
let currentReturnOrder = null;

// Built-in initial sample catalog in case running offline / before backend migration
const DEFAULT_RENTAL_CATALOG = [
  {
    id: 1,
    name: "Kanchipuram Silk Bridal Saree (Royal Maroon & Gold Zari)",
    code: "RNT-SAR-001",
    category: "Sarees & Lehengas",
    description: "Pure handwoven Kanchipuram silk saree with rich antique gold zari border. Includes matching pre-stitched bridal blouse (Size 34-38).",
    rental_price_per_24h: 7500,
    security_deposit: 10000,
    late_fee_per_day: 1500,
    total_quantity: 2,
    available_quantity: 1,
    condition: "Pristine",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80&auto=format&fit=crop",
    status: "available"
  },
  {
    id: 2,
    name: "Traditional Kandyan Mul Anduma Saree Set (Ivory & Gold)",
    code: "RNT-SAR-002",
    category: "Sarees & Lehengas",
    description: "Authentic Sri Lankan Kandyan bridal saree with exquisite hand embroidery, pearl beading, and custom frill work.",
    rental_price_per_24h: 8500,
    security_deposit: 12000,
    late_fee_per_day: 2000,
    total_quantity: 1,
    available_quantity: 1,
    condition: "Pristine",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop",
    status: "available"
  },
  {
    id: 3,
    name: "24K Gold Plated Heritage Bridal Jewellery Set (7 Pcs)",
    code: "RNT-JWL-001",
    category: "Jewellery Sets",
    description: "Grand bridal set: Choker necklace, long mala, matching jhumka earrings, maang tikka, haath phool, and nath.",
    rental_price_per_24h: 4500,
    security_deposit: 6000,
    late_fee_per_day: 1000,
    total_quantity: 3,
    available_quantity: 2,
    condition: "Excellent",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80&auto=format&fit=crop",
    status: "available"
  },
  {
    id: 4,
    name: "Royal Emerald Velvet Bridal Lehenga Set",
    code: "RNT-LHG-001",
    category: "Sarees & Lehengas",
    description: "Deep emerald green heavy velvet lehenga with zardozi and sequin embroidery, double net dupatta.",
    rental_price_per_24h: 9500,
    security_deposit: 15000,
    late_fee_per_day: 2000,
    total_quantity: 1,
    available_quantity: 0,
    condition: "Pristine",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&auto=format&fit=crop",
    status: "rented"
  },
  {
    id: 5,
    name: "Handcrafted Crystal Princess Bridal Tiara / Crown",
    code: "RNT-ACC-001",
    category: "Hair & Veils",
    description: "Swarovski-element crystal bridal crown with silver finish. Lightweight and secure for wedding day wear.",
    rental_price_per_24h: 2500,
    security_deposit: 4000,
    late_fee_per_day: 500,
    total_quantity: 4,
    available_quantity: 3,
    condition: "Excellent",
    image: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=800&q=80&auto=format&fit=crop",
    status: "available"
  },
  {
    id: 6,
    name: "Cathedral Bridal Lace Veil (3.5 Meters)",
    code: "RNT-ACC-002",
    category: "Hair & Veils",
    description: "Dramatic European illusion soft tulle veil with French scalloped chantilly lace border.",
    rental_price_per_24h: 3000,
    security_deposit: 5000,
    late_fee_per_day: 750,
    total_quantity: 2,
    available_quantity: 2,
    condition: "Pristine",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop",
    status: "available"
  },
  {
    id: 7,
    name: "Luxury Kundan & Pearl Choker Necklace with Jhumkas",
    code: "RNT-JWL-002",
    category: "Jewellery Sets",
    description: "Intricate Meenakari reverse with uncut glass Kundan stones and natural freshwater seed pearls.",
    rental_price_per_24h: 3500,
    security_deposit: 5000,
    late_fee_per_day: 800,
    total_quantity: 2,
    available_quantity: 2,
    condition: "Excellent",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80&auto=format&fit=crop",
    status: "available"
  },
  {
    id: 8,
    name: "Bridal Velvet Clutch & Crystal Brooch Set",
    code: "RNT-ACC-003",
    category: "Bridal Accessories",
    description: "Custom embroidered rose gold clutch bag with removable crystal chain and matching hair brooch.",
    rental_price_per_24h: 1800,
    security_deposit: 3000,
    late_fee_per_day: 400,
    total_quantity: 3,
    available_quantity: 2,
    condition: "Good",
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80&auto=format&fit=crop",
    status: "available"
  }
];

// Built-in initial sample orders
const now = new Date();
const in14Hours = new Date(now.getTime() + 14 * 3600 * 1000);
const overdue3Hours = new Date(now.getTime() - 3.5 * 3600 * 1000);
const yesterday = new Date(now.getTime() - 27.5 * 3600 * 1000);

const DEFAULT_RENTAL_ORDERS = [
  {
    id: 101,
    rental_number: "SV-RNT-2026-000001",
    customer_name: "Dilini Perera",
    customer_phone: "0771234567",
    customer_nic: "199458200123",
    rental_item_id: 1,
    item: DEFAULT_RENTAL_CATALOG[0],
    quantity: 1,
    rental_start_date: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
    duration_hours: 24,
    due_return_date: in14Hours.toISOString(),
    rental_fee: 7500,
    deposit_amount: 10000,
    total_collected: 17500,
    deposit_refunded: 0,
    late_fee_charged: 0,
    payment_method: "cash",
    status: "active",
    notes: "Wedding at Lighthouse Hotel Galle"
  },
  {
    id: 102,
    rental_number: "SV-RNT-2026-000002",
    customer_name: "Chathurika Silva",
    customer_phone: "0719876543",
    customer_nic: "199276100456",
    rental_item_id: 4,
    item: DEFAULT_RENTAL_CATALOG[3],
    quantity: 1,
    rental_start_date: yesterday.toISOString(),
    duration_hours: 24,
    due_return_date: overdue3Hours.toISOString(),
    rental_fee: 9500,
    deposit_amount: 15000,
    total_collected: 24500,
    deposit_refunded: 0,
    late_fee_charged: 0,
    payment_method: "card",
    status: "active",
    notes: "Homecoming reception dressing"
  },
  {
    id: 103,
    rental_number: "SV-RNT-2026-000003",
    customer_name: "Sanduni Fernando",
    customer_phone: "0765551234",
    customer_nic: "199684100789",
    rental_item_id: 3,
    item: DEFAULT_RENTAL_CATALOG[2],
    quantity: 1,
    rental_start_date: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(),
    duration_hours: 24,
    due_return_date: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
    rental_fee: 4500,
    deposit_amount: 6000,
    total_collected: 10500,
    deposit_refunded: 0,
    late_fee_charged: 0,
    payment_method: "cash",
    status: "active",
    notes: "Engagement photo shoot"
  }
];

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  common.initLayout("rentals", "Bridal & Dress Rentals", "24-Hour bridal saree, jewellery and accessories rental management & WhatsApp dispatch");

  // Load state from localStorage if exists
  const storedCatalog = localStorage.getItem("salon_rental_catalog");
  allRentalCatalog = storedCatalog ? JSON.parse(storedCatalog) : DEFAULT_RENTAL_CATALOG;

  const storedOrders = localStorage.getItem("salon_rental_orders");
  allRentalOrders = storedOrders ? JSON.parse(storedOrders) : DEFAULT_RENTAL_ORDERS;

  await loadRentalCatalog();
  await loadRentalOrders();
  await loadCustomers();
  updateRentalStats();

  // Auto-refresh countdown every 60 seconds
  setInterval(() => {
    if (activeView === 'orders') {
      renderRentalOrdersTable(allRentalOrders);
      updateRentalStats();
    }
  }, 60000);
});

function saveLocalState() {
  localStorage.setItem("salon_rental_catalog", JSON.stringify(allRentalCatalog));
  localStorage.setItem("salon_rental_orders", JSON.stringify(allRentalOrders));
}

async function loadRentalCatalog() {
  try {
    const res = await api.get("/rentals/catalog");
    if (res && res.success && res.data && res.data.length > 0) {
      allRentalCatalog = res.data;
      saveLocalState();
    }
  } catch (err) {
    console.warn("Using offline / local rental catalog cache:", err);
  }
  renderRentalCatalogGrid(allRentalCatalog);
  populateRentalItemsSelect();
}

async function loadRentalOrders() {
  const status = document.getElementById("order-status-filter")?.value || "active";
  try {
    const res = await api.get("/rentals/orders", { status });
    if (res && res.success && res.data) {
      allRentalOrders = res.data.data || res.data;
      saveLocalState();
    }
  } catch (err) {
    console.warn("Using offline / local rental orders cache:", err);
  }
  filterRentalOrders();
}

async function loadCustomers() {
  try {
    const res = await api.get("/customers");
    if (res && res.success && res.data) {
      allCustomersList = res.data.data || res.data;
      const select = document.getElementById("order-cust-select");
      if (select) {
        select.innerHTML = `<option value="">Or Pick Saved...</option>` +
          allCustomersList.map(c => `<option value="${c.id}" data-phone="${c.phone}" data-name="${c.name}">${c.name} (${c.phone})</option>`).join("");
      }
    }
  } catch (err) {
    console.warn("Could not load customers for rentals:", err);
  }
}

function onSelectExistingCustomer(custId) {
  if (!custId) return;
  const cust = allCustomersList.find(c => String(c.id) === String(custId));
  if (cust) {
    document.getElementById("order-cust-name").value = cust.name;
    document.getElementById("order-cust-phone").value = cust.phone;
  }
}

function updateRentalStats() {
  const nowTime = new Date().getTime();
  let activeCount = 0;
  let overdueCount = 0;
  let depositsHeld = 0;

  allRentalOrders.forEach(o => {
    if (o.status === 'active') {
      activeCount++;
      depositsHeld += parseFloat(o.deposit_amount || 0);
      const due = new Date(o.due_return_date).getTime();
      if (nowTime > due) {
        overdueCount++;
      }
    }
  });

  const totalCatalogQty = allRentalCatalog.reduce((sum, item) => sum + (parseInt(item.total_quantity) || 1), 0);
  const availCatalogQty = allRentalCatalog.reduce((sum, item) => sum + (parseInt(item.available_quantity) || 0), 0);

  document.getElementById("stat-active-rentals").innerText = activeCount;
  document.getElementById("stat-overdue-rentals").innerText = overdueCount;
  document.getElementById("stat-deposits-held").innerText = common.formatCurrency(depositsHeld);
  document.getElementById("stat-available-items").innerText = `${availCatalogQty} / ${totalCatalogQty}`;
  document.getElementById("active-tab-count").innerText = activeCount;

  const overduePill = document.getElementById("stat-overdue-pill");
  if (overduePill) {
    if (overdueCount > 0) {
      overduePill.style.display = "inline-flex";
      overduePill.innerHTML = `<i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> ${overdueCount} OVERDUE`;
    } else {
      overduePill.className = "badge-custom badge-success";
      overduePill.innerHTML = `<i data-lucide="check-circle" style="width:12px;height:12px;"></i> All On Time`;
    }
    if (window.lucide) lucide.createIcons();
  }
}

/**
 * VIEW SWITCHING
 */
function switchRentalView(view) {
  activeView = view;
  const btnOrders = document.getElementById("tab-btn-active-orders");
  const btnCatalog = document.getElementById("tab-btn-catalog");
  const viewOrders = document.getElementById("view-active-orders");
  const viewCatalog = document.getElementById("view-catalog");

  if (view === 'orders') {
    btnOrders.className = "btn-primary-custom";
    btnCatalog.className = "btn-secondary-custom";
    viewOrders.style.display = "block";
    viewCatalog.style.display = "none";
    filterRentalOrders();
  } else {
    btnOrders.className = "btn-secondary-custom";
    btnCatalog.className = "btn-primary-custom";
    viewOrders.style.display = "none";
    viewCatalog.style.display = "block";
    renderRentalCatalogGrid(allRentalCatalog);
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * 24H COUNTDOWN HELPER
 */
function formatTimeRemaining(dueDateStr) {
  const nowTime = new Date().getTime();
  const dueTime = new Date(dueDateStr).getTime();
  const diffMs = dueTime - nowTime;

  if (diffMs < 0) {
    const overdueHours = Math.floor(Math.abs(diffMs) / (3600 * 1000));
    const overdueMins = Math.floor((Math.abs(diffMs) % (3600 * 1000)) / (60 * 1000));
    return {
      isOverdue: true,
      text: `OVERDUE (${overdueHours}h ${overdueMins}m late)`,
      badgeClass: 'badge-overdue'
    };
  }

  const hours = Math.floor(diffMs / (3600 * 1000));
  const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

  if (hours <= 3) {
    return {
      isOverdue: false,
      text: `Due in ${hours}h ${mins}m (Soon!)`,
      badgeClass: 'badge-due-soon'
    };
  }

  return {
    isOverdue: false,
    text: `Due in ${hours}h ${mins}m`,
    badgeClass: 'badge-rental'
  };
}

/**
 * RENDER ACTIVE RENTALS TABLE
 */
function filterRentalOrders() {
  const query = (document.getElementById("order-search")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("order-status-filter")?.value || "active";
  const nowTime = new Date().getTime();

  let orders = [...allRentalOrders];

  if (statusFilter === 'active') {
    orders = orders.filter(o => o.status === 'active');
  } else if (statusFilter === 'overdue') {
    orders = orders.filter(o => o.status === 'active' && nowTime > new Date(o.due_return_date).getTime());
  } else if (statusFilter === 'returned') {
    orders = orders.filter(o => o.status === 'returned');
  }

  if (query) {
    orders = orders.filter(o =>
      (o.rental_number && o.rental_number.toLowerCase().includes(query)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
      (o.customer_phone && o.customer_phone.toLowerCase().includes(query)) ||
      (o.customer_nic && o.customer_nic.toLowerCase().includes(query)) ||
      (o.item && o.item.name.toLowerCase().includes(query))
    );
  }

  renderRentalOrdersTable(orders);
}

function renderRentalOrdersTable(orders) {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text-muted);">
      <i data-lucide="sparkles" style="width:36px;height:36px;margin-bottom:8px;color:var(--text-light);"></i>
      <p style="margin:0;font-weight:600;">No rental bookings found matching this filter.</p>
    </td></tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const itemName = o.item ? o.item.name : (o.item_name || "Rental Item");
    const itemImg = o.item?.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80";

    const startDate = new Date(o.rental_start_date || o.created_at);
    const startDay = startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const startTime = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const dueDate = new Date(o.due_return_date);
    const dueDay = dueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const dueTime = dueDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const countdown = formatTimeRemaining(o.due_return_date);

    let statusPill = "";
    if (o.status === 'returned') {
      statusPill = `<span class="badge-custom badge-success" style="white-space:nowrap;"><i data-lucide="check" style="width:12px;height:12px;"></i> Returned</span>`;
    } else {
      statusPill = `<span class="badge-custom ${countdown.badgeClass}" style="white-space:nowrap;"><i data-lucide="clock" style="width:12px;height:12px;"></i> ${countdown.text}</span>`;
    }

    return `
      <tr>
        <td style="white-space:nowrap;">
          <div style="font-weight:700; color:var(--primary); font-family:monospace; font-size:0.86rem; letter-spacing:0.3px;">${o.rental_number}</div>
          <div style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; color:#6b7280; margin-top:2px;">
            <span style="width:6px; height:6px; border-radius:50%; background:var(--primary); display:inline-block;"></span> 24h Agreement
          </div>
        </td>
        <td>
          <div style="font-weight:700; color:#111827; font-size:0.88rem; white-space:nowrap;">${o.customer_name}</div>
          <div style="font-size:0.76rem; color:#4b5563; display:flex; align-items:center; gap:4px; margin-top:2px; white-space:nowrap;">
            <i data-lucide="phone" style="width:12px; height:12px; color:#25D366;"></i> ${o.customer_phone}
          </div>
          ${o.customer_nic ? `<div style="font-size:0.7rem; color:#9ca3af; margin-top:1px; white-space:nowrap;">NIC: ${o.customer_nic}</div>` : ''}
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${itemImg}" alt="${itemName}" style="width:42px; height:42px; border-radius:8px; object-fit:cover; border:1px solid #fce7ec; flex-shrink:0; box-shadow:0 1px 3px rgba(0,0,0,0.06);" onerror="this.style.display='none'">
            <div style="min-width:0;">
              <div style="font-weight:700; font-size:0.85rem; line-height:1.25; color:#1f2937;" title="${itemName}">${itemName}</div>
              <span style="display:inline-block; font-size:0.72rem; color:var(--primary-dark); font-weight:700; background:#fdf2f5; border:1px solid #fce7ec; padding:1px 6px; border-radius:4px; margin-top:3px; white-space:nowrap;">Qty: ${o.quantity || 1}</span>
            </div>
          </div>
        </td>
        <td style="white-space:nowrap;">
          <div style="font-size:0.82rem; font-weight:700; color:#1f2937;">${startDay}</div>
          <div style="font-size:0.75rem; color:#6b7280; margin-top:2px; display:flex; align-items:center; gap:3px;">
            <i data-lucide="clock" style="width:11px; height:11px; color:#9ca3af;"></i> ${startTime}
          </div>
        </td>
        <td style="white-space:nowrap;">
          <div style="font-size:0.82rem; font-weight:800; color:#111827;">${dueDay}</div>
          <div style="font-size:0.75rem; color:#e11d48; font-weight:700; margin-top:2px; display:flex; align-items:center; gap:3px;">
            <i data-lucide="alert-circle" style="width:11px; height:11px; color:#e11d48;"></i> ${dueTime}
          </div>
          <span style="display:inline-block; font-size:0.65rem; color:#e11d48; font-weight:700; background:#fff1f2; border:1px solid #ffe4e6; padding:1px 5px; border-radius:3px; margin-top:3px; text-transform:uppercase;">24h Deadline</span>
        </td>
        <td style="white-space:nowrap;">
          ${statusPill}
        </td>
        <td style="font-weight:700; color:#374151; white-space:nowrap; font-size:0.88rem;">
          ${common.formatCurrency(o.rental_fee)}
        </td>
        <td style="font-weight:800; color:#059669; white-space:nowrap; font-size:0.9rem;">
          ${common.formatCurrency(o.deposit_amount)}
        </td>
        <td style="text-align:right; white-space:nowrap;">
          <div class="action-icon-dock">
            <!-- 1. WhatsApp 24h Agreement Receipt (Icon-Only) -->
            <button class="action-icon-btn action-icon-whatsapp" onclick="handleWhatsAppOrderReceipt(${o.id})" title="Share 24h Rental Agreement on WhatsApp" aria-label="Share Agreement on WhatsApp">
              <i data-lucide="message-circle"></i>
            </button>

            ${o.status === 'active' ? `
              <!-- 2. WhatsApp 24h Return Reminder (Icon-Only) -->
              <button class="action-icon-btn action-icon-remind" onclick="handleWhatsAppReminder(${o.id})" title="Send 24h Return Reminder on WhatsApp" aria-label="Send 24h Return Reminder">
                <i data-lucide="bell"></i>
              </button>

              <!-- 3. Return & Refund Inspection (Icon-Only) -->
              <button class="action-icon-btn action-icon-return" onclick="openReturnModal(${o.id})" title="Inspect Item & Process Return / Refund" aria-label="Process Item Return">
                <i data-lucide="rotate-ccw"></i>
              </button>
            ` : `
              <!-- 4. Return Clearance Certificate (Icon-Only) -->
              <button class="action-icon-btn action-icon-clearance" onclick="handleWhatsAppReturnClearance(${o.id})" title="Share Return Clearance Certificate on WhatsApp" aria-label="Share Return Clearance">
                <i data-lucide="file-check"></i>
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

/**
 * RENDER RENTAL CATALOG GRID
 */
let activeCatalogCategory = 'all';

function filterCatalogCategory(cat, btn) {
  activeCatalogCategory = cat;
  document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
  if (btn) btn.classList.add("active");
  filterRentalCatalog();
}

function filterRentalCatalog() {
  const query = (document.getElementById("catalog-search")?.value || "").toLowerCase().trim();
  let items = [...allRentalCatalog];

  if (activeCatalogCategory !== 'all') {
    items = items.filter(i => i.category === activeCatalogCategory);
  }

  if (query) {
    items = items.filter(i =>
      i.name.toLowerCase().includes(query) ||
      i.code.toLowerCase().includes(query) ||
      (i.category && i.category.toLowerCase().includes(query)) ||
      (i.description && i.description.toLowerCase().includes(query))
    );
  }

  renderRentalCatalogGrid(items);
}

function renderRentalCatalogGrid(items) {
  const grid = document.getElementById("rental-cards-grid");
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
      <i data-lucide="package-search" style="width:36px;height:36px;margin-bottom:8px;color:var(--text-light);"></i>
      <p style="margin:0;font-weight:600;">No rental items found.</p>
    </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = items.map(item => {
    const isAvail = item.available_quantity > 0;
    const availText = isAvail ? `${item.available_quantity} / ${item.total_quantity} Available` : 'Currently Rented Out';
    const availClass = isAvail ? 'badge-success' : 'badge-danger';
    const imgUrl = item.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80";

    return `
      <div class="card-custom" style="padding:0; overflow:hidden; display:flex; flex-direction:column; border-radius:16px; border:1px solid rgba(201, 93, 126, 0.18); transition:all 0.25s ease; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
        <div style="position:relative; height:180px; overflow:hidden; background:#f9fafb;">
          <img src="${imgUrl}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease;" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform='scale(1)'">
          <div style="position:absolute; top:10px; left:10px;">
            <span class="badge-custom badge-rental" style="box-shadow:0 2px 8px rgba(0,0,0,0.15);">
              <i data-lucide="gem" style="width:12px;height:12px;"></i> ${item.category}
            </span>
          </div>
          <div style="position:absolute; top:10px; right:10px;">
            <span class="badge-custom ${availClass}" style="box-shadow:0 2px 8px rgba(0,0,0,0.15);">
              ${availText}
            </span>
          </div>
        </div>

        <div style="padding:1.15rem; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <h4 style="margin:0; font-size:1rem; font-weight:800; color:#111827; font-family:'Playfair Display', serif; line-height:1.25;">${item.name}</h4>
              <span style="font-family:monospace; font-size:0.75rem; background:#f3f4f6; padding:2px 6px; border-radius:4px; font-weight:700; color:#4b5563;">${item.code}</span>
            </div>
            <p style="font-size:0.78rem; color:#6b7280; margin:6px 0 10px; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${item.description || 'Pristine bridal piece curated by Salon Vellora.'}
            </p>
          </div>

          <div>
            <!-- Financial breakdown card -->
            <div style="background:#fff7f9; border:1px solid #fce7ec; border-radius:10px; padding:8px 10px; margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline;">
                <span style="font-size:0.75rem; color:#9d174d; font-weight:600;">24-Hour Rental:</span>
                <span style="font-size:1.1rem; font-weight:800; color:var(--primary-dark);">${common.formatCurrency(item.rental_price_per_24h)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px; font-size:0.72rem; color:#6b7280;">
                <span>Security Deposit: <strong>${common.formatCurrency(item.security_deposit)}</strong></span>
                <span>Late Fee: <strong>${common.formatCurrency(item.late_fee_per_day || 500)}/d</strong></span>
              </div>
            </div>

            <!-- Card Actions -->
            <div style="display:flex; gap:8px;">
              <button class="btn-primary-custom" style="flex:1; justify-content:center; padding:0.5rem; font-size:0.82rem;" onclick="quickRentItem(${item.id})" ${!isAvail ? 'disabled' : ''}>
                <i data-lucide="sparkles" style="width:14px; height:14px;"></i> Rent 24h
              </button>
              <button class="btn-secondary-custom" style="padding:0.5rem 0.75rem; font-size:0.82rem;" onclick="openEditRentalItem(${item.id})" title="Edit Details">
                <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function populateRentalItemsSelect() {
  const select = document.getElementById("order-item-select");
  if (!select) return;

  select.innerHTML = `<option value="">Select Item to Rent...</option>` +
    allRentalCatalog.map(i => {
      const isAvail = i.available_quantity > 0;
      return `<option value="${i.id}" ${!isAvail ? 'disabled' : ''}>${i.name} [${i.code}] — Rent: LKR ${i.rental_price_per_24h} (Deposit: LKR ${i.security_deposit}) ${!isAvail ? '(RENTED OUT)' : ''}</option>`;
    }).join("");
}

function onRentalItemSelected(itemId) {
  const item = allRentalCatalog.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const fee = parseFloat(item.rental_price_per_24h || 0);
  const dep = parseFloat(item.security_deposit || 0);
  const total = fee + dep;

  document.getElementById("order-calc-fee").innerText = common.formatCurrency(fee);
  document.getElementById("order-calc-deposit").innerText = common.formatCurrency(dep);
  document.getElementById("order-calc-total").innerText = common.formatCurrency(total);
}

/**
 * MODAL: ISSUE NEW RENTAL ORDER
 */
function openNewOrderModal() {
  populateRentalItemsSelect();
  document.getElementById("order-cust-name").value = "";
  document.getElementById("order-cust-phone").value = "";
  document.getElementById("order-cust-nic").value = "";
  document.getElementById("order-notes").value = "";
  document.getElementById("order-calc-fee").innerText = "LKR 0.00";
  document.getElementById("order-calc-deposit").innerText = "LKR 0.00";
  document.getElementById("order-calc-total").innerText = "LKR 0.00";

  document.getElementById("new-rental-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeNewRentalModal() {
  document.getElementById("new-rental-modal").classList.remove("active");
}

function quickRentItem(itemId) {
  openNewOrderModal();
  const select = document.getElementById("order-item-select");
  if (select) {
    select.value = String(itemId);
    onRentalItemSelected(itemId);
  }
}

async function handleCreateRentalOrder(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-submit-order");
  btn.disabled = true;

  const custName = document.getElementById("order-cust-name").value.trim();
  const custPhone = document.getElementById("order-cust-phone").value.trim();
  const custNic = document.getElementById("order-cust-nic").value.trim();
  const itemId = parseInt(document.getElementById("order-item-select").value);
  const payMethod = document.getElementById("order-payment-method").value;
  const notes = document.getElementById("order-notes").value.trim();

  const item = allRentalCatalog.find(i => i.id === itemId);
  if (!item) {
    common.showToast("Please choose a valid rental item.", "warning");
    btn.disabled = false;
    return;
  }

  const durationHours = 24;
  const startDate = new Date();
  const dueDate = new Date(startDate.getTime() + durationHours * 3600 * 1000);

  const newOrder = {
    id: Date.now(),
    rental_number: `SV-RNT-${startDate.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    customer_name: custName,
    customer_phone: custPhone,
    customer_nic: custNic,
    rental_item_id: item.id,
    item: item,
    quantity: 1,
    rental_start_date: startDate.toISOString(),
    duration_hours: durationHours,
    due_return_date: dueDate.toISOString(),
    rental_fee: parseFloat(item.rental_price_per_24h),
    deposit_amount: parseFloat(item.security_deposit),
    total_collected: parseFloat(item.rental_price_per_24h) + parseFloat(item.security_deposit),
    payment_method: payMethod,
    status: 'active',
    notes: notes
  };

  try {
    // Attempt backend sync
    await api.post("/rentals/orders", {
      customer_name: custName,
      customer_phone: custPhone,
      customer_nic: custNic,
      rental_item_id: item.id,
      duration_hours: durationHours,
      payment_method: payMethod,
      notes: notes
    }).catch(err => console.warn("Backend order creation offline fallback:", err));
  } catch (err) {
    // Graceful offline fallback
  }

  // Update local state
  item.available_quantity = Math.max(0, (item.available_quantity || 1) - 1);
  if (item.available_quantity <= 0) item.status = 'rented';
  allRentalOrders.unshift(newOrder);
  saveLocalState();

  closeNewRentalModal();
  btn.disabled = false;

  common.showToast(`Rental ${newOrder.rental_number} created successfully!`, "success");
  switchRentalView('orders');
  updateRentalStats();

  // Prompt WhatsApp Agreement immediately
  setTimeout(() => {
    if (confirm(`Do you want to share the 24-Hour Rental Agreement with ${custName} on WhatsApp now?`)) {
      WhatsAppShare.shareRentalAgreement(newOrder, custPhone);
    }
  }, 400);
}

/**
 * MODAL: RETURN INSPECTION & DEPOSIT REFUND
 */
function openReturnModal(orderId) {
  const order = allRentalOrders.find(o => o.id === orderId);
  if (!order) return;

  currentReturnOrder = order;
  const itemName = order.item ? order.item.name : (order.name || "Rental Item");

  document.getElementById("return-order-id").value = order.id;
  document.getElementById("return-item-title").innerText = itemName;
  document.getElementById("return-client-info").innerText = `Client: ${order.customer_name} (${order.customer_phone}) • Ref: ${order.rental_number}`;

  const countdown = formatTimeRemaining(order.due_return_date);
  const badgeEl = document.getElementById("return-timing-badge");
  if (badgeEl) {
    badgeEl.innerHTML = `<span class="badge-custom ${countdown.badgeClass}"><i data-lucide="clock" style="width:12px;height:12px;"></i> ${countdown.text}</span>`;
  }

  // Auto-calculate overdue late fee
  const nowTime = new Date().getTime();
  const dueTime = new Date(order.due_return_date).getTime();
  let defaultLateFee = 0;
  if (nowTime > dueTime) {
    const hoursLate = Math.ceil((nowTime - dueTime) / (3600 * 1000));
    const daysLate = Math.max(1, Math.ceil(hoursLate / 24));
    const dailyRate = parseFloat(order.item?.late_fee_per_day || 500);
    defaultLateFee = daysLate * dailyRate;
  }

  document.getElementById("return-late-fee").value = defaultLateFee;
  document.getElementById("return-damage-fee").value = 0;
  document.getElementById("return-notes").value = "";
  document.getElementById("return-condition").selectedIndex = 0;

  calculateNetRefund();

  document.getElementById("return-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeReturnModal() {
  document.getElementById("return-modal").classList.remove("active");
  currentReturnOrder = null;
}

function onReturnConditionChange(val) {
  if (val.includes("Minor stain")) {
    document.getElementById("return-damage-fee").value = 1000;
  } else if (val.includes("Damaged fabric")) {
    document.getElementById("return-damage-fee").value = 3500;
  } else if (val.includes("Severely damaged")) {
    const deposit = currentReturnOrder ? parseFloat(currentReturnOrder.deposit_amount) : 0;
    document.getElementById("return-damage-fee").value = deposit;
  } else {
    document.getElementById("return-damage-fee").value = 0;
  }
  calculateNetRefund();
}

function calculateNetRefund() {
  if (!currentReturnOrder) return;
  const deposit = parseFloat(currentReturnOrder.deposit_amount || 0);
  const damageFee = parseFloat(document.getElementById("return-damage-fee").value) || 0;
  const lateFee = parseFloat(document.getElementById("return-late-fee").value) || 0;

  const totalDeductions = damageFee + lateFee;
  const netRefund = Math.max(0, deposit - totalDeductions);

  document.getElementById("return-net-refund").innerText = common.formatCurrency(netRefund);
  document.getElementById("return-deposit-held-note").innerText = `Initial Deposit: ${common.formatCurrency(deposit)} • Deductions: ${common.formatCurrency(totalDeductions)}`;
}

async function handleProcessReturn(e) {
  e.preventDefault();
  if (!currentReturnOrder) return;

  const order = currentReturnOrder;
  const damageFee = parseFloat(document.getElementById("return-damage-fee").value) || 0;
  const lateFee = parseFloat(document.getElementById("return-late-fee").value) || 0;
  const conditionNotes = document.getElementById("return-condition").value;
  const remarks = document.getElementById("return-notes").value.trim();

  const deposit = parseFloat(order.deposit_amount || 0);
  const netRefund = Math.max(0, deposit - damageFee - lateFee);

  const returnDate = new Date();
  order.status = 'returned';
  order.actual_return_date = returnDate.toISOString();
  order.damage_fee_charged = damageFee;
  order.late_fee_charged = lateFee;
  order.deposit_refunded = netRefund;
  order.return_condition_notes = conditionNotes + (remarks ? ` (${remarks})` : '');

  // Backend sync
  try {
    await api.post(`/rentals/orders/${order.id}/return`, {
      return_condition: order.return_condition_notes,
      damage_fee: damageFee,
      late_fee: lateFee,
      notes: remarks
    }).catch(err => console.warn("Backend return offline fallback:", err));
  } catch (err) {}

  // Restore inventory
  const catalogItem = allRentalCatalog.find(i => i.id === order.rental_item_id);
  if (catalogItem) {
    catalogItem.available_quantity = Math.min(catalogItem.total_quantity, (catalogItem.available_quantity || 0) + (order.quantity || 1));
    if (catalogItem.status === 'rented' && catalogItem.available_quantity > 0) {
      catalogItem.status = 'available';
    }
  }

  saveLocalState();
  closeReturnModal();

  common.showToast(`Item returned! Net deposit refund: ${common.formatCurrency(netRefund)}`, "success");
  filterRentalOrders();
  updateRentalStats();

  // Offer WhatsApp Return Clearance Slip
  setTimeout(() => {
    if (confirm(`Share Return Clearance & Deposit Refund Slip with ${order.customer_name} via WhatsApp?`)) {
      WhatsAppShare.shareRentalReturnReceipt(order);
    }
  }, 400);
}

/**
 * WHATSAPP TRIGGER HELPERS
 */
function handleWhatsAppOrderReceipt(orderId) {
  const order = allRentalOrders.find(o => o.id === orderId);
  if (order) {
    WhatsAppShare.shareRentalAgreement(order);
  }
}

function handleWhatsAppReminder(orderId) {
  const order = allRentalOrders.find(o => o.id === orderId);
  if (order) {
    WhatsAppShare.shareRentalReminder(order);
  }
}

function handleWhatsAppReturnClearance(orderId) {
  const order = allRentalOrders.find(o => o.id === orderId);
  if (order) {
    WhatsAppShare.shareRentalReturnReceipt(order);
  }
}

/**
 * MODAL: ADD / EDIT RENTAL CATALOG ITEM
 */
function openRentalItemModal() {
  document.getElementById("r-item-id").value = "";
  document.getElementById("rental-item-modal-title").innerText = "Add Rental Item";
  document.getElementById("r-item-name").value = "";
  document.getElementById("r-item-code").value = `RNT-${Math.floor(100 + Math.random() * 900)}`;
  document.getElementById("r-item-price").value = 3500;
  document.getElementById("r-item-deposit").value = 5000;
  document.getElementById("r-item-late-fee").value = 1000;
  document.getElementById("r-item-qty").value = 1;
  document.getElementById("r-item-image").value = "";
  document.getElementById("r-item-desc").value = "";

  document.getElementById("rental-item-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeRentalItemModal() {
  document.getElementById("rental-item-modal").classList.remove("active");
}

function openEditRentalItem(itemId) {
  const item = allRentalCatalog.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById("r-item-id").value = item.id;
  document.getElementById("rental-item-modal-title").innerText = "Edit Rental Item";
  document.getElementById("r-item-name").value = item.name;
  document.getElementById("r-item-code").value = item.code;
  document.getElementById("r-item-category").value = item.category || "Sarees & Lehengas";
  document.getElementById("r-item-price").value = item.rental_price_per_24h;
  document.getElementById("r-item-deposit").value = item.security_deposit;
  document.getElementById("r-item-late-fee").value = item.late_fee_per_day || 500;
  document.getElementById("r-item-qty").value = item.total_quantity || 1;
  document.getElementById("r-item-condition").value = item.condition || "Excellent";
  document.getElementById("r-item-image").value = item.image || "";
  document.getElementById("r-item-desc").value = item.description || "";

  document.getElementById("rental-item-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

async function handleSaveRentalItem(e) {
  e.preventDefault();
  const id = document.getElementById("r-item-id").value;
  const name = document.getElementById("r-item-name").value.trim();
  const code = document.getElementById("r-item-code").value.trim();
  const category = document.getElementById("r-item-category").value;
  const price = parseFloat(document.getElementById("r-item-price").value);
  const deposit = parseFloat(document.getElementById("r-item-deposit").value);
  const lateFee = parseFloat(document.getElementById("r-item-late-fee").value) || 500;
  const qty = parseInt(document.getElementById("r-item-qty").value) || 1;
  const condition = document.getElementById("r-item-condition").value;
  const image = document.getElementById("r-item-image").value.trim();
  const desc = document.getElementById("r-item-desc").value.trim();

  const payload = {
    name,
    code,
    category,
    rental_price_per_24h: price,
    security_deposit: deposit,
    late_fee_per_day: lateFee,
    total_quantity: qty,
    available_quantity: qty,
    condition,
    image,
    description: desc,
    status: 'available'
  };

  try {
    if (id) {
      await api.put(`/rentals/catalog/${id}`, payload).catch(() => {});
      const existing = allRentalCatalog.find(i => String(i.id) === String(id));
      if (existing) Object.assign(existing, payload);
    } else {
      await api.post("/rentals/catalog", payload).catch(() => {});
      payload.id = Date.now();
      allRentalCatalog.unshift(payload);
    }
  } catch (err) {
    if (!id) {
      payload.id = Date.now();
      allRentalCatalog.unshift(payload);
    }
  }

  saveLocalState();
  closeRentalItemModal();
  common.showToast("Rental item saved successfully!", "success");
  renderRentalCatalogGrid(allRentalCatalog);
  populateRentalItemsSelect();
  updateRentalStats();
}
