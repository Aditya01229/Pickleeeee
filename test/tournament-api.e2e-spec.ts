import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { TestUtils, TestUser } from './helpers/test-utils';

describe('Tournament API Endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let testUtils: TestUtils;
  let manager: TestUser;
  let player: TestUser;
  let game: any;
  let orgId: number;
  let tournamentId: number;
  let categoryId: number;

  beforeAll(async () => {
    testUtils = new TestUtils();
    const { app: testApp } = await testUtils.setup();
    app = testApp;

    // Create seed game
    game = await testUtils.createGame({
      key: 'pickleball',
      name: 'Pickleball',
    });

    // Create manager
    const timestamp = Date.now();
    manager = await testUtils.createUserWithToken({
      name: 'Tournament Manager',
      email: `tournament-manager-${timestamp}@test.com`,
      password: 'password123',
    });

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/users/organizations')
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        name: 'Tournament Test Org',
        slug: `tournament-test-org-${Date.now()}`,
        defaultGameId: game.id,
      })
      .expect(201);

    orgId = orgResponse.body.id;

    // Create tournament
    const tournamentResponse = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/tournaments`)
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        gameId: game.id,
        name: 'API Test Tournament',
        slug: `api-test-tournament-${Date.now()}`,
        description: 'Test tournament for API checks',
        startDate: new Date('2025-12-25').toISOString(),
        endDate: new Date('2025-12-26').toISOString(),
      })
      .expect(201);

    tournamentId = tournamentResponse.body.id;

    // Create category
    const categoryResponse = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/tournaments/${tournamentId}/categories`)
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        name: "Men's Singles",
        key: 'men-singles',
        entryType: 'INDIVIDUAL',
        entryLimit: 16,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;

    // Create player
    player = await testUtils.createUserWithToken({
      name: 'Tournament Player',
      email: `tournament-player-${timestamp}@test.com`,
      password: 'password123',
    });
  });

  afterAll(async () => {
    testUtils.teardown().catch(() => {});
  });

  describe('POST /organizations/:orgId/tournaments', () => {
    it('should create tournament with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          gameId: game.id,
          name: 'New Tournament',
          slug: `new-tournament-${Date.now()}`,
          description: 'A new tournament',
          startDate: new Date('2025-12-30').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Tournament');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments`)
        .send({
          gameId: game.id,
          name: 'Unauthorized Tournament',
          slug: 'unauthorized-tournament',
        })
        .expect(401);
    });

    it('should require valid gameId', async () => {
      await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          gameId: 99999,
          name: 'Invalid Game Tournament',
          slug: 'invalid-game-tournament',
        })
        .expect((res) => {
          // Accept 400 (validation) or 404 (not found)
          if (res.status !== 400 && res.status !== 404) {
            throw new Error(`Expected 400 or 404, got ${res.status}`);
          }
        });
    });
  });

  describe('GET /organizations/:orgId/tournaments', () => {
    it('should get all tournaments for organization', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${orgId}/tournaments`)
        .set('Authorization', `Bearer ${player.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/organizations/${orgId}/tournaments`)
        .expect(401);
    });
  });

  describe('POST /organizations/:orgId/tournaments/:tournamentId/categories', () => {
    it('should create tournament category', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments/${tournamentId}/categories`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: "Women's Singles",
          key: 'women-singles',
          entryType: 'INDIVIDUAL',
          entryLimit: 16,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe("Women's Singles");
      expect(response.body.entryType).toBe('INDIVIDUAL');
    });

    it('should create team category', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments/${tournamentId}/categories`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: "Mixed Doubles",
          key: 'mixed-doubles',
          entryType: 'TEAM',
          entryLimit: 8,
          teamSize: 2,
        })
        .expect(201);

      expect(response.body.entryType).toBe('TEAM');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments/${tournamentId}/categories`)
        .send({
          name: 'Unauthorized Category',
          key: 'unauthorized-category',
          entryType: 'INDIVIDUAL',
          entryLimit: 16,
        })
        .expect(401);
    });

    it('should require valid entryType', async () => {
      await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments/${tournamentId}/categories`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: 'Invalid Category',
          key: `invalid-category-${Date.now()}`,
          entryType: 'INVALID',
          entryLimit: 16,
        })
        .expect(400);
    });
  });

  describe('PUT /organizations/:orgId/tournaments/:tournamentId', () => {
    it('should update tournament', async () => {
      const response = await request(app.getHttpServer())
        .put(`/organizations/${orgId}/tournaments/${tournamentId}`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: 'Updated Tournament Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Tournament Name');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/organizations/${orgId}/tournaments/${tournamentId}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);
    });
  });

  describe('PUT /organizations/:orgId/tournaments/:tournamentId/categories/:categoryId', () => {
    it('should update tournament category', async () => {
      const response = await request(app.getHttpServer())
        .put(`/organizations/${orgId}/tournaments/${tournamentId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: "Updated Men's Singles",
          entryLimit: 32,
        })
        .expect(200);

      expect(response.body.name).toBe("Updated Men's Singles");
      expect(response.body.entryLimit).toBe(32);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/organizations/${orgId}/tournaments/${tournamentId}/categories/${categoryId}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);
    });
  });

  describe('DELETE /organizations/:orgId/tournaments/:tournamentId/categories/:categoryId', () => {
    it('should delete tournament category', async () => {
      // Create a category to delete
      const createResponse = await request(app.getHttpServer())
        .post(`/organizations/${orgId}/tournaments/${tournamentId}/categories`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: 'Category To Delete',
          key: `delete-category-${Date.now()}`,
          entryType: 'INDIVIDUAL',
          entryLimit: 16,
        })
        .expect(201);

      const deleteCategoryId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/organizations/${orgId}/tournaments/${tournamentId}/categories/${deleteCategoryId}`)
        .set('Authorization', `Bearer ${manager.token}`)
        .expect(200);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${orgId}/tournaments/${tournamentId}/categories/${categoryId}`)
        .expect(401);
    });
  });
});

