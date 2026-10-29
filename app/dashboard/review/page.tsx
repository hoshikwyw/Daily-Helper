"use client";

import { useEffect, useMemo, useState } from "react";
import { listTasks } from "@/lib/api/tasks";
import { listJournalEntriesInRange } from "@/lib/api/journal";
import { listExpensesInRange } from "@/lib/api/expenses";
import { listHabitChecks, listHabits } from "@/lib/api/habits";
import { addDays, formatDate, formatLongDate, todayISO } from "@/lib/date";
import { STREAK_WINDOW_DAYS } from "@/lib/habits";
import {
  gatherHighlights,
  lastCompletedWeek,
  nextWeek,
  previousWeek,
  reviewHabits,
  reviewMoney,
  reviewMood,
  reviewTasks,
  summarizeWeek,
  type WeekRange,
} from "@/lib/review";
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { PickerHeader, JumpButton } from "@/components/ui/picker-chrome";
import { SkeletonList } from "@/components/ui/skeleton";
import { TasksReviewCard } from "./_components/tasks-review-card";
import { MoodReviewCard } from "./_components/mood-review-card";
import { HabitsReviewCard } from "./_components/habits-review-card";
import { MoneyReviewCard } from "./_components/money-review-card";
import { HighlightsReviewCard } from "./_components/highlights-review-card";
import type { Expense, Habit, HabitCheck, JournalEntry, Task } from "@/lib/types";

/** "Nov 2 – Nov 8, 2026". */
function weekLabel(week: WeekRange): string {
  return `${formatDate(week.from).replace(/, \d{4}$/, "")} – ${formatLongDate(week.to)}`;
}

export default function ReviewPage() {
  const today = todayISO();
  const [week, setWeek] = useState<WeekRange>(() => lastCompletedWeek(today));
  const { colorMap } = useExpenseCategories();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [money, setMoney] = useState<Expense[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);
  const [loading, setLoading] = useState(true);

  // Comparisons need the week before as well, so the range loads two weeks.
  const rangeFrom = previousWeek(week).from;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      listTasks(),
      listJournalEntriesInRange(rangeFrom, week.to),
      listExpensesInRange(rangeFrom, week.to),
      listHabits(),
      listHabitChecks(addDays(today, -STREAK_WINDOW_DAYS), today),
    ]).then(([taskRows, entryRows, moneyRows, habitRows, checkRows]) => {
      if (cancelled) return;
      setTasks(taskRows);
      setEntries(entryRows);
      setMoney(moneyRows);
      setHabits(habitRows);
      setChecks(checkRows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [rangeFrom, week.to, today]);

  const taskReview = useMemo(() => reviewTasks(tasks, week), [tasks, week]);
  const moodReview = useMemo(() => reviewMood(entries, week), [entries, week]);
  const habitRows = useMemo(() => reviewHabits(habits, checks, week, today), [habits, checks, week, today]);
  const moneyReview = useMemo(() => reviewMoney(money, week), [money, week]);
  const highlights = useMemo(() => gatherHighlights(entries, week), [entries, week]);

  const latest = lastCompletedWeek(today);
  // The arrows reach the week in progress, but no further.
  const canGoForward = nextWeek(week).from <= today;
  const showingLatest = week.from === latest.from;

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Review" }]}
        title="Weekly review"
        subtitle={loading ? "Gathering the week…" : summarizeWeek(taskReview, moodReview, moneyReview)}
      />

      <div className="relative max-w-sm space-y-2">
        <PickerHeader
          title={weekLabel(week)}
          onPrev={() => setWeek(previousWeek(week))}
          onNext={() => canGoForward && setWeek(nextWeek(week))}
          unit="week"
        />
        {!showingLatest && (
          <JumpButton onClick={() => setWeek(latest)}>Back to last week</JumpButton>
        )}
        {week.to >= today && (
          <p className="text-xs text-slate-500 text-center">This week is still in progress.</p>
        )}
      </div>

      {loading ? (
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonList count={4} rowClassName="h-14" />
          <SkeletonList count={4} rowClassName="h-14" />
        </div>
      ) : (
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TasksReviewCard review={taskReview} />
            <HabitsReviewCard rows={habitRows} />
            <HighlightsReviewCard highlights={highlights} />
          </div>
          <div className="space-y-6">
            <MoodReviewCard review={moodReview} />
            <MoneyReviewCard review={moneyReview} colorMap={colorMap} />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
