import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('estimaApp/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  
  @Get('all')
  async findAll() {
    return this.usersService.findAll();
  }

  
  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmailOrFail(email);
  }

  
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

 
  @Get('stats/count')
  async count() {
    return {
      totalUsers: await this.usersService.countUsers(),
    };
  }
}
