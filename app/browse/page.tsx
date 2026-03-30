import Link from "next/link";
import { FileText, Gavel, ScrollText, Scale, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const documentTypes = [
  {
    title: "Acts",
    description: "Browse enacted legislation and statutes passed by Parliament",
    icon: FileText,
    href: "/legislation/acts",
    count: "1,200+",
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/15",
  },
  {
    title: "Judgments",
    description: "Access court decisions and case law from various courts",
    icon: Gavel,
    href: "/judgments",
    count: "3,500+",
    color: "text-secondary-foreground",
    bgColor: "bg-secondary",
  },
  {
    title: "Regulations",
    description: "Find regulatory instruments, rules, and subsidiary legislation",
    icon: ScrollText,
    href: "/legislation/regulations",
    count: "800+",
    color: "text-foreground",
    bgColor: "bg-surface-container-high",
  },
  {
    title: "Constitution",
    description: "The Constitution of the Republic of Uganda, 1995",
    icon: Scale,
    href: "/legislation/constitution",
    count: "1",
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/15",
  },
];

export const metadata = {
  title: "Browse Documents",
  description: "Browse Uganda's legal documents by type - acts, judgments, regulations, and constitution.",
};

export default function BrowsePage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Browse Documents
          </h1>
          <p className="mt-1 text-muted-foreground">
            Explore Uganda&apos;s legal documents organized by type
          </p>
        </div>

        {/* Document Type Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {documentTypes.map((type) => (
            <Link key={type.href} href={type.href}>
              <Card className={cn("h-full", surfaceClasses.pagePanelInteractive)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${type.bgColor}`}
                    >
                      <type.icon className={`h-6 w-6 ${type.color}`} />
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">
                      {type.count}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                  <div className={cn("mt-4 inline-flex items-center gap-1 text-sm font-medium", surfaceClasses.textLink)}>
                    Browse {type.title.toLowerCase()}
                    <ArrowRight className="ll-icon-muted h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
