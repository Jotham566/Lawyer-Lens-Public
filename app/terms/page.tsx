import { Mail } from "lucide-react";
import { LegalPageToc } from "@/components/legal/legal-page-toc";

export default function TermsPage() {
  const tocItems = [
    { id: "acceptance", label: "Acceptance" },
    { id: "platform-services", label: "Platform Services" },
    { id: "no-legal-advice", label: "No Legal Advice" },
    { id: "acceptable-use", label: "Acceptable Use" },
    { id: "customer-data", label: "Customer Data" },
    { id: "billing", label: "Billing and Trials" },
    { id: "enterprise-terms", label: "Enterprise Terms" },
    { id: "disclaimers", label: "Disclaimers" },
    { id: "governing-law", label: "Governing Law" },
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 2026
        </p>
        <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
          These Terms govern access to and use of Law Lens, including individual,
          team, and enterprise use of the platform.
        </p>
      </section>

      {/* Summary panel */}
      <section className="mb-12 rounded-xl border border-border/40 bg-surface-container-low p-6 lg:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: "Coverage", summary: "Individual, team, and enterprise use — including subscriptions, billing, and uploaded data" },
            { label: "Key terms", summary: "No legal advice, acceptable use, customer data ownership, and AI output disclaimers" },
            { label: "Governing law", summary: "Republic of Uganda — disputes subject to Ugandan jurisdiction" },
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
        {/* 1. Acceptance of Terms */}
        <section id="acceptance" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">1. Acceptance of Terms</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            By creating an account, accessing, or using the Law Lens platform, you acknowledge
            that you have read, understood, and agree to be bound by these Terms of Service and
            our Privacy Policy. If you do not agree to these Terms, please do not use the service.
          </p>
        </section>

        {/* 2. Who May Use the Service */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">2. Who May Use the Service</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Law Lens is available to:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Individual users for personal legal research and professional work",
              "Professional users including lawyers, researchers, and compliance officers",
              "Organizations through authorized users and account administrators on team and enterprise plans",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            You must be at least 18 years of age to use the platform.
          </p>
        </section>

        {/* 3. Accounts and Access */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">3. Accounts and Access</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "You must provide accurate and complete information when creating an account",
              "You are responsible for maintaining the security and confidentiality of your account credentials",
              "Organizations are responsible for authorized use of the platform within their teams",
              "You must notify us immediately of any unauthorized access to your account",
              "Access may be suspended or terminated for misuse, breach of these Terms, or security concerns",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Platform Services */}
        <section id="platform-services" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">4. Platform Services</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Law Lens provides a legal intelligence platform that includes:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Legal research automation — search judgments, statutes, and regulations in plain language",
              "Citation-backed legal intelligence — grounded answers with verified sources and confidence scoring",
              "Document analysis — review and analyze legal documents, contracts, and policies",
              "Internal knowledge and workspace tools — organizational knowledge base, document ingestion, and team workspaces",
              "Compliance and regulatory monitoring — track obligations, surface risk, and monitor regulatory change",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Features and availability may vary by plan. See the Pricing page for current plan details.
          </p>
        </section>

        {/* 5. No Legal Advice */}
        <section id="no-legal-advice" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">5. No Legal Advice</h2>
          <div className="mt-4 rounded-xl border border-border/40 bg-surface-container-low p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">
                Law Lens supports legal research and analysis but is not a substitute for
                professional legal judgment or legal advice.
              </strong>{" "}
              The platform provides information, citations, and AI-generated analysis to
              support legal work. It does not create an attorney-client relationship, provide
              legal opinions, or replace the judgment of qualified legal professionals. Users
              are responsible for independently verifying information and seeking professional
              counsel for specific legal matters.
            </p>
          </div>
        </section>

        {/* 6. Acceptable Use */}
        <section id="acceptable-use" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">6. Acceptable Use</h2>

          <div className="mt-4 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-bold">Permitted Uses</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Lawful legal research and compliance work",
                  "Internal organizational research and analysis",
                  "Document review and contract analysis",
                  "Organizational knowledge management workflows",
                  "Professional legal practice and advisory work",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-bold">Prohibited Uses</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {[
                  "Any unlawful purpose or activity",
                  "Unauthorized redistribution or resale of platform content",
                  "Automated scraping, crawling, or data extraction",
                  "Circumventing access controls or usage limits",
                  "Misuse of confidential data without proper authority",
                  "Infringing third-party intellectual property rights",
                  "Uploading malicious content or malware",
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

        {/* 7. Customer and Organizational Data */}
        <section id="customer-data" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">7. Customer and Organizational Data</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Users and organizations are responsible for ensuring they have the right to upload,
            use, and process documents and records submitted to the platform. You retain ownership
            of all content you upload. By uploading content, you grant us a limited license to
            process, index, store, and make it available within your workspace for the purpose
            of providing the service.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We do not use customer data to train AI models, share it with other customers, or
            make it available outside your organization&apos;s workspace. See our Privacy Policy
            for full details on how we handle organizational data.
          </p>
        </section>

        {/* 8. Intellectual Property */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">8. Intellectual Property</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Platform software, design, branding, and original content belong to Law Lens and are protected by intellectual property laws",
              "Public legal materials (legislation, judgments) may be subject to applicable public-domain or source rules",
              "Customer organizational documents remain customer data — we do not claim ownership of content you upload",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 9. Subscriptions, Billing, and Trials */}
        <section id="billing" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">9. Subscriptions, Billing, and Trials</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Law Lens offers Free, Professional, Team, and Enterprise plans with varying features and usage limits",
              "Paid plans are billed monthly or annually in advance, as selected at checkout. Prices are in US dollars unless otherwise agreed",
              "Professional and Team plans include a 14-day free trial. You will not be charged until the trial period ends",
              "Subscriptions renew automatically at the end of each billing cycle unless cancelled",
              "You may upgrade or downgrade your plan at any time. Changes take effect at the start of the next billing cycle",
              "Cancellation takes effect at the end of the current billing period. No refunds are provided for partial periods unless otherwise required by law",
              "Applicable taxes and fees may apply depending on your jurisdiction",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 10. Enterprise Terms */}
        <section id="enterprise-terms" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">10. Enterprise Terms</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Enterprise customers may be subject to separate commercial agreements, including
            customized terms for procurement, security requirements, data-processing obligations,
            SLAs, and support arrangements. Where a separate enterprise agreement exists, it
            takes precedence over these general Terms for the scope of that agreement.
          </p>
        </section>

        {/* 11. Availability and Changes */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">11. Service Availability and Changes</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "The platform may evolve — features, interfaces, and capabilities may be added, changed, or removed",
              "We aim to maintain service availability but do not guarantee uninterrupted access",
              "Scheduled maintenance and updates may result in temporary downtime",
              "Enterprise customers with SLAs are governed by the terms of their service agreement",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 12. Suspension and Termination */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">12. Suspension and Termination</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We may suspend or terminate access to the platform for:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Breach of these Terms or the Acceptable Use policy",
              "Non-payment of applicable subscription fees",
              "Security risks or threats to the platform or other users",
              "Misuse of the platform or its features",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We will provide reasonable notice where possible. Upon termination, your right to
            access the platform ceases. We will provide a reasonable data export window upon request.
          </p>
        </section>

        {/* 13. Disclaimers */}
        <section id="disclaimers" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">13. Disclaimers</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "The service is provided on an \"as available\" basis without warranties of any kind, express or implied",
              "We do not guarantee that AI-generated outputs are error-free, complete, or suitable for any particular legal purpose",
              "Users should review outputs, verify citations, and consult original source materials as appropriate",
              "We are not responsible for decisions or actions taken based on information provided by the platform",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 14. Limitation of Liability */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">14. Limitation of Liability</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            To the maximum extent permitted by law, Law Lens shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages resulting from your use of or
            inability to use the platform, including but not limited to reliance on AI-generated
            output, data loss, service interruptions, or unauthorized access to your account.
          </p>
        </section>

        {/* 15. Governing Law */}
        <section id="governing-law" className="scroll-mt-52">
          <h2 className="text-xl font-extrabold tracking-tight">15. Governing Law</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the
            Republic of Uganda. Any disputes arising from these Terms shall be subject to the
            exclusive jurisdiction of the courts of Uganda.
          </p>
        </section>

        {/* 16. Changes to Terms */}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight">16. Changes to Terms</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We may update these Terms from time to time. We will post the revised version on
            this page and update the &ldquo;Last updated&rdquo; date. For material changes, we
            will notify registered users by email or through the platform. Your continued use
            after changes are posted constitutes acceptance of the updated Terms.
          </p>
        </section>

        {/* 17. Contact */}
        <section id="contact" className="scroll-mt-52 rounded-xl border border-border/40 bg-surface-container-low p-8">
          <h2 className="text-lg font-bold tracking-tight">17. Contact</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            For questions about these Terms of Service:
          </p>
          <div className="mt-4 flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-brand-gold" />
            <a
              href="mailto:legal@lawlens.io"
              className="font-semibold text-foreground transition-colors hover:text-brand-gold"
            >
              legal@lawlens.io
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
