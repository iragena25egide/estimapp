import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { NotificationsService } from 'src/auth/notification.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private notificationService: NotificationsService) {}

  

async createUser(dto: CreateUserDto) {
  const existing = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (existing) {
    throw new BadRequestException('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  const user = await this.prisma.user.create({
    data: {
      firstName: dto.firstname,
      lastName: dto.lastname,
      email: dto.email,
      phone: dto.phone ?? null,
      role: dto.role ?? 'QS',
      isActive: true,
      localAuth: {
        create: {
          password: hashedPassword,
          verified: false,
        },
      },
    },
    include: {
      localAuth: true,
      googleAuth: true,
    },
  });

  
  if (user.role === 'QS') {
    await this.notificationService.notifyAdminQSRegistered(user);
  }

  return user;
}


  
  async countUsers() {
    return this.prisma.user.count();
  }

 
  async findByEmail(email: string) {
  if (!email) {
    throw new Error('Email is required for findByEmail');
  }

  return this.prisma.user.findUnique({
    where: { email },
    include: { localAuth: true, 
      googleAuth: true },
  });
}


  async findByEmailOrFail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        localAuth: true,
        googleAuth: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        localAuth: true,
        googleAuth: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

 
async createGoogleUser(
    email: string,
    firstName: string,
    lastName: string,
    googleId: string,
    avatarUrl?: string,
  ) {
    
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { googleAuth: true, localAuth: true },
    });

    if (user) {
      
      if (!user.googleAuth || user.googleAuth.googleId !== googleId) {
        user = await this.createOrUpdateGoogleAuth(user.id, googleId, avatarUrl);
      }
      return user;
    }

    
    user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role: 'QS', 
        googleAuth: {
          create: { googleId, avatarUrl },
        },
      },
      include: { googleAuth: true, localAuth: true },
    });

    
    await this.notificationService.notifyAdminQSRegistered(user);

    return user;
  }


 async createOrUpdateGoogleAuth(
    userId: string,
    googleId: string,
    avatarUrl?: string,
  ) {
    const googleAuth = await this.prisma.googleAuth.findUnique({
      where: { userId },
    });

    if (googleAuth) {
      await this.prisma.googleAuth.update({
        where: { userId },
        data: { googleId, avatarUrl },
      });
    } else {
      await this.prisma.googleAuth.create({
        data: { userId, googleId, avatarUrl },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { googleAuth: true, localAuth: true },
    });
  }


  
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        localAuth: true,
        googleAuth: true,
      },
    });
  }
}
