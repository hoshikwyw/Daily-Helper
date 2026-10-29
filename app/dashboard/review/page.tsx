"use client";

import { useEffect, useMemo, useState } from "react";
import { listTasks } from "@/lib/api/tasks";
import { listJournalEntriesInRange } from "@/lib/api/journal";
import { listExpensesInRange } from "@/lib/api/expenses";
import { listHabitChecks, listHabits } from "@/lib/api/habits";
import { addDays, formatLongDate, formatMonthDay, todayISO } from "@/lib/date";
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

/** "Nov 2 – November 8, 2026", in the viewer's locale. */
function weekLabel(week: WeekRange): string {
  return `${formatMonthDay(week.from)} – ${formatLongDate(week.to)}`;
}

export default function ReviewPage() {
  const today = todayISO();
  const [week, setWeek] = useState<WeekRange>(() => lastCompletedWeek(today));
  const { colorMap } = useExpenseCategories();

  // Loaded once: none of these depend on the week being viewed.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [recentChecks, setRecentChecks] = useState<HabitCheck[]>([]);
  const [baseLoaded, setBaseLoaded] = useState(false);

  // Loaded per week: the week and the one before, for the comparisons.
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [money, setMoney] = useState<Expense[]>([]);
  const [weekChecks, setWeekChecks] = useState<HabitCheck[]>([]);
  const [weekLoaded, setWeekLoaded] = useState(false);

  const windowStart = addDays(today, -STREAK_WINDOW_DAYS);
  const rangeFrom = previousWeek(week).from;

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTasks(), listHabits(), listHabitChecks(windowStart, today)]).then(
      ([taskRows, habitRows, checkRows]) => {
        if (cancelled) return;
        setTasks(taskRows);
        setHabits(habitRows);
        setRecentChecks(checkRows);
        setBaseLoaded(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [windowStart, today]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeekLoaded(false);
    // Habit checks for a week older than the streak window are not in the
    // once-loaded set, so fetch that week's own rows when needed.
    const needOlderChecks = rangeFrom < windowStart;
    Promise.all([
      listJournalEntriesInRange(rangeFrom, week.to),
      listExpensesInRange(rangeFrom, week.to),
      needOlderChecks ? listHabitChecks(rangeFrom, week.to) : Promise.resolve([]),
    ]).then(([entryRows, moneyRows, olderChecks]) => {
      if (cancelled) return;
      setEntries(entryRows);
      setMoney(moneyRows);
      setWeekChecks(olderChecks);
      setWeekLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [rangeFrom, week.to, windowStart]);

  const checks = useMemo(() => {
    if (weekChecks.length === 0) return recentChecks;
    const seen = new Set(recentChecks.map((c) => c.id));
    return [...recentChecks, ...weekChecks.filter((c) => !seen.has(c.id))];
  }, [recentChecks, weekChecks]);

  const loading = !baseLoaded || !weekLoaded;
  const taskReview = useMemo(() => reviewTasks(tasks, week, today), [tasks, week, today]);
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
          onNext={() => setWeek(nextWeek(week))}
          nextDisabled={!canGoForward}
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
