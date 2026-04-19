import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Clock3,
  Database,
  GitBranchPlus,
  Route,
  ShieldCheck
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | ChronoGraph",
  description:
    "Learn how ChronoGraph models task dependencies, computes the critical path, runs simulations, and keeps planning local-first."
};

const workflowSteps = [
  {
    step: "01",
    title: "Model the plan as a dependency graph",
    body:
      "Each task becomes a node and each dependency becomes a directed edge. This gives ChronoGraph a real execution structure to reason over, rather than a flat task list."
  },
  {
    step: "02",
    title: "Compute the schedule backbone",
    body:
      "The system validates the graph, orders it topologically, and runs Critical Path Method analysis to calculate earliest start, earliest finish, latest start, latest finish, and total float."
  },
  {
    step: "03",
    title: "Reveal risk concentration",
    body:
      "Critical tasks, near-critical tasks, bottlenecks, and isolated work are highlighted so you can immediately see which parts of the plan are controlling delivery."
  },
  {
    step: "04",
    title: "Forecast delivery with simulation",
    body:
      "Monte Carlo simulation samples task duration variance thousands of times and produces realistic P50, P75, and P90 completion ranges instead of a single-point estimate."
  },
  {
    step: "05",
    title: "Test changes before they become problems",
    body:
      "What-if planning injects delays, propagates downstream impact, and recomputes the critical path so you can compare scenarios before making commitments."
  }
];

const systemCards = [
  {
    icon: Route,
    title: "Graph-native planning",
    body:
      "ChronoGraph is designed around predecessor and successor relationships, which makes dependency logic a first-class part of the product."
  },
  {
    icon: Clock3,
    title: "Deterministic schedule analysis",
    body:
      "The app uses explicit DAG validation, topological sort, and CPM forward and backward passes to explain exactly why a timeline looks the way it does."
  },
  {
    icon: BarChart3,
    title: "Probabilistic forecasting",
    body:
      "Simulation translates variance into a distribution of finish dates, which gives teams a more honest basis for planning, risk reviews, and stakeholder updates."
  },
  {
    icon: GitBranchPlus,
    title: "Operational what-if decisions",
    body:
      "Delay propagation makes it easy to answer practical questions such as what slips, what becomes critical, and how much the end date actually moves."
  },
  {
    icon: Database,
    title: "Local-first data ownership",
    body:
      "Projects, tasks, dependencies, and cached simulations are stored in IndexedDB, so the product stays private, responsive, and usable offline."
  },
  {
    icon: ShieldCheck,
    title: "Portable project files",
    body:
      "The `.chronograph.json` format is schema-validated and editable, which makes it safe to export, adjust manually, and import back into the app."
  }
];

const outcomes = [
  "Understand which tasks truly govern delivery.",
  "See how much slack exists before a risk becomes critical.",
  "Quantify uncertainty with percentile-based completion ranges.",
  "Compare scenarios before communicating a new schedule.",
  "Keep project data private and portable."
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="premium-panel animate-fade-up space-y-6">
        <div className="max-w-4xl space-y-4">
          <p className="ui-label">How ChronoGraph Works</p>
          <h1 className="ui-display text-[color:var(--text-primary)]">
            A dependency-aware scheduling system built for serious planning.
          </h1>
          <p className="ui-body max-w-3xl">
            ChronoGraph combines graph modeling, critical path analysis, simulation,
            and local-first persistence into one workflow. The goal is simple: help
            you understand what is driving the timeline and make better decisions
            before delivery risk compounds.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="premium-button-primary inline-flex items-center">
            Open Dashboard
          </Link>
          <Link href="/" className="premium-button-ghost inline-flex items-center">
            Import a Project
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="premium-panel animate-fade-up [animation-delay:40ms]">
          <div className="space-y-4">
            <p className="ui-label">System Overview</p>
            <h2 className="ui-heading text-[color:var(--text-primary)]">
              ChronoGraph treats schedules as systems, not static checklists.
            </h2>
            <p className="ui-body">
              Standard project tools are often optimized for ownership and status
              tracking. ChronoGraph is optimized for reasoning. It uses the structure
              of your plan to determine which workstreams are flexible, which ones
              are fragile, and where risk is concentrated.
            </p>
            <p className="ui-body">
              That means the interface is not just displaying what you entered. It
              is continuously interpreting task relationships and turning them into
              operational schedule intelligence.
            </p>
          </div>
        </article>

        <aside className="premium-card animate-fade-up space-y-4 [animation-delay:80ms]">
          <p className="ui-label">What You Gain</p>
          <ul className="space-y-3">
            {outcomes.map((item) => (
              <li key={item} className="ui-body">
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="ui-label">Workflow</p>
          <h2 className="ui-heading text-[color:var(--text-primary)]">
            The planning loop from structure to decision
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {workflowSteps.map((item, index) => (
            <article
              key={item.step}
              className="premium-card animate-fade-up space-y-4"
              style={{ animationDelay: `${index * 40 + 120}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="ui-label">{item.step}</span>
                <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--accent-plain)]">
                  Step
                </span>
              </div>
              <h3 className="ui-heading text-[color:var(--text-primary)]">{item.title}</h3>
              <p className="ui-body">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="ui-label">Core Mechanics</p>
          <h2 className="ui-heading text-[color:var(--text-primary)]">
            What powers the product behind the scenes
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {systemCards.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="premium-card animate-fade-up space-y-4"
                style={{ animationDelay: `${index * 40 + 180}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-[color:var(--accent-plain)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="ui-heading text-[color:var(--text-primary)]">{item.title}</h3>
                  <p className="ui-body">{item.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="premium-panel animate-fade-up space-y-4 [animation-delay:260ms]">
        <p className="ui-label">Bottom Line</p>
        <h2 className="ui-heading text-[color:var(--text-primary)]">
          Better schedule decisions start with better schedule visibility.
        </h2>
        <p className="ui-body max-w-4xl">
          ChronoGraph helps teams move from intuition to evidence. Instead of
          asking whether a plan feels safe, you can inspect float, analyze
          bottlenecks, forecast completion ranges, and test delay scenarios before
          they become delivery issues. That leads to clearer communication, stronger
          planning discipline, and more confidence in the timeline.
        </p>
      </section>
    </main>
  );
}
