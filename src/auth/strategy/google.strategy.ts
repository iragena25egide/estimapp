import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        'http://localhost:3000/api/estimaApp/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email =
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : null;

      if (!email) {
        return done(
          new UnauthorizedException(
            'Google account has no email associated',
          ),
          false,
        );
      }

      const user = await this.authService.loginOrRegisterGoogle({
        email,
        firstName: profile.name?.givenName ?? '',
        lastName: profile.name?.familyName ?? '',
        googleId: profile.id,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      });

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
