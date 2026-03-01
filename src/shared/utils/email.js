const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendBookingConfirmationEmail = async (booking) => {
  const {
    guest_name,
    guest_email,
    reference_code,
    queue_number,
    service_name,
    variant_name,
    booking_date,
    amount_paid,
    remaining_balance,
    payment_type,
  } = booking;

  const formattedDate = new Date(booking_date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedAmountPaid = `₱${parseFloat(amount_paid).toLocaleString(
    'en-PH',
    { minimumFractionDigits: 2 }
  )}`;
  const formattedRemaining =
    remaining_balance > 0
      ? `₱${parseFloat(remaining_balance).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
        })}`
      : null;

  const serviceLabel = variant_name
    ? `${service_name} — ${variant_name}`
    : service_name;
  const paymentLabel =
    payment_type === 'full' ? 'Full Payment' : '50% Down Payment';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;color:#ffffff;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:3px;background-color:#e53535;border-radius:2px;">&nbsp;</td>
                  <td style="padding-left:12px;font-size:20px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#ffffff;">
                    Herco Detailing Garage
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td align="center" style="padding:40px 0 24px;">
              <div style="display:inline-block;background-color:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;color:#4ade80;font-weight:700;">
                &#10003;
              </div>
              <p style="margin:16px 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#4ade80;">Payment Confirmed</p>
              <h1 style="margin:0;font-size:36px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;">
                You're All Set!
              </h1>
              <p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;max-width:360px;">
                Your booking has been confirmed. Here are your booking details for your reference.
              </p>
            </td>
          </tr>

          <!-- Booking Details Card -->
          <tr>
            <td style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;">
              <p style="margin:0 0 20px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);">Booking Details</p>

              <!-- Reference Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:14px;margin-bottom:14px;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Reference Code</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:#ffffff;letter-spacing:2px;">${reference_code}</td>
                </tr>
              </table>

              <!-- Queue Number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:14px;margin-bottom:14px;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Queue Number</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:#ffffff;">#${queue_number}</td>
                </tr>
              </table>

              <!-- Service -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:14px;margin-bottom:14px;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Service</td>
                  <td align="right" style="font-size:13px;color:#ffffff;">${serviceLabel}</td>
                </tr>
              </table>

              <!-- Date -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:14px;margin-bottom:14px;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Date</td>
                  <td align="right" style="font-size:13px;color:#ffffff;">${formattedDate}</td>
                </tr>
              </table>

              <!-- Name -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:14px;margin-bottom:14px;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Name</td>
                  <td align="right" style="font-size:13px;color:#ffffff;">${guest_name}</td>
                </tr>
              </table>

              <!-- Payment Type -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:14px;margin-bottom:14px;">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Payment Type</td>
                  <td align="right" style="font-size:13px;color:#ffffff;">${paymentLabel}</td>
                </tr>
              </table>

              <!-- Amount Paid -->
              <table width="100%" cellpadding="0" cellspacing="0" ${
                formattedRemaining
                  ? 'style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:14px;margin-bottom:14px;"'
                  : ''
              }>
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Amount Paid</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:#4ade80;">${formattedAmountPaid}</td>
                </tr>
              </table>

              ${
                formattedRemaining
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.4);">Remaining Balance</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:#facc15;">${formattedRemaining}</td>
                </tr>
              </table>
              `
                  : ''
              }

            </td>
          </tr>

          <!-- What's Next -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);">What's Next</p>

              <!-- Item 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="width:40px;vertical-align:top;">
                    <div style="width:32px;height:32px;background-color:#e53535;border-radius:8px;">&nbsp;</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:top;">
                    <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#ffffff;">Arrive on time</p>
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;">Please arrive at the garage on your scheduled date with your queue number ready.</p>
                  </td>
                </tr>
              </table>

              <!-- Item 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="width:40px;vertical-align:top;">
                    <div style="width:32px;height:32px;background-color:#e53535;border-radius:8px;">&nbsp;</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:top;">
                    <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#ffffff;">Bring your motorcycle</p>
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;">Make sure your motorcycle matches the details you provided during booking.</p>
                  </td>
                </tr>
              </table>

              ${
                formattedRemaining
                  ? `
              <!-- Item 3 - only for down payment -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="width:40px;vertical-align:top;">
                    <div style="width:32px;height:32px;background-color:#e53535;border-radius:8px;">&nbsp;</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:top;">
                    <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#ffffff;">Settle remaining balance</p>
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;">Please prepare <strong style="color:#facc15;">${formattedRemaining}</strong> to be paid in cash upon pickup.</p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.2);">This is an automated email from Herco Detailing Garage.</p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">Please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  const data = await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: 'Herco Detailing Garage', email: 'devglensprt@gmail.com' },
    to: [{ email: guest_email, name: guest_name }],
    subject: `Booking Confirmed — ${reference_code}`,
    htmlContent: html,
  });

  console.log('[EMAIL] Confirmation email sent:', data.messageId);
  return data;
};

module.exports = { sendBookingConfirmationEmail };
