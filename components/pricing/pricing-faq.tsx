"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, the change takes effect at the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept major credit cards (Visa, Mastercard), MTN Mobile Money, and Airtel Money. All payments are processed securely through our payment provider.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Professional and Team plans come with a 14-day free trial. No credit card required to start. You'll only be charged after the trial period ends.",
  },
  {
    question: "What happens when I reach my usage limits?",
    answer:
      "When you approach your limits, we'll notify you so you can upgrade if needed. If you reach your limit, some features may be temporarily restricted until your next billing cycle or until you upgrade.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Absolutely. You can cancel your subscription at any time from your billing settings. Your access continues until the end of your current billing period, and you won't be charged again.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer:
      "Yes! When you choose annual billing, you save up to 20% compared to monthly billing. The discount is automatically applied when you select the annual option.",
  },
  {
    question: "What's included in the Enterprise plan?",
    answer:
      "Enterprise plans include unlimited usage, SSO/SAML integration, custom integrations, dedicated support, SLA guarantees, and optional on-premise deployment. Contact our sales team for a custom quote.",
  },
  {
    question: "How is team billing calculated?",
    answer:
      "Team plans are billed per user per month. You can add or remove seats at any time. When adding seats mid-cycle, you'll be charged a prorated amount. Minimum 3 seats required for Team plans.",
  },
];

export function PricingFAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
