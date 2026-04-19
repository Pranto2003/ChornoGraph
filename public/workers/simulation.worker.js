function kahnsTopologicalSort(nodes, edges) {
  const inDegree = new Map();
  const adjacency = new Map();

  for (const node of nodes) {
    inDegree.set(node, 0);
    adjacency.set(node, []);
  }

  for (const [from, to] of edges) {
    adjacency.get(from).push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  }

  const queue = nodes.filter((node) => (inDegree.get(node) || 0) === 0);
  const order = [];
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor++];
    order.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const next = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, next);

      if (next === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== nodes.length) {
    throw new Error("Cycle detected. Simulation requires a DAG.");
  }

  return order;
}

function gaussianRandom(mean, stdDev) {
  const u1 = Math.max(Number.MIN_VALUE, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

function buildHistogramBins(values, binCount = 20) {
  if (!values.length) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = Math.max(1, max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    bin: Math.round((min + width * index) * 10) / 10,
    count: 0
  }));

  for (const value of values) {
    const index = Math.min(binCount - 1, Math.max(0, Math.floor((value - min) / width)));
    bins[index].count += 1;
  }

  return bins;
}

function calculateMean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStdDev(values, mean) {
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculatePercentile(values, percentile) {
  return values[Math.min(values.length - 1, Math.floor(values.length * percentile))] || 0;
}

function computeProjectDuration(cpmResults) {
  return cpmResults.reduce(
    (max, result) => Math.max(max, result.earliestFinish),
    0
  );
}

function computeCPM(tasks, dependencies, overrides) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const edgeMap = new Map(
    dependencies.map((dependency) => [
      `${dependency.fromTaskId}->${dependency.toTaskId}`,
      dependency
    ])
  );
  const order = kahnsTopologicalSort(
    tasks.map((task) => task.id),
    dependencies.map((dependency) => [dependency.fromTaskId, dependency.toTaskId])
  );
  const predecessors = new Map();
  const successors = new Map();
  const schedule = new Map();

  for (const task of tasks) {
    predecessors.set(task.id, []);
    successors.set(task.id, []);
  }

  for (const dependency of dependencies) {
    predecessors.get(dependency.toTaskId).push(dependency.fromTaskId);
    successors.get(dependency.fromTaskId).push(dependency.toTaskId);
  }

  for (const taskId of order) {
    const task = taskById.get(taskId);
    const duration = Math.max(0.1, task.estimatedDays + (overrides?.[task.id] || 0));
    let earliestStart = 0;

    for (const predecessorId of predecessors.get(taskId) || []) {
      const predecessor = schedule.get(predecessorId);
      const dependency = edgeMap.get(`${predecessorId}->${taskId}`);

      if (!predecessor || !dependency) {
        continue;
      }

      if (dependency.type === "start-to-start") {
        earliestStart = Math.max(
          earliestStart,
          predecessor.earliestStart + dependency.lagDays
        );
      } else if (dependency.type === "finish-to-finish") {
        earliestStart = Math.max(
          earliestStart,
          predecessor.earliestFinish + dependency.lagDays - duration
        );
      } else {
        earliestStart = Math.max(
          earliestStart,
          predecessor.earliestFinish + dependency.lagDays
        );
      }
    }

    earliestStart = Math.max(0, earliestStart);
    schedule.set(taskId, {
      earliestStart,
      earliestFinish: earliestStart + duration,
      latestStart: 0,
      latestFinish: 0,
      duration
    });
  }

  const projectDuration = order.reduce(
    (max, taskId) => Math.max(max, schedule.get(taskId).earliestFinish),
    0
  );

  for (let index = order.length - 1; index >= 0; index -= 1) {
    const taskId = order[index];
    const record = schedule.get(taskId);
    const downstream = successors.get(taskId) || [];

    if (!downstream.length) {
      record.latestFinish = projectDuration;
      record.latestStart = projectDuration - record.duration;
      continue;
    }

    let latestStart = Number.POSITIVE_INFINITY;
    let latestFinish = Number.POSITIVE_INFINITY;

    for (const successorId of downstream) {
      const successor = schedule.get(successorId);
      const dependency = edgeMap.get(`${taskId}->${successorId}`);

      if (!successor || !dependency) {
        continue;
      }

      if (dependency.type === "start-to-start") {
        const candidateLatestStart = successor.latestStart - dependency.lagDays;
        latestStart = Math.min(latestStart, candidateLatestStart);
        latestFinish = Math.min(latestFinish, candidateLatestStart + record.duration);
      } else if (dependency.type === "finish-to-finish") {
        const candidateLatestFinish = successor.latestFinish - dependency.lagDays;
        latestFinish = Math.min(latestFinish, candidateLatestFinish);
        latestStart = Math.min(latestStart, candidateLatestFinish - record.duration);
      } else {
        const candidateLatestFinish = successor.latestStart - dependency.lagDays;
        latestFinish = Math.min(latestFinish, candidateLatestFinish);
        latestStart = Math.min(latestStart, candidateLatestFinish - record.duration);
      }
    }

    record.latestStart = latestStart;
    record.latestFinish = latestFinish;
  }

  return order.map((taskId) => {
    const record = schedule.get(taskId);
    const float = Math.max(
      0,
      Math.round((record.latestStart - record.earliestStart) * 1000) / 1000
    );

    return {
      taskId,
      earliestStart: record.earliestStart,
      earliestFinish: record.earliestFinish,
      latestStart: record.latestStart,
      latestFinish: record.latestFinish,
      float,
      isCritical: float === 0
    };
  });
}

function sampleTaskDuration(task, overrides) {
  const override = overrides?.[task.id];

  if (task.isFrozen || override !== undefined) {
    return Math.max(0.1, task.estimatedDays + (override || task.frozenDelayDays));
  }

  const mean = task.estimatedDays;
  const stdDev = mean * (task.variancePercent / 100);
  const sample = gaussianRandom(mean, stdDev);
  return Math.min(mean * 3, Math.max(mean * 0.1, sample));
}

self.onmessage = function (event) {
  try {
    const { tasks, dependencies, iterations, whatIfOverrides } = event.data;

    if (!tasks || tasks.length === 0) {
      self.postMessage({
        type: "error",
        message: "Add at least one task before running a simulation."
      });
      return;
    }

    const durations = [];
    let nextProgressPercent = 10;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const sampledTasks = tasks.map((task) => ({
        ...task,
        estimatedDays: sampleTaskDuration(task, whatIfOverrides)
      }));
      const cpm = computeCPM(sampledTasks, dependencies);
      durations.push(computeProjectDuration(cpm));

      const percent = Math.floor(((iteration + 1) / iterations) * 100);

      if (percent >= nextProgressPercent || iteration === iterations - 1) {
        self.postMessage({
          type: "progress",
          percent: Math.min(100, percent)
        });
        nextProgressPercent += 10;
      }
    }

    durations.sort((left, right) => left - right);
    const mean = calculateMean(durations);
    const stdDev = calculateStdDev(durations, mean);

    self.postMessage({
      type: "complete",
      result: {
        projectId: tasks[0].projectId,
        runAt: Date.now(),
        iterations,
        durations,
        p50: calculatePercentile(durations, 0.5),
        p75: calculatePercentile(durations, 0.75),
        p90: calculatePercentile(durations, 0.9),
        mean,
        stdDev,
        histogram: buildHistogramBins(durations)
      }
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Simulation worker failed."
    });
  }
};
