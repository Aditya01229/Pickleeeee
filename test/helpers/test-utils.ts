import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface TestUser {
  id: number;
  email: string;
  name: string;
  password: string;
  token?: string;
}

export interface TestOrganization {
  id: number;
  name: string;
  slug: string;
}

export interface TestTournament {
  id: number;
  name: string;
  slug: string;
  orgId: number;
  gameId: number;
}

export class TestUtils {
  private app: INestApplication<App>;
  private prisma: PrismaService;
  private moduleFixture: TestingModule;

  async setup() {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    
    // Enable validation like in production
    const { ValidationPipe } = await import('@nestjs/common');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, // Less strict for testing
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    
    await this.app.init();

    this.prisma = this.moduleFixture.get<PrismaService>(PrismaService);
    
    return { app: this.app, prisma: this.prisma };
  }

  async teardown() {
    // Fire-and-forget cleanup - don't wait for anything
    // Jest forceExit will kill everything if needed
    if (this.app) {
      this.app.close().catch(() => {}); // Fire and forget
    }
    
    if (this.prisma) {
      this.prisma.$disconnect().catch(() => {}); // Fire and forget
    }
    
    // Return immediately - don't block
    return Promise.resolve();
  }

  async cleanDatabase() {
    // This deletes ALL data from the database!
    // Note: If you want to use a separate test database, set TEST_DATABASE_URL in your .env

    // Delete in correct order to respect foreign keys
    await this.prisma.matchEvent.deleteMany();
    await this.prisma.match.deleteMany();
    await this.prisma.playerStat.deleteMany();
    await this.prisma.notification.deleteMany();
    await this.prisma.registration.deleteMany();
    await this.prisma.teamMember.deleteMany();
    await this.prisma.team.deleteMany();
    await this.prisma.tournamentCategory.deleteMany();
    await this.prisma.tournament.deleteMany();
    await this.prisma.playerProfile.deleteMany();
    await this.prisma.orgMembership.deleteMany();
    await this.prisma.organization.deleteMany();
    await this.prisma.user.deleteMany();
    // Games are kept as they're seed data
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<TestUser> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      password: data.password, // Keep plain password for testing
    };
  }

  async login(user: TestUser): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post('/users/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect((res) => {
        // Accept both 200 and 201 (201 might be returned by NestJS)
        if (res.status !== 200 && res.status !== 201) {
          throw new Error(`Expected 200 or 201, got ${res.status}`);
        }
      });

    return response.body.access_token;
  }

  async createUserWithToken(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<TestUser> {
    const user = await this.createUser(data);
    user.token = await this.login(user);
    return user;
  }

  async createGame(data: { key: string; name: string }) {
    return this.prisma.game.upsert({
      where: { key: data.key },
      update: {},
      create: {
        key: data.key,
        name: data.name,
        defaultSettings: {},
      },
    });
  }

  async createOrganization(
    userId: number,
    data: { name: string; slug: string; defaultGameId?: number },
  ): Promise<TestOrganization> {
    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        defaultGameId: data.defaultGameId,
        memberships: {
          create: {
            userId: userId,
            role: 'super_manager',
          },
        },
      },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
    };
  }

  async createTournament(
    orgId: number,
    gameId: number,
    createdBy: number,
    data: {
      name: string;
      slug: string;
      description?: string;
    },
  ): Promise<TestTournament> {
    const tournament = await this.prisma.tournament.create({
      data: {
        orgId,
        gameId,
        createdBy,
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });

    return {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      orgId: tournament.orgId,
      gameId: tournament.gameId,
    };
  }

  getApp(): INestApplication<App> {
    return this.app;
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }
}

