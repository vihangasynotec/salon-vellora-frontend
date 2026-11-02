/**
 * SALON VELLORA — UNIVERSAL WHATSAPP SHARING ENGINE (PDF DOCUMENT + SMALL MESSAGE)
 * Generates official PDF documents (Half-A4, A4, Thermal) and pairs them with
 * concise, professional, elegant WhatsApp messages.
 */

const WhatsAppShare = {
  salonInfo: {
    name: "SALON VELLORA",
    tagline: "Ladies Salon & Bridal Dressing",
    address: "Galwatawaththa Junction, Pinnaduwa, Galle, Sri Lanka",
    hotline: "074 084 4739",
    email: "salonvellora26@gmail.com",
    hours: "Tue - Sun: 9:00 AM - 7:00 PM (Mon Closed)",
    mapLink: "https://maps.google.com/?q=Salon+Vellora+Galle"
  },

  /**
   * Cleans telephone numbers to international format (Sri Lanka 94 prefix)
   */
  cleanPhone(phone) {
    if (!phone) return "";
    let clean = String(phone).replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "94" + clean.substring(1);
    } else if (clean.length === 9 && clean.startsWith("7")) {
      clean = "94" + clean;
    }
    return clean;
  },

  /**
   * Opens WhatsApp Web or mobile app with pre-filled message
   */
  send(phone, messageText) {
    const cleaned = this.cleanPhone(phone);
    const encoded = encodeURIComponent(messageText);

    // Prefer web.whatsapp.com on desktop when target phone is present for immediate chat focus
    const isDesktop = !(/Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent));
    let url = "";

    if (cleaned && cleaned.length >= 9) {
      url = isDesktop 
        ? `https://web.whatsapp.com/send?phone=${cleaned}&text=${encoded}`
        : `https://wa.me/${cleaned}?text=${encoded}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encoded}`;
    }

    const win = window.open(url, "_blank");
    if (win) {
      win.focus();
    } else {
      window.location.href = url;
    }
  },

  /**
   * Ensures the WhatsApp Share Modal exists in DOM
   */
  ensureModalExists() {
    if (document.getElementById("wa-share-dialog")) return;

    const modalHtml = `
      <div class="modal-overlay" id="wa-share-dialog" style="z-index: 999999;">
        <div class="modal-card" style="max-width: 520px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.25);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #128C7E 0%, #25D366 100%); padding: 1.1rem 1.4rem; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
            <div style="display:flex; align-items:center; gap: 10px;">
              <div style="background: rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #ffffff;" id="wa-modal-title">Share via WhatsApp</h3>
                <span style="font-size: 0.75rem; opacity: 0.9;" id="wa-modal-subtitle">PDF Document & Compact Message</span>
              </div>
            </div>
            <button type="button" onclick="WhatsAppShare.closeModal()" style="background: rgba(0,0,0,0.15); border: none; color: #ffffff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;">&times;</button>
          </div>

          <!-- Body -->
          <div style="padding: 1.25rem 1.4rem; background: #fafafa;">
            
            <!-- Document Attachment Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                <div style="background: #fee2e2; color: #dc2626; padding: 10px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div style="min-width: 0;">
                  <div id="wa-doc-name" style="font-weight: 700; font-size: 0.9rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Receipt_Document.pdf</div>
                  <div id="wa-doc-format" style="font-size: 0.75rem; color: #64748b;">Official PDF Document • Auto-Downloads with 1 Click</div>
                </div>
              </div>
              <span class="badge-custom badge-success" style="font-size: 0.7rem; padding: 4px 8px; white-space: nowrap;">PDF Ready</span>
            </div>

            <!-- Recipient Mobile -->
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 6px;">
                Recipient WhatsApp Number
              </label>
              <div style="position: relative;">
                <input type="text" id="wa-recipient-phone" class="form-control-custom" placeholder="e.g. 077 123 4567 or 94771234567" style="padding-left: 42px; font-weight: 600; font-size: 0.95rem; background: #ffffff;">
                <span style="position: absolute; left: 12px; top: 9px; color: #128C7E; font-weight: 800; font-size: 0.85rem;">📞</span>
              </div>
              <span style="font-size: 0.72rem; color: #64748b; margin-top: 4px; display: block;">Local numbers starting with 0 will automatically format with +94 country code.</span>
            </div>

            <!-- Small Message Preview -->
            <div style="margin-bottom: 0.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin: 0;">
                  Compact WhatsApp Message Preview
                </label>
                <span style="font-size: 0.7rem; color: #059669; font-weight: 600;">Clean & Short Style</span>
              </div>
              <textarea id="wa-message-preview" class="form-control-custom" rows="6" style="font-family: monospace; font-size: 0.8rem; line-height: 1.45; background: #ffffff; resize: vertical;"></textarea>
            </div>

            <!-- Helpful tip -->
            <div style="padding: 8px 12px; background: rgba(37,211,102,0.1); border: 1px dashed rgba(37,211,102,0.4); border-radius: 8px; font-size: 0.76rem; color: #065f46; display: flex; align-items: center; gap: 8px;">
              <span>💡</span>
              <div>Clicking <b>Download PDF & Open WhatsApp</b> automatically saves the PDF to your device and opens the chat with the short message pre-filled.</div>
            </div>

          </div>

          <!-- Footer Buttons -->
          <div style="padding: 1rem 1.4rem; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
            <button type="button" class="btn-secondary-custom" onclick="WhatsAppShare.closeModal()" style="font-size: 0.85rem;">Cancel</button>
            <button type="button" class="btn-secondary-custom" id="wa-btn-download-only" onclick="WhatsAppShare.downloadCurrentPdfOnly()" style="font-size: 0.85rem;">
              <i data-lucide="download" style="width:14px;vertical-align:middle;margin-right:4px;"></i> Download PDF Only
            </button>
            <button type="button" class="btn-whatsapp" id="wa-btn-share-main" onclick="WhatsAppShare.executeDownloadAndOpenWhatsApp()" style="font-size: 0.9rem; padding: 0.6rem 1.25rem;">
              <i data-lucide="send" style="width:15px;vertical-align:middle;margin-right:6px;"></i> Download PDF & Open WhatsApp
            </button>
          </div>

        </div>
      </div>
    `;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
  },

  currentContext: null,

  /**
   * Opens the WhatsApp Share modal with context
   */
  openModal(ctx) {
    this.ensureModalExists();
    this.currentContext = ctx;

    document.getElementById("wa-modal-title").innerText = ctx.title || "Share via WhatsApp";
    document.getElementById("wa-modal-subtitle").innerText = ctx.subtitle || "PDF Document & Compact Message";
    document.getElementById("wa-doc-name").innerText = ctx.filename || "Salon_Document.pdf";
    document.getElementById("wa-doc-format").innerText = ctx.formatLabel || "Official PDF Document • Auto-Downloads with 1 Click";
    document.getElementById("wa-recipient-phone").value = ctx.phone || "";
    document.getElementById("wa-message-preview").value = ctx.message || "";

    document.getElementById("wa-share-dialog").classList.add("active");
    if (window.lucide) lucide.createIcons();
  },

  closeModal() {
    const dialog = document.getElementById("wa-share-dialog");
    if (dialog) dialog.classList.remove("active");
    this.currentContext = null;
  },

  /**
   * Executes PDF download and opens WhatsApp
   */
  async executeDownloadAndOpenWhatsApp() {
    const ctx = this.currentContext;
    if (!ctx) return;

    const phone = document.getElementById("wa-recipient-phone").value.trim();
    const message = document.getElementById("wa-message-preview").value.trim();

    // 1. Download the PDF document if HTML content provided and PrintEngine available
    const htmlToRender = typeof ctx.htmlContent === 'function' ? ctx.htmlContent() : ctx.htmlContent;
    if (htmlToRender && window.PrintEngine) {
      try {
        await PrintEngine.downloadAsPdf(htmlToRender, ctx.filename, ctx.pdfFormat || 'half-a4');
      } catch (e) {
        console.warn("PDF auto-download error:", e);
      }
    }

    // 2. Open WhatsApp with the compact message
    this.send(phone, message);

    this.closeModal();

    if (window.common && window.common.showToast) {
      common.showToast(`📄 PDF downloaded! Drag or attach "${ctx.filename}" into WhatsApp.`, "success", 6000);
    }
  },

  /**
   * Downloads only the PDF
   */
  async downloadCurrentPdfOnly() {
    const ctx = this.currentContext;
    if (!ctx) return;

    const htmlToRender = typeof ctx.htmlContent === 'function' ? ctx.htmlContent() : ctx.htmlContent;
    if (htmlToRender && window.PrintEngine) {
      await PrintEngine.downloadAsPdf(htmlToRender, ctx.filename, ctx.pdfFormat || 'half-a4');
    } else {
      alert("PDF content generator is not available.");
    }
  },

  /**
   * =========================================================================
   * 1. SHARE POS RECEIPT / TAX INVOICE (PDF STYLE DOCUMENT + SMALL MESSAGE)
   * =========================================================================
   */
  async shareSaleReceipt(sale, customPhone = null) {
    if (!sale) return;
    let s = sale;

    // Ensure full sale details including items, customer, and cashier are loaded
    if ((!s.items || s.items.length === 0) && s.id && window.api) {
      try {
        const res = await api.get(`/sales/${s.id}`);
        if (res && res.success && res.data) {
          s = res.data;
        }
      } catch (e) {
        console.warn("Could not fetch full sale details:", e);
      }
    }

    const info = this.salonInfo;
    const clientName = s.customer ? s.customer.name : "Valued Client";
    const clientPhone = customPhone || (s.customer ? s.customer.phone : "");

    const createdDate = s.created_at ? new Date(s.created_at) : new Date();
    const dateFormatted = createdDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timeFormatted = createdDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const grandTotal = parseFloat(s.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const method = (s.payment_method || "Cash").toUpperCase();
    const invoiceNum = s.invoice_number || `SV-INV-${s.id}`;

    // Item count and summary
    const items = s.items || [];
    let itemsBrief = "";
    if (items.length === 1) {
      itemsBrief = `\n💇‍♀️ *Service/Item:* ${items[0].name}`;
    } else if (items.length > 1) {
      itemsBrief = `\n💇‍♀️ *Items:* ${items[0].name} + ${items.length - 1} more (${items.length} items total)`;
    }

    // CRISP, SMALL MESSAGE FOR WHATSAPP
    let smallMsg = `🌸 *${info.name}* 🌸\n`;
    smallMsg += `_${info.tagline}_\n\n`;
    smallMsg += `Dear *${clientName}*,\n`;
    smallMsg += `Thank you for visiting Salon Vellora! ✨\n\n`;
    smallMsg += `📄 *Official Tax Invoice:* \`${invoiceNum}\`\n`;
    smallMsg += `📅 *Date:* ${dateFormatted} at ${timeFormatted}${itemsBrief}\n`;
    smallMsg += `💰 *Grand Total:* *LKR ${grandTotal}* (${method})\n\n`;
    smallMsg += `📎 _Your official PDF receipt is attached._\n`;
    smallMsg += `_Please find your digital receipt copy._\n\n`;
    smallMsg += `✨ We look forward to pampering you again!\n`;
    smallMsg += `📞 Hotline: *${info.hotline}*\n`;
    smallMsg += `📍 Location: Galwatawaththa Junction, Pinnaduwa, Galle\n`;
    smallMsg += `🗺️ Map: ${info.mapLink}`;

    // Generate PDF HTML (Half-A4 Landscape format standard)
    let pdfHtml = "";
    if (window.PrintEngine) {
      pdfHtml = PrintEngine.generateA4Invoice(s, "CUSTOMER RECEIPT", true);
    }

    const filename = `Invoice_${invoiceNum}.pdf`;

    this.openModal({
      title: "Share Receipt on WhatsApp",
      subtitle: "Attach official PDF document with short message",
      filename: filename,
      formatLabel: "Half-A4 (A5 Landscape) Official Invoice PDF",
      phone: clientPhone,
      message: smallMsg,
      htmlContent: pdfHtml,
      pdfFormat: 'half-a4'
    });
  },

  /**
   * =========================================================================
   * 2. SHARE 24-HOUR RENTAL AGREEMENT (PDF STYLE DOCUMENT + SMALL MESSAGE)
   * =========================================================================
   */
  shareRentalAgreement(order, customPhone = null) {
    if (!order) return;
    const info = this.salonInfo;
    const itemName = order.item ? order.item.name : (order.name || "Rental Attire");
    const clientName = order.customer_name || "Valued Client";
    const clientPhone = customPhone || order.customer_phone || (order.customer ? order.customer.phone : "");
    const rentalNo = order.rental_number || "SV-RNT";

    const start = order.rental_start_date ? new Date(order.rental_start_date) : new Date();
    const due = order.due_return_date ? new Date(order.due_return_date) : new Date(start.getTime() + 24 * 3600 * 1000);

    const dueStr = due.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " +
                   due.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const rentalFee = parseFloat(order.rental_fee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const deposit = parseFloat(order.deposit_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    // CRISP SMALL MESSAGE
    let smallMsg = `👑 *${info.name} — BRIDAL RENTALS* 👑\n\n`;
    smallMsg += `Dear *${clientName}*,\n`;
    smallMsg += `Thank you for renting with Salon Vellora! ✨\n\n`;
    smallMsg += `👗 *Item:* ${itemName}\n`;
    smallMsg += `🔖 *Booking Ref:* \`${rentalNo}\`\n`;
    smallMsg += `⏰ *MANDATORY RETURN DUE:* *${dueStr}* (24h Window)\n`;
    smallMsg += `💰 *Rental Fee:* LKR ${rentalFee}\n`;
    smallMsg += `💵 *Refundable Deposit:* LKR ${deposit}\n\n`;
    smallMsg += `📎 _Your official 24-Hour Rental Agreement PDF is attached._\n`;
    smallMsg += `Please present the digital receipt when returning the item.\n\n`;
    smallMsg += `📞 Need assistance? Call our hotline: *${info.hotline}*`;

    // Generate agreement HTML
    let pdfHtml = "";
    if (window.PrintEngine) {
      pdfHtml = PrintEngine.generateA4Invoice({
        invoice_number: rentalNo,
        customer: { name: clientName, phone: clientPhone },
        created_at: start,
        payment_method: 'CASH',
        items: [{
          name: `${itemName} [24H RENTAL AGREEMENT]`,
          quantity: order.quantity || 1,
          total_price: order.rental_fee,
          rental_deposit: order.deposit_amount,
          item_type: 'rental'
        }],
        grand_total: order.total_collected || (parseFloat(order.rental_fee || 0) + parseFloat(order.deposit_amount || 0)),
        notes: `24-HOUR RENTAL RETURN DUE: ${dueStr}`
      }, "24H RENTAL AGREEMENT", true);
    }

    const filename = `Rental_Agreement_${rentalNo}.pdf`;

    this.openModal({
      title: "Share 24H Rental Agreement",
      subtitle: "Official rental terms & security deposit receipt PDF",
      filename: filename,
      formatLabel: "24-Hour Attire & Jewellery Rental Agreement PDF",
      phone: clientPhone,
      message: smallMsg,
      htmlContent: pdfHtml,
      pdfFormat: 'half-a4'
    });
  },

  /**
   * =========================================================================
   * 3. SHARE 24-HOUR RENTAL RETURN REMINDER (COMPACT MESSAGE)
   * =========================================================================
   */
  shareRentalReminder(order) {
    if (!order) return;
    const info = this.salonInfo;
    const itemName = order.item ? order.item.name : (order.name || "Rental Item");
    const clientName = order.customer_name || "Valued Client";
    const clientPhone = order.customer_phone || (order.customer ? order.customer.phone : "");

    const due = order.due_return_date ? new Date(order.due_return_date) : new Date();
    const dueStr = due.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " at " +
                   due.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const deposit = parseFloat(order.deposit_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    let smallMsg = `🌸 *SALON VELLORA — GENTLE RENTAL REMINDER* 🌸\n\n`;
    smallMsg += `Dear *${clientName}*,\n`;
    smallMsg += `This is a reminder that your rented item:\n`;
    smallMsg += `✨ *${itemName}* (Ref: \`${order.rental_number}\`)\n\n`;
    smallMsg += `⏰ is due back for return on:\n`;
    smallMsg += `👉 *${dueStr}* (24-Hour Return Window)\n\n`;
    smallMsg += `💵 Refundable deposit: *LKR ${deposit}* released upon inspection.\n`;
    smallMsg += `📍 Return Location: ${info.address}\n`;
    smallMsg += `📞 Contact: *${info.hotline}*`;

    this.openModal({
      title: "Send 24H Return Reminder",
      subtitle: "Courteous return notice to ensure prompt deposit refund",
      filename: `Reminder_${order.rental_number}.pdf`,
      formatLabel: "Return Notice",
      phone: clientPhone,
      message: smallMsg,
      htmlContent: null,
      pdfFormat: 'half-a4'
    });
  },

  /**
   * =========================================================================
   * 4. SHARE RENTAL RETURN & DEPOSIT REFUND CLEARANCE (PDF + SMALL MESSAGE)
   * =========================================================================
   */
  shareRentalReturnReceipt(order) {
    if (!order) return;
    const info = this.salonInfo;
    const itemName = order.item ? order.item.name : (order.name || "Rental Item");
    const clientName = order.customer_name || "Valued Client";
    const clientPhone = order.customer_phone || (order.customer ? order.customer.phone : "");

    const deposit = parseFloat(order.deposit_amount || 0);
    const lateFee = parseFloat(order.late_fee_charged || 0);
    const damageFee = parseFloat(order.damage_fee_charged || 0);
    const refunded = parseFloat(order.deposit_refunded || Math.max(0, deposit - lateFee - damageFee)).toLocaleString('en-US', { minimumFractionDigits: 2 });

    let smallMsg = `✅ *SALON VELLORA — RENTAL RETURN CLEARANCE* ✅\n\n`;
    smallMsg += `Dear *${clientName}*,\n`;
    smallMsg += `Your rented item (*${itemName}*) has been inspected and cleared!\n\n`;
    smallMsg += `🔖 *Booking Ref:* \`${order.rental_number}\`\n`;
    smallMsg += `💵 *Net Deposit Refunded:* *LKR ${refunded}*\n\n`;
    smallMsg += `📎 _Your Official Return Clearance PDF is attached._\n`;
    smallMsg += `Thank you for your business! 💖\n`;
    smallMsg += `📞 Hotline: *${info.hotline}*`;

    let pdfHtml = "";
    if (window.PrintEngine) {
      pdfHtml = PrintEngine.generateA4Invoice({
        invoice_number: `CLR-${order.rental_number}`,
        customer: { name: clientName, phone: clientPhone },
        created_at: new Date(),
        payment_method: 'REFUND',
        items: [{
          name: `RETURN CLEARANCE: ${itemName}`,
          quantity: order.quantity || 1,
          total_price: 0,
          notes: order.return_condition_notes || 'Inspected and approved in good condition.'
        }],
        grand_total: order.deposit_refunded || deposit
      }, "RETURN CLEARANCE CERTIFICATE", true);
    }

    const filename = `Return_Clearance_${order.rental_number}.pdf`;

    this.openModal({
      title: "Share Return Clearance",
      subtitle: "Official inspection certificate & deposit refund slip",
      filename: filename,
      formatLabel: "Return & Refund Clearance PDF",
      phone: clientPhone,
      message: smallMsg,
      htmlContent: pdfHtml,
      pdfFormat: 'half-a4'
    });
  },

  /**
   * =========================================================================
   * 5. SHARE BRIDAL QUOTATION (PDF STYLE DOCUMENT + SMALL MESSAGE)
   * =========================================================================
   */
  shareQuotation(quote, customPhone = null) {
    if (!quote) return;
    const q = quote;
    const info = this.salonInfo;
    const clientName = q.customer_name || "Valued Bride / Client";
    const clientPhone = customPhone || q.customer_phone || "";

    const quoteDate = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
    const validUntil = q.valid_until ? new Date(q.valid_until).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
    const grandTotal = parseFloat(q.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const quoteNum = q.quotation_number || `QTN-${q.id}`;

    let smallMsg = `🌸 *${info.name} — BRIDAL QUOTATION* 🌸\n`;
    smallMsg += `_${info.tagline}_\n\n`;
    smallMsg += `Dear *${clientName}*,\n`;
    smallMsg += `Thank you for inquiring with Salon Vellora! 💍\n\n`;
    smallMsg += `📋 *Quotation Ref:* \`${quoteNum}\`\n`;
    smallMsg += `📅 *Date:* ${quoteDate} (Valid Until: ${validUntil})\n`;
    smallMsg += `💰 *Estimated Total:* *LKR ${grandTotal}*\n\n`;
    smallMsg += `📎 _Your detailed bridal package PDF quote is attached._\n`;
    smallMsg += `To confirm your wedding date & stylist booking, kindly reply or call us! 👰‍♀️\n\n`;
    smallMsg += `📞 Bridal Coordinator: *${info.hotline}*\n`;
    smallMsg += `📍 Location: Galwatawaththa Junction, Pinnaduwa, Galle`;

    let pdfHtml = "";
    if (window.PrintEngine) {
      pdfHtml = PrintEngine.generateA4Quotation(q);
    }

    const filename = `Quotation_${quoteNum}.pdf`;

    this.openModal({
      title: "Share Bridal Quotation",
      subtitle: "Detailed bridal makeover estimate & terms PDF",
      filename: filename,
      formatLabel: "Luxury A4 Bridal Estimate & Proposal PDF",
      phone: clientPhone,
      message: smallMsg,
      htmlContent: pdfHtml,
      pdfFormat: 'a4'
    });
  },

  /**
   * =========================================================================
   * 6. SHARE EXECUTIVE BUSINESS REPORT (PDF STYLE DOCUMENT + SMALL MESSAGE)
   * =========================================================================
   */
  shareExecutiveReport(reportData, customPhone = null) {
    if (!reportData) return;
    const info = this.salonInfo;
    const { financials, period } = reportData;

    const start = period?.start || "-";
    const end = period?.end || "-";
    const revenue = parseFloat(financials?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const expenses = parseFloat(financials?.total_expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const netProfit = parseFloat(financials?.net_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const totalSales = financials?.total_sales || 0;

    let smallMsg = `📊 *${info.name} — EXECUTIVE BUSINESS REPORT* 📊\n`;
    smallMsg += `🗓️ *Period:* ${start} to ${end}\n\n`;
    smallMsg += `💰 *Total Revenue:* LKR ${revenue}\n`;
    smallMsg += `📉 *Operating Expenses:* LKR ${expenses}\n`;
    smallMsg += `💵 *NET PROFIT:* *LKR ${netProfit}*\n`;
    smallMsg += `🧾 *Completed Invoices:* ${totalSales}\n\n`;
    smallMsg += `📎 _Official Executive PDF Report document is attached._\n`;
    smallMsg += `_Confidential business audit generated via Salon Vellora System._\n`;
    smallMsg += `📞 Hotline: ${info.hotline}`;

    let pdfHtml = "";
    if (window.PrintEngine) {
      pdfHtml = PrintEngine.generateA4Report(reportData);
    }

    const filename = `Executive_Report_${start}_to_${end}.pdf`;

    this.openModal({
      title: "Share Executive Report",
      subtitle: "Comprehensive financial audit & performance PDF",
      filename: filename,
      formatLabel: "Executive Financial Audit & Analytics PDF",
      phone: customPhone || "",
      message: smallMsg,
      htmlContent: pdfHtml,
      pdfFormat: 'a4'
    });
  },

  /**
   * =========================================================================
   * 7. SHARE APPOINTMENT BOOKING CONFIRMATION (COMPACT MESSAGE)
   * =========================================================================
   */
  shareAppointmentConfirmation(appointment, customPhone = null) {
    if (!appointment) return;
    const a = appointment;
    const info = this.salonInfo;
    const clientName = a.customer ? a.customer.name : "Valued Client";
    const clientPhone = customPhone || (a.customer ? a.customer.phone : "");
    const stylistName = a.staff ? a.staff.name : "Senior Stylist";
    const serviceName = a.service ? a.service.name : (a.package ? a.package.name : "Salon Service");

    const apptDate = a.appointment_date ? new Date(a.appointment_date).toLocaleDateString("en-GB", { weekday: 'long', day: "2-digit", month: "short", year: "numeric" }) : "-";
    const apptTime = a.start_time || "Scheduled Time";
    const apptNum = a.appointment_number || `APT-${a.id}`;

    let smallMsg = `🌸 *SALON VELLORA — APPOINTMENT CONFIRMATION* 🌸\n\n`;
    smallMsg += `Dear *${clientName}*,\n`;
    smallMsg += `Your appointment has been booked at *Salon Vellora*! ✨\n\n`;
    smallMsg += `📅 *Date:* ${apptDate}\n`;
    smallMsg += `⏰ *Time:* ${apptTime}\n`;
    smallMsg += `💇‍♀️ *Service:* ${serviceName}\n`;
    smallMsg += `✂️ *Stylist:* ${stylistName}\n`;
    smallMsg += `🔖 *Booking ID:* \`${apptNum}\`\n\n`;
    smallMsg += `📍 *Location:* ${info.address}\n`;
    smallMsg += `_Please arrive 10 mins prior to your scheduled slot._\n`;
    smallMsg += `To reschedule or cancel, call: *${info.hotline}* 💖`;

    this.openModal({
      title: "Share Appointment Confirmation",
      subtitle: "Booking schedule details for client",
      filename: `Appointment_${apptNum}.pdf`,
      formatLabel: "Appointment Confirmation Notice",
      phone: clientPhone,
      message: smallMsg,
      htmlContent: null,
      pdfFormat: 'half-a4'
    });
  }
};

window.WhatsAppShare = WhatsAppShare;
