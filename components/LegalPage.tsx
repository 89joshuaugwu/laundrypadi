import type { ReactNode } from "react";

export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-canvas">
      <article className="container-page max-w-3xl py-12 sm:py-16">
        <h1 className="animate-rise text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p>
        {updated && <p className="mt-2 text-sm text-ink-soft">Last updated {updated}</p>}
        <div className="mt-10 space-y-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_p]:mt-2 [&_p]:leading-relaxed [&_p]:text-ink-soft [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-ink-soft">
          {children}
        </div>
      </article>
    </div>
  );
}
