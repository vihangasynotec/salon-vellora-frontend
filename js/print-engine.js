/**
 * SALON VELLORA — ULTRA-LUXURY PRINT & PDF EXPORT ENGINE
 * Handles 80mm ESC/POS thermal receipts and standard A4 invoices, quotations & reports
 * Supports instant direct printing and crisp vector-quality PDF downloading
 */

const PrintEngine = {
  salonInfo: {
    name: "Salon Vellora",
    tagline: "Ladies Salon & Bridal Dressing",
    address: "Galwatawaththa Junction, Pinnaduwa, Galle, Sri Lanka",
    phone: "074 084 4739",
    email: "salonvellora26@gmail.com",
    hours: "Tue - Sun: 9:00 AM - 7:00 PM (Mon Closed)",
    regNo: "PV-2026/GAL/084",
    bank: {
      bankName: "Commercial Bank of Ceylon",
      accountName: "Salon Vellora (Pvt) Ltd",
      accountNo: "8009 1234 5678",
      branch: "Galle Main Branch"
    }
  },

  getAssetPrefix() {
    return (typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.includes('/pages/')) ? '../' : '';
  },

  /**
   * Generates next-level Luxury 80mm Thermal Receipt HTML (Precision 80mm ESC/POS Roll Paper)
   */
  generateThermalReceipt(sale) {
    const s = sale || {};
    const prefix = this.getAssetPrefix();
    const info = this.salonInfo;
    const items = s.items || [];
    const cashierName = s.cashier ? s.cashier.name : "Cashier Desk";
    const customerName = s.customer ? s.customer.name : "Walk-in Client";
    const customerPhone = s.customer && s.customer.phone ? s.customer.phone : "";
    const createdDate = s.created_at ? new Date(s.created_at) : new Date();
    const dateStr = createdDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = createdDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const subtotal = parseFloat(s.subtotal || s.grand_total || 0);
    const discount = parseFloat(s.discount_amount || 0);
    const grandTotal = parseFloat(s.grand_total || 0);
    const paidAmount = parseFloat(s.paid_amount || grandTotal);
    const changeAmount = parseFloat(s.change_amount || 0);
    const paymentMethod = (s.payment_method || "CASH").toUpperCase();
    const invoiceNum = s.invoice_number || "SV-INV-000000";

    // Loyalty points (1 point per 100 LKR)
    const pointsEarned = Math.floor(grandTotal / 100);

    let itemsRows = items.map((item, idx) => {
      const unitPrice = parseFloat(item.unit_price || item.price || item.total_price);
      const total = parseFloat(item.total_price);
      const qty = item.quantity || 1;
      const staffName = item.staff ? (item.staff.name || item.staff) : "";

      return `
        <tr style="border-bottom: 1px dashed #d1d5db;">
          <td style="padding: 6px 0; vertical-align: top; text-align: left;">
            <div style="font-weight: 700; color: #000000; font-size: 11px; line-height: 1.25;">${idx + 1}. ${item.name}</div>
            ${staffName ? `<div style="font-size: 9px; color: #4b5563; font-style: italic;">Stylist: ${staffName}</div>` : ''}
            <div style="font-size: 9.5px; color: #374151; margin-top: 1px;">${qty} &times; LKR ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </td>
          <td style="padding: 6px 0; vertical-align: top; text-align: right; font-weight: 800; color: #000000; font-size: 11px; white-space: nowrap;">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    }).join("");

    return `
      <div class="luxury-receipt-container" style="width: 72mm; margin: 0 auto; background: #ffffff; padding: 10px 12px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; line-height: 1.35; color: #000000;">
        
        <!-- Brand Header with Circular Logo -->
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="display: inline-block; padding: 2px; border: 1.5px solid #000000; border-radius: 50%; margin-bottom: 4px;">
            <img src="${prefix}assets/logocircel.jpg" alt="Salon Vellora" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; display: block;" onerror="this.style.display='none'">
          </div>
          <div style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 19px; font-weight: 900; letter-spacing: 0.8px; color: #000000; line-height: 1.15; text-transform: uppercase;">SALON VELLORA</div>
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #222222; margin-top: 2px;">Luxury Bridal & Hair Studio</div>
          <div style="font-size: 8.5px; color: #444444; margin-top: 2px; line-height: 1.3;">Galwatawaththa Junction, Pinnaduwa, Galle</div>
          <div style="font-size: 9px; font-weight: 700; color: #000000; margin-top: 2px;">Hotline: 074 084 4739</div>
        </div>

        <!-- Ornamental Divider -->
        <div style="display: flex; align-items: center; justify-content: center; margin: 6px 0; gap: 6px;">
          <div style="flex: 1; height: 1px; border-bottom: 1px dashed #000000;"></div>
          <div style="font-size: 10px; color: #000000; font-weight: 700;">✦ &nbsp; ❖ &nbsp; ✦</div>
          <div style="flex: 1; height: 1px; border-bottom: 1px dashed #000000;"></div>
        </div>

        <!-- Bill Metadata Box -->
        <div style="border: 1px dashed #000000; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; font-size: 9.5px; background: #fafafa;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #4b5563;">Invoice No:</span>
            <span style="font-weight: 800; color: #000000; font-family: monospace; font-size: 10.5px;">${invoiceNum}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #4b5563;">Date & Time:</span>
            <span style="font-weight: 600; color: #000000;">${dateStr} &bull; ${timeStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #4b5563;">Client:</span>
            <span style="font-weight: 700; color: #000000;">${customerName} ${customerPhone ? `(${customerPhone})` : ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #4b5563;">Staff / Cashier:</span>
            <span style="font-weight: 600; color: #000000;">${cashierName}</span>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
          <thead>
            <tr style="border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; font-size: 9px; text-transform: uppercase; color: #000000;">
              <th style="text-align: left; padding: 4px 0; font-weight: 800;">Service / Description</th>
              <th style="text-align: right; padding: 4px 0; font-weight: 800;">LKR</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals & Payment Section -->
        <div style="border-top: 1.5px solid #000000; padding-top: 4px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #374151;">
            <span>Subtotal:</span>
            <span style="font-weight: 600;">LKR ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: #000000; font-weight: 600;">
            <span>Discount Applied:</span>
            <span>- LKR ${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>` : ''}

          <!-- High-Contrast Solid Black Grand Total Badge -->
          <div style="background: #000000; color: #ffffff; border-radius: 4px; padding: 6px 8px; margin: 6px 0; display: flex; justify-content: space-between; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #ffffff;">TOTAL AMOUNT</span>
            <span style="font-size: 14px; font-weight: 900; color: #ffffff;">LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <!-- Payment Breakdown -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 9.5px; color: #374151;">
            <span>Payment Mode:</span>
            <span style="font-weight: 700; color: #000000;">${paymentMethod}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 9.5px; color: #374151;">
            <span>Amount Paid:</span>
            <span style="font-weight: 700; color: #000000;">LKR ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          ${changeAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 9.5px; color: #000000; font-weight: 700;">
            <span>Change Returned:</span>
            <span>LKR ${changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>` : ''}
        </div>

        <!-- Loyalty Points Badge -->
        <div style="border: 1px solid #000000; border-radius: 4px; padding: 4px 6px; margin: 8px 0; text-align: center; font-size: 9px; color: #000000; font-weight: 700; background: #fafafa;">
          ✨ Loyalty Reward: +${pointsEarned} Points Added!
        </div>

        <!-- High-Definition SVG Barcode -->
        <div style="text-align: center; margin: 8px 0 4px;">
          <svg style="width: 160px; height: 32px; margin: 0 auto; display: block;" viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="32" fill="#ffffff"/>
            <!-- Crisp simulated barcode bars -->
            <rect x="10" y="2" width="2" height="28" fill="#000000"/>
            <rect x="14" y="2" width="1" height="28" fill="#000000"/>
            <rect x="17" y="2" width="3" height="28" fill="#000000"/>
            <rect x="22" y="2" width="1" height="28" fill="#000000"/>
            <rect x="25" y="2" width="2" height="28" fill="#000000"/>
            <rect x="29" y="2" width="4" height="28" fill="#000000"/>
            <rect x="35" y="2" width="1" height="28" fill="#000000"/>
            <rect x="38" y="2" width="2" height="28" fill="#000000"/>
            <rect x="42" y="2" width="3" height="28" fill="#000000"/>
            <rect x="47" y="2" width="1" height="28" fill="#000000"/>
            <rect x="50" y="2" width="2" height="28" fill="#000000"/>
            <rect x="54" y="2" width="3" height="28" fill="#000000"/>
            <rect x="59" y="2" width="1" height="28" fill="#000000"/>
            <rect x="62" y="2" width="4" height="28" fill="#000000"/>
            <rect x="68" y="2" width="2" height="28" fill="#000000"/>
            <rect x="72" y="2" width="1" height="28" fill="#000000"/>
            <rect x="75" y="2" width="3" height="28" fill="#000000"/>
            <rect x="80" y="2" width="2" height="28" fill="#000000"/>
            <rect x="84" y="2" width="1" height="28" fill="#000000"/>
            <rect x="87" y="2" width="3" height="28" fill="#000000"/>
            <rect x="92" y="2" width="4" height="28" fill="#000000"/>
            <rect x="98" y="2" width="1" height="28" fill="#000000"/>
            <rect x="101" y="2" width="2" height="28" fill="#000000"/>
            <rect x="105" y="2" width="3" height="28" fill="#000000"/>
            <rect x="110" y="2" width="2" height="28" fill="#000000"/>
            <rect x="114" y="2" width="1" height="28" fill="#000000"/>
            <rect x="117" y="2" width="3" height="28" fill="#000000"/>
            <rect x="122" y="2" width="4" height="28" fill="#000000"/>
            <rect x="128" y="2" width="1" height="28" fill="#000000"/>
            <rect x="131" y="2" width="2" height="28" fill="#000000"/>
            <rect x="135" y="2" width="3" height="28" fill="#000000"/>
            <rect x="140" y="2" width="1" height="28" fill="#000000"/>
            <rect x="143" y="2" width="2" height="28" fill="#000000"/>
            <rect x="147" y="2" width="3" height="28" fill="#000000"/>
          </svg>
          <div style="font-size: 8.5px; color: #444444; font-family: monospace; font-weight: 700; margin-top: 2px;">${invoiceNum}</div>
        </div>

        <!-- Footer Thank You & Socials -->
        <div style="text-align: center; font-size: 8.5px; color: #444444; border-top: 1px dashed #000000; padding-top: 6px; margin-top: 6px;">
          <div style="font-weight: 800; color: #000000; font-size: 9.5px; margin-bottom: 2px;">Thank you for choosing Salon Vellora!</div>
          <div style="font-style: italic; margin-bottom: 3px;">Feel beautiful, confident & radiant.</div>
          <div>Appointments: <b>074 084 4739</b></div>
          <div style="font-size: 8px; color: #666666; margin-top: 4px;">- - - - - - - - - - - - - - - - - - - - - - - - - -</div>
          <div style="font-size: 7.5px; color: #888888; margin-top: 1px;">Please retain this receipt for warranty & records</div>
        </div>

      </div>
    `;
  },

  /**
   * Generates next-level Luxury A4 Tax Invoice HTML
   */
  generateA4Invoice(sale) {
    const s = sale || {};
    const prefix = this.getAssetPrefix();
    const info = this.salonInfo;
    const items = s.items || [];
    const cashierName = s.cashier ? s.cashier.name : "Vellora Cashier";
    const customer = s.customer || {};
    const customerName = customer.name || "Valued Client";
    const customerPhone = customer.phone || "N/A";
    const customerEmail = customer.email || "N/A";
    const customerAddress = customer.address || "Galle, Sri Lanka";

    const createdDate = s.created_at ? new Date(s.created_at) : new Date();
    const dateFormatted = createdDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    
    const subtotal = parseFloat(s.subtotal || s.grand_total || 0);
    const discount = parseFloat(s.discount_amount || 0);
    const tax = parseFloat(s.tax_amount || 0);
    const grandTotal = parseFloat(s.grand_total || 0);
    const paidAmount = parseFloat(s.paid_amount || grandTotal);
    const changeAmount = parseFloat(s.change_amount || 0);
    const paymentMethod = (s.payment_method || "CASH").toUpperCase();
    const invoiceNum = s.invoice_number || "SV-INV-000000";

    let rowsHtml = items.map((item, idx) => {
      const unitPrice = parseFloat(item.unit_price || item.price || item.total_price);
      const total = parseFloat(item.total_price);
      const qty = item.quantity || 1;
      const typeLabel = (item.item_type || "service").toUpperCase();
      return `
        <tr style="border-bottom: 1px solid #f3e8eb;">
          <td style="padding: 6px 8px; font-weight: 600; color: #6b7280; font-size: 10px;">${idx + 1}</td>
          <td style="padding: 6px 8px;">
            <div style="font-weight: 700; color: #1f2937; font-size: 11.5px;">${item.name}</div>
            <div style="font-size: 8.5px; color: #C95D7E; text-transform: uppercase; font-weight: 600;">${typeLabel}</div>
          </td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 600; color: #374151; font-size: 11px;">${qty}</td>
          <td style="padding: 6px 8px; text-align: right; color: #374151; font-size: 11px;">LKR ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #111827; font-size: 11.5px;">LKR ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="luxury-a4-wrapper luxury-half-a4-invoice" style="width: 100%; max-width: 720px; margin: 0 auto; background: #ffffff; padding: 20px 24px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header Banner with Gold/Blush Border -->
        <div style="border-bottom: 2px solid #C95D7E; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${prefix}assets/logocircel.jpg" alt="Salon Vellora" style="width: 52px; height: 52px; border-radius: 12px; object-fit: cover; border: 1.5px solid #C95D7E; box-shadow: 0 2px 8px rgba(201,93,126,0.15);" onerror="this.src='${prefix}assets/salonvelora.png'">
            <div>
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 800; color: #C95D7E; margin: 0; line-height: 1.15; letter-spacing: 0.5px;">SALON VELLORA</h1>
              <div style="font-size: 9.5px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 2px;">Ladies Salon & Bridal Dressing</div>
              <div style="font-size: 9px; color: #6b7280; margin-top: 2px;">Galwatawaththa Junction, Pinnaduwa, Galle, Sri Lanka</div>
              <div style="font-size: 9px; color: #6b7280;">Tel: <b>074 084 4739</b> | Email: salonvellora26@gmail.com</div>
            </div>
          </div>

          <div style="text-align: right;">
            <div style="display: inline-block; background: #C95D7E; color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 14px; margin-bottom: 5px;">TAX INVOICE</div>
            <div style="font-family: monospace; font-size: 13.5px; font-weight: 800; color: #111827;">${invoiceNum}</div>
            <div style="font-size: 9.5px; color: #6b7280; margin-top: 2px;">Date: <b>${dateFormatted}</b></div>
            <div style="font-size: 9.5px; color: #059669; font-weight: 700; margin-top: 1px;">STATUS: PAID IN FULL</div>
          </div>
        </div>

        <!-- 2-Column Client & Bill Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div style="background: #fdf2f5; border: 1px solid #fce7ec; border-radius: 8px; padding: 8px 12px;">
            <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #C95D7E; margin-bottom: 4px;">BILLED TO (CLIENT)</div>
            <div style="font-size: 12.5px; font-weight: 700; color: #111827; margin-bottom: 2px;">${customerName}</div>
            <div style="font-size: 9.5px; color: #4b5563; margin-bottom: 1px;">Phone: <b>${customerPhone}</b></div>
            <div style="font-size: 9.5px; color: #4b5563; margin-bottom: 1px;">Email: ${customerEmail}</div>
            <div style="font-size: 9.5px; color: #4b5563;">Address: ${customerAddress}</div>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px;">
            <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #4b5563; margin-bottom: 4px;">PAYMENT & SERVICE DETAILS</div>
            <div style="display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 2px;">
              <span style="color: #6b7280;">Payment Method:</span>
              <span style="font-weight: 700; color: #111827;">${paymentMethod}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 2px;">
              <span style="color: #6b7280;">Handled By (Cashier):</span>
              <span style="font-weight: 600; color: #111827;">${cashierName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 2px;">
              <span style="color: #6b7280;">Business Reg. No:</span>
              <span style="font-weight: 600; color: #111827;">${info.regNo}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
              <span style="color: #6b7280;">Currency:</span>
              <span style="font-weight: 700; color: #C95D7E;">Sri Lankan Rupee (LKR)</span>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <thead>
            <tr style="background: #fdf2f5; border-top: 1.5px solid #C95D7E; border-bottom: 1.5px solid #C95D7E;">
              <th style="padding: 6px 8px; text-align: left; font-size: 9.5px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 28px;">#</th>
              <th style="padding: 6px 8px; text-align: left; font-size: 9.5px; font-weight: 700; color: #C95D7E; text-transform: uppercase;">Description / Treatment</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 9.5px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 45px;">Qty</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 9.5px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 110px;">Unit Rate</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 9.5px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 115px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Totals & Payment Summary Box -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 16px;">
          <!-- Bank Transfer & Notes Info -->
          <div style="flex: 1; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 6px; padding: 7px 10px; font-size: 9px; color: #4b5563;">
            <div style="font-weight: 700; color: #111827; margin-bottom: 2px; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.5px;">Bank Payment Details</div>
            <div>Bank: <b>${info.bank.bankName}</b></div>
            <div>Account Name: <b>${info.bank.accountName}</b></div>
            <div>Account No: <b style="font-family: monospace;">${info.bank.accountNo}</b> (${info.bank.branch})</div>
            <div style="margin-top: 3px; font-size: 8px; color: #6b7280;">Thank you for trusting Salon Vellora with your beauty & bridal transformation.</div>
          </div>

          <!-- Totals Calculation Table -->
          <div style="width: 250px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
              <tr>
                <td style="padding: 2.5px 0; color: #6b7280;">Subtotal:</td>
                <td style="padding: 2.5px 0; text-align: right; font-weight: 600; color: #111827;">LKR ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="padding: 2.5px 0; color: #059669;">Special Discount:</td>
                <td style="padding: 2.5px 0; text-align: right; font-weight: 600; color: #059669;">- LKR ${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
              ${tax > 0 ? `
              <tr>
                <td style="padding: 2.5px 0; color: #6b7280;">Tax (VAT):</td>
                <td style="padding: 2.5px 0; text-align: right; font-weight: 600; color: #111827;">LKR ${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
              <tr style="border-top: 1.5px solid #C95D7E; border-bottom: 1.5px solid #C95D7E;">
                <td style="padding: 5px 0; font-size: 11.5px; font-weight: 800; color: #C95D7E; text-transform: uppercase;">GRAND TOTAL:</td>
                <td style="padding: 5px 0; text-align: right; font-size: 13.5px; font-weight: 800; color: #C95D7E;">LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0 1px; color: #6b7280; font-size: 9px;">Amount Tendered (${paymentMethod}):</td>
                <td style="padding: 3px 0 1px; text-align: right; font-weight: 700; color: #111827; font-size: 9px;">LKR ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${changeAmount > 0 ? `
              <tr>
                <td style="padding: 1px 0; color: #C95D7E; font-size: 9px; font-weight: 600;">Change Balance:</td>
                <td style="padding: 1px 0; text-align: right; font-weight: 700; color: #C95D7E; font-size: 9px;">LKR ${changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
            </table>
          </div>
        </div>

        <!-- Terms & Signatures -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="font-size: 8.5px; color: #9ca3af; max-width: 320px; line-height: 1.3;">
            <b>Important Notice:</b> All bridal reservations and chemical salon treatments (rebonding, keratin, color) are non-refundable once performed. Products sold may be exchanged within 7 days in unopened condition.
          </div>

          <div style="text-align: center; min-width: 170px;">
            <div style="font-family: 'Playfair Display', cursive, serif; font-size: 18px; font-style: italic; color: #C95D7E; margin-bottom: 2px; letter-spacing: 0.5px;">Salon Vellora</div>
            <div style="width: 160px; border-top: 1px solid #9ca3af; margin: 0 auto 3px;"></div>
            <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #374151;">Authorized Seal & Signature</div>
            <div style="font-size: 9px; font-weight: 600; color: #6b7280; margin-top: 1px;">Salon Vellora Signature</div>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Generates next-level Luxury A4 Quotation HTML
   */
  generateA4Quotation(q) {
    const qtn = q || {};
    const prefix = this.getAssetPrefix();
    const info = this.salonInfo;
    const items = qtn.items || [];
    const customer = qtn.customer || {};
    const customerName = customer.name || "Valued Bridal Client";
    const customerPhone = customer.phone || "N/A";
    const customerEmail = customer.email || "N/A";
    const customerAddress = customer.address || "Galle, Sri Lanka";

    const createdDate = qtn.created_at ? new Date(qtn.created_at) : new Date();
    const dateFormatted = createdDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const validUntilFormatted = qtn.valid_until ? new Date(qtn.valid_until).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "30 Days from Issue";

    const subtotal = parseFloat(qtn.subtotal || qtn.total_amount || 0);
    const discount = parseFloat(qtn.discount_amount || 0);
    const grandTotal = parseFloat(qtn.total_amount || 0);
    const qtnNum = qtn.quotation_number || "QTN-2026-000001";
    const status = (qtn.status || "DRAFT").toUpperCase();

    let rowsHtml = items.map((item, idx) => {
      const unitPrice = parseFloat(item.unit_price || item.price || item.total_price);
      const total = parseFloat(item.total_price);
      const qty = item.quantity || 1;
      const typeLabel = (item.item_type || "service").toUpperCase();
      return `
        <tr style="border-bottom: 1px solid #f3e8eb;">
          <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 11px;">${idx + 1}</td>
          <td style="padding: 10px 12px;">
            <div style="font-weight: 700; color: #1f2937; font-size: 13px;">${item.name}</div>
            <div style="font-size: 10px; color: #C95D7E; text-transform: uppercase; font-weight: 600;">${typeLabel}</div>
          </td>
          <td style="padding: 10px 12px; text-align: center; font-weight: 600; color: #374151; font-size: 12px;">${qty}</td>
          <td style="padding: 10px 12px; text-align: right; color: #374151; font-size: 12px;">LKR ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #111827; font-size: 12.5px;">LKR ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="luxury-a4-wrapper" style="width: 100%; max-width: 800px; margin: 0 auto; background: #ffffff; padding: 35px 40px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header Banner with Gold/Blush Border -->
        <div style="border-bottom: 3px double #C95D7E; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${prefix}assets/logocircel.jpg" alt="Salon Vellora" style="width: 72px; height: 72px; border-radius: 16px; object-fit: cover; border: 2px solid #C95D7E; box-shadow: 0 4px 10px rgba(201,93,126,0.15);" onerror="this.src='${prefix}assets/salonvelora.png'">
            <div>
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 800; color: #C95D7E; margin: 0; line-height: 1.15;">SALON VELLORA</h1>
              <div style="font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px;">Ladies Salon & Bridal Dressing</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Galwatawaththa Junction, Pinnaduwa, Galle, Sri Lanka</div>
              <div style="font-size: 11px; color: #6b7280;">Tel: <b>074 084 4739</b> | Email: salonvellora26@gmail.com</div>
            </div>
          </div>

          <div style="text-align: right;">
            <div style="display: inline-block; background: #1f2937; color: #fbcfe8; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 20px; margin-bottom: 8px;">OFFICIAL QUOTATION</div>
            <div style="font-family: monospace; font-size: 15px; font-weight: 800; color: #C95D7E;">${qtnNum}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">Date: <b>${dateFormatted}</b></div>
            <div style="font-size: 11px; color: #b45309; font-weight: 700; margin-top: 2px;">VALID UNTIL: ${validUntilFormatted}</div>
          </div>
        </div>

        <!-- 2-Column Client & Quotation Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
          <div style="background: #fdf2f5; border: 1px solid #fce7ec; border-radius: 10px; padding: 14px 18px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #C95D7E; margin-bottom: 8px;">PREPARED FOR (CLIENT)</div>
            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 3px;">${customerName}</div>
            <div style="font-size: 11.5px; color: #4b5563; margin-bottom: 2px;">Phone: <b>${customerPhone}</b></div>
            <div style="font-size: 11.5px; color: #4b5563; margin-bottom: 2px;">Email: ${customerEmail}</div>
            <div style="font-size: 11.5px; color: #4b5563;">Location: ${customerAddress}</div>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; margin-bottom: 8px;">PROPOSAL HIGHLIGHTS</div>
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
              <span style="color: #6b7280;">Quotation Status:</span>
              <span style="font-weight: 700; color: #C95D7E;">${status}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
              <span style="color: #6b7280;">Bridal Dressing Slot:</span>
              <span style="font-weight: 600; color: #111827;">Subject to 30% Advance</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
              <span style="color: #6b7280;">Trial & Consultation:</span>
              <span style="font-weight: 600; color: #111827;">Included in Bridal Packages</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11.5px;">
              <span style="color: #6b7280;">Currency:</span>
              <span style="font-weight: 700; color: #C95D7E;">Sri Lankan Rupee (LKR)</span>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr style="background: #fdf2f5; border-top: 2px solid #C95D7E; border-bottom: 2px solid #C95D7E;">
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 40px;">#</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #C95D7E; text-transform: uppercase;">Treatment / Package Items</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 60px;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 130px;">Rate</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #C95D7E; text-transform: uppercase; width: 140px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Totals & Deposit Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; gap: 30px;">
          <!-- Bank Details -->
          <div style="flex: 1; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #4b5563;">
            <div style="font-weight: 700; color: #111827; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Advance Payment Account</div>
            <div>Bank: <b>${info.bank.bankName}</b></div>
            <div>Account Name: <b>${info.bank.accountName}</b></div>
            <div>Account No: <b style="font-family: monospace;">${info.bank.accountNo}</b></div>
            <div style="margin-top: 6px; font-size: 10px; color: #6b7280;">Please state your quotation number as reference when making bank transfer.</div>
          </div>

          <!-- Totals Table -->
          <div style="width: 320px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">Subtotal:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #111827;">LKR ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="padding: 5px 0; color: #059669;">Seasonal Privilege Discount:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #059669;">- LKR ${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
              <tr style="border-top: 2px solid #C95D7E; border-bottom: 2px solid #C95D7E;">
                <td style="padding: 9px 0; font-size: 14px; font-weight: 800; color: #C95D7E; text-transform: uppercase;">PROPOSED TOTAL:</td>
                <td style="padding: 9px 0; text-align: right; font-size: 16px; font-weight: 800; color: #C95D7E;">LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Terms & Client Acceptance -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="text-align: center;">
            <div style="width: 180px; border-top: 1px solid #9ca3af; margin: 30px auto 4px;"></div>
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563;">Client Acceptance Signature</div>
            <div style="font-size: 9px; color: #9ca3af;">Date: ____ / ____ / 2026</div>
          </div>

          <div style="text-align: center;">
            <div style="font-family: 'Playfair Display', cursive, serif; font-size: 18px; font-style: italic; color: #C95D7E; margin-bottom: 2px;">Salon Vellora</div>
            <div style="width: 180px; border-top: 1px solid #9ca3af; margin: 0 auto 4px;"></div>
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563;">Authorized Stylist Seal</div>
            <div style="font-size: 9.5px; font-weight: 600; color: #6b7280; margin-top: 1px;">Salon Vellora Signature</div>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Generates next-level Luxury A4 Executive Report HTML
   */
  generateA4Report(reportData) {
    const data = reportData || {};
    const prefix = this.getAssetPrefix();
    const info = this.salonInfo;
    const fin = data.financials || {};
    const qtn = data.quotations || {};
    const topServices = data.top_services || [];
    const staff = data.staff_performance || [];
    const period = data.period || { start: "Start of Month", end: "Today" };

    const topRows = topServices.slice(0, 8).map((s, i) => `
      <tr style="border-bottom: 1px solid #fce7ec;">
        <td style="padding: 7px 10px; font-size: 11px; color: #6b7280;">${i + 1}</td>
        <td style="padding: 7px 10px; font-weight: 700; font-size: 12px; color: #111827;">${s.name}</td>
        <td style="padding: 7px 10px; text-align: center; font-weight: 600; font-size: 11.5px;">${s.total_qty}</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 700; font-size: 12px; color: #C95D7E;">LKR ${parseFloat(s.total_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    const staffRows = staff.map(st => `
      <tr style="border-bottom: 1px solid #f3e8eb;">
        <td style="padding: 7px 10px; font-weight: 700; font-size: 12px; color: #111827;">${st.name}</td>
        <td style="padding: 7px 10px; font-size: 11px; color: #6b7280;">${st.designation || 'Stylist'}</td>
        <td style="padding: 7px 10px; text-align: center; font-weight: 600; font-size: 11.5px;">${st.appointments_count || 0}</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 700; font-size: 12px; color: #059669;">LKR ${parseFloat(st.commission_earned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    return `
      <div class="luxury-a4-wrapper" style="width: 100%; max-width: 800px; margin: 0 auto; background: #ffffff; padding: 35px 40px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; border: 1px solid #e5e7eb; border-radius: 12px;">
        
        <!-- Header -->
        <div style="border-bottom: 3px double #C95D7E; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${prefix}assets/logocircel.jpg" alt="Salon Vellora" style="width: 64px; height: 64px; border-radius: 14px; object-fit: cover; border: 2px solid #C95D7E;" onerror="this.src='${prefix}assets/salonvelora.png'">
            <div>
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 800; color: #C95D7E; margin: 0;">SALON VELLORA</h1>
              <div style="font-size: 10px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 1px;">Executive Performance & Financial Intelligence Report</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">Reporting Period: <b>${period.start}</b> to <b>${period.end}</b></div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #1f2937; color: #ffffff; font-weight: 800; font-size: 12px; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; display: inline-block;">CONFIDENTIAL</div>
            <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">Generated: ${new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        <!-- 4 KPI Highlight Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 25px;">
          <div style="background: #fdf2f5; border: 1px solid #fce7ec; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #C95D7E;">Total Revenue</div>
            <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 4px;">LKR ${parseFloat(fin.total_revenue || 0).toLocaleString()}</div>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #dc2626;">Total Expenses</div>
            <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 4px;">LKR ${parseFloat(fin.total_expenses || 0).toLocaleString()}</div>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #059669;">Net Salon Profit</div>
            <div style="font-size: 16px; font-weight: 800; color: #059669; margin-top: 4px;">LKR ${parseFloat(fin.net_profit || 0).toLocaleString()}</div>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #15803d;">Quote Conversion</div>
            <div style="font-size: 16px; font-weight: 800; color: #15803d; margin-top: 4px;">${qtn.conversion_rate || 0}%</div>
          </div>
        </div>

        <!-- Top Services Table -->
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #C95D7E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Top Performing Treatments & Packages</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fdf2f5; border-top: 1px solid #C95D7E; border-bottom: 1px solid #C95D7E; font-size: 10.5px; text-transform: uppercase; color: #C95D7E;">
                <th style="padding: 7px 10px; text-align: left; width: 30px;">#</th>
                <th style="padding: 7px 10px; text-align: left;">Treatment Name</th>
                <th style="padding: 7px 10px; text-align: center; width: 70px;">Qty Sold</th>
                <th style="padding: 7px 10px; text-align: right; width: 140px;">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topRows || '<tr><td colspan="4" style="text-align:center;padding:15px;color:#9ca3af;">No service sales in period.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Stylist Commissions Table -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #C95D7E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Staff & Stylist Performance Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; font-size: 10.5px; text-transform: uppercase; color: #4b5563;">
                <th style="padding: 7px 10px; text-align: left;">Stylist Name</th>
                <th style="padding: 7px 10px; text-align: left;">Specialization</th>
                <th style="padding: 7px 10px; text-align: center; width: 90px;">Appointments</th>
                <th style="padding: 7px 10px; text-align: right; width: 140px;">Commission Earned</th>
              </tr>
            </thead>
            <tbody>
              ${staffRows || '<tr><td colspan="4" style="text-align:center;padding:15px;color:#9ca3af;">No staff data in period.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Footer Sign-off -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #9ca3af;">
          <div>Certified true & accurate ledger record — Salon Vellora Management Information System</div>
          <div style="text-align: right; font-weight: 600; color: #4b5563;">Salon Vellora Management</div>
        </div>

      </div>
    `;
  },

  /**
   * Directly downloads any HTML element as a high-resolution PDF
   */
  async downloadAsPdf(elementOrHtml, filename = "Salon_Vellora_Doc.pdf", formatOrThermal = false) {
    // Check if html2pdf is available
    if (typeof html2pdf === "undefined") {
      alert("PDF library is loading. Please try again in a few seconds or use the Print button to Save as PDF.");
      return;
    }

    const isThermal = (formatOrThermal === true || formatOrThermal === 'thermal');
    const isFullA4 = (formatOrThermal === 'a4');

    let targetEl;
    let isCreated = false;

    if (typeof elementOrHtml === "string") {
      targetEl = document.createElement("div");
      targetEl.innerHTML = elementOrHtml;
      targetEl.style.position = "absolute";
      targetEl.style.left = "-9999px";
      targetEl.style.top = "0";
      targetEl.style.width = isThermal ? "72mm" : (isFullA4 ? "190mm" : "140mm");
      targetEl.style.background = "#ffffff";
      targetEl.style.boxSizing = "border-box";
      document.body.appendChild(targetEl);
      isCreated = true;
    } else {
      targetEl = elementOrHtml;
    }

    // Wait briefly to guarantee any image assets inside targetEl are fully decoded
    const images = targetEl.querySelectorAll ? targetEl.querySelectorAll("img") : [];
    const imgPromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    if (imgPromises.length > 0) {
      await Promise.all(imgPromises);
    }

    let opt;
    if (isThermal) {
      // Accurately compute the physical roll height in mm (1px ≈ 0.264583mm at 96dpi)
      const heightPx = Math.max(targetEl.offsetHeight, targetEl.scrollHeight, 450);
      const calculatedHeightMm = Math.ceil(heightPx * 0.264583) + 12;
      const pdfHeightMm = Math.max(120, calculatedHeightMm);

      opt = {
        margin: [2, 2, 2, 2],
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: [80, pdfHeightMm],
          orientation: 'portrait'
        }
      };
    } else if (isFullA4) {
      opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
    } else {
      // Default: Half-A4 (A5 ISO Standard: 148mm x 210mm)
      opt = {
        margin: [4, 4, 4, 4],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
      };
    }

    try {
      if (window.common && window.common.showToast) {
        const toastMsg = isThermal ? "Generating high-resolution 80mm PDF..." : (isFullA4 ? "Generating Luxury A4 PDF..." : "Generating Half A4 (A5) Invoice PDF...");
        window.common.showToast(toastMsg, "info");
      }
      await html2pdf().set(opt).from(targetEl).save();
      if (window.common && window.common.showToast) {
        window.common.showToast("Document PDF downloaded successfully!", "success");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Could not generate PDF directly. You can click 'Print' and choose 'Save as PDF' from your browser's print options.");
    } finally {
      if (isCreated && targetEl.parentElement) {
        targetEl.parentElement.removeChild(targetEl);
      }
    }
  },

  /**
   * Prints 80mm receipt using browser print dialog with dedicated thermal styling
   */
  printThermal(elementOrHtml) {
    this._triggerPrint(elementOrHtml, "print-receipt");
  },

  /**
   * Prints A4 document using browser print dialog with dedicated A4 styling
   */
  printA4(elementOrHtml) {
    this._triggerPrint(elementOrHtml, "print-a4");
  },

  _triggerPrint(elementOrHtml, bodyClass) {
    let printHost = document.getElementById("salon-print-host");
    if (!printHost) {
      printHost = document.createElement("div");
      printHost.id = "salon-print-host";
      printHost.className = "print-only-container";
      document.body.appendChild(printHost);
    }

    if (typeof elementOrHtml === "string") {
      printHost.innerHTML = elementOrHtml;
    } else {
      printHost.innerHTML = elementOrHtml.innerHTML;
    }

    document.body.classList.add(bodyClass);
    window.print();
    setTimeout(() => {
      document.body.classList.remove(bodyClass);
      printHost.innerHTML = "";
    }, 1000);
  }
};

window.PrintEngine = PrintEngine;
