"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BillingMetricsGrid,
  TierBreakdown,
  SubscriptionsTable,
  InvoicesTable,
  PaymentsTable,
} from "@/components/billing";
import { useAuth } from "@/components/providers";
import { getCsrfToken } from "@/lib/api/client";
import { FeatureGate } from "@/components/entitlements/feature-gate";

interface BillingMetrics {
  mrr: number;
  arr: number;
  total_revenue_mtd: number;
  total_customers: number;
  paying_customers: number;
  free_tier_customers: number;
  trial_customers: number;
  churned_customers_mtd: number;
  new_customers_mtd: number;
  average_revenue_per_customer: number;
  churn_rate: number;
  tier_breakdown: Record<string, number>;
}

interface Subscription {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  tier: string;
  status: string;
  billing_cycle: string;
  price_per_unit: number;
  quantity: number;
  total_amount: number;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  organization_id: string;
  organization_name: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  created_at: string;
  due_date: string | null;
  paid_at: string | null;
}

interface Payment {
  id: string;
  organization_id: string;
  organization_name: string;
  status: string;
  amount: number;
  refunded_amount: number;
  currency: string;
  payment_method_type: string | null;
  created_at: string;
  paid_at: string | null;
  flutterwave_tx_id: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

function AdminBillingContent() {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsTotal, setSubscriptionsTotal] = useState(0);
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Fetch billing metrics
  useEffect(() => {
    async function fetchMetrics() {
      try {
        if (!isAuthenticated) {
          setMetricsLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/admin/billing/metrics`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setMetricsLoading(false);
      }
    }
    fetchMetrics();
  }, [isAuthenticated]);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setSubscriptionsLoading(true);
    try {
      if (!isAuthenticated) {
        setSubscriptionsLoading(false);
        return;
      }
      const params = new URLSearchParams({
        page: subscriptionsPage.toString(),
        page_size: "20",
      });
      if (statusFilter) params.set("status", statusFilter);
      if (tierFilter) params.set("tier", tierFilter);

      const res = await fetch(
        `${API_BASE}/admin/billing/subscriptions?${params}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
        setSubscriptionsTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [subscriptionsPage, statusFilter, tierFilter, isAuthenticated]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Fetch invoices
  useEffect(() => {
    async function fetchInvoices() {
      try {
        if (!isAuthenticated) {
          setInvoicesLoading(false);
          return;
        }
        const res = await fetch(
          `${API_BASE}/admin/billing/invoices?page_size=10`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setInvoicesLoading(false);
      }
    }
    fetchInvoices();
  }, [isAuthenticated]);

  // Fetch payments
  useEffect(() => {
    async function fetchPayments() {
      try {
        if (!isAuthenticated) {
          setPaymentsLoading(false);
          return;
        }
        const res = await fetch(
          `${API_BASE}/admin/billing/payments?page_size=10`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments);
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setPaymentsLoading(false);
      }
    }
    fetchPayments();
  }, [isAuthenticated]);

  const handleVoidInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to void this invoice?")) return;

    try {
      if (!isAuthenticated) return;
      const csrfToken = getCsrfToken();
      const res = await fetch(
        `${API_BASE}/admin/billing/invoices/${invoiceId}/void`,
        {
          method: "POST",
          headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
          credentials: "include",
        }
      );
      if (res.ok) {
        // Refresh invoices
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: "void" } : inv
          )
        );
      }
    } catch (error) {
      console.error("Failed to void invoice:", error);
    }
  };

  const handleRefundPayment = async (paymentId: string) => {
    const reason = prompt("Enter refund reason:");
    if (!reason) return;

    try {
      if (!isAuthenticated) return;
      const csrfToken = getCsrfToken();
      const res = await fetch(`${API_BASE}/admin/billing/refunds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ payment_id: paymentId, reason }),
      });
      if (res.ok) {
        // Refresh payments
        setPayments((prev) =>
          prev.map((pmt) =>
            pmt.id === paymentId ? { ...pmt, status: "refunded" } : pmt
          )
        );
      }
    } catch (error) {
      console.error("Failed to process refund:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing Dashboard</h1>
        <p className="text-muted-foreground">
          Manage subscriptions, invoices, and payments
        </p>
      </div>

      {/* Metrics Grid */}
      <BillingMetricsGrid metrics={metrics} isLoading={metricsLoading} />

      {/* Tier Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <TierBreakdown metrics={metrics} isLoading={metricsLoading} />
        </div>
      </div>

      {/* Tabs for Subscriptions, Invoices, Payments */}
      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionsTable
            subscriptions={subscriptions}
            total={subscriptionsTotal}
            page={subscriptionsPage}
            pageSize={20}
            isLoading={subscriptionsLoading}
            onPageChange={setSubscriptionsPage}
            onStatusFilter={setStatusFilter}
            onTierFilter={setTierFilter}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesTable
            invoices={invoices}
            isLoading={invoicesLoading}
            onVoid={handleVoidInvoice}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsTable
            payments={payments}
            isLoading={paymentsLoading}
            onRefund={handleRefundPayment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminBillingPage() {
  return (
    <FeatureGate
      feature="team_management"
      requiredTier="team"
      featureName="Billing Admin"
    >
      <AdminBillingContent />
    </FeatureGate>
  );
}
