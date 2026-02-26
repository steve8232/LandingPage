import Link from "next/link";
import { getAllV1TemplateIds, getV1Spec } from "../../../../v1/specs";

export const dynamic = "force-dynamic";

export default function V1PreviewsIndexPage() {
  const templateIds = getAllV1TemplateIds().sort();

  const entries = templateIds.map((id) => {
    const spec = getV1Spec(id);
    return {
      id,
      name: spec?.metadata?.name ?? id,
      description: spec?.metadata?.description ?? "",
      category: spec?.category ?? "",
      goal: spec?.goal ?? "",
    };
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-3">v1 Template Previews</h1>
        <p className="text-sm text-slate-600 mb-6">
          Links below render the same HTML as the generated files under{" "}
          <code className="font-mono text-xs">dist/previews/&lt;templateId&gt;/index.html</code>
          , but on-demand via the v1 composer.
        </p>

        <ul className="space-y-4">
          {entries.map((entry) => {
            const metaLine = [
              entry.category && `Category: ${entry.category}`,
              entry.goal && `Goal: ${entry.goal}`,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={entry.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
              >
                <h2 className="text-sm font-semibold">
                  {entry.name}{" "}
                  <span className="text-slate-500 font-normal">
                    ({entry.id})
                  </span>
                </h2>
                {entry.description && (
                  <p className="text-xs text-slate-600 mt-1">
                    {entry.description}
                  </p>
                )}
                {metaLine && (
                  <p className="text-[11px] text-slate-500 mt-1">{metaLine}</p>
                )}
                <p className="text-sm mt-2">
                  <Link
                    href={`/v1/previews/${encodeURIComponent(entry.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open preview
                  </Link>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
