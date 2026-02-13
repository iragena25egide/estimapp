import { Module } from '@nestjs/common';
import { TeamMemberService } from './team-member.service';
import { TeamMemberController } from './team-member.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TeamMemberController],
  providers: [TeamMemberService, PrismaService],
})
export class TeamMemberModule {}
