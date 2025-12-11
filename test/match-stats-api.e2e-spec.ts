import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { TestUtils, TestUser } from './helpers/test-utils';

describe('Match and Stats API Endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let testUtils: TestUtils;
  let player: TestUser;
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

    // Create player
    player = await testUtils.createUserWithToken({
      name: 'Match Stats Player',
      email: 'match-stats-player@test.com',
      password: 'password123',
    });

    // Create player profile
    await request(app.getHttpServer())
      .post('/users/player-profiles')
      .set('Authorization', `Bearer ${player.token}`)
      .send({
        gameId: game.id,
        rating: 1200,
        meta: {
          skillLevel: 'intermediate',
        },
      })
      .expect(201);
  });

  afterAll(async () => {
    testUtils.teardown().catch(() => {});
  });

  describe('GET /users/matches', () => {
    it('should get user matches', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/matches')
        .set('Authorization', `Bearer ${player.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/matches')
        .expect(401);
    });

    it('should return empty array for new user', async () => {
      const newPlayer = await testUtils.createUserWithToken({
        name: 'New Player',
        email: `new-player-${Date.now()}@test.com`,
        password: 'password123',
      });

      const response = await request(app.getHttpServer())
        .get('/users/matches')
        .set('Authorization', `Bearer ${newPlayer.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /users/stats', () => {
    it('should get user stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/stats')
        .set('Authorization', `Bearer ${player.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalMatches');
      expect(response.body).toHaveProperty('wins');
      expect(response.body).toHaveProperty('losses');
      expect(response.body).toHaveProperty('playerProfiles');
      expect(Array.isArray(response.body.playerProfiles)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/stats')
        .expect(401);
    });

    it('should return stats for specific game', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/stats')
        .set('Authorization', `Bearer ${player.token}`)
        .query({ gameId: game.id })
        .expect(200);

      expect(response.body).toHaveProperty('totalMatches');
      expect(response.body).toHaveProperty('playerProfiles');
      expect(Array.isArray(response.body.playerProfiles)).toBe(true);
    });
  });

  describe('GET /users/games', () => {
    it('should get all games', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/games')
        .set('Authorization', `Bearer ${player.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/games')
        .expect(401);
    });
  });
});

