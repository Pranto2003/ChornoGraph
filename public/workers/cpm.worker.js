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
    throw new Error("Cycle detected. CPM requires a DAG.");
  }

  return order;
}

function buildEdgeMap(dependencies) {
  const map = new Map();

  for (const dependency of dependencies) {
    map.set(`${dependency.fromTaskId}->${dependency.toTaskId}`, dependency);
  }

  return map;
}

function resolveDuration(task, overrides) {
  return Math.max(0.1, task.estimatedDays + (overrides?.[task.id] || 0));
}

function computeCPM(tasks, dependencies, overrides) {
  if (!tasks.length) {
    return [];
  }

  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const edges = dependencies.map((dependency) => [
    dependency.fromTaskId,
    dependency.toTaskId
  ]);
  const order = kahnsTopologicalSort(
    tasks.map((task) => task.id),
    edges
  );
  const predecessors = new Map();
  const successors = new Map();
  const edgeMap = buildEdgeMap(dependencies);
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
    const duration = resolveDuration(task, overrides);
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
        latestFinish = Math.min(
          latestFinish,
          candidateLatestStart + record.duration
        );
      } else if (dependency.type === "finish-to-finish") {
        const candidateLatestFinish = successor.latestFinish - dependency.lagDays;
        latestFinish = Math.min(latestFinish, candidateLatestFinish);
        latestStart = Math.min(
          latestStart,
          candidateLatestFinish - record.duration
        );
      } else {
        const candidateLatestFinish = successor.latestStart - dependency.lagDays;
        latestFinish = Math.min(latestFinish, candidateLatestFinish);
        latestStart = Math.min(
          latestStart,
          candidateLatestFinish - record.duration
        );
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

self.onmessage = function (event) {
  try {
    const { tasks, dependencies, whatIfOverrides } = event.data;
    const result = computeCPM(tasks, dependencies, whatIfOverrides);
    self.postMessage({ type: "complete", result });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "CPM worker failed."
    });
  }
};
