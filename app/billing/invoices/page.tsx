"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  FileText,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { useAuth, useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

interface Invoice {
  id: string;
  invoice_number: string;
  status: "paid" | "pending" | "failed" | "cancelled";
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  due_date: string;
  paid_at?: string;
  pdf_url?: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  paid: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-green-100 text-green-700",
    label: "Paid",
  },
  pending: {
    icon: <Clock className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-700",
    label: "Pending",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700",
    label: "Failed",
  },
  cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-slate-100 text-slate-700",
    label: "Cancelled",
  },
};

export default function InvoicesPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    fetchInvoices();
  }, [isAuthenticated]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      setError("Failed to load invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Failed to download invoice:", err);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "UGX") {
      return `UGX ${amount.toLocaleString()}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Get unique years from invoices
  const years = [...new Set(invoices.map((inv) => new Date(inv.created_at).getFullYear()))].sort(
    (a, b) => b - a
  );

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    const matchesYear =
      yearFilter === "all" || new Date(invoice.created_at).getFullYear().toString() === yearFilter;

    return matchesSearch && matchesStatus && matchesYear;
  });

  // Calculate totals
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (authLoading || !isAuthenticated) {
    return <PageLoading message="Redirecting to login..." />;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Link href="/billing" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Invoice History</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              View and download your past invoices
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold">UGX {totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold">
                  {invoices.filter((inv) => inv.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {invoices.length === 0
                  ? "No invoices yet"
                  : "No invoices match your filters"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>{formatDateOnly(invoice.created_at)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {invoice.description}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[invoice.status].color}>
                          <span className="flex items-center gap-1">
                            {statusConfig[invoice.status].icon}
                            {statusConfig[invoice.status].label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(invoice.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-slate-500">
        <p>
          Need help with an invoice?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}
