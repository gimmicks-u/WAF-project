import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  async googleLogin(credential: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Google client ID not configured');
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Google payload missing required claims');
    }

    const oauth_id = payload.sub;
    const email = payload.email;
    const name = payload.name ?? '';

    let user = await this.userRepository.findOne({
      where: { oauth_provider: 'google', oauth_id },
    });

    if (!user) {
      // Try to link by email if exists
      user = await this.userRepository.findOne({ where: { email } });
      if (user) {
        user.oauth_provider = 'google';
        user.oauth_id = oauth_id;
        user.name = name;
        await this.userRepository.save(user);
      } else {
        user = await this.userRepository.save({
          email,
          name,
          oauth_provider: 'google',
          oauth_id,
        });
      }
    } else {
      let changed = false;
      if (user.email !== email) {
        user.email = email;
        changed = true;
      }
      if ((user.name ?? '') !== (name ?? '')) {
        user.name = name;
        changed = true;
      }
      if (changed) {
        await this.userRepository.save(user);
      }
    }

    if (!user) {
      throw new UnauthorizedException('Failed to resolve user');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      provider: 'google',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? '',
      },
    };
  }
}
