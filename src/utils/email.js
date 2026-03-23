import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }
  
  return null;
}

export async function sendOrderConfirmation(order) {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not configured - skipping order confirmation email for', order.orderNumber);
    return;
  }

  try {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.title}</strong>${item.variant ? ` - ${item.variant}` : ''}<br>
          <span style="color: #6b7280;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #064e3b; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Akhdar Perfumes</h1>
        </div>
        
        <div style="padding: 32px 24px;">
          <h2 style="color: #111827; margin: 0 0 8px;">Order Confirmed!</h2>
          <p style="color: #6b7280; margin: 0 0 24px;">Thank you for your purchase. Your order #${order.orderNumber} has been received.</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase;">Item</th>
                <th style="text-align: right; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <table style="width: 100%; margin-top: 16px;">
            <tr><td style="color: #6b7280; padding: 4px 0;">Subtotal</td><td style="text-align: right; padding: 4px 0;">$${order.subtotal.toFixed(2)}</td></tr>
            <tr><td style="color: #6b7280; padding: 4px 0;">Shipping</td><td style="text-align: right; padding: 4px 0;">${order.shipping === 0 ? 'FREE' : '$' + order.shipping.toFixed(2)}</td></tr>
            <tr><td style="color: #6b7280; padding: 4px 0;">Tax</td><td style="text-align: right; padding: 4px 0;">$${order.tax.toFixed(2)}</td></tr>
            <tr><td style="font-weight: bold; padding: 12px 0 0; border-top: 2px solid #e5e7eb;">Total</td><td style="text-align: right; font-weight: bold; padding: 12px 0 0; border-top: 2px solid #e5e7eb;">$${order.total.toFixed(2)}</td></tr>
          </table>
          
          ${order.shippingAddress ? `
            <div style="margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <h3 style="margin: 0 0 8px; color: #111827; font-size: 14px;">Shipping Address</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                ${order.shippingAddress.address1}<br>
                ${order.shippingAddress.address2 ? order.shippingAddress.address2 + '<br>' : ''}
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
              </p>
            </div>
          ` : ''}
        </div>
        
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">Akhdar Perfumes &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;

    await transport.sendMail({
      from: `"Akhdar Perfumes" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Order Confirmed - #${order.orderNumber}`,
      html
    });

    console.log('Order confirmation email sent to', order.email);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
}

export async function sendShippingNotification(order) {
  const transport = getTransporter();
  if (!transport) return;

  try {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #064e3b; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Akhdar Perfumes</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #111827;">Your Order Has Shipped!</h2>
          <p style="color: #6b7280;">Order #${order.orderNumber} is on its way to you.</p>
          ${order.trackingNumber ? `
            <p style="color: #6b7280;">Tracking Number: <strong>${order.trackingNumber}</strong></p>
            ${order.trackingUrl ? `<a href="${order.trackingUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px;">Track Your Package</a>` : ''}
          ` : ''}
        </div>
      </div>
    `;

    await transport.sendMail({
      from: `"Akhdar Perfumes" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Your Order Has Shipped - #${order.orderNumber}`,
      html
    });
  } catch (error) {
    console.error('Failed to send shipping notification:', error);
  }
}
