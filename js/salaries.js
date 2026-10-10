/**
 * Salon Vellora — Staff Salary & Payroll Management Engine
 * Handles live calculations, basic salary (LKR 20,000), target tracking (LKR 500,000),
 * operational deductions (Electricity, Rent, Petty Cash), 15% net incentive & luxury payslips.
 */

let allStaffList = [];
let editingSalaryId = null;
let currentPayslipData = null;
let currentExpenseItems = [];

const DEFAULT_FALLBACK_STAFF = [
  { id: 1, name: "Vihanga Dilshan", designation: "Salon Director & Bridal Specialist", base_salary: 85000 },
  { id: 2, name: "Sachini Senanayake", designation: "Senior Hair Stylist", base_salary: 60000 },
  { id: 3, name: "Kaveesha Rasanjali", designation: "Esthetician & Nail Artist", base_salary: 55000 },
  { id: 4, name: "Dilrukshi Gunawardena", designation: "Bridal Makeup Artist", base_salary: 65000 }
];

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize common sidebar & topbar
  common.initLayout(
    "salaries",
    "Staff Salaries & Payroll",
    "Monthly salary calculations, sales target incentive tracking & overhead deductions"
  );

  // Set default current month and year
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const filterMonth = document.getElementById("filter-month");
  if (filterMonth) filterMonth.value = currentMonth;

  const filterYear = document.getElementById("filter-year");
  if (filterYear) filterYear.value = currentYear;

  const calcMonth = document.getElementById("calc-month");
  if (calcMonth) calcMonth.value = currentMonth;

  const calcYear = document.getElementById("calc-year");
  if (calcYear) calcYear.value = currentYear;

  const payDateInput = document.getElementById("pay-date-input");
  if (payDateInput) payDateInput.value = now.toISOString().split("T")[0];

  // Load staff list & salary ledger
  await loadStaffDirectory();
  await loadSalaryLedger();

  if (window.lucide) {
    lucide.createIcons();
  }
});

/**
 * Load staff list for dropdowns with API and guaranteed fallback
 */
async function loadStaffDirectory() {
  try {
    const apiClient = window.api || window.API;
    const res = await apiClient.get("/staff");
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      allStaffList = res.data;
    } else if (Array.isArray(res) && res.length > 0) {
      allStaffList = res;
    } else if (!allStaffList || allStaffList.length === 0) {
      allStaffList = DEFAULT_FALLBACK_STAFF;
    }
  } catch (err) {
    console.warn("Could not fetch staff from API, applying salon staff list:", err);
    if (!allStaffList || allStaffList.length === 0) {
      allStaffList = DEFAULT_FALLBACK_STAFF;
    }
  }

  // Populate filter dropdown
  const filterStaff = document.getElementById("filter-staff");
  if (filterStaff) {
    const prevVal = filterStaff.value;
    let optHtml = '<option value="">All Stylists & Staff</option>';
    allStaffList.forEach(s => {
      optHtml += `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.designation || 'Stylist')})</option>`;
    });
    filterStaff.innerHTML = optHtml;
    if (prevVal) filterStaff.value = prevVal;
  }

  // Populate calculator modal staff dropdown
  const calcStaff = document.getElementById("calc-staff-id");
  if (calcStaff) {
    const prevVal = calcStaff.value;
    let optHtml = '<option value="">Select Stylist...</option>';
    allStaffList.forEach(s => {
      optHtml += `<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.designation || 'Stylist')}</option>`;
    });
    calcStaff.innerHTML = optHtml;
    if (prevVal) {
      calcStaff.value = prevVal;
    } else if (allStaffList.length > 0) {
      calcStaff.value = allStaffList[0].id;
    }
  }
}

/**
 * Load Salary Ledger Table and Update KPIs
 */
async function loadSalaryLedger() {
  const tbody = document.getElementById("salaries-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:3rem; color:var(--text-muted);"><i data-lucide="loader" class="spin" style="margin-bottom:8px;"></i><p style="margin:0;">Loading salary records...</p></td></tr>`;
  if (window.lucide) lucide.createIcons();

  const month = document.getElementById("filter-month").value;
  const year = document.getElementById("filter-year").value;
  const staffId = document.getElementById("filter-staff").value;
  const status = document.getElementById("filter-status").value;

  const params = new URLSearchParams();
  if (month) params.append("month", month);
  if (year) params.append("year", year);
  if (staffId) params.append("staff_id", staffId);
  if (status) params.append("payment_status", status);

  try {
    const res = await API.get(`/salaries?${params.toString()}`);
    if (res && res.success) {
      const records = res.data.data || res.data || [];
      renderSalaryLedger(records);
      updateKPISummary(records);
    } else {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:2rem; color:var(--danger);">Failed to load salary records.</td></tr>`;
    }
  } catch (err) {
    console.error("Failed to fetch salaries:", err);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:2rem; color:var(--danger);">Could not connect to server.</td></tr>`;
  }
}

/**
 * Render Salary Ledger Rows
 */
