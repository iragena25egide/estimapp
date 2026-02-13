import { Controller, Post, Body, Param, Get, Req } from '@nestjs/common';
import { TeamService } from './team.service';

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
}
