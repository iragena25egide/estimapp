import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamRole } from '@prisma/client';

@Injectable()
export class TeamMemberService {
  constructor(private prisma: PrismaService) {}

  async addMember(
    teamId: string,
    userId: string,
    role: string,
  ) {
    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role:TeamRole.ESTIMATOR,
      },
    });
  }

  async removeMember(teamId: string, userId: string) {
    return this.prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }
}

