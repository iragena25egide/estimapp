import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async createTeam(name: string, ownerId: string) {
    return this.prisma.team.create({
      data: {
        name,
        ownerId,
      },
    });
  }

  async getTeam(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Team not found');

    return team;
  }
}
