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
  /** 0 = Sunday … 6 = Saturday; weekly rules on one day. */
  weekday: number | null;
  /** Several days a week (same numbering); replaces `weekday` when set. */
  weekdays: number[] | null;
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

/**
 * A monthly spending limit for one expense category, effective from `month`
 * (always the first of the month) until a later row replaces it. An amount of
 * 0 switches the budget off from that month on.
 */
export type Budget = {
  id: string;
  user_id: string;
  category: string;
  month: string;
  amount: number;
  created_at: string;
  updated_at: string;
};

/** Which part of life a habit feeds in My World. */
export type HabitCategory = "learning" | "fitness" | "general";

/** A daily habit. Archived habits keep their history and can be restored. */
export type Habit = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  /** Order of the chips on the Today page, ascending. */
  position: number;
  archived: boolean;
  category: HabitCategory;
  created_at: string;
  updated_at: string;
};

export type RewardSourceType = "habit_check" | "task" | "expense";
export type RewardCategory = HabitCategory | "savings";

/** One rewarded event, written only by database triggers. */
export type GameReward = {
  id: string;
  user_id: string;
  source_type: RewardSourceType;
  /** The real-world event, e.g. "<habit id>:<date>"; unique per source type. */
  source_key: string;
  category: RewardCategory;
  xp: number;
  note: string | null;
  created_at: string;
};

/** A row of the game_progress view: one per person who has any reward. */
export type GameProgressRow = {
  user_id: string;
  total_xp: number;
  learning_xp: number;
  fitness_xp: number;
  savings_xp: number;
  general_xp: number;
};

/** One day a habit was done. Absence of a row means it was not. */
export type HabitCheck = {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  created_at: string;
};

/** An email allowed to administer the app (create accounts). */
export type Admin = {
  email: string;
  created_at: string;
};

/** An email the admin has invited; sign-up is only possible for these. */
export type AllowedUser = {
  email: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

/** One row of `admin_list_users()`: an invitation joined to its account, if any. */
export type ManagedUserRow = {
  email: string;
  note: string | null;
  invited_at: string;
  signed_up_at: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
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

type BudgetInsert = {
  user_id: string;
  category: string;
  month: string;
  amount: number;
};

type HabitInsert = {
  user_id: string;
  name: string;
  emoji?: string;
  position?: number;
  archived?: boolean;
  category?: HabitCategory;
};

type HabitCheckInsert = {
  user_id: string;
  habit_id: string;
  date: string;
};

type AllowedUserInsert = {
  email: string;
  note?: string | null;
  created_by?: string | null;
};

type RecurrenceInsert = {
  user_id: string;
  target: RecurrenceTarget;
  cadence: RecurrenceCadence;
  every?: number;
  weekday?: number | null;
  weekdays?: number[] | null;
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
      budgets: {
        Row: Budget;
        Insert: BudgetInsert;
        Update: Partial<BudgetInsert>;
        Relationships: [];
      };
      habits: {
        Row: Habit;
        Insert: HabitInsert;
        Update: Partial<HabitInsert>;
        Relationships: [];
      };
      habit_checks: {
        Row: HabitCheck;
        Insert: HabitCheckInsert;
        Update: Partial<HabitCheckInsert>;
        Relationships: [];
      };
      admins: {
        Row: Admin;
        Insert: { email: string };
        Update: Partial<{ email: string }>;
        Relationships: [];
      };
      allowed_users: {
        Row: AllowedUser;
        Insert: AllowedUserInsert;
        Update: Partial<AllowedUserInsert>;
        Relationships: [];
      };
      game_rewards: {
        Row: GameReward;
        // Written by triggers only; the app never inserts.
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      game_progress: {
        Row: GameProgressRow;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      admin_list_users: { Args: Record<string, never>; Returns: ManagedUserRow[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
