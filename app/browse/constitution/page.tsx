import Link from "next/link";
import { Scale, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Constitution of Uganda",
  description: "The Constitution of the Republic of Uganda, 1995 - Browse the supreme law of the land.",
};

export default function ConstitutionPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link href="/browse" className="hover:text-foreground">
              Browse
            </Link>
            <span>/</span>
            <span className="text-foreground">Constitution</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Constitution
              </h1>
              <p className="text-sm text-muted-foreground">
                The supreme law of the Republic of Uganda
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-amber-50 dark:bg-amber-900/10">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <div>
                <CardTitle className="text-xl">
                  The Constitution of the Republic of Uganda, 1995
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  As amended up to 2018
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <p className="text-muted-foreground">
              The Constitution of Uganda is the supreme law of the Republic of
              Uganda. It establishes the structure, procedures, powers and
              duties of the government, and guarantees the rights and freedoms
              of all Ugandans.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Key Information</h3>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Enacted:</dt>
                    <dd>8 October 1995</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Chapters:</dt>
                    <dd>21</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Articles:</dt>
                    <dd>288</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Schedules:</dt>
                    <dd>7</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Amendments</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">First Amendment:</span>
                    <span>2000</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Second Amendment:</span>
                    <span>2005</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Third Amendment:</span>
                    <span>2017</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Fourth Amendment:</span>
                    <span>2018</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/document/constitution-1995">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Full Constitution
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/search?q=constitution&type=constitution">
                  Search Constitution
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chapters Quick Links */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Chapters Overview</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { num: 1, title: "The Republic" },
              { num: 2, title: "The Republic and Democratic Principles" },
              { num: 3, title: "Citizenship" },
              { num: 4, title: "Protection and Promotion of Fundamental Rights" },
              { num: 5, title: "Representation of the People" },
              { num: 6, title: "The Legislature" },
              { num: 7, title: "The Executive" },
              { num: 8, title: "The Judiciary" },
              { num: 9, title: "Finance" },
              { num: 10, title: "The Public Service" },
              { num: 11, title: "Local Government" },
              { num: 12, title: "Defence and National Security" },
            ].map((chapter) => (
              <Link
                key={chapter.num}
                href={`/document/constitution-1995#chapter-${chapter.num}`}
                className="rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium">Chapter {chapter.num}:</span>{" "}
                <span className="text-muted-foreground">{chapter.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
