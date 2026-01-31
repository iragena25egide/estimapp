import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3000/api/estimaApp/auth/google/callback', 
      scope: ['email', 'profile'],
      passReqToCallback: false, 
    });
  }

  async validate(
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: VerifyCallback,
): Promise<any> {
  try {
    const { emails, name, photos, id: googleId } = profile;

    if (!emails || emails.length === 0 || !emails[0].value) {
      return done(new Error('No email returned from Google'), false);
    }

    const user = await this.authService.loginOrRegisterGoogle({
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      googleId,
      avatarUrl: photos[0]?.value,
    });

    done(null, user);
  } catch (err) {
    done(err, false);
  }
}
    
}
