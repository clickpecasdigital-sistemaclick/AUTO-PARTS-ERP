import { Test } from '@nestjs/testing';
import { WorkshopAppointmentsService } from '../workshop-appointments.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('WorkshopAppointmentsService — agenda e lista de espera', () => {
  let service: WorkshopAppointmentsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

  beforeEach(async () => {
    prisma = {
      workshopAppointment: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'appt-1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'appt-1', ...data })),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [WorkshopAppointmentsService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(WorkshopAppointmentsService);
  });

  it('agenda normalmente (status: scheduled) quando não há conflito de horário', async () => {
    prisma.workshopAppointment.findMany.mockResolvedValue([]);

    const result = await service.create(ctx, 'branch-1', { customerId: 'c1', mechanicId: 'm1', scheduledAt: '2026-07-01T10:00:00.000Z', durationMinutes: 60 });

    expect(result.status).toBe('scheduled');
  });

  it('cai automaticamente em lista de espera (waitlisted) quando o mesmo mecânico já tem horário sobreposto', async () => {
    prisma.workshopAppointment.findMany.mockResolvedValue([
      { id: 'existing', mechanicId: 'm1', boxId: null, scheduledAt: new Date('2026-07-01T10:30:00.000Z'), durationMinutes: 60 },
    ]);

    const result = await service.create(ctx, 'branch-1', { customerId: 'c1', mechanicId: 'm1', scheduledAt: '2026-07-01T10:00:00.000Z', durationMinutes: 60 });

    expect(result.status).toBe('waitlisted');
  });

  it('não detecta conflito quando os horários não se sobrepõem', async () => {
    prisma.workshopAppointment.findMany.mockResolvedValue([
      { id: 'existing', mechanicId: 'm1', boxId: null, scheduledAt: new Date('2026-07-01T08:00:00.000Z'), durationMinutes: 60 },
    ]);

    const result = await service.create(ctx, 'branch-1', { customerId: 'c1', mechanicId: 'm1', scheduledAt: '2026-07-01T10:00:00.000Z', durationMinutes: 60 });

    expect(result.status).toBe('scheduled');
  });

  it('detecta conflito também por box, mesmo com mecânicos diferentes', async () => {
    prisma.workshopAppointment.findMany.mockResolvedValue([
      { id: 'existing', mechanicId: 'm2', boxId: 'box-1', scheduledAt: new Date('2026-07-01T10:00:00.000Z'), durationMinutes: 60 },
    ]);

    const result = await service.create(ctx, 'branch-1', { customerId: 'c1', mechanicId: 'm1', boxId: 'box-1', scheduledAt: '2026-07-01T10:15:00.000Z', durationMinutes: 30 });

    expect(result.status).toBe('waitlisted');
  });

  describe('reschedule', () => {
    it('cria um novo agendamento ligado ao original via rescheduledFromId e marca o original como rescheduled', async () => {
      prisma.workshopAppointment.findFirst.mockResolvedValue({ id: 'appt-1', tenantId: 'tenant-1', branchId: 'branch-1', mechanicId: 'm1', boxId: null, customerId: 'c1', vehicleId: null, serviceId: null, durationMinutes: 60 });
      prisma.workshopAppointment.findMany.mockResolvedValue([]);

      await service.reschedule(ctx, 'appt-1', '2026-07-02T10:00:00.000Z');

      expect(prisma.workshopAppointment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rescheduledFromId: 'appt-1' }) }));
      expect(prisma.workshopAppointment.update).toHaveBeenCalledWith({ where: { id: 'appt-1' }, data: { status: 'rescheduled' } });
    });
  });
});
