import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check completo (banco, Supabase, Redis, Storage, métricas)' })
  getHealth() { return this.health.getHealth(); }

  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes/Docker liveness probe' })
  liveness() { return this.health.getLiveness(); }

  @Get('readiness')
  @ApiOperation({ summary: 'Kubernetes/Docker readiness probe' })
  readiness() { return this.health.getReadiness(); }

  @Get('metrics')
  @ApiOperation({ summary: 'Métricas operacionais detalhadas (negócio + sistema)' })
  metrics() { return this.health.getMetrics(); }
}
