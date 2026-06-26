import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  ClipboardList, 
  Puzzle, 
  Users, 
  Repeat, 
  CheckCircle2, 
  BarChart3, 
  UserCog, 
  Settings 
} from 'lucide-react';

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'incoming', label: 'Incoming Tasks', icon: Inbox, group: 'main' },
  { id: 'tasks', label: 'Task Management', icon: ClipboardList, group: 'main' },
  { id: 'assignments', label: 'Assignments', icon: Puzzle, group: 'main' },
  { id: 'capacity', label: 'Team Capacity', icon: Users, group: 'operations' },
  { id: 'deadlines', label: 'Deadline Requests', icon: Repeat, group: 'operations' },
  { id: 'reviews', label: 'Reviews', icon: CheckCircle2, group: 'operations' },
  { id: 'reports', label: 'Reports', icon: BarChart3, group: 'analytics' },
  { id: 'team', label: 'Team Management', icon: UserCog, group: 'admin' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'admin' },
];

export const GROUPS = [
  { id: 'main', label: 'Main' },
  { id: 'operations', label: 'Operations' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'admin', label: 'Administration' },
];