function renderSalaryLedger(records) {
  const tbody = document.getElementById("salaries-table-body");
  const countBadge = document.getElementById("records-count-badge");
  if (countBadge) countBadge.textContent = `${records.length} Record${records.length === 1 ? '' : 's'}`;

  if (!records || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:3.5rem 1rem; color:var(--text-muted);">
          <i data-lucide="file-x" style="width:36px;height:36px;color:var(--text-light);margin-bottom:8px;"></i>
          <p style="margin:0; font-weight:600;">No salary records found</p>
          <p style="font-size:0.8rem; margin:4px 0 12px;">No payroll entries matching the selected period or filters.</p>
          <button class="btn-primary-custom" style="padding:0.4rem 0.9rem; font-size:0.8rem;" onclick="openSalaryCalculatorModal()">
            <i data-lucide="calculator"></i> Calculate New Salary
          </button>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  tbody.innerHTML = records.map(item => {
    const staffName = item.staff ? item.staff.name : "Unknown Staff";
    const designation = item.staff ? item.staff.designation : "Staff";
    const payPeriod = `${monthNames[item.month]} ${item.year}`;
    const statusClass = item.payment_status === 'paid' ? 'status-badge-paid' : 'status-badge-pending';
    const statusLabel = item.payment_status === 'paid' ? 'PAID' : 'PENDING';

    const basicSalaryFormatted = common.formatCurrency(item.basic_salary);
    const incentiveFormatted = common.formatCurrency(item.incentive_amount);
    const netSalaryFormatted = common.formatCurrency(item.net_salary);
    const deductionsFormatted = common.formatCurrency(item.total_expenses_deducted);
    const targetFormatted = (parseFloat(item.monthly_target) / 1000).toFixed(0) + 'k';
    const revFormatted = (parseFloat(item.monthly_revenue) / 1000).toFixed(0) + 'k';

    return `
      <tr>
        <td>
          <span style="font-weight:700; color:var(--primary-dark); font-size:0.85rem;">${item.salary_slip_number}</span>
          <div style="font-size:0.7rem; color:var(--text-muted);">${new Date(item.created_at).toLocaleDateString()}</div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:32px; height:32px; border-radius:50%; background:var(--primary-light); color:var(--primary-dark); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem;">
              ${staffName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong style="font-size:0.88rem; color:#111827;">${escapeHtml(staffName)}</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">${escapeHtml(designation)}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-weight:600; font-size:0.85rem;">${payPeriod}</span>
        </td>
        <td>
          <span style="font-weight:600; color:#374151;">${basicSalaryFormatted}</span>
        </td>
        <td>
          <div style="font-size:0.78rem;">
            <span>Rev: <strong>${revFormatted}</strong> / ${targetFormatted}</span>
            <div>${item.target_achieved ? '<span style="color:#059669;font-weight:700;font-size:0.7rem;">Target Met ✓</span>' : '<span style="color:#dc2626;font-size:0.7rem;">Target Pending</span>'}</div>
          </div>
        </td>
        <td>
          <span style="font-size:0.8rem; color:#6b7280;">${deductionsFormatted}</span>
        </td>
        <td>
          <span style="font-weight:700; color:#059669;">+ ${incentiveFormatted}</span>
        </td>
        <td>
          <strong style="font-size:0.95rem; font-weight:800; color:var(--primary-dark); font-family:'Plus Jakarta Sans',sans-serif;">${netSalaryFormatted}</strong>
        </td>
        <td>
          <span class="${statusClass}">${statusLabel}</span>
          ${item.paid_at ? `<div style="font-size:0.68rem; color:var(--text-muted);">${new Date(item.paid_at).toLocaleDateString()}</div>` : ''}
        </td>
        <td style="text-align:right; white-space:nowrap;">
          <div style="display:inline-flex; gap:4px;">
            <button class="btn-secondary-custom" style="padding:4px 8px; font-size:0.75rem;" title="View & Print Payslip" onclick="openPayslipModal(${item.id})">
              <i data-lucide="printer" style="width:14px;height:14px;"></i>
            </button>
            ${item.payment_status === 'pending' ? `
              <button class="btn-primary-custom" style="padding:4px 8px; font-size:0.75rem; background:#10b981;" title="Mark as Paid" onclick="openMarkPaidModal(${item.id}, ${item.net_salary}, '${escapeHtml(staffName)}')">
                <i data-lucide="check" style="width:14px;height:14px;"></i>
              </button>
            ` : ''}
            <button class="btn-secondary-custom" style="padding:4px 8px; font-size:0.75rem;" title="Edit Slip Figures" onclick="editSalarySlip(${item.id})">
              <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
            </button>
            <button class="btn-secondary-custom" style="padding:4px 8px; font-size:0.75rem; color:var(--danger);" title="Delete / Remove Slip" onclick="deleteSalarySlip(${item.id})">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

/**
 * Update 4 KPI Cards
 */
function updateKPISummary(records) {
  let totalDisbursed = 0;
  let paidCount = 0;
  let totalIncentive = 0;
  let pendingTotal = 0;
  let pendingCount = 0;

  records.forEach(r => {
    const net = parseFloat(r.net_salary) || 0;
    const inc = parseFloat(r.incentive_amount) || 0;
    if (r.payment_status === 'paid') {
      totalDisbursed += net;
      paidCount++;
      totalIncentive += inc;
    } else {
      pendingTotal += net;
      pendingCount++;
    }
  });

  const elDisbursed = document.getElementById("kpi-total-disbursed");
  if (elDisbursed) elDisbursed.textContent = common.formatCurrency(totalDisbursed);

  const elPaidCount = document.getElementById("kpi-paid-count");
  if (elPaidCount) elPaidCount.textContent = `${paidCount} paid salary slip${paidCount === 1 ? '' : 's'}`;

  const elIncentive = document.getElementById("kpi-incentive-pool");
  if (elIncentive) elIncentive.textContent = common.formatCurrency(totalIncentive);

  const elPendingTotal = document.getElementById("kpi-pending-total");
  if (elPendingTotal) elPendingTotal.textContent = common.formatCurrency(pendingTotal);

  const elPendingCount = document.getElementById("kpi-pending-count");
  if (elPendingCount) elPendingCount.textContent = `${pendingCount} pending disbursal${pendingCount === 1 ? '' : 's'}`;
}

function resetFilters() {
  const now = new Date();
  document.getElementById("filter-month").value = now.getMonth() + 1;
  document.getElementById("filter-year").value = now.getFullYear();
  document.getElementById("filter-staff").value = "";
  document.getElementById("filter-status").value = "";
  loadSalaryLedger();
}

/**
 * ==========================================================================
 * DYNAMIC OPERATIONAL EXPENSES MANAGEMENT
 * ==========================================================================
 */

/**
 * Render dynamic expense items into #expense-items-container
 */
function renderExpenseItems() {
  const container = document.getElementById("expense-items-container");
  if (!container) return;

  if (currentExpenseItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:1.2rem; color:var(--text-muted); background:#ffffff; border:1px dashed #d1d5db; border-radius:8px; font-size:0.8rem;">
        No operational expenses added yet. Click <strong>+ Add Expense Item</strong> or use the Quick-Add presets above.
      </div>
    `;
    runLiveRecalculation();
    return;
  }

  container.innerHTML = currentExpenseItems.map((item, idx) => `
    <div class="expense-item-row" data-idx="${idx}">
      <div>
        <input type="text" class="form-control-custom expense-item-name" style="padding:6px 10px; font-size:0.82rem; height:34px;" value="${escapeHtml(item.name || '')}" placeholder="Expense Name (e.g. Shop Rent, Water Bill)" oninput="onExpenseItemNameChange(${idx}, this.value)">
      </div>
      <div style="position:relative;">
        <span style="position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:0.75rem; color:#9ca3af; font-weight:700;">LKR</span>
        <input type="number" step="any" min="0" class="form-control-custom expense-item-amount" style="padding:6px 8px 6px 36px; font-size:0.85rem; height:34px; font-weight:700; text-align:right;" value="${item.amount !== undefined && item.amount !== null ? item.amount : ''}" placeholder="0.00" oninput="onExpenseItemAmountChange(${idx}, this.value)">
      </div>
      <button type="button" class="btn-icon-danger" title="Remove Item" onclick="removeExpenseItem(${idx})" style="background:#fee2e2; color:#ef4444; border:none; border-radius:6px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
        <i data-lucide="trash-2" style="width:15px;height:15px;"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
  runLiveRecalculation();
}

function onExpenseItemNameChange(idx, val) {
  if (currentExpenseItems[idx]) {
    currentExpenseItems[idx].name = val;
  }
}

function onExpenseItemAmountChange(idx, val) {
  if (currentExpenseItems[idx]) {
    currentExpenseItems[idx].amount = parseFloat(val) || 0;
  }
  runLiveRecalculation();
}

function onExpenseItemChange() {
  runLiveRecalculation();
}

function addNewExpenseItem(name = "", amount = 0) {
  currentExpenseItems.push({ name: name, amount: parseFloat(amount) || 0 });
  renderExpenseItems();
  // Auto-focus new row input
  const container = document.getElementById("expense-items-container");
  if (container) {
    const rows = container.querySelectorAll(".expense-item-row");
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const nameInput = lastRow.querySelector(".expense-item-name");
      if (nameInput) nameInput.focus();
    }
  }
}

function addPresetExpenseItem(presetName, defaultAmount = 0) {
  // Check if item with similar name already exists
  const cleanPreset = presetName.replace(/^[^\w\s]+/, '').trim().toLowerCase();
  const existingIdx = currentExpenseItems.findIndex(i => (i.name || '').toLowerCase().includes(cleanPreset));
  if (existingIdx !== -1) {
    const container = document.getElementById("expense-items-container");
    if (container) {
      const rows = container.querySelectorAll(".expense-item-row");
      if (rows[existingIdx]) {
        const amtInput = rows[existingIdx].querySelector(".expense-item-amount");
        if (amtInput) amtInput.focus();
      }
    }
    common.showToast(`"${presetName}" is already listed. You can adjust its amount.`, "info");
    return;
  }

  currentExpenseItems.push({ name: presetName, amount: defaultAmount });
  renderExpenseItems();
}

function removeExpenseItem(idx) {
  currentExpenseItems.splice(idx, 1);
  renderExpenseItems();
}

function collectExpenseBreakdown() {
  return currentExpenseItems.map(item => ({
    name: (item.name || 'Operational Expense').trim(),
    amount: Math.max(0, parseFloat(item.amount) || 0)
  }));
}

/**
 * ==========================================================================
 * INTERACTIVE SALARY CALCULATOR MODAL LOGIC
 * ==========================================================================
 */
async function openSalaryCalculatorModal() {
  editingSalaryId = null;
  const modal = document.getElementById("salary-calc-modal");
  if (!modal) return;

  // Open modal immediately so user sees popup without delay
  modal.classList.add("active");

  const titleEl = document.getElementById("modal-calc-title");
  if (titleEl) {
    titleEl.innerHTML = '<i data-lucide="calculator"></i> Calculate & Process Staff Salary';
  }

  try {
    // Ensure staff list is loaded
    if (!allStaffList || allStaffList.length === 0) {
      await loadStaffDirectory();
    } else {
      const calcStaff = document.getElementById("calc-staff-id");
      if (calcStaff && calcStaff.options.length <= 1) {
        let optHtml = '<option value="">Select Stylist...</option>';
        allStaffList.forEach(s => {
          optHtml += `<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.designation || 'Stylist')}</option>`;
        });
        calcStaff.innerHTML = optHtml;
      }
    }

    // Set defaults
    const now = new Date();
    const mEl = document.getElementById("calc-month");
    if (mEl) mEl.value = now.getMonth() + 1;
    const yEl = document.getElementById("calc-year");
    if (yEl) yEl.value = now.getFullYear();
    const tEl = document.getElementById("calc-target");
    if (tEl) tEl.value = 500000;
    const bEl = document.getElementById("calc-basic-salary");
    if (bEl) bEl.value = 20000;
    const aEl = document.getElementById("calc-allowances");
    if (aEl) aEl.value = 0;
    const advEl = document.getElementById("calc-advances");
    if (advEl) advEl.value = 0;
    const notesEl = document.getElementById("calc-notes");
    if (notesEl) notesEl.value = "";
    const pctEl = document.getElementById("calc-incentive-percentage");
    if (pctEl) pctEl.value = 15;

    const calcStaff = document.getElementById("calc-staff-id");
    if (calcStaff && allStaffList.length > 0) {
      if (!calcStaff.value) {
        calcStaff.value = allStaffList[0].id;
      }
    }

    // Initialize empty so auto-fetch pulls exact expenses from DB
    currentExpenseItems = [];
    renderExpenseItems();

    if (window.lucide) lucide.createIcons();

    // Auto-fetch actual expenses from Operational Expenses page for this month & year
    await onStaffOrPeriodChange(true);
  } catch (err) {
    console.warn("Notice in openSalaryCalculatorModal:", err);
    runLiveRecalculation();
  }
}

function closeSalaryCalculatorModal() {
  const modal = document.getElementById("salary-calc-modal");
  if (modal) modal.classList.remove("active");
  editingSalaryId = null;
}

/**
 * Manually sync all actual expenses from the Operational Expenses page
 */
async function syncOperationalExpensesFromDB() {
  try {
    common.showToast("Pulling operational expenses from expenses ledger...", "info");
    await onStaffOrPeriodChange(true);
    common.showToast("Successfully synced all expenses from Operational Expenses page.", "success");
  } catch (err) {
    console.error("Error syncing operational expenses:", err);
    common.showToast("Could not sync expenses from database.", "error");
  }
}

window.openSalaryCalculatorModal = openSalaryCalculatorModal;
window.closeSalaryCalculatorModal = closeSalaryCalculatorModal;
window.syncOperationalExpensesFromDB = syncOperationalExpensesFromDB;

/**
 * Triggered when staff or period changes in calculator modal
 * @param {boolean} forceRefresh - If true, re-syncs all actual expenses from DB for the period
 */
async function onStaffOrPeriodChange(forceRefresh = false) {
  const staffId = document.getElementById("calc-staff-id").value;
  const month = document.getElementById("calc-month").value;
  const year = document.getElementById("calc-year").value;

  // Selected staff base salary
  if (staffId && allStaffList.length > 0) {
    const selectedStaff = allStaffList.find(s => s.id == staffId);
    if (selectedStaff && parseFloat(selectedStaff.base_salary) > 0) {
      document.getElementById("calc-basic-salary").value = parseFloat(selectedStaff.base_salary);
    } else {
      document.getElementById("calc-basic-salary").value = 20000;
    }
  }

  try {
    const apiClient = window.api || window.API;

    const res = await apiClient.post("/salaries/calculate-preview", {
      staff_id: staffId || null,
      month: month,
      year: year,
      monthly_target: document.getElementById("calc-target").value || 500000,
      basic_salary: document.getElementById("calc-basic-salary").value || 20000,
      incentive_percentage: parseFloat(document.getElementById("calc-incentive-percentage")?.value) || 15,
      expense_breakdown: forceRefresh ? [] : collectExpenseBreakdown(),
      refresh_expenses: forceRefresh ? 1 : 0,
    });

    if (res && res.success && res.data) {
      const d = res.data;
      document.getElementById("calc-revenue").value = d.monthly_revenue;

      // Populate backend auto-fetched operational expenses
      if (d.expense_breakdown && d.expense_breakdown.length > 0) {
        const isAllZero = currentExpenseItems.length === 0 || currentExpenseItems.every(i => !i.amount || i.amount == 0);
        if (forceRefresh || isAllZero) {
          currentExpenseItems = d.expense_breakdown.map(item => ({
            name: item.name,
            amount: parseFloat(item.amount) || 0
          }));
          renderExpenseItems();
        }
      }
      runLiveRecalculation();
    }
  } catch (err) {
    console.warn("Could not auto-fetch month calculation preview:", err);
    runLiveRecalculation();
  }
}

/**
 * Instant live recalculation on any keystroke
 */
function runLiveRecalculation() {
  const target = parseFloat(document.getElementById("calc-target").value) || 500000;
  const revenue = parseFloat(document.getElementById("calc-revenue").value) || 0;

  // Sum all dynamic expense items (Operational Overheads)
  const breakdown = collectExpenseBreakdown();
  const totalDeductions = breakdown.reduce((sum, item) => sum + item.amount, 0);

  // Sync backward compatible inputs if present
  let electricity = 0;
  let rent = 0;
  let pettyCash = 0;
  let otherDeductions = 0;
  breakdown.forEach(b => {
    const l = (b.name || '').toLowerCase();
    if (l.includes('electr') || l.includes('ceb')) electricity += b.amount;
    else if (l.includes('rent')) rent += b.amount;
    else if (l.includes('petty') || l.includes('tea')) pettyCash += b.amount;
    else otherDeductions += b.amount;
  });

  const elElec = document.getElementById("calc-electricity");
  if (elElec) elElec.value = electricity;
  const elRent = document.getElementById("calc-rent");
  if (elRent) elRent.value = rent;
  const elPetty = document.getElementById("calc-petty-cash");
  if (elPetty) elPetty.value = pettyCash;
  const elOther = document.getElementById("calc-other-deductions");
  if (elOther) elOther.value = otherDeductions;

  // Net Profit = Monthly Revenue minus Total Operational Expenses
  const remainingAmount = Math.max(0, revenue - totalDeductions);

  // Dynamic Net Profit Incentive Share % (Editable by user, default 15%)
  const incentivePercentageInput = document.getElementById("calc-incentive-percentage");
  const incentivePercentage = incentivePercentageInput ? (parseFloat(incentivePercentageInput.value) || 0) : 15.00;
  const incentiveAmount = remainingAmount * (incentivePercentage / 100);

  const basicSalary = parseFloat(document.getElementById("calc-basic-salary").value) || 20000;
  const allowances = parseFloat(document.getElementById("calc-allowances").value) || 0;
  const advances = parseFloat(document.getElementById("calc-advances").value) || 0;

  const grandNetSalary = Math.max(0, basicSalary + incentiveAmount + allowances - advances);

  // Update target milestone badge
  const targetBadge = document.getElementById("calc-target-badge");
  if (targetBadge) {
    const pct = target > 0 ? Math.round((revenue / target) * 100) : 0;
    if (revenue >= target) {
      targetBadge.className = "target-pill-unlocked";
      targetBadge.innerHTML = `<i data-lucide="check-circle" style="width:12px;height:12px;"></i> Target Met! (${pct}%)`;
    } else {
      targetBadge.className = "target-pill-unlocked";
      targetBadge.innerHTML = `<i data-lucide="activity" style="width:12px;height:12px;"></i> Milestone Progress: ${pct}%`;
    }
  }

  const deductionsLabel = document.getElementById("calc-total-deductions-label");
  if (deductionsLabel) {
    deductionsLabel.textContent = `Total Deductions: ${common.formatCurrency(totalDeductions)}`;
  }

  const remEl = document.getElementById("calc-remaining-amount");
  if (remEl) remEl.textContent = common.formatCurrency(remainingAmount);

  const incTitleEl = document.getElementById("calc-incentive-share-title");
  if (incTitleEl) {
    incTitleEl.textContent = `${incentivePercentage}% Net Profit Share`;
  }

  const incEl = document.getElementById("calc-incentive-amount");
  if (incEl) incEl.textContent = `+ ${common.formatCurrency(incentiveAmount)}`;

  const incStatusEl = document.getElementById("calc-incentive-status");
  if (incStatusEl) {
    incStatusEl.textContent = `${incentivePercentage}% of Net Profit (${common.formatCurrency(remainingAmount)}) directly added to salary`;
  }

  const netEl = document.getElementById("calc-grand-net-salary");
  if (netEl) netEl.textContent = common.formatCurrency(grandNetSalary);

  const formulaEl = document.getElementById("calc-formula-summary");
  if (formulaEl) {
    formulaEl.textContent = `Basic (${common.formatCurrency(basicSalary)}) + ${incentivePercentage}% Net Profit Share (${common.formatCurrency(incentiveAmount)}) + Allowances (${common.formatCurrency(allowances)}) - Advances (${common.formatCurrency(advances)})`;
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Save Salary Slip (Pending or Paid)
 */
async function saveSalarySlip(paymentStatus = 'pending') {
  const staffId = document.getElementById("calc-staff-id").value;
  if (!staffId) {
    common.showToast("Please select a staff member.", "warning");
    return;
  }

  const breakdown = collectExpenseBreakdown();
  const totalDeductions = breakdown.reduce((sum, item) => sum + item.amount, 0);

  const payload = {
    staff_id: parseInt(staffId),
    month: parseInt(document.getElementById("calc-month").value),
    year: parseInt(document.getElementById("calc-year").value),
    monthly_target: parseFloat(document.getElementById("calc-target").value) || 500000,
    monthly_revenue: parseFloat(document.getElementById("calc-revenue").value) || 0,
    expense_breakdown: breakdown,
    electricity_bill: parseFloat(document.getElementById("calc-electricity")?.value) || 0,
    shop_rent: parseFloat(document.getElementById("calc-rent")?.value) || 0,
    petty_cash: parseFloat(document.getElementById("calc-petty-cash")?.value) || 0,
    other_deductions: parseFloat(document.getElementById("calc-other-deductions")?.value) || 0,
    total_expenses_deducted: totalDeductions,
    incentive_percentage: parseFloat(document.getElementById("calc-incentive-percentage")?.value) || 15.00,
    basic_salary: parseFloat(document.getElementById("calc-basic-salary").value) || 20000,
    allowances: parseFloat(document.getElementById("calc-allowances").value) || 0,
    advances: parseFloat(document.getElementById("calc-advances").value) || 0,
    notes: document.getElementById("calc-notes").value,
    payment_status: paymentStatus,
    payment_method: paymentStatus === 'paid' ? 'bank_transfer' : null,
  };

  try {
    const apiClient = window.api || window.API;
    let res;
    if (editingSalaryId) {
      res = await apiClient.put(`/salaries/${editingSalaryId}`, payload);
    } else {
      res = await apiClient.post("/salaries", payload);
    }

    if (res && res.success) {
      common.showToast(res.message || "Salary slip saved successfully.", "success");
      closeSalaryCalculatorModal();
      loadSalaryLedger();
    } else {
      common.showToast(res?.message || "Failed to save salary slip.", "error");
    }
  } catch (err) {
    console.error("Error saving salary slip:", err);
    common.showToast(err?.message || "Error saving salary slip.", "error");
  }
}

/**
 * Edit existing slip
 */
async function editSalarySlip(id) {
  try {
    const apiClient = window.api || window.API;
    const res = await apiClient.get(`/salaries/${id}`);
    if (res && res.success && res.data) {
      const s = res.data;
      editingSalaryId = s.id;

      // Ensure staff list is loaded
      if (!allStaffList || allStaffList.length === 0) {
        await loadStaffDirectory();
      }

      const modal = document.getElementById("salary-calc-modal");
      modal.classList.add("active");
      document.getElementById("modal-calc-title").innerHTML = `<i data-lucide="edit"></i> Edit Salary Slip: ${escapeHtml(s.salary_slip_number)}`;

      document.getElementById("calc-staff-id").value = s.staff_id;
      document.getElementById("calc-month").value = s.month;
      document.getElementById("calc-year").value = s.year;
      document.getElementById("calc-target").value = s.monthly_target;
      document.getElementById("calc-revenue").value = s.monthly_revenue;
      document.getElementById("calc-basic-salary").value = s.basic_salary;
      const pctEl = document.getElementById("calc-incentive-percentage");
      if (pctEl) pctEl.value = s.incentive_percentage !== undefined && s.incentive_percentage !== null ? parseFloat(s.incentive_percentage) : 15;
      document.getElementById("calc-allowances").value = s.allowances;
      document.getElementById("calc-advances").value = s.advances;
      document.getElementById("calc-notes").value = s.notes || "";

      if (s.expense_breakdown && Array.isArray(s.expense_breakdown) && s.expense_breakdown.length > 0) {
        currentExpenseItems = s.expense_breakdown;
      } else {
        currentExpenseItems = [
          { name: "⚡ Electricity Bill", amount: parseFloat(s.electricity_bill) || 0 },
          { name: "🏢 Shop Rent", amount: parseFloat(s.shop_rent) || 0 },
          { name: "💵 Petty Cash & Misc", amount: parseFloat(s.petty_cash) || 0 },
        ];
        if (parseFloat(s.other_deductions) > 0) {
          currentExpenseItems.push({ name: "Other Operational Deductions", amount: parseFloat(s.other_deductions) });
        }
      }
      renderExpenseItems();
      runLiveRecalculation();
    }
  } catch (err) {
    common.showToast("Could not load salary slip details.", "error");
  }
}

/**
 * Delete pending slip
 */
function deleteSalarySlip(id) {
  common.showConfirm({
    title: "Delete Salary Slip?",
    message: "Are you sure you want to delete this salary slip record from the ledger?",
    confirmText: "Yes, Delete",
    isDanger: true,
    onConfirm: async () => {
      try {
        const apiClient = window.api || window.API;
        const res = await apiClient.delete(`/salaries/${id}`);
        if (res && res.success) {
          common.showToast("Salary slip deleted successfully.", "success");
          loadSalaryLedger();
        } else {
          common.showToast(res?.message || "Failed to delete slip.", "error");
        }
      } catch (err) {
        common.showToast("Could not delete salary slip.", "error");
      }
    }
  });
}

/**
 * ==========================================================================
 * MARK AS PAID MODAL
 * ==========================================================================
 */
function openMarkPaidModal(id, netSalary, staffName) {
  document.getElementById("pay-slip-id").value = id;
  document.getElementById("pay-modal-amount").textContent = common.formatCurrency(netSalary);
  document.getElementById("pay-modal-staff-name").textContent = `Recipient: ${staffName}`;
  document.getElementById("pay-date-input").value = new Date().toISOString().split("T")[0];
  document.getElementById("pay-ref-input").value = "";

  const modal = document.getElementById("mark-paid-modal");
  if (modal) modal.classList.add("active");
}

function closeMarkPaidModal() {
  const modal = document.getElementById("mark-paid-modal");
  if (modal) modal.classList.remove("active");
}

async function submitMarkAsPaid() {
  const id = document.getElementById("pay-slip-id").value;
  const method = document.getElementById("pay-method-select").value;
  const date = document.getElementById("pay-date-input").value;
  const ref = document.getElementById("pay-ref-input").value;

  try {
    const res = await API.post(`/salaries/${id}/pay`, {
      payment_method: method,
      paid_at: date,
      notes: ref ? `Payment Ref: ${ref}` : null,
    });

    if (res && res.success) {
      common.showToast(res.message || "Salary marked as paid.", "success");
      closeMarkPaidModal();
      loadSalaryLedger();
    } else {
      common.showToast(res?.message || "Failed to disburse salary.", "error");
    }
  } catch (err) {
    common.showToast("Error processing payment.", "error");
  }
}

/**
 * ==========================================================================
 * LUXURY PRINTABLE PAYSLIP MODAL
 * ==========================================================================
 */
async function openPayslipModal(id) {
  const modal = document.getElementById("payslip-modal");
  const area = document.getElementById("payslip-printable-area");
  if (!modal || !area) return;

  area.innerHTML = `<div style="text-align:center; padding:3rem;"><i data-lucide="loader" class="spin"></i> Loading payslip...</div>`;
  modal.classList.add("active");
  if (window.lucide) lucide.createIcons();

  try {
    const res = await API.get(`/salaries/${id}/payslip`);
    if (res && res.success && res.data) {
      currentPayslipData = res.data;
      renderPrintablePayslip(res.data);
    } else {
      area.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load payslip data.</p>`;
    }
  } catch (err) {
    area.innerHTML = `<p style="color:var(--danger); text-align:center;">Error loading payslip.</p>`;
  }
}

