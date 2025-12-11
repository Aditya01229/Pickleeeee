import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { TestUtils, TestUser } from './helpers/test-utils';

describe('API Endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let testUtils: TestUtils;
  let user: TestUser;
  let game: any;

  beforeAll(async () => {
    testUtils = new TestUtils();
    const { app: testApp } = await testUtils.setup();
    app = testApp;

    // Create seed game
    game = await testUtils.createGame({
      key: 'pickleball',
      name: 'Pickleball',
    });

    // Create authenticated user
    user = await testUtils.createUserWithToken({
      name: 'API Test User',
      email: 'apitest@example.com',
      password: 'password123',
    });
  });

  afterAll(async () => {
    // Fire-and-forget teardown
    testUtils.teardown().catch(() => {});
  });

  describe('User Endpoints', () => {
    it('GET /users/profile - should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(user.email);
    });

    it('PUT /users/profile - should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          name: 'Updated Name',
          phone: '9876543210',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });

    it('GET /users/games - should get all games', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/games')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Organization Endpoints', () => {
    let orgId: number;

    it('POST /users/organizations - should create organization', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/organizations')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          name: 'Test Org',
          slug: 'test-org-api',
        })
        .expect(201);

      orgId = response.body.id;
      expect(response.body.name).toBe('Test Org');
    });

    it('GET /users/organizations - should get user organizations', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/organizations')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /users/organizations/join - should join organization', async () => {
      // Create another user
      const user2 = await testUtils.createUserWithToken({
        name: 'User 2',
        email: 'user2@test.com',
        password: 'password123',
      });

      const response = await request(app.getHttpServer())
        .post('/users/organizations/join')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({
          organizationId: orgId,
          role: 'follower',
        })
        .expect(201);

      expect(response.body.role).toBe('follower');
    });
  });

  describe('Player Profile Endpoints', () => {
    it('POST /users/player-profiles - should create player profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/player-profiles')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          gameId: game.id,
          rating: 1200,
          meta: {
            skillLevel: 'intermediate',
          },
        })
        .expect(201);

      expect(response.body.rating).toBe(1200);
    });

    it('GET /users/player-profiles - should get player profiles', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/player-profiles')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('PUT /users/player-profiles/:gameId - should update player profile', async () => {
      const response = await request(app.getHttpServer())
        .put(`/users/player-profiles/${game.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          rating: 1400,
        })
        .expect(200);

      expect(response.body.rating).toBe(1400);
    });
  });

  describe('Teams Endpoints', () => {
    let tournamentId: number;
    let categoryId: number;
    let teamId: number;

    beforeAll(async () => {
      // Create organization and tournament first
      const org = await testUtils.createOrganization(user.id, {
        name: 'Teams Org',
        slug: 'teams-org',
      });

      const tournament = await testUtils.createTournament(
        org.id,
        game.id,
        user.id,
        {
          name: 'Teams Tournament',
          slug: 'teams-tournament',
        },
      );

      tournamentId = tournament.id;

      // Create team category (would normally be done via API)
      const category = await testUtils.getPrisma().tournamentCategory.create({
        data: {
          tournamentId: tournament.id,
          name: "Men's Doubles",
          key: 'men-doubles',
          entryType: 'TEAM',
          settings: { teamSize: 2 },
        },
      });

      categoryId = category.id;
    });

    it('POST /users/teams - should create team', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/teams')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          tournamentId: tournamentId,
          categoryId: categoryId,
          name: 'Test Team',
        })
        .expect(201);

      teamId = response.body.id;
      expect(response.body.name).toBe('Test Team');
    });

    it('GET /users/teams - should get user teams', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/teams')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('captainedTeams');
      expect(response.body).toHaveProperty('memberTeams');
    });
  });

  describe('Notifications Endpoints', () => {
    it('GET /users/notifications - should get notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/notifications')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

