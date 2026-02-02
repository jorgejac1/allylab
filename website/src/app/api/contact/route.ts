import { NextRequest, NextResponse } from "next/server";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateForm(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid form data"] };
  }

  const form = data as Partial<ContactFormData>;

  if (!form.name || typeof form.name !== "string" || form.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (!form.email || typeof form.email !== "string" || !validateEmail(form.email)) {
    errors.push("Valid email is required");
  }

  if (!form.subject || typeof form.subject !== "string" || form.subject.trim().length < 3) {
    errors.push("Subject must be at least 3 characters");
  }

  if (!form.message || typeof form.message !== "string" || form.message.trim().length < 10) {
    errors.push("Message must be at least 10 characters");
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the form data
    const validation = validateForm(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    const formData = body as ContactFormData;

    // In production, you would:
    // 1. Send an email using a service like SendGrid, Resend, or AWS SES
    // 2. Store the submission in a database
    // 3. Send a Slack notification
    // 4. Add to a CRM like HubSpot or Salesforce

    // For now, we'll just log the submission and return success
    console.log("Contact form submission:", {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
      timestamp: new Date().toISOString(),
    });

    // Simulate a small delay as if sending email
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Thank you for your message! We'll get back to you within 24 hours.",
    });
  } catch {
    console.error("Contact form error");
    return NextResponse.json(
      { success: false, errors: ["An unexpected error occurred. Please try again."] },
      { status: 500 }
    );
  }
}
