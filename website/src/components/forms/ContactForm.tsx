"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface FormState {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  errors: string[];
}

export function ContactForm() {
  const [formState, setFormState] = useState<FormState>({
    status: "idle",
    message: "",
    errors: [],
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState({ status: "loading", message: "", errors: [] });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setFormState({
          status: "success",
          message: data.message,
          errors: [],
        });
        // Reset form on success
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setFormState({
          status: "error",
          message: "Please fix the errors below.",
          errors: data.errors || ["An error occurred"],
        });
      }
    } catch {
      setFormState({
        status: "error",
        message: "Failed to send message. Please try again.",
        errors: [],
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (formState.status === "error") {
      setFormState((prev) => ({ ...prev, errors: [] }));
    }
  };

  const inputClass = `w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg
    focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
    disabled:opacity-50 disabled:cursor-not-allowed transition-colors`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {formState.status === "success" && (
        <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-primary">Message sent!</p>
            <p className="text-sm text-text-secondary">{formState.message}</p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {formState.status === "error" && formState.errors.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg">
          <AlertCircle className="text-accent-red flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-accent-red">Please fix the following:</p>
            <ul className="text-sm text-text-secondary list-disc pl-4 mt-1">
              {formState.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name <span className="text-accent-red">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={inputClass}
          placeholder="Your name"
          required
          disabled={formState.status === "loading"}
          minLength={2}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email <span className="text-accent-red">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={inputClass}
          placeholder="you@company.com"
          required
          disabled={formState.status === "loading"}
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Subject <span className="text-accent-red">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className={inputClass}
          required
          disabled={formState.status === "loading"}
        >
          <option value="">Select a topic</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Sales">Sales / Pricing</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Enterprise">Enterprise / Custom Plans</option>
          <option value="Partnership">Partnership Opportunities</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message <span className="text-accent-red">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className={`${inputClass} min-h-[150px] resize-y`}
          placeholder="Tell us how we can help..."
          required
          disabled={formState.status === "loading"}
          minLength={10}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={formState.status === "loading"}
      >
        {formState.status === "loading" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>

      <p className="text-xs text-text-muted text-center">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
