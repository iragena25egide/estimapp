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

  // ===============================
  // START SIGNUP (SEND OTP)
  // ===============================
  @Post('start-signup')
  async startSignup(@Body() body: any) {
    return this.usersService.startSignup(body);
  }

  // ===============================
  // VERIFY OTP
  // ===============================
  @Post('verify-signup')
  async verifySignupOtp(@Body() body: any) {
    return this.usersService.verifySignupOtp(body.email, body.otp);
  }

  // ===============================
  // COMPLETE SIGNUP
  // ===============================
  @Post('complete-signup')
  async completeSignup(@Body() body: any) {
    return this.usersService.completeSignup(body.email, body.password);
  }

  // ===============================
  // GET ALL USERS
  // ===============================
  @Get('all')
  async findAll() {
    return this.usersService.findAll();
  }

  // ===============================
  // COUNT USERS
  // ===============================
  @Get('stats/count')
  async count() {
    return {
      totalUsers: await this.usersService.countUsers(),
    };
  }

  // ===============================
  // FIND BY EMAIL
  // ===============================
  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmailOrFail(email);
  }

  // ===============================
  // FIND BY ID (MUST BE LAST)
  // ===============================
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
