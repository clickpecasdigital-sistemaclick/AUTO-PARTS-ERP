import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, UserX } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/utils/formatters';
import {
  useDeactivateUser,
  useInviteUser,
  useUpdateUserRole,
  useUsers,
  type InviteUserPayload,
  type TenantUser,
  type UserRole,
} from '../services/users.service';

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  operator: 'Operador',
  viewer: 'Visualização',
};

const roleVariant: Record<UserRole, 'destructive' | 'success' | 'secondary' | 'outline'> = {
  super_admin: 'destructive',
  admin: 'success',
  manager: 'secondary',
  operator: 'outline',
  viewer: 'outline',
};

/** Gestão de usuários do tenant — convite direto (sem depender do
 * self-signup público, que nascia sem empresa/papel definidos). */
export default function UsersPage() {
  const { can } = usePermissions();
  const { data: users, isLoading } = useUsers();
  const inviteUser = useInviteUser();
  const updateRole = useUpdateUserRole();
  const deactivateUser = useDeactivateUser();
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<InviteUserPayload>({ defaultValues: { role: 'operator' } });

  async function onSubmit(values: InviteUserPayload) {
    await inviteUser.mutateAsync(values);
    setIsOpen(false);
    form.reset();
  }

  const columns: ColumnDef<TenantUser, unknown>[] = [
    {
      id: 'name',
      header: 'Usuário',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.fullName ?? row.original.email}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Papel',
      cell: ({ row }) =>
        can('employees', 'update') ? (
          <Select value={row.original.role} onValueChange={(v) => updateRole.mutate({ id: row.original.id, role: v as UserRole })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={roleVariant[row.original.role]}>{roleLabels[row.original.role]}</Badge>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'secondary'}>{row.original.isActive ? 'Ativo' : 'Inativo'}</Badge>,
    },
    {
      id: 'lastLoginAt',
      header: 'Último acesso',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.lastLoginAt ? formatDate(row.original.lastLoginAt) : 'Nunca acessou'}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        can('employees', 'delete') &&
        row.original.isActive && (
          <Button variant="ghost" size="icon-sm" onClick={() => deactivateUser.mutate(row.original.id)} title="Desativar acesso">
            <UserX className="size-4" />
          </Button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Convide e gerencie o acesso da sua equipe ao sistema."
        actions={
          can('employees', 'create') && (
            <Button onClick={() => setIsOpen(true)}>
              <Plus /> Convidar usuário
            </Button>
          )
        }
      />

      <AdvancedDataTable
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
        exportFileName="usuarios"
        emptyMessage="Nenhum usuário cadastrado ainda."
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Nome completo" required>
              <Input {...form.register('fullName', { required: true })} />
            </FormField>
            <FormField label="E-mail" required hint="A pessoa recebe um e-mail para definir a senha e acessar.">
              <Input type="email" {...form.register('email', { required: true })} />
            </FormField>
            <FormField label="Papel" required>
              <Select onValueChange={(v) => form.setValue('role', v as UserRole)} value={form.watch('role')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels)
                    .filter(([value]) => value !== 'super_admin')
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter>
              <Button type="submit" isLoading={inviteUser.isPending}>
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
