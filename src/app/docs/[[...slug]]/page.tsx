import { ReactPromise } from "react";

export default async function DocsPage({
  params,
  searchParams,
}: {
  params: ReactPromise<{ slug: string[] }>;
  searchParams: ReactPromise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const rsearchParamsParams = await searchParams;
  console.log("DocsPage params", resolvedParams, rsearchParamsParams);

  return (
    <div>
      <h1>Docs page</h1>
      <p>Slug: {JSON.stringify(resolvedParams.slug)}</p>
    </div>
  );
}
