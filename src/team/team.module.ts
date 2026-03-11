import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../emails/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [TeamController],
  providers: [TeamService, PrismaService, EmailService],
})
export class TeamModule {}
