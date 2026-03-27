import type { Metadata } from "next";
import { Mail, MapPin, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Law Lens team for demos, enterprise inquiries, partnerships, or support.",
};

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "For general inquiries and support",
    detail: "hello@lawlens.io",
    href: "mailto:hello@lawlens.io",
  },
  {
    icon: MessageSquare,
    title: "Sales",
    description: "Enterprise plans and custom deployments",
    detail: "sales@lawlens.io",
    href: "mailto:sales@lawlens.io",
  },
  {
    icon: MapPin,
    title: "Office",
    description: "Kampala, Uganda",
    detail: "East Africa",
    href: null,
  },
];

export default function LandingContactPage() {
  return (
    <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="mx-auto px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight lg:text-5xl">
            Get in touch
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Whether you&apos;re interested in a demo, enterprise deployment, or have
            questions about the platform — we&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {contactMethods.map((method) => (
            <div
              key={method.title}
              className="rounded-2xl border border-transparent bg-card p-8 text-center shadow-soft dark:border-glass"
            >
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <method.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{method.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{method.description}</p>
              {method.href ? (
                <a
                  href={method.href}
                  className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {method.detail}
                </a>
              ) : (
                <p className="mt-3 text-sm font-semibold">{method.detail}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="mt-20 mx-auto max-w-2xl">
          <div className="rounded-2xl border border-transparent bg-card p-10 shadow-soft dark:border-glass">
            <h2 className="text-2xl font-bold">Send us a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill out the form below and we&apos;ll get back to you within one
              business day.
            </p>

            <form className="mt-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  htmlFor="message"
                  className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Tell us about your needs..."
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto sm:px-8"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
