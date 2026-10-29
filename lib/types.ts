export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type Mood = "great" | "good" | "okay" | "bad" | "terrible";
/** Which side of the ledger a money entry sits on. */
export type EntryKind = "expense" | "income";
/** What a recurring rule creates. */
export type RecurrenceTarget = "expense" | "task";
export type RecurrenceCadence = "daily" | "weekly" | "monthly" | "yearly";

// NOTE: these row shapes are `type` aliases, not `interface`s, on purpose.
// TypeScript gives object-literal type aliases an implicit index signature but
// interfaces none, so only aliases satisfy Supabase's `GenericSchema`
// constraint (`Row extends Record<string, unknown>`). Using interfaces here
// silently collapses every query result to `never`.
export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  tech_stack: string[];
  repository_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  /** The rule that created this task, or null when it was added by hand. */
  recurrence_id: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  date: string;
  content: string;
  mood: Mood | null;
  highlights: string[];
  created_at: string;
  updated_at: string;
};

export type ExpenseCategory = string;

export type CustomCategory = {
  id: string;
  user_id: string;
  kind: EntryKind;
  name: string;
  color: string;
  created_at: string;
};

/**
 * A money entry. The table is still called `expenses` for historical reasons,
 * but a row is money OUT or money IN depending on `kind`. `amount` is always
 * positive — the sign lives in `kind`, never in the number.
 */
export type Expense = {
  id: string;
  user_id: string;
  kind: EntryKind;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  /** The rule that created this entry, or null when it was added by hand. */
  recurrence_id: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * A rule that creates money entries or tasks on a schedule. The scheduling
 * fields are shared; which template fields are filled depends on `target`.
 * `next_due` is the first occurrence not yet created, kept current by the sync.
 */
export type Recurrence = {
  id: string;
  user_id: string;
  target: RecurrenceTarget;
  cadence: RecurrenceCadence;
  /** Step between occurrences: 1 = every period, 2 = every second period. */
  every: number;
  /** 0 = Sunday … 6 = Saturday; weekly rules. */
  weekday: number | null;
  /** 1-31, clamped to short months; monthly and yearly rules. */
  day_of_month: number | null;
  /** 1-12; yearly rules. */
  month: number | null;
  start_date: string;
  end_date: string | null;
  next_due: string;
  active: boolean;
  // Money template.
  kind: EntryKind | null;
  amount: number | null;
  category: string | null;
  description: string | null;
  // Task template.
  title: string | null;
  priority: TaskPriority | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

// Insert shapes mirror the SQL schema: `user_id` and genuinely-required columns
// are mandatory; anything nullable or carrying a DB default is optional. Update
// shapes are `Partial<Insert>` — every writable column, all optional.
type ProjectInsert = {
  user_id: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  color?: string;
  tech_stack?: string[];
  repository_url?: string | null;
  notes?: string | null;
};

type TaskInsert = {
  user_id: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  project_id?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  recurrence_id?: string | null;
};

type JournalInsert = {
  user_id: string;
  date: string;
  content?: string;
  mood?: Mood | null;
  highlights?: string[];
};

type ExpenseInsert = {
  user_id: string;
  kind?: EntryKind;
  amount: number;
  category?: string;
  description?: string | null;
  date?: string;
  recurrence_id?: string | null;
};

type CategoryInsert = {
  user_id: string;
  kind?: EntryKind;
  name: string;
  color?: string;
};

type RecurrenceInsert = {
  user_id: string;
  target: RecurrenceTarget;
  cadence: RecurrenceCadence;
  every?: number;
  weekday?: number | null;
  day_of_month?: number | null;
  month?: number | null;
  start_date: string;
  end_date?: string | null;
  next_due: string;
  active?: boolean;
  kind?: EntryKind | null;
  amount?: number | null;
  category?: string | null;
  description?: string | null;
  title?: string | null;
  priority?: TaskPriority | null;
  project_id?: string | null;
};

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: Partial<ProjectInsert>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: Partial<TaskInsert>;
        Relationships: [];
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: JournalInsert;
        Update: Partial<JournalInsert>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: ExpenseInsert;
        Update: Partial<ExpenseInsert>;
        Relationships: [];
      };
      expense_categories: {
        Row: CustomCategory;
        Insert: CategoryInsert;
        Update: Partial<CategoryInsert>;
        Relationships: [];
      };
      recurrences: {
        Row: Recurrence;
        Insert: RecurrenceInsert;
        Update: Partial<RecurrenceInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
