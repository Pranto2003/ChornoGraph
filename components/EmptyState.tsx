"use client";

interface EmptyStateProps {
  onCreate: () => void;
  onExample: () => void;
}

export function EmptyState({ onCreate, onExample }: EmptyStateProps) {
  return (
    <div className="flex min-h-[44vh] items-center justify-center rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface)] px-6 py-12">
      <div className="flex max-w-xl flex-col items-center text-center">
        <svg
          width="80"
          height="52"
          viewBox="0 0 80 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M14 14L40 14L40 38L66 38"
            stroke="rgba(96,165,250,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="14" r="6" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" />
          <circle cx="40" cy="14" r="6" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" />
          <circle cx="40" cy="38" r="6" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" />
          <circle cx="66" cy="38" r="6" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" />
        </svg>

        <h2 className="mt-6 text-[20px] font-medium tracking-[-0.01em] text-[color:var(--text-primary)]">
          Your timeline starts here
        </h2>
        <p className="mt-3 max-w-md text-[14px] leading-[1.65] text-[color:var(--text-secondary)]">
          Create a project or drop a `.chronograph.json` file
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="premium-button-primary" onClick={onCreate}>
            New project
          </button>
          <button type="button" className="premium-button-ghost" onClick={onExample}>
            See example
          </button>
        </div>
      </div>
    </div>
  );
}
