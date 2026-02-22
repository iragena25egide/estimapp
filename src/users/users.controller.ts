import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';

@Controller('estimaApp/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  
  @Post('start-signup')
  async startSignup(@Body() body: any) {
    return this.usersService.startSignup(body);
  }

  
  @Post('verify-signup')
  async verifySignupOtp(@Body() body: any) {
    return this.usersService.verifySignupOtp(body.email, body.otp);
  }

  
  @Post('complete-signup')
  async completeSignup(@Body() body: any) {
    return this.usersService.completeSignup(body.email, body.password);
  }

  
  @Get('all')
  async findAll() {
    return this.usersService.findAll();
  }

  
  @Get('stats/count')
  async count() {
    return {
      totalUsers: await this.usersService.countUsers(),
    };
  }

  
  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmailOrFail(email);
  }

  
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
