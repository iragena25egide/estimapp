import { Controller, Post, Delete, Body } from '@nestjs/common';
import { TeamMemberService } from './team-member.service';

@Controller('team-members')
export class TeamMemberController {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  @Post()
  add(@Body() body: { teamId: string; userId: string; role: string }) {
    return this.teamMemberService.addMember(
      body.teamId,
      body.userId,
      body.role,
    );
  }

  @Delete()
  remove(@Body() body: { teamId: string; userId: string }) {
    return this.teamMemberService.removeMember(
      body.teamId,
      body.userId,
    );
  }
}
