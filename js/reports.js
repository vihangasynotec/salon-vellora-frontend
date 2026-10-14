/**
 * SALON VELLORA — REPORTS & ANALYTICS ENGINE
 */

let currentReportData = null;

document.addEventListener("DOMContentLoaded", () => {
  common.initLayout("reports", "Reports & Analytics", "Financial performance, net profits, quotation conversion & stylist commission breakdowns");

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  document.getElementById("rep-start-date").value = firstDay.toISOString().split('T')[0];
  document.getElementById("rep-end-date").value = today.toISOString().split('T')[0];

  loadReportsData();
});

async function loadReportsData() {
  const startDate = document.getElementById("rep-start-date").value;
  const endDate = document.getElementById("rep-end-date").value;

  try {
    const res = await api.get("/reports/summary", { start_date: startDate, end_date: endDate });
    if (!res.success || !res.data) return;

    currentReportData = res.data;
    const { financials, quotations, top_services, staff_performance } = currentReportData;

    // Financials
    document.getElementById("rep-rev").innerText = common.formatCurrency(financials.total_revenue);
    document.getElementById("rep-exp").innerText = common.formatCurrency(financials.total_expenses);
    document.getElementById("rep-profit").innerText = common.formatCurrency(financials.net_profit);
    document.getElementById("rep-sales-count").innerText = financials.total_sales;

    // Quotations
    document.getElementById("rep-q-total").innerText = quotations.total;
    document.getElementById("rep-q-approved").innerText = quotations.approved;
    document.getElementById("rep-q-converted").innerText = quotations.converted;
    document.getElementById("rep-q-rate").innerText = `${quotations.conversion_rate}%`;
    document.getElementById("rep-q-conv-val").innerText = common.formatCurrency(quotations.converted_value);

    // Top Services Table
    const topSrvTbody = document.getElementById("rep-top-services-tbody");
    if (!top_services || top_services.length === 0) {
      topSrvTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:2rem;color:var(--text-muted);">No services sold in selected period.</td></tr>`;
    } else {
      topSrvTbody.innerHTML = top_services.map(s => `
        <tr>
          <td><b>${s.name}</b></td>
          <td style="font-weight:700;">${s.total_qty}</td>
          <td style="font-weight:700;color:var(--primary-dark);">${common.formatCurrency(s.total_sales)}</td>
        </tr>
      `).join("");
    }

    // Staff Performance Table
    const staffTbody = document.getElementById("rep-staff-tbody");
    if (!staff_performance || staff_performance.length === 0) {
      staffTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No staff records found.</td></tr>`;
    } else {
      staffTbody.innerHTML = staff_performance.map(st => `
        <tr>
          <td><b>${st.name}</b> (${st.designation})</td>
          <td>${st.appointments_count}</td>
          <td style="font-weight:700;">${common.formatCurrency(st.revenue_generated)}</td>
          <td style="font-weight:700;color:#059669;">${common.formatCurrency(st.commission_earned)}</td>
        </tr>
      `).join("");
    }

  } catch (err) {
    console.error("Load reports error:", err);
    common.showToast("Failed to generate report summary.", "error");
  }
}

function exportReportCSV() {
  if (!currentReportData) {
    common.showToast("No report data to export.", "warning");
    return;
  }

  const { financials, quotations, top_services, staff_performance, period } = currentReportData;

  let csv = `SALON VELLORA — BUSINESS REPORT (${period.start} to ${period.end})\n\n`;
  csv += `FINANCIAL OVERVIEW\n`;
  csv += `Total Revenue,${financials.total_revenue}\n`;
  csv += `Total Expenses,${financials.total_expenses}\n`;
  csv += `Net Profit,${financials.net_profit}\n`;
  csv += `Total Bills,${financials.total_sales}\n\n`;

  csv += `QUOTATION PERFORMANCE\n`;
  csv += `Total Quoted,${quotations.total}\n`;
  csv += `Approved,${quotations.approved}\n`;
  csv += `Converted,${quotations.converted}\n`;
  csv += `Conversion Rate,${quotations.conversion_rate}%\n`;
  csv += `Converted Value,${quotations.converted_value}\n\n`;

  csv += `TOP REVENUE SERVICES\n`;
  csv += `Service Name,Qty Sold,Total Sales\n`;
  top_services.forEach(s => {
    csv += `"${s.name}",${s.total_qty},${s.total_sales}\n`;
  });
  csv += `\n`;

  csv += `STAFF PERFORMANCE\n`;
  csv += `Stylist Name,Appointments,Revenue,Commission\n`;
  staff_performance.forEach(st => {
    csv += `"${st.name}",${st.appointments_count},${st.revenue_generated},${st.commission_earned}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Salon_Vellora_Report_${period.start}_${period.end}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printExecutiveReport() {
  if (!currentReportData) {
    common.showToast("No report data loaded to print.", "warning");
    return;
  }
  const html = PrintEngine.generateA4Report(currentReportData);
  PrintEngine.printA4(html);
}

function downloadReportPdf() {
  if (!currentReportData) {
    common.showToast("No report data loaded to download.", "warning");
    return;
  }
  const html = PrintEngine.generateA4Report(currentReportData);
  const p = currentReportData.period || { start: "from", end: "to" };
  PrintEngine.downloadAsPdf(html, `Salon_Vellora_Executive_Report_${p.start}_${p.end}.pdf`, 'a4');
}

function shareReportWhatsApp() {
  if (!currentReportData) {
    common.showToast("No report data loaded to share on WhatsApp.", "warning");
    return;
  }
  WhatsAppShare.shareExecutiveReport(currentReportData);
}

