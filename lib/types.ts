export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type Mood = "great" | "good" | "okay" | "bad" | "terrible";

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
  name: string;
  color: string;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
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
  amount: number;
  category?: string;
  description?: string | null;
  date?: string;
};

type CategoryInsert = {
  user_id: string;
  name: string;
  color?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
