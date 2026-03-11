import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { addHours } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../emails/email.service';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const inviteLink = `${frontendUrl}/invite?token=${token}`;

    // Create the invitation in the database
    const invitation = await this.prisma.teamInvitation.create({
      data: {
        email,
        token,
        teamId,
        role,
        expiresAt: addHours(new Date(), 4), // 4 hours expiry
      },
    });

    // Get team name for the email
    const team = await this.getTeam(teamId);

    // Prepare email content
    const subject = `You're invited to join the team "${team.name}"`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p>You have been invited to join the team <strong>${team.name}</strong> as a <strong>${role.toLowerCase()}</strong>.</p>
        <p>Click the button below to accept the invitation:</p>
        <a href="${inviteLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Accept Invitation</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p><strong>Note:</strong> If you don't have an account yet, you'll be able to create one after clicking the link.</p>
        <p>This invitation will expire in 4 hours.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    `;

    // Send the email
    try {
      await this.emailService.sendEmail({
        to: email,
        subject,
        html,
      });
      this.logger.log(`Invitation email sent to ${email} for team ${teamId}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}: ${error.message}`);
      // Decide if you want to throw an error or still return the invitation.
      // Depending on your requirements, you might want to notify the user that email failed.
      // For now, we'll log and continue.
    }

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

    // Add user to team
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


  async getUserTeams(userId: string) {
  
  const teams = await this.prisma.team.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      members: true, 
    },
  });
  return teams;
}
}