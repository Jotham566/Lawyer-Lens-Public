import { Mail } from "lucide-react";
import { LegalPageToc } from "@/components/legal/legal-page-toc";

export default function PrivacyPage() {
  const tocItems = [
    { id: "scope", label: "Scope" },
    { id: "information-we-collect", label: "Information We Collect" },
    { id: "how-we-use-information", label: "How We Use Information" },
    { id: "organizational-data", label: "Organizational Data" },
    { id: "sharing-and-disclosure", label: "Sharing and Disclosure" },
    { id: "data-retention", label: "Data Retention" },
    { id: "security", label: "Security" },
    { id: "rights", label: "Rights" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className="px-6 py-10 lg:px-12 xl:px-20">
      {/* Header */}
      <section className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 2026
        </p>
        <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
          Law Lens is committed to protecting personal, organizational, and platform data.
          This policy explains what we collect, how we use it, how we protect it, and the
          choices available to users and organizations.
        </p>
      </section>

      {/* Summary panel */}
      <section className="mb-12 rounded-xl border border-border/40 bg-surface-container-low p-6 lg:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: "What we collect", summary: "Account info, usage data, uploaded documents, and support interactions" },
            { label: "How we protect it", summary: "Encryption in transit and at rest, access controls, and continuous monitoring" },
            { label: "Your rights", summary: "Access, correction, deletion, data export, and objection where applicable" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-gold">
                {item.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="order-2 space-y-12 lg:order-1">
        {/* 1. Scope */}
        <section id="scope" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">1. Scope</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            This Privacy Policy applies to:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Website visitors",
              "Individual account holders",
              "Organizational users (team and enterprise accounts)",
              "Uploaded documents, internal records, and workspace data",
              "Support, sales, and onboarding interactions",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 2. Information We Collect */}
        <section id="information-we-collect" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">2. Information We Collect</h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-bold">Account and Profile Information</h3>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Name and email address",
                  "Phone number (if provided)",
                  "Organization name and details",
                  "Role and account preferences",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-bold">Usage and Activity Data</h3>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Search queries and chat activity",
                  "Feature usage and interaction patterns",
                  "Session, device, and browser data",
                  "Billing and subscription interactions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-bold">Documents and Workspace Data</h3>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Uploaded contracts, policies, records, and internal documents",
                  "Document metadata and indexing data",
                  "Workspace and organizational knowledge-base content",
                  "Prompts, outputs, and interactions tied to user workflows",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-bold">Support and Communications</h3>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Emails and support requests",
                  "Demo and sales conversations",
                  "Feedback and feature submissions",
                  "Onboarding interactions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 3. How We Use Information */}
        <section id="how-we-use-information" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">3. How We Use Information</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Provide and operate the platform",
              "Authenticate users and manage access",
              "Enable legal research, document analysis, and knowledge workflows",
              "Support organizational workspaces and internal knowledge bases",
              "Improve product quality, reliability, and security",
              "Provide customer support and onboarding",
              "Process billing and subscription management",
              "Comply with legal and regulatory obligations",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Organizational Data and Internal Knowledge Bases */}
        <section id="organizational-data" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">
            4. Organizational Data and Internal Knowledge Bases
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Documents and internal records uploaded by organizations are processed to enable
            search, retrieval, analysis, compliance workflows, and internal knowledge-base
            features. Organizational content is handled as customer data and used to provide
            the contracted service — not to make that organization&apos;s internal information
            public or available to other customers.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We do not use organizational data to train AI models or share it outside the
            organization&apos;s workspace unless required by law.
          </p>
        </section>

        {/* 5. Legal Basis */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">5. Legal Basis for Processing</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We process information where necessary to provide the service, maintain security,
            improve platform performance, communicate with users, and comply with legal
            obligations. Where applicable law requires consent, we will obtain it before
            processing.
          </p>
        </section>

        {/* 6. Sharing and Disclosure */}
        <section id="sharing-and-disclosure" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">6. Sharing and Disclosure</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We may share information with:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Infrastructure and cloud service providers (e.g., AWS)",
              "Payment processors for subscription billing",
              "AI inference providers for language model processing",
              "Analytics and security monitoring providers",
              "As required by law, regulation, or valid legal process",
              "In connection with a business transfer, merger, or acquisition (if ever applicable)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-foreground">
            We do not:
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              Sell personal data
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              Expose private organizational documents publicly
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              Use customer data for advertising
            </li>
          </ul>
        </section>

        {/* 7. Data Retention */}
        <section id="data-retention" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">7. Data Retention</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Account data is retained while the account is active",
              "Support and billing records are retained as required for business and legal purposes",
              "Organizational and workspace data is retained according to product and contractual requirements",
              "Deleted accounts or documents may remain in encrypted backups for a limited period",
              "Enterprise customers may negotiate custom retention and deletion schedules",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 8. Security */}
        <section id="security" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">8. Security</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Encryption in transit (TLS) for all platform communications",
              "Encryption at rest (AES-256) for stored data where applicable",
              "Role-based access controls for team and enterprise workspaces",
              "Continuous monitoring and security safeguards",
              "No system is absolutely risk-free — we implement commercially reasonable measures to protect your data",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 9. User and Organization Rights */}
        <section id="rights" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">9. User and Organization Rights</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Access the personal information we hold about you",
              "Request correction of inaccurate information",
              "Request deletion of your personal information and organizational data",
              "Object to or restrict certain processing where applicable",
              "Close your account",
              "Manage team member access and data (for organization administrators)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            To exercise any of these rights, contact us at the address below.
          </p>
        </section>

        {/* 10. International / Third-Party Infrastructure */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">10. International Infrastructure</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Our platform is hosted on Amazon Web Services (AWS) cloud infrastructure. Data may
            be processed and stored in regions where our infrastructure providers operate. We
            require all third-party providers to maintain appropriate security standards and
            process data only as necessary to provide their services.
          </p>
        </section>

        {/* 11. Children */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">11. Children</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Law Lens is not intended for use by children under the age of 18. We do not
            knowingly collect personal information from children. If we become aware that we
            have collected data from a child, we will take steps to delete it promptly.
          </p>
        </section>

        {/* 12. Changes to This Policy */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">12. Changes to This Policy</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We may update this Privacy Policy from time to time. We will post the revised
            version on this page and update the &ldquo;Last updated&rdquo; date. For material
            changes, we will notify registered users by email or through the platform.
          </p>
        </section>

        {/* 13. Contact */}
        <section id="contact" className="scroll-mt-52 rounded-xl border border-border/40 bg-surface-container-low p-8">
          <h2 className="text-lg font-bold tracking-tight">13. Contact</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            For privacy-related inquiries, data access requests, or concerns about how your
            information is handled:
          </p>
          <div className="mt-4 flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-brand-gold" />
            <a
              href="mailto:privacy@lawlens.io"
              className="font-semibold text-foreground transition-colors hover:text-brand-gold"
            >
              privacy@lawlens.io
            </a>
          </div>
        </section>
        </div>
        <div className="order-1 h-full lg:order-2">
          <LegalPageToc items={tocItems} />
        </div>
      </div>
    </div>
  );
}
