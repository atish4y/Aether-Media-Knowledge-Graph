import { Suspense } from "react";
import { SearchResultsContent } from "@/components/search/search-results-content";

export default function SearchPage() {
  return (
    <div className="space-y-8 animate-fade-up pb-8 pt-4">
      <Suspense fallback={<div className="p-8 text-muted-foreground animate-pulse">Searching the knowledge graph...</div>}>
        <SearchResultsContent />
      </Suspense>
    </div>
  );
}
