import { Controller, Post, Body, Param, Get, Req } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamRole } from '@prisma/client';

@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  create(@Body() body: { name: string }, @Req() req: any) {
    return this.teamService.createTeam(body.name, req.user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.teamService.getTeam(id);
  }
  @Post(':teamId/invite')
invite(
  @Param('teamId') teamId: string,
  @Body() body: { email: string; role: TeamRole },
) {
  return this.teamService.inviteMember(teamId, body.email, body.role);
}

@Post('accept-invite')
accept(
  @Body() body: { token: string; userId: string },
) {
  return this.teamService.acceptInvitation(body.token, body.userId);
}

}
