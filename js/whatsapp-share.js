/**
 * SALON VELLORA — UNIVERSAL WHATSAPP SHARING ENGINE
 * Generates beautifully formatted WhatsApp text receipts, rental agreements,
 * 24-hour return reminders, bridal quotations, and executive financial reports.
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
   * Opens WhatsApp Web or native app with pre-filled encoded text
   */
  send(phone, messageText) {
    const cleaned = this.cleanPhone(phone);
    const encoded = encodeURIComponent(messageText);

    let url = "";
    if (cleaned && cleaned.length >= 9) {
      url = `https://wa.me/${cleaned}?text=${encoded}`;
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
   * Prompts user for client phone number if missing, then sends
   */
  promptAndSend(defaultPhone, messageText, clientName = "Client") {
    let targetPhone = defaultPhone || "";
    if (!targetPhone || targetPhone.trim() === "" || targetPhone === "0000000000") {
      const input = prompt(`Enter WhatsApp number for ${clientName} (e.g. 0771234567 or 94771234567):`, "");
      if (input === null) return; // User cancelled
      targetPhone = input.trim();
    }
    this.send(targetPhone, messageText);
  },

  /**
   * 1. SHARE POS RECEIPT / TAX INVOICE ON WHATSAPP
   */
  shareSaleReceipt(sale, customPhone = null) {
    if (!sale) return;
    const s = sale;
    const info = this.salonInfo;
    const items = s.items || [];
    const clientName = s.customer ? s.customer.name : "Valued Client";
    const clientPhone = customPhone || (s.customer ? s.customer.phone : "");
    const cashierName = s.cashier ? s.cashier.name : "Reception Desk";

    const createdDate = s.created_at ? new Date(s.created_at) : new Date();
    const dateFormatted = createdDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timeFormatted = createdDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const subtotal = parseFloat(s.subtotal || s.grand_total || 0);
    const discount = parseFloat(s.discount_amount || 0);
    const grandTotal = parseFloat(s.grand_total || 0);
    const paidAmount = parseFloat(s.paid_amount || grandTotal);
    const changeAmount = parseFloat(s.change_amount || 0);
    const method = (s.payment_method || "CASH").toUpperCase();
    const invoiceNum = s.invoice_number || "SV-INV";
    const pointsEarned = Math.floor(grandTotal / 100);

    let msg = `🌸 *${info.name}* 🌸\n`;
    msg += `_${info.tagline}_\n`;
    msg += `📍 ${info.address}\n`;
    msg += `📞 Hotline: *${info.hotline}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🧾 *OFFICIAL RECEIPT / INVOICE*\n`;
    msg += `*Invoice No:* \`${invoiceNum}\`\n`;
    msg += `*Date:* ${dateFormatted} at ${timeFormatted}\n`;
    msg += `*Client:* ${clientName} ${clientPhone ? `(${clientPhone})` : ''}\n`;
    msg += `*Cashier:* ${cashierName}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `*ITEMS & SERVICES:* \n`;
    items.forEach((item, idx) => {
      const qty = item.quantity || 1;
      const price = parseFloat(item.total_price || item.unit_price * qty);
      const staffName = item.staff ? (item.staff.name || item.staff) : "";

      if (item.item_type === 'rental') {
        msg += `${idx + 1}. *${item.name}* [👗 24H RENTAL]\n`;
        msg += `   ↳ *Rent:* LKR ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
        if (item.rental_deposit || item.deposit_amount) {
          const dep = parseFloat(item.rental_deposit || item.deposit_amount);
          msg += `   ↳ *Security Deposit Held:* LKR ${dep.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
        }
        msg += `   ↳ *Return Due:* 24 Hours from billing\n`;
      } else {
        msg += `${idx + 1}. *${item.name}* (${qty}x)\n`;
        if (staffName) msg += `   ↳ _Stylist: ${staffName}_\n`;
        msg += `   ↳ LKR ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
      }
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*Subtotal:* LKR ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    if (discount > 0) {
      msg += `*Discount Applied:* -LKR ${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }
    msg += `*GRAND TOTAL:* *LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}*\n`;
    msg += `*Payment Mode:* ${method}\n`;
    msg += `*Amount Paid:* LKR ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    if (changeAmount > 0) {
      msg += `*Change Returned:* LKR ${changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }

    if (pointsEarned > 0) {
      msg += `\n⭐ *Loyalty Points Earned:* +${pointsEarned} pts\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ *Thank you for choosing Salon Vellora!*\n`;
    msg += `_We look forward to pampering you again._\n`;
    msg += `🕒 ${info.hours}\n`;
    msg += `📍 Location: ${info.mapLink}\n`;

    this.promptAndSend(clientPhone, msg, clientName);
  },

  /**
   * 2. SHARE 24-HOUR RENTAL AGREEMENT ON WHATSAPP
   */
  shareRentalAgreement(order, customPhone = null) {
    if (!order) return;
    const info = this.salonInfo;
    const itemName = order.item ? order.item.name : (order.name || "Rental Item");
    const clientName = order.customer_name || "Valued Client";
    const clientPhone = customPhone || order.customer_phone || (order.customer ? order.customer.phone : "");
    const nic = order.customer_nic ? ` (NIC: ${order.customer_nic})` : "";
    const rentalNo = order.rental_number || "SV-RNT";

    const start = order.rental_start_date ? new Date(order.rental_start_date) : new Date();
    const due = order.due_return_date ? new Date(order.due_return_date) : new Date(start.getTime() + 24 * 3600 * 1000);

    const startStr = start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " +
                     start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const dueStr = due.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " +
                   due.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const rentalFee = parseFloat(order.rental_fee || 0);
    const deposit = parseFloat(order.deposit_amount || 0);
    const totalCollected = parseFloat(order.total_collected || (rentalFee + deposit));
    const lateFeePerDay = parseFloat(order.item?.late_fee_per_day || 500);

    let msg = `👑 *${info.name} — BRIDAL & ATTIRE RENTALS* 👑\n`;
    msg += `📍 ${info.address} | 📞 ${info.hotline}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ *24-HOUR RENTAL AGREEMENT & RECEIPT*\n`;
    msg += `*Booking Ref:* \`${rentalNo}\`\n`;
    msg += `*Client:* ${clientName}${nic}\n`;
    msg += `*Mobile:* ${clientPhone}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `👗 *RENTAL ITEM DETAILS:*\n`;
    msg += `*Item:* ${itemName}\n`;
    msg += `*Qty:* ${order.quantity || 1}\n`;
    msg += `*Issue Date & Time:* ${startStr}\n`;
    msg += `⏰ *MANDATORY RETURN DUE:* *${dueStr}* *(24h Duration)*\n\n`;

    msg += `💰 *FINANCIAL BREAKDOWN:*\n`;
    msg += `• *24h Rental Fee:* LKR ${rentalFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `• *Refundable Security Deposit:* LKR ${deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `• *Total Amount Collected:* *LKR ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}*\n`;
    msg += `• *Overdue Late Fee:* LKR ${lateFeePerDay.toLocaleString('en-US', { minimumFractionDigits: 2 })} / day\n\n`;

    msg += `📜 *TERMS & RETURN POLICY:*\n`;
    msg += `1. Items must be returned within *24 hours* (${dueStr}) in original condition.\n`;
    msg += `2. Security deposit is fully refunded upon inspection of item.\n`;
    msg += `3. Any fabric tears, stains, broken beads or missing accessories will incur deduction from deposit.\n`;
    msg += `4. Please present this WhatsApp receipt when returning the item.\n\n`;

    msg += `✨ Thank you for choosing Salon Vellora for your special day! ✨\n`;
    msg += `📞 Need assistance? Call our hotline: *${info.hotline}*\n`;

    this.promptAndSend(clientPhone, msg, clientName);
  },

  /**
   * 3. SHARE 24-HOUR RENTAL RETURN REMINDER ON WHATSAPP
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

    const deposit = parseFloat(order.deposit_amount || 0);

    let msg = `🌸 *SALON VELLORA — GENTLE RENTAL REMINDER* 🌸\n\n`;
    msg += `Dear *${clientName}*,\n\n`;
    msg += `This is a courteous reminder that your rented item:\n`;
    msg += `✨ *${itemName}* (Ref: \`${order.rental_number}\`)\n\n`;
    msg += `⏰ is due back for return on:\n`;
    msg += `👉 *${dueStr}* (24-Hour Return Window)\n\n`;
    msg += `💵 Your refundable security deposit of *LKR ${deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}* will be released upon return and physical inspection.\n\n`;
    msg += `📍 *Return Location:* ${info.address}\n`;
    msg += `🕒 Operating Hours: ${info.hours}\n`;
    msg += `📞 If you require a return extension, please call us urgently at *${info.hotline}*.\n\n`;
    msg += `_Warm regards,_\n*Salon Vellora Team*`;

    this.promptAndSend(clientPhone, msg, clientName);
  },

  /**
   * 4. SHARE RENTAL RETURN & DEPOSIT REFUND CLEARANCE ON WHATSAPP
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
    const refunded = parseFloat(order.deposit_refunded || Math.max(0, deposit - lateFee - damageFee));

    const returnDate = order.actual_return_date ? new Date(order.actual_return_date) : new Date();
    const returnStr = returnDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " +
                      returnDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    let msg = `✅ *SALON VELLORA — RENTAL RETURN CLEARANCE* ✅\n`;
    msg += `📍 ${info.address} | 📞 ${info.hotline}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*Booking Ref:* \`${order.rental_number}\`\n`;
    msg += `*Client:* ${clientName}\n`;
    msg += `*Item Returned:* ${itemName}\n`;
    msg += `*Return Timestamp:* ${returnStr}\n`;
    msg += `*Condition:* ${order.return_condition_notes || 'Inspected & Cleared'}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `💰 *SECURITY DEPOSIT SETTLEMENT:*\n`;
    msg += `• Initial Deposit Held: LKR ${deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    if (lateFee > 0) {
      msg += `• Overdue Late Fee Deducted: -LKR ${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }
    if (damageFee > 0) {
      msg += `• Damage/Cleaning Fee Deducted: -LKR ${damageFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 *NET DEPOSIT REFUNDED TO CLIENT:* \n`;
    msg += `*LKR ${refunded.toLocaleString('en-US', { minimumFractionDigits: 2 })}*\n\n`;
    msg += `✨ All obligations cleared. Thank you for your business!\n`;
    msg += `_Salon Vellora — Ladies Salon & Bridal Dressing_`;

    this.promptAndSend(clientPhone, msg, clientName);
  },

  /**
   * 5. SHARE BRIDAL QUOTATION ON WHATSAPP
   */
  shareQuotation(quote, customPhone = null) {
    if (!quote) return;
    const q = quote;
    const info = this.salonInfo;
    const items = q.items || [];
    const clientName = q.customer_name || "Valued Bride / Client";
    const clientPhone = customPhone || q.customer_phone || "";

    const quoteDate = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
    const validUntil = q.valid_until ? new Date(q.valid_until).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

    const grandTotal = parseFloat(q.grand_total || 0);

    let msg = `🌸 *${info.name} — BRIDAL QUOTATION* 🌸\n`;
    msg += `_${info.tagline}_\n`;
    msg += `📍 ${info.address} | 📞 *${info.hotline}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💍 *BRIDAL ESTIMATE & PACKAGE QUOTE*\n`;
    msg += `*Quotation No:* \`${q.quotation_number || 'QTN'}\`\n`;
    msg += `*Date:* ${quoteDate} (Valid Until: ${validUntil})\n`;
    msg += `*Bride / Client:* ${clientName}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `*INCLUDED SERVICES & PACKAGES:*\n`;
    items.forEach((item, idx) => {
      const price = parseFloat(item.total_price || item.unit_price);
      msg += `${idx + 1}. *${item.description || item.name}*\n`;
      msg += `   ↳ LKR ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*ESTIMATED GRAND TOTAL:* *LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `📋 *TERMS & BOOKING CONFIRMATION:*\n`;
    msg += `• 50% advance deposit is required to reserve your wedding date & stylist.\n`;
    msg += `• Balance is payable on or before dressing day.\n\n`;
    msg += `✨ To confirm this booking, kindly reply to this message or call our bridal coordinator at *${info.hotline}*.\n`;
    msg += `_We would be honored to be part of your dream day!_ 👰‍♀️`;

    this.promptAndSend(clientPhone, msg, clientName);
  },

  /**
   * 6. SHARE EXECUTIVE BUSINESS REPORT ON WHATSAPP
   */
  shareExecutiveReport(reportData, customPhone = null) {
    if (!reportData) return;
    const info = this.salonInfo;
    const { financials, quotations, top_services, staff_performance, period } = reportData;

    const start = period?.start || "-";
    const end = period?.end || "-";

    let msg = `📊 *${info.name} — EXECUTIVE BUSINESS REPORT* 📊\n`;
    msg += `🗓️ *Period:* ${start} to ${end}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `💰 *FINANCIAL OVERVIEW:*\n`;
    msg += `• *Total Revenue:* LKR ${parseFloat(financials?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `• *Operating Expenses:* LKR ${parseFloat(financials?.total_expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    msg += `• *NET PROFIT:* *LKR ${parseFloat(financials?.net_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}*\n`;
    msg += `• *Completed Invoices:* ${financials?.total_sales || 0}\n\n`;

    if (quotations) {
      msg += `💍 *BRIDAL PIPELINE:*\n`;
      msg += `• Total Quoted: ${quotations.total || 0} (Approved: ${quotations.approved || 0})\n`;
      msg += `• Converted to Sales: ${quotations.converted || 0} (${quotations.conversion_rate || 0}%)\n`;
      msg += `• Converted Revenue: LKR ${parseFloat(quotations.converted_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n`;
    }

    if (top_services && top_services.length > 0) {
      msg += `⭐ *TOP REVENUE SERVICES:*\n`;
      top_services.slice(0, 5).forEach((s, idx) => {
        msg += `${idx + 1}. *${s.name}* — ${s.total_qty} sold (LKR ${parseFloat(s.total_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })})\n`;
      });
      msg += `\n`;
    }

    if (staff_performance && staff_performance.length > 0) {
      msg += `✂️ *STYLIST SALES BREAKDOWN:*\n`;
      staff_performance.forEach((st) => {
        msg += `• *${st.name}*: LKR ${parseFloat(st.revenue_generated || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} (Comm: LKR ${parseFloat(st.commission_earned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})\n`;
      });
      msg += `\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Generated confidentially via Salon Vellora System._\n`;

    this.promptAndSend(customPhone, msg, "Management / Owner");
  },

  /**
   * 7. SHARE APPOINTMENT BOOKING CONFIRMATION ON WHATSAPP
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

    let msg = `🌸 *SALON VELLORA — APPOINTMENT CONFIRMATION* 🌸\n\n`;
    msg += `Dear *${clientName}*,\n\n`;
    msg += `Your appointment has been successfully booked at *Salon Vellora*! ✨\n\n`;
    msg += `📅 *Date:* ${apptDate}\n`;
    msg += `⏰ *Time:* ${apptTime}\n`;
    msg += `💇‍♀️ *Service:* ${serviceName}\n`;
    msg += `✂️ *Stylist:* ${stylistName}\n`;
    msg += `🔖 *Booking ID:* \`${a.appointment_number || 'APT'}\`\n\n`;
    msg += `📍 *Location:* ${info.address}\n`;
    msg += `🗺️ Google Maps: ${info.mapLink}\n\n`;
    msg += `_Please arrive 10 minutes prior to your appointment time._\n`;
    msg += `To reschedule or cancel, kindly reply or call: *${info.hotline}*.\n\n`;
    msg += `_We look forward to giving you an exceptional experience!_ 💖`;

    this.promptAndSend(clientPhone, msg, clientName);
  }
};

window.WhatsAppShare = WhatsAppShare;
