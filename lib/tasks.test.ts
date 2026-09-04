import { describe, expect, it } from "vitest";
import {
  TASK_TABS,
  countByTab,
  emptyLabelForTab,
  filterByTab,
  projectNameById,
} from "@/lib/tasks";
import { progressPercent, progressVariant } from "@/lib/progress";
import type { Project, Task, TaskStatus } from "@/lib/types";

function task(id: string, status: TaskStatus, projectId: string | null = null): Task {
  return { id, status, title: `Task ${id}`, project_id: projectId } as Task;
}

const TASKS = [
  task("1", "todo"),
  task("2", "todo"),
  task("3", "in_progress"),
  task("4", "done"),
];

describe("TASK_TABS", () => {
  it("is \"all\" plus one tab per workflow status, in order", () => {
    expect(TASK_TABS.map((t) => t.value)).toEqual(["all", "todo", "in_progress", "done"]);
  });

  it("labels the statuses in plain words", () => {
    expect(TASK_TABS.map((t) => t.label)).toEqual(["All", "To Do", "In Progress", "Done"]);
  });
});

describe("countByTab", () => {
  it("counts every tab in a single pass", () => {
    expect(countByTab(TASKS)).toEqual({ all: 4, todo: 2, in_progress: 1, done: 1 });
  });

  it("is all zeroes for no tasks", () => {
    expect(countByTab([])).toEqual({ all: 0, todo: 0, in_progress: 0, done: 0 });
  });

  it("agrees with filterByTab for every tab", () => {
    const counts = countByTab(TASKS);
    for (const { value } of TASK_TABS) {
      expect(filterByTab(TASKS, value)).toHaveLength(counts[value]);
    }
  });
});

describe("filterByTab", () => {
  it("returns everything for \"all\"", () => {
    expect(filterByTab(TASKS, "all")).toHaveLength(4);
  });

  it("narrows to one status", () => {
    expect(filterByTab(TASKS, "todo").map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("does not mutate the source list", () => {
    const before = [...TASKS];
    filterByTab(TASKS, "done");
    expect(TASKS).toEqual(before);
  });
});

describe("projectNameById", () => {
  const projects = [{ id: "p1", name: "Orbit" } as Project];

  it("resolves a linked project", () => {
    expect(projectNameById(projects, "p1")).toBe("Orbit");
  });

  it("is null for an unassigned task", () => {
    expect(projectNameById(projects, null)).toBeNull();
  });

  it("is null for a project that no longer exists", () => {
    expect(projectNameById(projects, "gone")).toBeNull();
  });
});

describe("emptyLabelForTab", () => {
  it("says something different once everything is finished", () => {
    expect(emptyLabelForTab("done")).toBe("No completed tasks yet.");
    expect(emptyLabelForTab("todo")).toBe("No tasks here. Add one!");
  });
});

describe("progress", () => {
  it("rounds to a whole percentage", () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
  });

  it("is 0 rather than NaN when there is nothing to measure", () => {
    expect(progressPercent(0, 0)).toBe(0);
  });

  it("turns green only at a true 100%", () => {
    expect(progressVariant(99)).toBe("primary");
    expect(progressVariant(100)).toBe("success");
    expect(progressVariant(0)).toBe("primary");
  });
});
