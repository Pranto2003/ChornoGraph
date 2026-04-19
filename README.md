# ChronoGraph

ChronoGraph is a local-first temporal dependency visualizer and critical path optimizer built with Next.js, Tailwind, React Flow, Zustand, IndexedDB, and Web Workers. It models projects as directed acyclic graphs, computes CPM metrics in real time, supports interactive what-if delay injection, and forecasts delivery uncertainty with Monte Carlo simulation.

## Stack

- Next.js App Router
- TypeScript in strict mode
- Tailwind CSS v3
- shadcn-style UI primitives
- Framer Motion
- React Flow v11
- Recharts
- IndexedDB via `idb`
- Zustand
- Vitest + React Testing Library

## Setup

1. Prerequisites: Node.js 20+ and npm 10+
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`
5. Create a production build:

```bash
npm run build
```

6. Run the DSA test suite:

```bash
npm test
```

## Core Algorithms

- `lib/graph/dag.ts`: Generic DAG abstraction used by the editor and scheduling engine.
- `lib/graph/topological-sort.ts`: Kahn's algorithm for stable cycle-aware ordering.
- `lib/graph/cycle-detection.ts`: Union-Find with a directed reachability fallback for live edge validation.
- `lib/graph/cpm.ts`: Forward/backward pass Critical Path Method with FS, SS, and FF dependencies plus lag support.
- `lib/graph/what-if.ts`: Reachability-based delay propagation and CPM diffing.
- `lib/simulation/monte-carlo.ts`: Box-Muller Gaussian sampling with repeated CPM evaluation.
- `lib/simulation/statistics.ts`: Percentiles, mean, standard deviation, and histogram bins for forecast output.

## Features

- Dashboard with project cards, trie-based search, import/export, and onboarding example data
- Graph-native workspace with custom nodes, custom dependency edges, cycle rejection, and auto-layout
- Live CPM overlays with float badges and critical-path emphasis
- What-if mode with delay sliders, affected-task highlighting, and comparative simulation
- Pure SVG Gantt timeline
- Offline-first persistence in IndexedDB and browser cache

## Testing

The test suite covers:

- DAG operations
- Union-Find cycle checks
- Kahn topological sort
- CPM forward/backward passes
- Monte Carlo distribution behavior

## Notes

- All project data is stored locally in the browser.
- Heavy schedule computations are moved to dedicated Web Workers.
- The workspace was bootstrapped from scratch in this repository and does not rely on external APIs.
