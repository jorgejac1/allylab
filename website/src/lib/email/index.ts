/**
 * Email Service
 *
 * Centralized email service for sending transactional emails.
 * Uses Resend in production, logs to console in development.
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'AllyLab <noreply@allylab.com>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@allylab.com';
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173';
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend or log in development
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  // In development without Resend, just log
  if (!resend) {
    console.log('📧 [Email] Would send email:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text || html.slice(0, 200)}...`);
    return true;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Welcome to AllyLab!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">AllyLab</div>
            <h1>Welcome, ${name}!</h1>
            <p>Thanks for joining AllyLab! We're excited to help you make your websites more accessible.</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li><strong>Run your first scan</strong> - Enter any URL to check for accessibility issues</li>
              <li><strong>Get AI-powered fixes</strong> - Let our AI generate code fixes for you</li>
              <li><strong>Create GitHub PRs</strong> - Push fixes directly to your repositories</li>
            </ul>
            <p style="margin-top: 24px;">
              <a href="${DASHBOARD_URL}" class="button">Go to Dashboard</a>
            </p>
            <p>If you have any questions, reply to this email or reach out to ${SUPPORT_EMAIL}.</p>
            <div class="footer">
              <p>AllyLab - Making the web accessible, one fix at a time.</p>
              <p><a href="${WEBSITE_URL}">allylab.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(
  email: string,
  name: string,
  plan: string,
  interval: 'monthly' | 'yearly'
): Promise<boolean> {
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
  const intervalDisplay = interval === 'yearly' ? 'yearly' : 'monthly';

  return sendEmail({
    to: email,
    subject: `Your AllyLab ${planDisplay} subscription is active!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #15803d; border-radius: 20px; font-weight: 600; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">AllyLab</div>
            <h1>Your subscription is active!</h1>
            <p>Hi ${name},</p>
            <p>Thanks for subscribing to <span class="badge">${planDisplay}</span> (${intervalDisplay})!</p>
            <p>You now have access to:</p>
            <ul>
              ${plan === 'pro' ? `
                <li>Unlimited scans</li>
                <li>AI-powered code fixes</li>
                <li>Scheduled scans</li>
                <li>JIRA integration</li>
              ` : `
                <li>Unlimited scans</li>
                <li>Custom rules</li>
                <li>API access</li>
                <li>Priority support</li>
                <li>Up to 20 team members</li>
              `}
            </ul>
            <p style="margin-top: 24px;">
              <a href="${DASHBOARD_URL}" class="button">Start Using AllyLab</a>
            </p>
            <div class="footer">
              <p>Manage your subscription anytime in Settings > Billing.</p>
              <p><a href="${WEBSITE_URL}">allylab.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  email: string,
  name: string,
  plan: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Action required: Payment failed for your AllyLab subscription',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .alert { padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">AllyLab</div>
            <h1>Payment failed</h1>
            <p>Hi ${name},</p>
            <div class="alert">
              <p><strong>We couldn't process your payment</strong> for your ${plan.charAt(0).toUpperCase() + plan.slice(1)} subscription.</p>
            </div>
            <p style="margin-top: 16px;">To keep your subscription active, please update your payment method:</p>
            <p style="margin-top: 24px;">
              <a href="${WEBSITE_URL}/api/billing/portal" class="button">Update Payment Method</a>
            </p>
            <p>If you have any questions, reach out to ${SUPPORT_EMAIL}.</p>
            <div class="footer">
              <p><a href="${WEBSITE_URL}">allylab.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  email: string,
  name: string,
  endDate: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your AllyLab subscription has been canceled',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .info { padding: 16px; background: #f1f5f9; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">AllyLab</div>
            <h1>Subscription canceled</h1>
            <p>Hi ${name},</p>
            <p>Your AllyLab subscription has been canceled.</p>
            <div class="info">
              <p><strong>You'll still have access until ${endDate}</strong></p>
              <p>After that, your account will be downgraded to the free plan.</p>
            </div>
            <p style="margin-top: 16px;">Changed your mind? You can reactivate anytime:</p>
            <p style="margin-top: 24px;">
              <a href="${WEBSITE_URL}/pricing" class="button">View Plans</a>
            </p>
            <p>We'd love to know why you left. Reply to this email with any feedback!</p>
            <div class="footer">
              <p><a href="${WEBSITE_URL}">allylab.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send trial ending reminder
 */
export async function sendTrialEndingEmail(
  email: string,
  name: string,
  daysLeft: number,
  plan: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Your AllyLab trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .highlight { padding: 16px; background: #fef3c7; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">AllyLab</div>
            <h1>Your trial is ending soon</h1>
            <p>Hi ${name},</p>
            <div class="highlight">
              <p><strong>Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.</strong></p>
            </div>
            <p style="margin-top: 16px;">To continue using all features, make sure your payment method is up to date:</p>
            <p style="margin-top: 24px;">
              <a href="${DASHBOARD_URL}/settings?tab=billing" class="button">Manage Subscription</a>
            </p>
            <p>If you don't want to continue, no action is needed. Your account will be downgraded to the free plan automatically.</p>
            <div class="footer">
              <p><a href="${WEBSITE_URL}">allylab.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export {
  FROM_EMAIL,
  SUPPORT_EMAIL,
  DASHBOARD_URL,
  WEBSITE_URL,
};
