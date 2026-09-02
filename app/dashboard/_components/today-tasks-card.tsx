"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, Badge, Button, Input } from "@kwyw/kayv-glass-ui";
import { TASK_PRIORITY_VARIANTS } from "@/lib/constants";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Task } from "@/lib/types";

type TodayTasksCardProps = {
  loading: boolean;
  pending: Task[];
  done: Task[];
  /** Creates a task from the quick-add box; returns true on success. */
  onAdd: (title: string) => Promise<boolean>;
  onToggle: (task: Task) => void;
};

export function TodayTasksCard({ loading, pending, done, onAdd, onToggle }: TodayTasksCardProps) {
  const [title, setTitle] = useState("");
  const isEmpty = pending.length === 0 && done.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (await onAdd(title.trim())) setTitle("");
  }

  return (
    <Card variant="elevated">
      <CardHeader title="Tasks" description="Due today or in progress" />
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            placeholder="Quick add a task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="primary">
            Add
          </Button>
        </form>

        {loading ? (
          <SkeletonList count={3} rowClassName="h-10" />
        ) : isEmpty ? (
          <EmptyState padding="md">No tasks yet — add one above!</EmptyState>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {pending.map((task) => (
              <button
                key={task.id}
                onClick={() => onToggle(task)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
              >
                <span className="w-4 h-4 rounded border border-slate-500 group-hover:border-kv-400 transition-colors shrink-0" />
                <span className="text-sm text-slate-200 flex-1">{task.title}</span>
                <Badge variant={TASK_PRIORITY_VARIANTS[task.priority]} size="sm">
                  {task.priority}
                </Badge>
              </button>
            ))}
            {done.map((task) => (
              <button
                key={task.id}
                onClick={() => onToggle(task)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-colors text-left opacity-60"
              >
                <span className="w-4 h-4 rounded border border-kv-500 bg-kv-500/30 shrink-0 flex items-center justify-center text-xs text-kv-300">
                  ✓
                </span>
                <span className="text-sm text-slate-400 line-through flex-1">{task.title}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
