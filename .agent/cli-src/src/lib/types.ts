/**
 * CLI 类型定义
 * 
 * 与 .human/data.json 的数据结构对应
 */

export interface Metrics {
  activePlans: number;
  pendingPlans: number;
  completedPlans: number;
  totalDecisions: number;
  openActions: number;
}

export interface Plan {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'completed' | 'blocked' | 'cancelled' | 'unknown';
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  total_screws: number;
  done_screws: number;
  tags: string[];
  created_at: string;
  started_at: string;
}

export interface Decision {
  file: string;
  title: string;
  date: string;
  topic: string;
}

export interface Notification {
  type: 'complete' | 'decision' | 'error' | 'info';
  message: string;
  time: string;
  read: boolean;
}

export interface DashboardData {
  lastSync: string;
  projectSummary: string;
  metrics: Metrics;
  activePlans: Plan[];
  recentDecisions: Decision[];
  systemHealth: string;
  notifications: Notification[];
  unreadCount: number;
}

export interface RenderContext {
  data: DashboardData;
  command: string;
}

export type CommandName = 
  | 'status' 
  | 'plans' 
  | 'decisions' 
  | 'summary' 
  | 'browser' 
  | 'sync' 
  | 'refresh' 
  | 'watch' 
  | 'help';
