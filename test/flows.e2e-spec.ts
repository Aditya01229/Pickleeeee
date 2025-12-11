import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { TestUtils, TestUser, TestOrganization } from './helpers/test-utils';

describe('Complete User Flows (e2e)', () => {
  let app: INestApplication<App>;
  let testUtils: TestUtils;
  let manager: TestUser;
  let player: TestUser;
  let game: any;
  let organization: TestOrganization;

  beforeAll(async () => {
    testUtils = new TestUtils();
    const { app: testApp } = await testUtils.setup();
    app = testApp;

    // Create seed game
    game = await testUtils.createGame({
      key: 'pickleball',
      name: 'Pickleball',
    });
  });

  afterAll(async () => {
    // Fire-and-forget teardown
    testUtils.teardown().catch(() => {});
  });

  describe('Flow 1: Manager Creates Tournament', () => {
    it('should complete full manager flow', async () => {
      // 1. Register manager (use timestamp to ensure unique email)
      const timestamp = Date.now();
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          name: 'Tournament Manager',
          email: `manager${timestamp}@test.com`,
          password: 'password123',
        })
        .expect(201);

      manager = {
        id: registerResponse.body.id,
        email: registerResponse.body.email,
        name: registerResponse.body.name,
        password: 'password123',
      };

      // 2. Login manager
      const loginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: manager.email,
          password: manager.password,
        })
        .expect((res) => {
          // Accept both 200 and 201
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Expected 200 or 201, got ${res.status}`);
          }
        });

      manager.token = loginResponse.body.access_token;

      // 3. Create organization (use timestamp for unique slug)
      const orgResponse = await request(app.getHttpServer())
        .post('/users/organizations')
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: 'Test Organization',
          slug: `test-org-${timestamp}`,
          defaultGameId: game.id,
        })
        .expect(201);

      organization = {
        id: orgResponse.body.id,
        name: orgResponse.body.name,
        slug: orgResponse.body.slug,
      };

      expect(orgResponse.body.memberships[0].role).toBe('super_manager');

      // 4. Create tournament
      const tournamentResponse = await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/tournaments`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          gameId: game.id,
          name: 'Test Tournament 2025',
          slug: 'test-tournament-2025',
          description: 'A test tournament',
          startDate: new Date('2025-12-25').toISOString(),
          endDate: new Date('2025-12-26').toISOString(),
        })
        .expect(201);

      expect(tournamentResponse.body.name).toBe('Test Tournament 2025');

      // 5. Add tournament category
      const categoryResponse = await request(app.getHttpServer())
        .post(
          `/organizations/${organization.id}/tournaments/${tournamentResponse.body.id}/categories`,
        )
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          name: "Men's Singles",
          key: 'men-singles',
          entryType: 'INDIVIDUAL',
          entryLimit: 16,
        })
        .expect(201);

      expect(categoryResponse.body.entryType).toBe('INDIVIDUAL');
    });
  });

  describe('Flow 2: Player Registration Flow', () => {
    it('should complete player registration flow', async () => {
      // 1. Register player (use timestamp to ensure unique email)
      const timestamp = Date.now();
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          name: 'Test Player',
          email: `player${timestamp}@test.com`,
          password: 'password123',
        })
        .expect(201);

      player = {
        id: registerResponse.body.id,
        email: registerResponse.body.email,
        name: registerResponse.body.name,
        password: 'password123',
      };

      // 2. Login player
      const loginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: player.email,
          password: player.password,
        })
        .expect((res) => {
          // Accept both 200 and 201
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Expected 200 or 201, got ${res.status}`);
          }
        });

      player.token = loginResponse.body.access_token;

      // 3. Get tournaments (should be accessible)
      const tournamentsResponse = await request(app.getHttpServer())
        .get(`/organizations/${organization.id}/tournaments`)
        .set('Authorization', `Bearer ${player.token}`)
        .expect(200);

      expect(Array.isArray(tournamentsResponse.body)).toBe(true);
    });
  });

  describe('Flow 3: Team Creation and Management', () => {
    let teamId: number;
    let teamMember: TestUser;

    it('should complete team creation and invitation flow', async () => {
      // Increase timeout for this complex flow
      jest.setTimeout(60000);
      
      // Setup: Create manager and organization for this flow
      const flow3Timestamp = Date.now();
      const managerFlow3 = await testUtils.createUserWithToken({
        name: 'Flow3 Manager',
        email: `flow3manager${flow3Timestamp}@test.com`,
        password: 'password123',
      });

      const orgResponse = await request(app.getHttpServer())
        .post('/users/organizations')
        .set('Authorization', `Bearer ${managerFlow3.token}`)
        .send({
          name: 'Flow3 Organization',
          slug: `flow3-org-${flow3Timestamp}`,
          defaultGameId: game.id,
        })
        .expect(201);

      const flow3Org = {
        id: orgResponse.body.id,
        name: orgResponse.body.name,
        slug: orgResponse.body.slug,
      };

      // Create tournament
      const tournamentResponse = await request(app.getHttpServer())
        .post(`/organizations/${flow3Org.id}/tournaments`)
        .set('Authorization', `Bearer ${managerFlow3.token}`)
        .send({
          gameId: game.id,
          name: 'Flow3 Tournament',
          slug: `flow3-tournament-${flow3Timestamp}`,
        })
        .expect(201);

      // 1. Create team category first (by manager)
      const tournament = tournamentResponse.body;

      const teamCategoryResponse = await request(app.getHttpServer())
        .post(
          `/organizations/${flow3Org.id}/tournaments/${tournament.id}/categories`,
        )
        .set('Authorization', `Bearer ${managerFlow3.token}`)
        .send({
          name: "Men's Doubles",
          key: 'men-doubles',
          entryType: 'TEAM',
          entryLimit: 16,
          teamSize: 2,
        })
        .expect(201);

      // Create player for this flow
      const playerFlow3 = await testUtils.createUserWithToken({
        name: 'Flow3 Player',
        email: `flow3player${flow3Timestamp}@test.com`,
        password: 'password123',
      });

      // 2. Create team (by player)
      const createTeamResponse = await request(app.getHttpServer())
        .post('/users/teams')
        .set('Authorization', `Bearer ${playerFlow3.token}`)
        .send({
          tournamentId: tournament.id,
          categoryId: teamCategoryResponse.body.id,
          name: 'Team Alpha',
        })
        .expect(201);

      teamId = createTeamResponse.body.id;
      expect(createTeamResponse.body.name).toBe('Team Alpha');

      // 3. Register another user to invite (use timestamp to ensure unique email)
      const memberTimestamp = Date.now();
      const memberRegisterResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          name: 'Team Member',
          email: `member${memberTimestamp}@test.com`,
          password: 'password123',
        })
        .expect(201);

      teamMember = {
        id: memberRegisterResponse.body.id,
        email: memberRegisterResponse.body.email,
        name: memberRegisterResponse.body.name,
        password: 'password123',
      };

      // 4. Login team member
      const memberLoginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: teamMember.email,
          password: teamMember.password,
        })
        .expect((res) => {
          // Accept both 200 and 201
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Expected 200 or 201, got ${res.status}`);
          }
        });

      teamMember.token = memberLoginResponse.body.access_token;

      // 5. Invite team member
      await request(app.getHttpServer())
        .post('/users/teams/invite')
        .set('Authorization', `Bearer ${playerFlow3.token}`)
        .send({
          teamId: teamId,
          userId: teamMember.id,
        })
        .expect(201);

      // 6. Get team invites (as member)
      const invitesResponse = await request(app.getHttpServer())
        .get('/users/teams/invites')
        .set('Authorization', `Bearer ${teamMember.token}`)
        .expect(200);

      expect(invitesResponse.body.length).toBeGreaterThan(0);

      // 7. Accept invite
      await request(app.getHttpServer())
        .post('/users/teams/respond')
        .set('Authorization', `Bearer ${teamMember.token}`)
        .send({
          teamId: teamId,
          action: 'accept',
        })
        .expect((res) => {
          // Accept both 200 and 201
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Expected 200 or 201, got ${res.status}`);
          }
        });

      // 8. Verify team membership
      const teamsResponse = await request(app.getHttpServer())
        .get('/users/teams')
        .set('Authorization', `Bearer ${playerFlow3.token}`)
        .expect(200);

      expect(teamsResponse.body.captainedTeams.length).toBeGreaterThan(0);
    });
  });
});

