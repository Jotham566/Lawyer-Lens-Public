/**
 * Tests for WeakResearchBanner — the Phase A/4 (2026-04-18) transparency
 * banners that appear when Deep Research couldn't find sufficient
 * statutory or judicial authority for one or more topics. Without these
 * banners the previous behavior was to render a clean-looking report
 * with no signal that some sections were synthesised on thin evidence.
 */

import { render, screen } from "@testing-library/react";
import { WeakResearchBanner } from "@/components/research/weak-research-banner";

describe("WeakResearchBanner", () => {
  describe("variant=report", () => {
    it("renders the report-level headline and accessible status role", () => {
      render(<WeakResearchBanner variant="report" weakTopicCount={3} />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(
        screen.getByText("Limited authority found in some sections"),
      ).toBeInTheDocument();
    });

    it("pluralizes the topic count copy when more than one topic is weak", () => {
      render(<WeakResearchBanner variant="report" weakTopicCount={3} />);
      expect(screen.getByText(/3 topics/)).toBeInTheDocument();
    });

    it("uses singular copy when exactly one topic is weak", () => {
      render(<WeakResearchBanner variant="report" weakTopicCount={1} />);
      expect(screen.getByText(/1 topic\b/)).toBeInTheDocument();
      expect(screen.queryByText(/1 topics/)).not.toBeInTheDocument();
    });

    it("falls back to generic copy when no count is provided", () => {
      render(<WeakResearchBanner variant="report" />);
      expect(screen.getByText(/some topics/)).toBeInTheDocument();
    });

    it("falls back to generic copy when count is zero", () => {
      render(<WeakResearchBanner variant="report" weakTopicCount={0} />);
      expect(screen.getByText(/some topics/)).toBeInTheDocument();
    });

    it("tells the user to verify independently before relying on the report", () => {
      render(<WeakResearchBanner variant="report" weakTopicCount={2} />);
      expect(
        screen.getByText(/Verify any conclusions independently/),
      ).toBeInTheDocument();
    });
  });

  describe("variant=inline", () => {
    it("renders the inline (per-section) headline", () => {
      render(<WeakResearchBanner variant="inline" />);
      expect(
        screen.getByText("Limited authority for this section"),
      ).toBeInTheDocument();
    });

    it("tells the user the section is preliminary", () => {
      render(<WeakResearchBanner variant="inline" />);
      expect(
        screen.getByText(/Treat the analysis below as preliminary/),
      ).toBeInTheDocument();
    });

    it("ignores weakTopicCount in inline copy (inline is section-scoped)", () => {
      render(<WeakResearchBanner variant="inline" weakTopicCount={5} />);
      expect(screen.queryByText(/5 topics/)).not.toBeInTheDocument();
    });
  });

  it("accepts an additional className override", () => {
    const { container } = render(
      <WeakResearchBanner
        variant="report"
        weakTopicCount={1}
        className="custom-spacing"
      />,
    );
    expect(container.firstChild).toHaveClass("custom-spacing");
  });
});
