import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationItem, type NotificationItemData } from '@/components/ui/notification-item';
import { EmptyState } from '@/components/common/EmptyState';

interface NotificationCenterProps {
  notifications: NotificationItemData[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (id: string) => void;
}

/**
 * Central de Notificações do Navbar — consome `NotificationItem` (Design
 * System, Sprint 03) e a tabela `notifications` (Sprint 02) via as props
 * injetadas pelo container (Navbar). Sem estado próprio de dados: este
 * componente é puramente de apresentação, pronto para receber dados reais
 * de Supabase Realtime quando o módulo de Notificações for implementado.
 */
export function NotificationCenter({ notifications, onMarkAllRead, onNotificationClick }: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full p-0 text-[10px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <CheckCheck className="size-3.5" /> Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-96 divide-y divide-border overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Nenhuma notificação" description="Você está em dia! Novidades do sistema aparecerão aqui." />
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onClick={onNotificationClick} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
