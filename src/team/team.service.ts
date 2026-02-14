import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { addHours } from 'date-fns';

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

  async inviteMember(teamId: string, email: string, role: TeamRole) {
  const token = randomUUID();

  const invitation = await this.prisma.teamInvitation.create({
    data: {
      email,
      token,
      teamId,
      role,
      expiresAt: addHours(new Date(), 4), 
    },
  });

  // TODO: send email here
  // sendEmail(email, inviteLink)

  return invitation;
}

async acceptInvitation(token: string, userId: string) {
  const invitation = await this.prisma.teamInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new NotFoundException('Invalid invitation');
  }

  if (invitation.accepted) {
    throw new Error('Invitation already accepted');
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error('Invitation expired');
  }


  await this.prisma.teamMember.create({
    data: {
      teamId: invitation.teamId,
      userId,
      role: invitation.role,
    },
  });

 
  await this.prisma.teamInvitation.update({
    where: { token },
    data: { accepted: true },
  });

  return { message: 'Joined team successfully' };
}



}
