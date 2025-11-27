import Link from "next/link";
import { FileText, Gavel, ScrollText, Scale, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const documentTypes = [
  {
    title: "Acts",
    description: "Browse enacted legislation and statutes passed by Parliament",
    icon: FileText,
    href: "/browse/acts",
    count: "1,200+",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Judgments",
    description: "Access court decisions and case law from various courts",
    icon: Gavel,
    href: "/browse/judgments",
    count: "3,500+",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "Regulations",
    description: "Find regulatory instruments, rules, and subsidiary legislation",
    icon: ScrollText,
    href: "/browse/regulations",
    count: "800+",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Constitution",
    description: "The Constitution of the Republic of Uganda, 1995",
    icon: Scale,
    href: "/browse/constitution",
    count: "1",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
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
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
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
                  <Button variant="ghost" className="mt-4 gap-1 p-0" asChild>
                    <span>
                      Browse {type.title.toLowerCase()}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
