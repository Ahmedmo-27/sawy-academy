const nodemailer = require("nodemailer");
const logger = require("../../utils/logger");

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

function getFromAddress() {
  return (
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    '"Sawy Academy" <no-reply@sawyacademy.eg>'
  );
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || "info@sawyacademy.eg";
}

function baseEmailTemplate({ title, eyebrow, contentHtml, footerText }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f5f4f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e1e1e;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f5f4f0;
      padding: 40px 0 60px 0;
    }
    .main-table {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e3dc;
    }
    .header {
      padding: 32px 36px 24px 36px;
      border-bottom: 1px solid #e5e3dc;
      background-color: #ffffff;
    }
    .eyebrow {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #b35434;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    .wordmark {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 22px;
      letter-spacing: 0.08em;
      color: #1e1e1e;
      text-decoration: none;
      font-weight: normal;
    }
    .content {
      padding: 36px 36px;
      font-size: 15px;
      line-height: 1.6;
      color: #2b2b2b;
    }
    .content h1 {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 24px;
      font-weight: normal;
      color: #1e1e1e;
      margin: 0 0 20px 0;
      line-height: 1.25;
    }
    .button {
      display: inline-block;
      padding: 13px 28px;
      background-color: #1e1e1e;
      color: #f5f4f0 !important;
      text-decoration: none;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin: 24px 0 16px 0;
    }
    .data-box {
      background-color: #faf9f6;
      border: 1px solid #e5e3dc;
      padding: 16px 20px;
      margin: 20px 0;
      font-size: 13px;
    }
    .data-row {
      padding: 6px 0;
      border-bottom: 1px solid #f0eee8;
    }
    .data-row:last-child {
      border-bottom: none;
    }
    .data-label {
      color: #737373;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .data-value {
      font-weight: 600;
      color: #1e1e1e;
    }
    .footer {
      padding: 24px 36px;
      background-color: #faf9f6;
      border-top: 1px solid #e5e3dc;
      font-size: 12px;
      color: #737373;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
          <div class="wordmark">SAWY ACADEMY</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${contentHtml}
        </td>
      </tr>
      <tr>
        <td class="footer">
          ${footerText || "Sawy Academy · Architecture, Education & Research · Cairo, Egypt"}<br />
          <span style="font-size: 11px; color: #a3a3a3;">This is an automated studio communication.</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const from = getFromAddress();

  if (!transporter) {
    logger.info("[Email Service: Safe Fallback]", {
      to,
      subject,
      textPreview: text ? text.slice(0, 140) : "",
      time: new Date().toISOString(),
    });
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
    logger.info("[Email Service: Sent]", {
      messageId: info.messageId,
      to,
      subject,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("[Email Service: Error sending email]", {
      error: error.message || error,
      to,
      subject,
    });
    return { success: false, error };
  }
}

async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes = 60 }) {
  const subject = "Reset your Sawy Academy password";
  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Access Recovery",
    contentHtml: `
      <h1>Password Reset Request</h1>
      <p>Hello ${name || "Student"},</p>
      <p>We received a request to reset the password for your Sawy Academy account. Click the button below to set a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #737373;">
        Or copy and paste this link in your browser:<br />
        <a href="${resetUrl}" style="color: #b35434; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="font-size: 13px; color: #737373;">This link is valid for <strong>${expiresInMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });

  const text = `Hello ${name || "Student"},\n\nWe received a request to reset your Sawy Academy password.\nUse the link below to set a new password (valid for ${expiresInMinutes} minutes):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  return sendMail({ to, subject, html, text });
}

async function sendOrderReceivedEmail({ to, name, orderId, amount, items = [] }) {
  const subject = `Order received — ${orderId}`;
  const itemsHtml = items
    .map(
      (item) => `
      <div class="data-row">
        <div class="data-label">${item.quantity || 1}x ${item.title}</div>
        <div class="data-value">${item.price}</div>
      </div>`
    )
    .join("");

  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Order Confirmation",
    contentHtml: `
      <h1>Order Received for Verification</h1>
      <p>Hello ${name || "Student"},</p>
      <p>Thank you for your order. We have received your InstaPay payment proof and queued it for administrative review.</p>
      
      <div class="data-box">
        <div class="data-row">
          <span class="data-label">Order Reference:</span>
          <span class="data-value">${orderId}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Total Amount:</span>
          <span class="data-value">EGP ${amount}</span>
        </div>
        ${itemsHtml}
      </div>

      <p>Our team verifies payments during studio hours. You will receive an enrollment confirmation email as soon as your payment is verified.</p>
    `,
  });

  const text = `Hello ${name || "Student"},\n\nWe have received your order ${orderId} for EGP ${amount}.\nYour InstaPay payment proof is currently under review.\nYou will receive another email once verified.`;

  return sendMail({ to, subject, html, text });
}

async function sendAdminNewOrderAlert({ orderId, userName, userEmail, amount, items = [] }) {
  const adminEmail = getAdminEmail();
  const subject = `[New Order] ${orderId} — ${userName} (EGP ${amount})`;
  const itemsList = items.map((i) => `• ${i.quantity || 1}x ${i.title} (${i.price})`).join("\n");

  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Studio Alert",
    contentHtml: `
      <h1>New Order Pending Verification</h1>
      <p>A new order with InstaPay payment proof has been submitted:</p>
      <div class="data-box">
        <div class="data-row"><strong>Order ID:</strong> ${orderId}</div>
        <div class="data-row"><strong>Student:</strong> ${userName} (${userEmail})</div>
        <div class="data-row"><strong>Total:</strong> EGP ${amount}</div>
      </div>
      <p><strong>Items:</strong></p>
      <ul>${items.map((i) => `<li>${i.quantity || 1}x ${i.title} — ${i.price}</li>`).join("")}</ul>
      <p>Please log in to the Admin Control Panel to verify or reject this order.</p>
    `,
  });

  const text = `New order ${orderId} from ${userName} (${userEmail}) for EGP ${amount}.\n\nItems:\n${itemsList}`;

  return sendMail({ to: adminEmail, subject, html, text });
}

