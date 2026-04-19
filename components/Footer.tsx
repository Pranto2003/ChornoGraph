import Link from "next/link";

const navigationLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/how-it-works", label: "How It Works" }
];

const featureNotes = [
  "Critical path analysis",
  "Monte Carlo forecasting",
  "What-if delay planning",
  "Editable .chronograph.json imports"
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[color:var(--header-border)] bg-[color:var(--header-bg)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-medium tracking-[-0.01em] text-[color:var(--text-primary)]">
              ChronoGraph
            </span>
            <span className="rounded-full border border-[color:var(--header-border)] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[color:var(--text-secondary)]">
              v2.0
            </span>
          </div>
          <p className="ui-body max-w-md">
            ChronoGraph is a local-first scheduling workspace for mapping task
            dependencies, understanding the critical path, and forecasting delivery
            confidence without leaving the browser.
          </p>
        </div>

        <div className="space-y-3">
          <p className="ui-label">Navigation</p>
          <nav className="flex flex-col gap-2">
            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="ui-body w-fit transition-all duration-150 ease-out hover:-translate-y-px hover:text-[color:var(--text-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          <p className="ui-label">Professional Notes</p>
          <ul className="space-y-2">
            {featureNotes.map((item) => (
              <li key={item} className="ui-body">
                {item}
              </li>
            ))}
          </ul>
          <p className="ui-caption">
            Project data stays in your browser unless you explicitly export it. If
            you clear site storage, export first.
          </p>
        </div>
      </div>

      <div className="border-t border-[color:var(--header-border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="ui-caption">© {year} ChronoGraph. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="ui-caption">Local-first by design.</span>
            <span className="ui-caption">Offline-ready after first load.</span>
            <span className="ui-caption">IndexedDB persistence.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
