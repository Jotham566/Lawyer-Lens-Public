"use client";

import { useState, useCallback } from "react";
import { X, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStatus("idle");
      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
    }, 200);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/50 bg-card p-8 shadow-2xl dark:border-glass/50">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-container-high hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {status === "sent" ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
              Message sent
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for reaching out. We&apos;ll get back to you within one business day.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-extrabold tracking-tight">
              Get in touch
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Whether you&apos;re interested in a demo, enterprise deployment, or have
              questions — we&apos;d love to hear from you.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-first"
                    className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    First Name *
                  </label>
                  <input
                    id="contact-first"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-last"
                    className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Last Name
                  </label>
                  <input
                    id="contact-last"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="+256 700 000 000"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Subject
                </label>
                <select
                  id="contact-subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select a topic...</option>
                  <option value="demo">Request a Demo</option>
                  <option value="enterprise">Enterprise Inquiry</option>
                  <option value="partnership">Partnership</option>
                  <option value="support">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Tell us about your needs..."
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">
                  Something went wrong. Please try again or email us at{" "}
                  <a href="mailto:info@lawlens.io" className="underline">
                    info@lawlens.io
                  </a>
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for easily using the ContactModal in any component.
 * Returns { ContactModal, openContactModal }
 */
export function useContactModal() {
  const [open, setOpen] = useState(false);
  const openContactModal = useCallback(() => setOpen(true), []);

  const Modal = useCallback(
    () => <ContactModal open={open} onOpenChange={setOpen} />,
    [open]
  );

  return { ContactModal: Modal, openContactModal };
}