function closePayslipModal() {
  const modal = document.getElementById("payslip-modal");
  if (modal) modal.classList.remove("active");
  currentPayslipData = null;
}

function renderPrintablePayslip(data) {
  const area = document.getElementById("payslip-printable-area");
  const s = data.salary;
  const staff = s.staff || {};
  const salon = data.salon || {};

  area.innerHTML = `
    <!-- Header -->
    <div class="payslip-header">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="../assets/logocircel.jpg" alt="Salon Vellora" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid #f1dde5;" onerror="this.src='../assets/salonvelora.png'">
        <div>
          <h2 style="font-family:'Playfair Display',serif; font-size:1.45rem; color:#872341; margin:0 0 2px;">${escapeHtml(salon.name || 'Salon Vellora')}</h2>
          <div style="font-size:0.75rem; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">${escapeHtml(salon.tagline || 'Ladies Salon & Bridal Dressing')}</div>
          <div style="font-size:0.72rem; color:#9ca3af;">${escapeHtml(salon.address || 'Galwatawaththa Junction, Pinnaduwa, Galle')} | Tel: ${escapeHtml(salon.phone || '074 084 4739')}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <span class="badge badge-rose" style="font-size:0.8rem; font-weight:700;">OFFICIAL PAYSLIP</span>
        <div style="font-size:1.05rem; font-weight:800; color:#111827; margin-top:4px;">${s.salary_slip_number}</div>
        <div style="font-size:0.75rem; color:#6b7280;">Pay Period: <strong>${escapeHtml(data.month_name)}</strong></div>
      </div>
    </div>

    <!-- Staff & Payment Meta Grid -->
    <div class="payslip-grid-2col">
      <div style="background:#faf7f8; padding:1rem; border-radius:8px; border:1px solid var(--border);">
        <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:var(--primary-dark); margin-bottom:6px;">Employee Information</div>
        <div style="font-size:1rem; font-weight:700; color:#111827;">${escapeHtml(staff.name || 'Staff')}</div>
        <div style="font-size:0.8rem; color:#4b5563;">Designation: ${escapeHtml(staff.designation || 'Senior Stylist')}</div>
        <div style="font-size:0.8rem; color:#4b5563;">Contact: ${escapeHtml(staff.phone || 'N/A')}</div>
      </div>

      <div style="background:#faf7f8; padding:1rem; border-radius:8px; border:1px solid var(--border);">
        <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:var(--primary-dark); margin-bottom:6px;">Disbursal Details</div>
        <div style="font-size:0.85rem; color:#111827;">Status: <strong>${s.payment_status.toUpperCase()}</strong></div>
        <div style="font-size:0.8rem; color:#4b5563;">Method: ${s.payment_method ? s.payment_method.replace('_', ' ').toUpperCase() : 'Pending'}</div>
        <div style="font-size:0.8rem; color:#4b5563;">Disbursed On: ${s.paid_at ? new Date(s.paid_at).toLocaleDateString() : 'Pending Approval'}</div>
      </div>
    </div>

    <!-- Monthly Salon Incentive Formula Box -->
    <div style="background:#fef9fb; border:1px dashed #f6cbd9; border-radius:8px; padding:0.85rem 1rem; margin-bottom:1.25rem;">
      <div style="font-size:0.75rem; font-weight:700; color:var(--primary-dark); text-transform:uppercase; margin-bottom:4px;">Salon Monthly Target & Incentive Summary</div>
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; font-size:0.8rem; margin-bottom:8px;">
        <div>Target: <strong>${common.formatCurrency(s.monthly_target)}</strong></div>
        <div>Revenue: <strong>${common.formatCurrency(s.monthly_revenue)}</strong></div>
        <div>Total Deductions: <strong>${common.formatCurrency(s.total_expenses_deducted)}</strong></div>
        <div>Remaining Balance: <strong>${common.formatCurrency(s.remaining_amount)}</strong></div>
      </div>
      
      <!-- Dynamic Itemized Overheads -->
      <div style="font-size:0.75rem; color:#4b5563; background:#fff; border:1px solid #fce7f3; border-radius:6px; padding:6px 10px; margin-bottom:4px;">
        <span style="font-weight:700; color:var(--primary-dark);">Itemized Overhead Deductions: </span>
        ${(s.expense_breakdown && s.expense_breakdown.length > 0)
          ? s.expense_breakdown.map(e => `<strong>${escapeHtml(e.name)}:</strong> ${common.formatCurrency(e.amount)}`).join(' &bull; ')
          : `Electricity: ${common.formatCurrency(s.electricity_bill)} &bull; Shop Rent: ${common.formatCurrency(s.shop_rent)} &bull; Petty Cash: ${common.formatCurrency(s.petty_cash)}`}
      </div>
      <div style="font-size:0.72rem; color:#6b7280;">
        * ${s.target_achieved ? '15% Target Incentive unlocked on net remaining balance!' : 'Target in progress — incentive unlocked once monthly revenue threshold is reached.'}
      </div>
    </div>

    <!-- Earnings & Deductions Table -->
    <table class="payslip-breakdown-table">
      <thead>
        <tr>
          <th>Earnings & Incentives</th>
          <th style="text-align:right;">Amount (LKR)</th>
          <th>Deductions & Advances</th>
          <th style="text-align:right;">Amount (LKR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Basic Salary (Fixed)</td>
          <td style="text-align:right; font-weight:600;">${common.formatCurrency(s.basic_salary)}</td>
          <td>Salary Advances / Loans</td>
          <td style="text-align:right; color:#dc2626; font-weight:600;">${common.formatCurrency(s.advances)}</td>
        </tr>
        <tr>
          <td>15% Remaining Profit Incentive</td>
          <td style="text-align:right; color:#059669; font-weight:700;">+ ${common.formatCurrency(s.incentive_amount)}</td>
          <td>Other Deductions</td>
          <td style="text-align:right; color:#dc2626;">${common.formatCurrency(s.other_deductions)}</td>
        </tr>
        <tr>
          <td>Allowances (Travel / Attendance)</td>
          <td style="text-align:right; font-weight:600;">+ ${common.formatCurrency(s.allowances)}</td>
          <td></td>
          <td></td>
        </tr>
        <tr style="background:#faf7f8; font-weight:700;">
          <td>Total Gross Earnings</td>
          <td style="text-align:right; color:var(--primary-dark);">${common.formatCurrency(parseFloat(s.basic_salary) + parseFloat(s.incentive_amount) + parseFloat(s.allowances))}</td>
          <td>Total Deductions</td>
          <td style="text-align:right; color:#dc2626;">${common.formatCurrency(parseFloat(s.advances) + parseFloat(s.other_deductions))}</td>
        </tr>
      </tbody>
    </table>

    <!-- Net Salary Callout Box -->
    <div style="background:linear-gradient(135deg, #fff0f5 0%, #fde8ef 100%); border:2px solid #f9cbd7; border-radius:10px; padding:1.25rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
      <div>
        <span style="font-size:0.75rem; text-transform:uppercase; font-weight:800; color:var(--primary-dark);">NET SALARY PAYABLE</span>
        <div style="font-size:1.85rem; font-weight:800; color:var(--primary-dark); font-family:'Plus Jakarta Sans',sans-serif;">${common.formatCurrency(s.net_salary)}</div>
      </div>
      <div style="text-align:right; font-size:0.8rem; color:#4b5563;">
        Payment Status: <strong>${s.payment_status.toUpperCase()}</strong><br>
        Currency: <strong>LKR</strong>
      </div>
    </div>

    <!-- Signatures -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:3rem; margin-top:2.5rem; padding-top:1.5rem;">
      <div style="border-top:1px dashed #9ca3af; text-align:center; padding-top:6px; font-size:0.8rem; color:#4b5563;">
        Employee Signature
      </div>
      <div style="border-top:1px dashed #9ca3af; text-align:center; padding-top:6px; font-size:0.8rem; color:#4b5563;">
        Authorized Salon Vellora Seal & Signature
      </div>
    </div>

    <div style="text-align:center; font-size:0.7rem; color:#9ca3af; margin-top:2rem;">
      This is an official computer-generated payslip issued by Salon Vellora (Pinnaduwa, Galle).
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function printPayslip() {
  window.print();
}

function downloadPayslipPDF() {
  const element = document.getElementById("payslip-printable-area");
  if (!element || !window.html2pdf) {
    window.print();
    return;
  }

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Salon_Vellora_Payslip_${currentPayslipData?.salary?.salary_slip_number || 'Slip'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
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
