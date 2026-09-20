/**
 * SALON VELLORA — EXPENSES ENGINE
 */

let allExpenses = [];
let allExpenseCategories = [];

document.addEventListener("DOMContentLoaded", () => {
  common.initLayout("expenses", "Operational Expenses", "Track utility bills, rent, tea/refreshments, foil and consumable purchases");
  loadExpensesPage();
});

async function loadExpensesPage() {
  await loadExpenseCategories();
  await loadExpenses();
}

async function loadExpenseCategories() {
  try {
    const res = await api.get("/expenses/categories");
    if (res.success && res.data) {
      allExpenseCategories = res.data;
      const select = document.getElementById("exp-cat");
      if (select) {
        select.innerHTML = allExpenseCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
      }
    }
  } catch (e) {}
}

async function loadExpenses() {
  const tbody = document.getElementById("expenses-table-body");
  if (!tbody) return;

  try {
    const res = await api.get("/expenses");
    if (!res.success || !res.data) return;

    allExpenses = res.data.data || res.data;

    if (allExpenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No expenses recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allExpenses.map(e => `
      <tr>
        <td style="font-family:monospace;font-weight:700;color:var(--primary);">${e.expense_number}</td>
        <td><b>${e.title}</b></td>
        <td><span class="badge-custom badge-primary">${e.category ? e.category.name : '-'}</span></td>
        <td>${common.formatDate(e.expense_date)}</td>
        <td style="text-transform:capitalize;">${e.payment_method}</td>
        <td style="font-weight:700;color:var(--danger);">${common.formatCurrency(e.amount)}</td>
        <td>${e.user ? e.user.name : 'Staff'}</td>
        <td style="text-align:right;">
          <button class="btn-soft-pink" style="padding:4px 8px;font-size:0.75rem;" onclick="deleteExpense(${e.id})" title="Delete Entry">
            <i data-lucide="trash-2" style="width:14px;"></i>
          </button>
        </td>
      </tr>
    `).join("");

    if (window.lucide) lucide.createIcons();

  } catch (e) {
    common.showToast("Failed to load expenses.", "error");
  }
}

function openExpenseModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("exp-date").value = today;
  document.getElementById("exp-title").value = "";
  document.getElementById("exp-amount").value = "";
  document.getElementById("exp-notes").value = "";

  document.getElementById("expense-modal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}
function closeExpenseModal() {
  document.getElementById("expense-modal").classList.remove("active");
}

async function handleSaveExpense(e) {
  e.preventDefault();

  const payload = {
    title: document.getElementById("exp-title").value.trim(),
    category_id: parseInt(document.getElementById("exp-cat").value),
    amount: parseFloat(document.getElementById("exp-amount").value),
    expense_date: document.getElementById("exp-date").value,
    payment_method: document.getElementById("exp-method").value,
    notes: document.getElementById("exp-notes").value.trim() || undefined,
  };

  const btn = document.getElementById("btn-save-exp");
  btn.disabled = true;

  try {
    await api.post("/expenses", payload);
    common.showToast("Expense logged successfully.", "success");
    closeExpenseModal();
    loadExpenses();
  } catch (err) {
    common.showToast(err.message || "Failed to log expense.", "error");
  } finally {
    btn.disabled = false;
  }
}

async function deleteExpense(id) {
  common.showConfirm({
    title: "Delete Expense?",
    message: "Are you sure you want to remove this expense entry?",
    confirmText: "Delete",
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/expenses/${id}`);
        common.showToast("Expense deleted.", "info");
        loadExpenses();
      } catch (e) {
        common.showToast("Failed to delete expense.", "error");
      }
    }
  });
}
