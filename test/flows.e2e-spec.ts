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

    // Increase timeout for this complex flow
    jest.setTimeout(60000);

    it('should complete team creation and invitation flow', async () => {
      
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

  describe('Flow 4: Tournament Registration Flow', () => {
    let tournamentId: number;
    let categoryId: number;
    let registeredPlayer: TestUser;

    jest.setTimeout(60000);

    it('should complete tournament registration flow', async () => {
      const flow4Timestamp = Date.now();
      
      // Setup: Create manager, organization, and tournament
      const managerFlow4 = await testUtils.createUserWithToken({
        name: 'Flow4 Manager',
        email: `flow4manager${flow4Timestamp}@test.com`,
        password: 'password123',
      });

      const orgResponse = await request(app.getHttpServer())
        .post('/users/organizations')
        .set('Authorization', `Bearer ${managerFlow4.token}`)
        .send({
          name: 'Flow4 Organization',
          slug: `flow4-org-${flow4Timestamp}`,
          defaultGameId: game.id,
        })
        .expect(201);

      const flow4Org = {
        id: orgResponse.body.id,
        name: orgResponse.body.name,
        slug: orgResponse.body.slug,
      };

      // Create tournament
      const tournamentResponse = await request(app.getHttpServer())
        .post(`/organizations/${flow4Org.id}/tournaments`)
        .set('Authorization', `Bearer ${managerFlow4.token}`)
        .send({
          gameId: game.id,
          name: 'Flow4 Tournament',
          slug: `flow4-tournament-${flow4Timestamp}`,
          startDate: new Date('2025-12-25').toISOString(),
          endDate: new Date('2025-12-26').toISOString(),
        })
        .expect(201);

      tournamentId = tournamentResponse.body.id;

      // Create category
      const categoryResponse = await request(app.getHttpServer())
        .post(
          `/organizations/${flow4Org.id}/tournaments/${tournamentId}/categories`,
        )
        .set('Authorization', `Bearer ${managerFlow4.token}`)
        .send({
          name: "Women's Singles",
          key: 'women-singles',
          entryType: 'INDIVIDUAL',
          entryLimit: 16,
        })
        .expect(201);

      categoryId = categoryResponse.body.id;

      // 1. Create player profile for the game
      registeredPlayer = await testUtils.createUserWithToken({
        name: 'Flow4 Player',
        email: `flow4player${flow4Timestamp}@test.com`,
        password: 'password123',
      });

      const profileResponse = await request(app.getHttpServer())
        .post('/users/player-profiles')
        .set('Authorization', `Bearer ${registeredPlayer.token}`)
        .send({
          gameId: game.id,
          rating: 1200,
          meta: {
            skillLevel: 'intermediate',
          },
        })
        .expect(201);

      expect(profileResponse.body.rating).toBe(1200);

      // 2. Register for tournament
      const registrationResponse = await request(app.getHttpServer())
        .post('/users/registrations')
        .set('Authorization', `Bearer ${registeredPlayer.token}`)
        .send({
          tournamentId: tournamentId,
          categoryId: categoryId,
        })
        .expect(201);

      expect(registrationResponse.body.tournamentId).toBe(tournamentId);
      expect(registrationResponse.body.categoryId).toBe(categoryId);

      // 3. Get player registrations
      const registrationsResponse = await request(app.getHttpServer())
        .get('/users/registrations')
        .set('Authorization', `Bearer ${registeredPlayer.token}`)
        .expect(200);

      expect(Array.isArray(registrationsResponse.body)).toBe(true);
      expect(registrationsResponse.body.length).toBeGreaterThan(0);

      // 4. Get tournament history
      const historyResponse = await request(app.getHttpServer())
        .get('/users/tournaments/history')
        .set('Authorization', `Bearer ${registeredPlayer.token}`)
        .expect(200);

      expect(Array.isArray(historyResponse.body)).toBe(true);
    });
  });

  describe('Flow 5: Player Profile Management Flow', () => {
    let profilePlayer: TestUser;

    it('should complete player profile management flow', async () => {
      const flow5Timestamp = Date.now();

      // 1. Register and login player
      profilePlayer = await testUtils.createUserWithToken({
        name: 'Flow5 Player',
        email: `flow5player${flow5Timestamp}@test.com`,
        password: 'password123',
      });

      // 2. Create player profile
      const createProfileResponse = await request(app.getHttpServer())
        .post('/users/player-profiles')
        .set('Authorization', `Bearer ${profilePlayer.token}`)
        .send({
          gameId: game.id,
          rating: 1000,
          meta: {
            skillLevel: 'beginner',
            preferredPosition: 'backhand',
          },
        })
        .expect(201);

      expect(createProfileResponse.body.rating).toBe(1000);
      expect(createProfileResponse.body.meta.skillLevel).toBe('beginner');

      // 3. Get all player profiles
      const profilesResponse = await request(app.getHttpServer())
        .get('/users/player-profiles')
        .set('Authorization', `Bearer ${profilePlayer.token}`)
        .expect(200);

      expect(Array.isArray(profilesResponse.body)).toBe(true);
      expect(profilesResponse.body.length).toBeGreaterThan(0);

      // 4. Update player profile
      const updateProfileResponse = await request(app.getHttpServer())
        .put(`/users/player-profiles/${game.id}`)
        .set('Authorization', `Bearer ${profilePlayer.token}`)
        .send({
          rating: 1300,
          meta: {
            skillLevel: 'advanced',
            preferredPosition: 'forehand',
          },
        })
        .expect(200);

      expect(updateProfileResponse.body.rating).toBe(1300);
      expect(updateProfileResponse.body.meta.skillLevel).toBe('advanced');
    });
  });

  describe('Flow 6: Match and Stats Flow', () => {
    let matchPlayer: TestUser;
    let matchOrg: TestOrganization;
    let matchTournamentId: number;

    jest.setTimeout(60000);

    it('should complete match and stats flow', async () => {
      const flow6Timestamp = Date.now();

      // Setup: Create manager, organization, tournament
      const managerFlow6 = await testUtils.createUserWithToken({
        name: 'Flow6 Manager',
        email: `flow6manager${flow6Timestamp}@test.com`,
        password: 'password123',
      });

      const orgResponse = await request(app.getHttpServer())
        .post('/users/organizations')
        .set('Authorization', `Bearer ${managerFlow6.token}`)
        .send({
          name: 'Flow6 Organization',
          slug: `flow6-org-${flow6Timestamp}`,
          defaultGameId: game.id,
        })
        .expect(201);

      matchOrg = {
        id: orgResponse.body.id,
        name: orgResponse.body.name,
        slug: orgResponse.body.slug,
      };

      const tournamentResponse = await request(app.getHttpServer())
        .post(`/organizations/${matchOrg.id}/tournaments`)
        .set('Authorization', `Bearer ${managerFlow6.token}`)
        .send({
          gameId: game.id,
          name: 'Flow6 Tournament',
          slug: `flow6-tournament-${flow6Timestamp}`,
        })
        .expect(201);

      matchTournamentId = tournamentResponse.body.id;

      // 1. Create player and profile
      matchPlayer = await testUtils.createUserWithToken({
        name: 'Flow6 Player',
        email: `flow6player${flow6Timestamp}@test.com`,
        password: 'password123',
      });

      await request(app.getHttpServer())
        .post('/users/player-profiles')
        .set('Authorization', `Bearer ${matchPlayer.token}`)
        .send({
          gameId: game.id,
          rating: 1200,
        })
        .expect(201);

      // 2. Register for tournament
      const categoryResponse = await request(app.getHttpServer())
        .post(
          `/organizations/${matchOrg.id}/tournaments/${matchTournamentId}/categories`,
        )
        .set('Authorization', `Bearer ${managerFlow6.token}`)
        .send({
          name: "Men's Singles",
          key: 'men-singles',
          entryType: 'INDIVIDUAL',
          entryLimit: 16,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/users/registrations')
        .set('Authorization', `Bearer ${matchPlayer.token}`)
        .send({
          tournamentId: matchTournamentId,
          categoryId: categoryResponse.body.id,
        })
        .expect(201);

      // 3. Get matches (should be empty initially)
      const matchesResponse = await request(app.getHttpServer())
        .get('/users/matches')
        .set('Authorization', `Bearer ${matchPlayer.token}`)
        .expect(200);

      expect(Array.isArray(matchesResponse.body)).toBe(true);

      // 4. Get player stats
      const statsResponse = await request(app.getHttpServer())
        .get('/users/stats')
        .set('Authorization', `Bearer ${matchPlayer.token}`)
        .expect(200);

      expect(statsResponse.body).toHaveProperty('totalMatches');
      expect(statsResponse.body).toHaveProperty('wins');
      expect(statsResponse.body).toHaveProperty('losses');
      expect(statsResponse.body).toHaveProperty('playerProfiles');
      expect(Array.isArray(statsResponse.body.playerProfiles)).toBe(true);
      if (statsResponse.body.playerProfiles.length > 0) {
        expect(statsResponse.body.playerProfiles[0].gameId).toBe(game.id);
      }
    });
  });

  describe('Flow 7: Notification Flow', () => {
    let notificationPlayer: TestUser;
    let notificationOrg: TestOrganization;

    it('should complete notification flow', async () => {
      const flow7Timestamp = Date.now();

      // Setup: Create manager and organization
      const managerFlow7 = await testUtils.createUserWithToken({
        name: 'Flow7 Manager',
        email: `flow7manager${flow7Timestamp}@test.com`,
        password: 'password123',
      });

      const orgResponse = await request(app.getHttpServer())
        .post('/users/organizations')
        .set('Authorization', `Bearer ${managerFlow7.token}`)
        .send({
          name: 'Flow7 Organization',
          slug: `flow7-org-${flow7Timestamp}`,
          defaultGameId: game.id,
        })
        .expect(201);

      notificationOrg = {
        id: orgResponse.body.id,
        name: orgResponse.body.name,
        slug: orgResponse.body.slug,
      };

      // 1. Create player
      notificationPlayer = await testUtils.createUserWithToken({
        name: 'Flow7 Player',
        email: `flow7player${flow7Timestamp}@test.com`,
        password: 'password123',
      });

      // 2. Join organization (should create notification)
      await request(app.getHttpServer())
        .post('/users/organizations/join')
        .set('Authorization', `Bearer ${notificationPlayer.token}`)
        .send({
          organizationId: notificationOrg.id,
          role: 'follower',
        })
        .expect(201);

      // 3. Get notifications
      const notificationsResponse = await request(app.getHttpServer())
        .get('/users/notifications')
        .set('Authorization', `Bearer ${notificationPlayer.token}`)
        .expect(200);

      expect(Array.isArray(notificationsResponse.body)).toBe(true);

      // 4. Mark notification as read (if any exist)
      if (notificationsResponse.body.length > 0) {
        const notificationId = notificationsResponse.body[0].id;
        await request(app.getHttpServer())
          .put(`/users/notifications/${notificationId}/read`)
          .set('Authorization', `Bearer ${notificationPlayer.token}`)
          .expect(200);
      }
    });
  });
});

