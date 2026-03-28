"use client";

import { useState } from "react";
import { X, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface DemoRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoRequestModal({ open, onOpenChange }: DemoRequestModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    role: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/demo-request", {
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
    // Reset after animation
    setTimeout(() => {
      setStatus("idle");
      setForm({ name: "", email: "", organization: "", role: "", message: "" });
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
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-border/50 bg-card p-8 shadow-2xl dark:border-glass/50">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-container-high hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {status === "sent" ? (
          /* Success state */
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
              Request received
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ll be in touch within one business day to schedule your demo.
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
          /* Form state */
          <>
            <h2 className="text-xl font-extrabold tracking-tight">
              Request a Demo
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              See how Law Lens can support your institution with faster research,
              grounded answers, and compliance visibility.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="demo-name"
                    className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Full Name *
                  </label>
                  <input
                    id="demo-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Jane Nakamya"
                  />
                </div>
                <div>
                  <label
                    htmlFor="demo-email"
                    className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Work Email *
                  </label>
                  <input
                    id="demo-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="demo-org"
                    className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Organization
                  </label>
                  <input
                    id="demo-org"
                    type="text"
                    value={form.organization}
                    onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Your organization"
                  />
                </div>
                <div>
                  <label
                    htmlFor="demo-role"
                    className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Role
                  </label>
                  <input
                    id="demo-role"
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="e.g. Legal Counsel, CTO"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="demo-message"
                  className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  What are you looking to solve?
                </label>
                <textarea
                  id="demo-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Optional — tell us about your use case"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">
                  Something went wrong. Please try again or email us at{" "}
                  <a href="mailto:sales@lawlens.io" className="underline">
                    sales@lawlens.io
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
                    Request Demo
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
