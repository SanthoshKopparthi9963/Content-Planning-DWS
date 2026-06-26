export type UserRole = 'LEAD' | 'MEMBER';
export type MemberType = 'WRITER' | 'EDITOR';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  member_type: MemberType | null;
  base_capacity: number;
  assigned?: number;
  remaining?: number;
  avatar?: string;
}

export interface TaskType {
  id: number;
  name: string;
  words_per_hour: number;
  allowed_role: 'WRITER' | 'EDITOR' | 'BOTH';
}

export type TaskStatus = 'NEW' | 'FULLY_ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'OVERDUE' | 'COMPLETED';

export interface Task {
  id: number;
  name: string;
  type_id: number;
  type_name?: string;
  total_word_count: number;
  total_minutes_required: number;
  remaining_minutes: number;
  deadline: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: TaskStatus;
  source?: string; // e.g., 'Google Form'
  pm_name?: string;
  reviewer?: string;
  ai_requirement?: string;
  pieces?: number;
  assigned_members?: { name: string; minutes: number; date: string; total_day_minutes: number }[];
}

export interface Assignment {
  id: number;
  task_id: number;
  task_name?: string;
  user_id: number;
  date: string;
  minutes_assigned: number;
  status: 'PENDING' | 'STARTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  actual_word_count: number;
  content?: string;
  total_word_count?: number;
  deadline?: string;
  words_per_hour?: number;
}

export interface DeadlineRequest {
  id: number;
  task_id: number;
  task_name: string;
  user_id: number;
  user_name: string;
  current_deadline: string;
  requested_deadline: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}
