import { Module } from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminController } from './superadmin.controller';

@Module({ controllers: [SuperAdminController], providers: [SuperAdminService] })
export class SuperAdminModule {}
