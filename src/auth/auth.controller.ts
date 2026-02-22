import { Body, Controller, Post,Get, Req, UnauthorizedException,Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../users/dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@Controller('estimaApp/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }


  @Post('verify-otp')
  async verifyOtp(
    @Body() body: { email: string; otp: string },
  ) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

 
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
   
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any) {
    
    return req.user; 
  }

   @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    return this.authService.getMe(token);
  }
}


