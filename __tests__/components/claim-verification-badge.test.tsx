/**
 * Tests for ClaimVerificationBadge — the Phase B/2 (2026-04-18) badge
 * that surfaces the Deep Research pipeline's aggregate NLI entailment
 * verdict on the report header. Without these tests, silent tone-
 * routing bugs (e.g., 0% verified rendering as "verified") would slip
 * through since the badge is rendered conditionally and off the
 * critical-path for most reports.
 */

import { render, screen } from "@testing-library/react";
import { ClaimVerificationBadge } from "@/components/research/claim-verification-badge";
import type { ClaimVerificationSummary } from "@/lib/api/research";

function makeSummary(
  overrides: Partial<ClaimVerificationSummary> = {},
): ClaimVerificationSummary {
  return {
    total_claims: 10,
    verified_claims: 8,
    unsupported_claims: 2,
    contradicted_claims: 0,
    verification_rate: 0.8,
    overall_confidence: 0.75,
    skipped: false,
    skipped_reason: "",
    ...overrides,
  };
}

describe("ClaimVerificationBadge", () => {
  it("renders nothing when summary is null", () => {
    const { container } = render(<ClaimVerificationBadge summary={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when summary is undefined", () => {
    const { container } = render(<ClaimVerificationBadge summary={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  describe("verified tone (rate >= 0.8, no contradictions)", () => {
    it("renders the verified state with 80% rate", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({ verification_rate: 0.8 })}
        />,
      );
      expect(screen.getByText(/80% of claims verified/)).toBeInTheDocument();
    });

    it("rounds the rate to a whole percent", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({ verification_rate: 0.875 })}
        />,
      );
      expect(screen.getByText(/88% of claims verified/)).toBeInTheDocument();
    });

    it("sets role=status for assistive tech announcements", () => {
      render(<ClaimVerificationBadge summary={makeSummary()} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("mixed tone (0.4 <= rate < 0.8 OR any contradictions)", () => {
    it("renders mixed state at 60% rate", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            verification_rate: 0.6,
            verified_claims: 6,
            unsupported_claims: 4,
          })}
        />,
      );
      expect(screen.getByText(/60% of claims verified/)).toBeInTheDocument();
    });

    it("surfaces contradiction count when rate would otherwise be verified", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            verification_rate: 0.75,
            contradicted_claims: 2,
          })}
        />,
      );
      expect(
        screen.getByText(/75% verified · 2 contradicted/),
      ).toBeInTheDocument();
    });
  });

  describe("weak tone (rate < 0.4)", () => {
    it("uses 'only X%' copy to flag the weakness", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            verification_rate: 0.2,
            verified_claims: 2,
            unsupported_claims: 8,
          })}
        />,
      );
      expect(screen.getByText(/Only 20% of claims verified/)).toBeInTheDocument();
    });
  });

  describe("skipped tone", () => {
    it("renders skipped when the verifier did not run", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            skipped: true,
            skipped_reason: "LLM rate-limited during verification",
            verified_claims: 0,
            verification_rate: 0,
          })}
        />,
      );
      expect(screen.getByText("Verification skipped")).toBeInTheDocument();
    });

    it("renders empty-check copy when there are no claims", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            total_claims: 0,
            verified_claims: 0,
            unsupported_claims: 0,
            verification_rate: 1,
          })}
        />,
      );
      expect(screen.getByText("No claims to verify")).toBeInTheDocument();
    });

    it("includes skipped_reason in the tooltip for transparency", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            skipped: true,
            skipped_reason: "LLM client not configured; claim verification skipped",
          })}
        />,
      );
      const badge = screen.getByRole("status");
      expect(badge.getAttribute("title")).toContain(
        "LLM client not configured",
      );
    });
  });

  describe("tooltip content", () => {
    it("includes verified/unsupported breakdown", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            verified_claims: 8,
            unsupported_claims: 2,
            contradicted_claims: 0,
            total_claims: 10,
          })}
        />,
      );
      const badge = screen.getByRole("status");
      const title = badge.getAttribute("title") || "";
      expect(title).toContain("8 verified");
      expect(title).toContain("2 unsupported");
      expect(title).toContain("of 10 checked");
    });

    it("includes contradicted count when present", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            verified_claims: 6,
            contradicted_claims: 1,
            unsupported_claims: 3,
            total_claims: 10,
          })}
        />,
      );
      const title = screen.getByRole("status").getAttribute("title") || "";
      expect(title).toContain("1 contradicted");
    });

    it("omits contradicted line when zero", () => {
      render(
        <ClaimVerificationBadge
          summary={makeSummary({
            verified_claims: 8,
            contradicted_claims: 0,
          })}
        />,
      );
      const title = screen.getByRole("status").getAttribute("title") || "";
      expect(title).not.toContain("contradicted");
    });
  });

  it("accepts a className override for layout callers", () => {
    const { container } = render(
      <ClaimVerificationBadge
        summary={makeSummary()}
        className="custom-spacing"
      />,
    );
    expect(container.firstChild).toHaveClass("custom-spacing");
  });
});
