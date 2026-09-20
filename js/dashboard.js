/**
 * SALON VELLORA — DASHBOARD ENGINE
 * Real-time analytics, Chart.js graphs, and live operational feeds
 */

let dailySalesChartInstance = null;
let revenueBreakdownChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  common.initLayout("dashboard", "Operations Dashboard", "Real-time revenue, client bookings, and salon performance");
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const res = await api.get("/dashboard");
    if (!res.success || !res.data) return;

    const { kpis, charts, recent } = res.data;

    // 1. Populate KPI Cards
    document.getElementById("kpi-today-revenue").innerText = common.formatCurrency(kpis.today_revenue);
    document.getElementById("kpi-today-sales").innerText = kpis.today_sales;
    document.getElementById("kpi-today-appointments").innerText = kpis.today_appointments;
    document.getElementById("kpi-total-customers").innerText = kpis.total_customers;
    document.getElementById("kpi-monthly-revenue").innerText = common.formatCurrency(kpis.monthly_revenue);
    document.getElementById("kpi-pending-quotes").innerText = kpis.pending_quotations;
    document.getElementById("kpi-pending-payments").innerText = common.formatCurrency(kpis.pending_payments);
    document.getElementById("kpi-low-stock").innerText = kpis.low_stock_count;

    // 2. Render Daily Sales Chart
    renderDailySalesChart(charts.daily_sales);

    // 3. Render Revenue Breakdown Doughnut Chart
    renderRevenueBreakdownChart(charts.revenue_breakdown);

    // 4. Render Upcoming Appointments Table
    renderUpcomingAppointments(recent.appointments);

    // 5. Render Recent Sales Table
    renderRecentSales(recent.sales);

  } catch (err) {
    console.error("Dashboard Load Error:", err);
    common.showToast("Failed to load dashboard metrics.", "error");
  }
}

function renderDailySalesChart(dailySales) {
  const ctx = document.getElementById("dailySalesChart").getContext("2d");
  const labels = dailySales.map(d => d.date);
  const dataValues = dailySales.map(d => d.total);

  if (dailySalesChartInstance) dailySalesChartInstance.destroy();

  dailySalesChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Sales (LKR)",
        data: dataValues,
        borderColor: "#c95d7e",
        backgroundColor: "rgba(201, 93, 126, 0.12)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#a84262",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Revenue: ${common.formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#f1e4e8" },
          ticks: {
            callback: (val) => `LKR ${Number(val).toLocaleString()}`
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderRevenueBreakdownChart(breakdown) {
  const ctx = document.getElementById("revenueBreakdownChart").getContext("2d");

  if (revenueBreakdownChartInstance) revenueBreakdownChartInstance.destroy();

  const labels = ["Services", "Retail Products", "Bridal Packages"];
  const data = [breakdown.services, breakdown.products, breakdown.packages];

  // If no sales yet, show friendly placeholder
  const total = data.reduce((a, b) => a + b, 0);
  const finalData = total === 0 ? [1, 1, 1] : data;

  revenueBreakdownChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: finalData,
        backgroundColor: ["#c95d7e", "#f092a9", "#8b5cf6"],
        borderWidth: 3,
        borderColor: "#ffffff",
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${total === 0 ? 'No sales yet' : common.formatCurrency(data[ctx.dataIndex])}`
          }
        }
      },
      cutout: "68%"
    }
  });
}

function renderUpcomingAppointments(appointments) {
  const tbody = document.getElementById("upcoming-appointments-body");
  if (!appointments || appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No appointments scheduled for today.</td></tr>`;
    return;
  }

  tbody.innerHTML = appointments.map(apt => `
    <tr>
      <td>
        <div style="font-weight:700;">${common.formatTime(apt.start_time)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${common.formatDate(apt.appointment_date)}</div>
      </td>
      <td>
        <div style="font-weight:600;">${apt.customer ? apt.customer.name : 'Walk-in Client'}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${apt.customer ? apt.customer.phone : ''}</div>
      </td>
      <td>${apt.service ? apt.service.name : (apt.package ? apt.package.name : 'Hair & Beauty Service')}</td>
      <td><span class="badge-custom badge-info">${apt.staff ? apt.staff.name : 'Any Stylist'}</span></td>
      <td><span class="badge-custom badge-${getStatusBadgeClass(apt.status)}">${apt.status}</span></td>
    </tr>
  `).join("");
}

function renderRecentSales(sales) {
  const tbody = document.getElementById("recent-sales-body");
  if (!sales || sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No sales recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = sales.map(s => `
    <tr>
      <td>
        <div style="font-weight:700;color:var(--primary);">${s.invoice_number}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${common.formatDate(s.created_at)}</div>
      </td>
      <td>${s.customer ? s.customer.name : 'Walk-in Customer'}</td>
      <td style="font-weight:700;">${common.formatCurrency(s.grand_total)}</td>
      <td><span class="badge-custom badge-primary" style="text-transform:capitalize;">${s.payment_method}</span></td>
      <td><span class="badge-custom badge-success">${s.status}</span></td>
    </tr>
  `).join("");
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Confirmed': return 'success';
    case 'In Progress': return 'purple';
    case 'Completed': return 'success';
    case 'Cancelled': return 'danger';
    case 'No Show': return 'warning';
    default: return 'info';
  }
}
