import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailsModule } from './emails/emails.module';
import { PrismaModule } from './prisma/prisma.module'; 
import { DrawingModule } from './drawing/drawing.module';
import { ProjectsModule } from './projects/projects.module';
import { SpecificationModule } from './specification/specification.module';
import { DimensionModule } from './dimension/dimension.module';
import { BoqItemModule } from './boq-item/boq-item.module';
import { RateAnalysisModule } from './rate-analysis/rate-analysis.module';
import { MaterialTakeOffModule } from './material-take-off/material-take-off.module';
import { LaborProductivityModule } from './labor-productivity/labor-productivity.module';
import { EquipmentCostModule } from './equipment-cost/equipment-cost.module';
import { NotificationsModule } from './auth/notification.module';



@Module({
  imports: [
    PrismaModule, 
    UsersModule,
    AuthModule,
    EmailsModule,
    DrawingModule,
    ProjectsModule,
    SpecificationModule,
    DimensionModule,
    BoqItemModule,
    RateAnalysisModule,
    MaterialTakeOffModule,
    LaborProductivityModule,
    EquipmentCostModule,
    NotificationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
