export type NotificationType = 'risk_amber' | 'risk_red' | 'intervention' | 'info' | 'warning';

export interface Notification {
  id: string;
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  actionable?: boolean;
  metadata?: Record<string, unknown>;
  dismissed?: boolean;
}

export interface ToastState {
  visible: boolean;
  notification: Notification | null;
  expanded: boolean;
  history: Notification[];
}
