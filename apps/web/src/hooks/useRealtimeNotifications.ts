import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import type { NotificationItemData } from '@/components/ui/notification-item';

/**
 * Estrutura de integração com Supabase Realtime para a tabela `notifications`
 * (Sprint 02). Esta sprint entrega apenas o "encanamento": assina o canal
 * correto, no formato correto, filtrado pelo usuário correto — mas como a
 * tabela ainda não recebe inserts de nenhum módulo de negócio, a lista
 * permanece vazia até a primeira notificação real ser criada.
 *
 * Quando um módulo futuro passar a INSERT em `notifications`, esta lista
 * atualiza automaticamente em tempo real, sem qualquer mudança aqui.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            title: string;
            message: string;
            kind: NotificationItemData['kind'];
            is_read: boolean;
            created_at: string;
          };
          setNotifications((current) => [
            {
              id: row.id,
              title: row.title,
              message: row.message,
              kind: row.kind,
              isRead: row.is_read,
              createdAtLabel: new Date(row.created_at).toLocaleString('pt-BR'),
            },
            ...current,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  function markAllAsRead() {
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    // @todo Sprint do módulo de Notificações: UPDATE notifications SET is_read = true WHERE user_id = user.id AND is_read = false.
  }

  return { notifications, markAllAsRead };
}
