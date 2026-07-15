import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface NotificationItemData {
  id: string;
  title: string;
  message: string;
  kind: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAtLabel: string; // já formatado pelo caller (ex: "há 2 horas")
}

interface NotificationItemProps {
  notification: NotificationItemData;
  onClick?: (id: string) => void;
}

const iconByKind = { info: Info, success: CheckCircle2, warning: TriangleAlert, error: AlertCircle };
const colorByKind = { info: 'text-info bg-info/10', success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', error: 'text-destructive bg-destructive/10' };

/**
 * Item de notificação persistente (central de notificações no Navbar) —
 * diferente do Toast (que desaparece). Representa 1:1 a tabela
 * `notifications` da Sprint 02.
 */
function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const Icon = iconByKind[notification.kind];
  return (
    <button
      onClick={() => onClick?.(notification.id)}
      className={cn(
        'flex w-full gap-3 px-3 py-2.5 text-left transition-colors duration-base hover:bg-accent',
        !notification.isRead && 'bg-primary/5',
      )}
    >
      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4', colorByKind[notification.kind])}>
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', !notification.isRead ? 'font-semibold' : 'font-medium')}>{notification.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{notification.createdAtLabel}</p>
      </div>
      {!notification.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
}

export { NotificationItem };
