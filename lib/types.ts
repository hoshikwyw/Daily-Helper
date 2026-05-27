export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type Mood = "great" | "good" | "okay" | "bad" | "terrible";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  tech_stack: string[];
  repository_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: Mood | null;
  highlights: string[];
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = string;

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Project, "id" | "created_at" | "updated_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at" | "updated_at">>;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Omit<JournalEntry, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<JournalEntry, "id" | "created_at" | "updated_at">>;
      };
    };
  };
}
