import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(
  toEmail: string,
  magicLink: string,
  invitedBy: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Bullet Journal <onboarding@resend.dev>",
      to: toEmail,
      subject: `You've been invited to Bullet Journal`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
              <h1 style="color: #1f2937; margin-top: 0;">You've been invited to Bullet Journal</h1>
              <p style="font-size: 16px; color: #4b5563;">
                ${invitedBy} has invited you to join their Bullet Journal workspace.
              </p>
              <p style="font-size: 16px; color: #4b5563;">
                Click the button below to accept the invitation and set up your account:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}"
                   style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Accept Invitation
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Or copy and paste this link into your browser:<br>
                <a href="${magicLink}" style="color: #2563eb; word-break: break-all;">${magicLink}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="font-size: 12px; color: #9ca3af;">
                This invitation link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}
