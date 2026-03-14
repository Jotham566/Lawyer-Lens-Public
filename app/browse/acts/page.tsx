import { redirect } from "next/navigation";

interface BrowseActsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function buildQueryString(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }
    if (typeof value === "string" && value.length > 0) {
      query.set(key, value);
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function BrowseActsPage({ searchParams }: BrowseActsPageProps) {
  const resolved = searchParams ? await searchParams : {};
  redirect(`/legislation/acts${buildQueryString(resolved)}`);
}
