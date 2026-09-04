import { describe, expect, it } from "vitest";
import {
  countByFilter,
  draftFromProject,
  draftToUpdate,
  filterProjects,
  formatTechStack,
  isDraftDirty,
  parseTechStack,
} from "@/lib/projects";
import type { Project, ProjectStatus } from "@/lib/types";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Orbit",
    description: "A dashboard",
    status: "active",
    color: "#6366f1",
    tech_stack: ["React", "TypeScript"],
    repository_url: "https://github.com/x/y",
    notes: "some notes",
    ...overrides,
  } as Project;
}

describe("tech stack", () => {
  it("splits, trims and drops blanks", () => {
    expect(parseTechStack(" React , TypeScript ,, Supabase ")).toEqual([
      "React",
      "TypeScript",
      "Supabase",
    ]);
  });

  it("is empty for an empty field", () => {
    expect(parseTechStack("")).toEqual([]);
    expect(parseTechStack("  ,  ")).toEqual([]);
  });

  it("round-trips through the text field", () => {
    const stack = ["React", "TypeScript", "Supabase"];
    expect(parseTechStack(formatTechStack(stack))).toEqual(stack);
  });
});

describe("draft conversion", () => {
  it("turns nullable columns into empty strings for the form", () => {
    const draft = draftFromProject(
      project({ description: null, repository_url: null, notes: null })
    );
    expect(draft.description).toBe("");
    expect(draft.repository).toBe("");
    expect(draft.notes).toBe("");
  });

  it("turns empty fields back into NULL for the database", () => {
    const update = draftToUpdate({
      name: "  Orbit  ",
      description: "   ",
      repository: "",
      techStack: "",
      color: "#6366f1",
      status: "active",
      notes: "  ",
    });
    expect(update).toEqual({
      name: "Orbit",
      description: null,
      repository_url: null,
      tech_stack: [],
      color: "#6366f1",
      status: "active",
      notes: null,
    });
  });
});

describe("isDraftDirty", () => {
  // Gates the Save button on the project detail page.
  it("is clean for an untouched project", () => {
    const p = project();
    expect(isDraftDirty(p, draftFromProject(p))).toBe(false);
  });

  it("is clean when nullable columns map to empty strings", () => {
    const p = project({ description: null, repository_url: null, notes: null });
    expect(isDraftDirty(p, draftFromProject(p))).toBe(false);
  });

  it.each([
    ["the name", { name: "Renamed" }],
    ["the description", { description: "New" }],
    ["the repository", { repository: "https://example.com" }],
    ["the colour", { color: "#ef4444" }],
    ["the status", { status: "completed" as ProjectStatus }],
    ["the notes", { notes: "changed" }],
    ["the tech stack", { techStack: "React" }],
  ])("is dirty after editing %s", (_label, patch) => {
    const p = project();
    expect(isDraftDirty(p, { ...draftFromProject(p), ...patch })).toBe(true);
  });

  it("ignores whitespace the save would strip anyway", () => {
    const p = project();
    expect(isDraftDirty(p, { ...draftFromProject(p), name: "  Orbit  " })).toBe(false);
  });

  it("notices a reordered tech stack", () => {
    const p = project();
    expect(isDraftDirty(p, { ...draftFromProject(p), techStack: "TypeScript, React" })).toBe(
      true
    );
  });
});

describe("list filtering", () => {
  const projects = [
    project({ id: "1", status: "active" }),
    project({ id: "2", status: "active" }),
    project({ id: "3", status: "paused" }),
    project({ id: "4", status: "completed" }),
  ];

  it("counts every filter in one pass", () => {
    expect(countByFilter(projects)).toEqual({
      all: 4,
      active: 2,
      paused: 1,
      completed: 1,
      archived: 0,
    });
  });

  it("counts nothing for an empty list", () => {
    expect(countByFilter([])).toEqual({
      all: 0,
      active: 0,
      paused: 0,
      completed: 0,
      archived: 0,
    });
  });

  it("returns everything for \"all\"", () => {
    expect(filterProjects(projects, "all")).toHaveLength(4);
  });

  it("narrows to one status", () => {
    expect(filterProjects(projects, "active").map((p) => p.id)).toEqual(["1", "2"]);
    expect(filterProjects(projects, "archived")).toEqual([]);
  });
});
