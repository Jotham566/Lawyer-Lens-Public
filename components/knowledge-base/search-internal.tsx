"use client";

import { useState } from "react";
import { Search, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers";
import {
  searchKnowledgeBase,
  type DocumentSearchResult,
} from "@/lib/api/knowledge-base";
import { toast } from "sonner";

export function SearchInternal() {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocumentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!accessToken || !query.trim()) return;

    setSearching(true);
    setHasSearched(true);

    try {
      const response = await searchKnowledgeBase(query.trim());
      setResults(response.results);

      if (response.results.length === 0) {
        toast.info("No results found", {
          description: "Try different search terms",
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-700";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Internal Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your organization's documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm text-muted-foreground">
                  Try different search terms or check your documents
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.chunk_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {result.document_title}
                              </h4>
                              <Badge className={getScoreColor(result.score)}>
                                {Math.round(result.score * 100)}% match
                              </Badge>
                            </div>

                            {(result.section_heading || result.page_number) && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {result.section_heading && (
                                  <span className="mr-2">
                                    Section: {result.section_heading}
                                  </span>
                                )}
                                {result.page_number && (
                                  <span>Page {result.page_number}</span>
                                )}
                              </p>
                            )}

                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {highlightText(result.chunk_text, query)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              Enter a search query to find relevant content in your
              organization&apos;s documents
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