async function sendOrderApprovedEmail({ to, name, orderId, items = [] }) {
  const subject = `Enrollment Confirmed — Order ${orderId}`;
  const courseListHtml = items
    .filter((i) => i.kind !== "product")
    .map((i) => `<li><strong>${i.title}</strong></li>`)
    .join("");

  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Access Granted",
    contentHtml: `
      <h1>Your Enrollment is Now Active</h1>
      <p>Hello ${name || "Student"},</p>
      <p>Your payment for order <strong>${orderId}</strong> has been verified. You now have full access to your course materials and video lessons.</p>
      
      ${courseListHtml ? `<p>Enrolled Courses:</p><ul>${courseListHtml}</ul>` : ""}

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sawyacademy.eg"}/dashboard" class="button" target="_blank" rel="noopener noreferrer">Open Dashboard</a>
      </div>

      <p style="font-size: 13px; color: #737373;">Sign in on your registered device to start watching your lessons.</p>
    `,
  });

  const text = `Hello ${name || "Student"},\n\nYour order ${orderId} has been verified!\nYou can now access your course lessons in the student dashboard.`;

  return sendMail({ to, subject, html, text });
}

async function sendOrderRejectedEmail({ to, name, orderId, reason }) {
  const subject = `Order Update — ${orderId}`;
  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Order Status",
    contentHtml: `
      <h1>Order Verification Update</h1>
      <p>Hello ${name || "Student"},</p>
      <p>We were unable to verify your InstaPay transfer for order <strong>${orderId}</strong>.</p>
      
      <div class="data-box">
        <div class="data-label">Reason provided:</div>
        <div style="margin-top: 6px; color: #b35434; font-weight: 500;">${reason || "Payment proof could not be verified."}</div>
      </div>

      <p>If you believe this was an error, please submit a new order with the correct payment screenshot or contact the studio for assistance.</p>
    `,
  });

  const text = `Hello ${name || "Student"},\n\nYour order ${orderId} could not be verified.\nReason: ${reason || "Payment proof could not be verified."}\nPlease contact the studio or submit a new order.`;

  return sendMail({ to, subject, html, text });
}

async function sendServiceStatusEmail({ to, name, serviceType, status, notes }) {
  const subject = `Service Request Update — ${serviceType}`;
  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Service Update",
    contentHtml: `
      <h1>Service Request: ${status.toUpperCase()}</h1>
      <p>Hello ${name || "Client"},</p>
      <p>The status of your <strong>${serviceType}</strong> request has been updated to <strong>${status}</strong>.</p>
      
      ${
        notes
          ? `<div class="data-box"><div class="data-label">Studio Notes:</div><div style="margin-top: 6px; color: #1e1e1e;">${notes}</div></div>`
          : ""
      }

      <p>You can view your request history in your student profile or reply directly to this correspondence if you have questions.</p>
    `,
  });

  const text = `Hello ${name},\n\nYour ${serviceType} request is now ${status}.${notes ? `\n\nNotes: ${notes}` : ""}`;

  return sendMail({ to, subject, html, text });
}

async function sendContactInquiryEmail({ name, email, subject: userSubject, message }) {
  const adminEmail = getAdminEmail();
  const subject = `[Contact Inquiry] ${userSubject || "General"} — ${name}`;
  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Inquiry Received",
    contentHtml: `
      <h1>New Studio Contact Inquiry</h1>
      <div class="data-box">
        <div class="data-row"><strong>From:</strong> ${name} (${email})</div>
        <div class="data-row"><strong>Subject:</strong> ${userSubject}</div>
      </div>
      <p><strong>Message:</strong></p>
      <div style="background-color: #faf9f6; border-left: 3px solid #b35434; padding: 12px 16px; font-style: italic;">
        ${message.replace(/\n/g, "<br />")}
      </div>
    `,
  });

  const text = `New inquiry from ${name} (${email})\nSubject: ${userSubject}\n\nMessage:\n${message}`;

  return sendMail({ to: adminEmail, subject, html, text });
}

async function sendContactAcknowledgmentEmail({ to, name, subject: userSubject }) {
  const subject = `Message received — ${userSubject || "Sawy Academy Inquiry"}`;
  const html = baseEmailTemplate({
    title: subject,
    eyebrow: "Correspondence",
    contentHtml: `
      <h1>We Received Your Message</h1>
      <p>Hello ${name},</p>
      <p>Thank you for contacting Sawy Academy regarding <strong>${userSubject}</strong>. We have received your inquiry and will reply within our normal studio office hours (Sunday – Thursday, 10:00 – 17:00).</p>
      <p>Warm regards,<br /><strong>Sawy Academy Studio</strong></p>
    `,
  });

  const text = `Hello ${name},\n\nThank you for reaching out to Sawy Academy. We received your message regarding "${userSubject}" and will reply within office hours.`;

  return sendMail({ to, subject, html, text });
}

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  sendOrderReceivedEmail,
  sendAdminNewOrderAlert,
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
  sendServiceStatusEmail,
  sendContactInquiryEmail,
  sendContactAcknowledgmentEmail,
};
