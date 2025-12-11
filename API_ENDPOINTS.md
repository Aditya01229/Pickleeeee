# Pickleeeee API Endpoints - Complete User Flow

## Base URL
```
http://localhost:3000
```

---

## 📋 TABLE OF CONTENTS
1. [Authentication & User Management](#1-authentication--user-management)
2. [Organization Management](#2-organization-management)
3. [Tournament Management (Manager)](#3-tournament-management-manager)
4. [Tournament Registration (Player)](#4-tournament-registration-player)
5. [Team Management](#5-team-management)
6. [Match History & Stats](#6-match-history--stats)
7. [Notifications](#7-notifications)
8. [Player Profiles](#8-player-profiles)

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 Register User
**POST** `/users/register`

Creates a new user account.

**Request Body:**
```json
{
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "phone": "9999988888",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "phone": "9999988888",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2025-12-07T10:00:00.000Z",
  "updatedAt": "2025-12-07T10:00:00.000Z",
  "orgMemberships": []
}
```

---

### 1.2 Login User
**POST** `/users/login`

User login endpoint.

**Request Body:**
```json
{
  "email": "rahul@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "Rahul Patel",
    "email": "rahul@example.com",
    "orgMemberships": [...],
    "playerProfiles": [...]
  },
  "message": "Login successful"
}
```

---

### 1.3 Get User Profile
**GET** `/users/:userId/profile`

Get complete user profile with organizations, teams, and profiles.

**Example:** `GET /users/1/profile`

**Response:**
```json
{
  "id": 1,
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "phone": "9999988888",
  "avatarUrl": "https://example.com/avatar.jpg",
  "orgMemberships": [
    {
      "id": 1,
      "role": "manager",
      "organization": {
        "id": 10,
        "name": "PaddleHouse",
        "slug": "paddlehouse"
      }
    }
  ],
  "playerProfiles": [...],
  "captainedTeams": [...],
  "teamMemberships": [...]
}
```

---

### 1.4 Update User Profile
**PUT** `/users/:userId/profile`

Update user profile information.

**Example:** `PUT /users/1/profile`

**Request Body:**
```json
{
  "name": "Rahul P",
  "phone": "8888877777",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Rahul P",
  "email": "rahul@example.com",
  "phone": "8888877777",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "playerProfiles": [...]
}
```

---

## 2. ORGANIZATION MANAGEMENT

### 2.1 Create Organization
### 2.1 Create Organization
**POST** `/users/:userId/organizations`

Create a new organization. User automatically becomes a manager.

**Example:** `POST /users/1/organizations`

**Request Body:**
```json
{
  "name": "PaddleHouse",
  "slug": "paddlehouse"
}
```

**Or with optional fields:**
```json
{
  "name": "PaddleHouse",
  "slug": "paddlehouse",
  "defaultGameId": 1,
  "branding": {
    "logo": "https://example.com/logo.png",
    "primaryColor": "#FF5733"
  }
}
```

**Note:** `defaultGameId` must reference an existing game in the database. Omit it if you don't have games set up yet.

**Response:**
```json
{
  "id": 10,
  "name": "PaddleHouse",
  "slug": "paddlehouse",
  "defaultGameId": 1,
  "branding": {...},
  "memberships": [
    {
      "id": 1,
      "userId": 1,
      "role": "manager",
      "user": {
        "id": 1,
        "name": "Rahul Patel"
      }
    }
  ]
}
```

---

### 2.2 Join Organization
**POST** `/users/:userId/organizations/join`

Join an existing organization as a follower, manager, or super_manager. If no role is specified, defaults to 'follower'.

**Example:** `POST /users/1/organizations/join`

**Request Body:**
```json
{
  "organizationId": 10,
  "role": "manager"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "orgId": 10,
  "role": "manager",
  "organization": {
    "id": 10,
    "name": "PaddleHouse",
    "slug": "paddlehouse"
  },
  "user": {
    "id": 1,
    "name": "Rahul Patel"
  }
}
```

---

### 2.3 Get User Organizations
**GET** `/users/:userId/organizations`

Get all organizations the user belongs to.

**Example:** `GET /users/1/organizations`

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "orgId": 10,
    "role": "manager",
    "organization": {
      "id": 10,
      "name": "PaddleHouse",
      "slug": "paddlehouse",
      "defaultGame": {...},
      "tournaments": [...]
    }
  }
]
```

---

## 3. TOURNAMENT MANAGEMENT (MANAGER)

### ⚠️ PREREQUISITE: GAMES MUST EXIST
Before creating tournaments, you MUST have at least one game in your database. See `SETUP_GUIDE.md` for instructions on seeding games.

### 3.1 Create Tournament
**POST** `/users/:userId/tournaments`

Create a new tournament. Only managers or super_managers can create tournaments.

**Example:** `POST /users/1/tournaments`

**Request Body:**
```json
{
  "orgId": 10,
  "gameId": 1,
  "name": "PaddleHouse Open 2025",
  "slug": "paddlehouse-open-2025",
  "description": "Annual championship tournament",
  "regDeadline": "2025-12-20T23:59:59.000Z",
  "startDate": "2025-12-25T09:00:00.000Z",
  "endDate": "2025-12-26T18:00:00.000Z",
  "courtsCount": 5,
  "matchDurationMinutes": 45,
  "bufferMinutes": 15,
  "scoringMode": "rally_point",
  "settings": {
    "maxParticipants": 32
  }
}
```

**Response:**
```json
{
  "id": 100,
  "orgId": 10,
  "gameId": 1,
  "name": "PaddleHouse Open 2025",
  "slug": "paddlehouse-open-2025",
  "description": "Annual championship tournament",
  "createdBy": 1,
  "organization": {...},
  "game": {...},
  "categories": []
}
```

---

### 3.2 Add Tournament Category
**POST** `/users/:userId/tournaments/categories`

Add a category to a tournament (e.g., Men's Singles, Mixed Doubles).

**Example:** `POST /users/1/tournaments/categories`

**Request Body:**
```json
{
  "tournamentId": 100,
  "name": "Men's Singles",
  "key": "men-singles",
  "entryType": "INDIVIDUAL",
  "entryLimit": 16,
  "regDeadline": "2025-12-20T23:59:59.000Z",
  "startDate": "2025-12-25T09:00:00.000Z",
  "courtsCount": 3,
  "matchDurationMinutes": 45,
  "scoringMode": "best_of_3"
}
```

**For Team Category:**
```json
{
  "tournamentId": 100,
  "name": "Men's Doubles",
  "key": "men-doubles",
  "entryType": "TEAM",
  "entryLimit": 16,
  "regDeadline": "2025-12-20T23:59:59.000Z",
  "startDate": "2025-12-25T14:00:00.000Z",
  "courtsCount": 2,
  "matchDurationMinutes": 45
}
```

**Response:**
```json
{
  "id": 301,
  "tournamentId": 100,
  "name": "Men's Singles",
  "key": "men-singles",
  "entryType": "INDIVIDUAL",
  "entryLimit": 16,
  "tournament": {
    "id": 100,
    "name": "PaddleHouse Open 2025"
  }
}
```

---

### 3.3 Get Hosted Tournaments
**GET** `/users/:userId/tournaments/hosted`

Get all tournaments created by the user (manager view).

**Example:** `GET /users/1/tournaments/hosted`

**Response:**
```json
[
  {
    "id": 100,
    "name": "PaddleHouse Open 2025",
    "slug": "paddlehouse-open-2025",
    "startDate": "2025-12-25T09:00:00.000Z",
    "organization": {...},
    "game": {...},
    "categories": [
      {
        "id": 301,
        "name": "Men's Singles",
        "_count": {
          "registrations": 12,
          "teams": 0
        }
      }
    ],
    "_count": {
      "registrations": 25,
      "matches": 48
    }
  }
]
```

---

## 4. TOURNAMENT REGISTRATION (PLAYER)

### 4.1 Register for Individual Category
**POST** `/users/:userId/registrations`

Register for an individual tournament category.

**Example:** `POST /users/1/registrations`

**Request Body:**
```json
{
  "tournamentId": 100,
  "categoryId": 301
}
```

**Response:**
```json
{
  "id": 1,
  "tournamentId": 100,
  "categoryId": 301,
  "userId": 1,
  "teamId": null,
  "status": "registered",
  "paid": false,
  "tournament": {
    "id": 100,
    "name": "PaddleHouse Open 2025"
  },
  "category": {
    "id": 301,
    "name": "Men's Singles",
    "entryType": "INDIVIDUAL"
  },
  "user": {
    "id": 1,
    "name": "Rahul Patel"
  }
}
```

---

### 4.2 Register for Team Category
**POST** `/users/:userId/registrations`

Register a team for a team tournament category.

**Example:** `POST /users/1/registrations`

**Request Body:**
```json
{
  "tournamentId": 100,
  "categoryId": 302,
  "teamId": 55
}
```

**Response:**
```json
{
  "id": 2,
  "tournamentId": 100,
  "categoryId": 302,
  "userId": 1,
  "teamId": 55,
  "status": "registered",
  "tournament": {...},
  "category": {
    "id": 302,
    "name": "Men's Doubles",
    "entryType": "TEAM"
  },
  "team": {
    "id": 55,
    "name": "Smash Bros",
    "captain": {...},
    "members": [...]
  }
}
```

---

### 4.3 Get My Registrations
**GET** `/users/:userId/registrations`

Get all tournament registrations for the user.

**Example:** `GET /users/1/registrations`

**Response:**
```json
[
  {
    "id": 1,
    "tournamentId": 100,
    "categoryId": 301,
    "userId": 1,
    "status": "registered",
    "tournament": {
      "id": 100,
      "name": "PaddleHouse Open 2025",
      "organization": {...},
      "game": {...}
    },
    "category": {
      "id": 301,
      "name": "Men's Singles"
    },
    "team": null
  }
]
```

---

### 4.4 Get Tournament History
**GET** `/users/:userId/tournaments/history`

Get tournament participation history with stats.

**Example:** `GET /users/1/tournaments/history`

**Response:**
```json
[
  {
    "id": 1,
    "tournamentId": 100,
    "tournament": {
      "id": 100,
      "name": "PaddleHouse Open 2025",
      "startDate": "2025-12-25T09:00:00.000Z"
    },
    "category": {
      "id": 301,
      "name": "Men's Singles"
    },
    "stats": {
      "matchesPlayed": 5,
      "wins": 3,
      "losses": 2
    }
  }
]
```

---

## 5. TEAM MANAGEMENT

### 5.1 Create Team
**POST** `/users/:userId/teams`

Create a new team. User becomes the captain.

**Example:** `POST /users/1/teams`

**Request Body:**
```json
{
  "tournamentId": 100,
  "categoryId": 302,
  "name": "Smash Bros"
}
```

**Response:**
```json
{
  "id": 55,
  "tournamentId": 100,
  "categoryId": 302,
  "name": "Smash Bros",
  "captainUserId": 1,
  "tournament": {
    "id": 100,
    "name": "PaddleHouse Open 2025"
  },
  "category": {
    "id": 302,
    "name": "Men's Doubles"
  },
  "captain": {
    "id": 1,
    "name": "Rahul Patel"
  },
  "members": []
}
```

---

### 5.2 Invite Team Member
**POST** `/users/:userId/teams/invite`

Invite a user to join your team. Only captain can invite.

**Example:** `POST /users/1/teams/invite`

**Request Body:**
```json
{
  "teamId": 55,
  "userId": 2
}
```

**Response:**
```json
{
  "id": 1,
  "teamId": 55,
  "userId": 2,
  "status": "invited",
  "joinedAt": null,
  "team": {
    "id": 55,
    "name": "Smash Bros",
    "tournament": {...},
    "captain": {
      "id": 1,
      "name": "Rahul Patel"
    }
  },
  "user": {
    "id": 2,
    "name": "Amit Shah"
  }
}
```

---

### 5.3 Respond to Team Invite (Accept)
**POST** `/users/:userId/teams/respond`

Accept or reject a team invitation.

**Example:** `POST /users/2/teams/respond`

**Request Body (Accept):**
```json
{
  "teamId": 55,
  "action": "accept"
}
```

**Response:**
```json
{
  "id": 1,
  "teamId": 55,
  "userId": 2,
  "status": "accepted",
  "joinedAt": "2025-12-07T10:30:00.000Z",
  "team": {
    "id": 55,
    "name": "Smash Bros",
    "captain": {...},
    "members": [...]
  }
}
```

**Request Body (Reject):**
```json
{
  "teamId": 55,
  "action": "reject"
}
```

**Response:**
```json
{
  "message": "Invitation declined"
}
```

---

### 5.4 Get My Teams
**GET** `/users/:userId/teams`

Get all teams where user is captain or member.

**Example:** `GET /users/1/teams`

**Response:**
```json
{
  "captainedTeams": [
    {
      "id": 55,
      "name": "Smash Bros",
      "captainUserId": 1,
      "tournament": {...},
      "category": {...},
      "members": [
        {
          "id": 1,
          "userId": 2,
          "status": "accepted",
          "user": {
            "id": 2,
            "name": "Amit Shah"
          }
        }
      ],
      "registrations": [...]
    }
  ],
  "memberTeams": [
    {
      "id": 77,
      "name": "Court Kings",
      "captain": {
        "id": 5,
        "name": "Vikram Singh"
      },
      "tournament": {...}
    }
  ]
}
```

---

### 5.5 Get Team Invites
**GET** `/users/:userId/teams/invites`

Get pending team invitations.

**Example:** `GET /users/2/teams/invites`

**Response:**
```json
[
  {
    "id": 1,
    "teamId": 55,
    "userId": 2,
    "status": "invited",
    "team": {
      "id": 55,
      "name": "Smash Bros",
      "tournament": {
        "id": 100,
        "name": "PaddleHouse Open 2025"
      },
      "category": {
        "id": 302,
        "name": "Men's Doubles"
      },
      "captain": {
        "id": 1,
        "name": "Rahul Patel"
      }
    }
  }
]
```

---

## 6. MATCH HISTORY & STATS

### 6.1 Get My Matches
**GET** `/users/:userId/matches?limit=50`

Get all matches the user has played in.

**Example:** `GET /users/1/matches?limit=20`

**Response:**
```json
[
  {
    "id": 1,
    "tournamentId": 100,
    "categoryId": 301,
    "round": "semifinals",
    "scheduledStart": "2025-12-25T15:00:00.000Z",
    "courtNo": "Court 2",
    "status": "finished",
    "scoreA": 11,
    "scoreB": 6,
    "tournament": {
      "id": 100,
      "name": "PaddleHouse Open 2025"
    },
    "category": {
      "id": 301,
      "name": "Men's Singles"
    },
    "myTeam": {
      "id": 55,
      "name": "Smash Bros"
    },
    "opponentTeam": {
      "id": 77,
      "name": "Court Kings"
    },
    "myScore": 11,
    "opponentScore": 6,
    "result": "won"
  }
]
```

---

### 6.2 Get My Stats
**GET** `/users/:userId/stats?tournamentId=100`

Get overall statistics or tournament-specific stats.

**Example:** `GET /users/1/stats`

**Response:**
```json
{
  "totalMatches": 15,
  "wins": 10,
  "losses": 5,
  "winRate": 66.67,
  "playerProfiles": [
    {
      "id": 1,
      "userId": 1,
      "gameId": 1,
      "rating": 1450,
      "game": {
        "id": 1,
        "name": "Pickleball"
      },
      "playerStats": [
        {
          "id": 1,
          "tournamentId": 100,
          "stats": {
            "gamesPlayed": 5,
            "wins": 3,
            "totalPoints": 43,
            "assists": 12
          }
        }
      ]
    }
  ]
}
```

---

## 7. NOTIFICATIONS

### 7.1 Get My Notifications
**GET** `/users/:userId/notifications`

Get all notifications for the user.

**Example:** `GET /users/1/notifications`

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "type": "teamInvite",
    "payload": {
      "message": "You have been invited to join team Smash Bros",
      "teamId": 55,
      "captainId": 1
    },
    "delivered": false,
    "createdAt": "2025-12-07T10:00:00.000Z"
  },
  {
    "id": 2,
    "userId": 1,
    "type": "registrationConfirmed",
    "payload": {
      "message": "You have successfully registered for Men's Singles in PaddleHouse Open 2025",
      "tournamentId": 100,
      "categoryId": 301
    },
    "delivered": true,
    "createdAt": "2025-12-07T09:30:00.000Z"
  }
]
```

---

### 7.2 Mark Notification as Read
**PUT** `/users/:userId/notifications/:notificationId/read`

Mark a notification as delivered/read.

**Example:** `PUT /users/1/notifications/1/read`

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "type": "teamInvite",
  "delivered": true,
  "createdAt": "2025-12-07T10:00:00.000Z"
}
```

---

## 8. PLAYER PROFILES

### 8.1 Create Player Profile
**POST** `/users/:userId/player-profiles`

Create a player profile for a specific game.

**Example:** `POST /users/1/player-profiles`

**Request Body:**
```json
{
  "gameId": 1,
  "rating": 1200,
  "meta": {
    "skillLevel": "intermediate",
    "yearsPlaying": 2,
    "preferredPosition": "left"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "gameId": 1,
  "rating": 1200,
  "meta": {
    "skillLevel": "intermediate",
    "yearsPlaying": 2,
    "preferredPosition": "left"
  },
  "game": {
    "id": 1,
    "name": "Pickleball",
    "key": "pickleball"
  }
}
```

---

### 8.2 Update Player Profile
**PUT** `/users/:userId/player-profiles/:gameId`

Update a player profile for a specific game.

**Example:** `PUT /users/1/player-profiles/1`

**Request Body:**
```json
{
  "rating": 1450,
  "meta": {
    "skillLevel": "advanced",
    "yearsPlaying": 3,
    "preferredPosition": "right"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "gameId": 1,
  "rating": 1450,
  "meta": {
    "skillLevel": "advanced",
    "yearsPlaying": 3,
    "preferredPosition": "right"
  },
  "game": {
    "id": 1,
    "name": "Pickleball"
  }
}
```

---

### 8.3 Get Player Profiles
**GET** `/users/:userId/player-profiles`

Get all player profiles for the user across different games.

**Example:** `GET /users/1/player-profiles`

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "gameId": 1,
    "rating": 1450,
    "meta": {
      "skillLevel": "advanced"
    },
    "game": {
      "id": 1,
      "name": "Pickleball",
      "key": "pickleball"
    },
    "playerStats": [
      {
        "id": 1,
        "tournamentId": 100,
        "stats": {
          "gamesPlayed": 5,
          "wins": 3
        }
      }
    ]
  }
]
```

---

## 🎯 COMPLETE USER FLOW EXAMPLE

### Scenario: Rahul's Journey

#### Step 1: Register User
```bash
POST /users/register
Body: {"name": "Rahul Patel", "email": "rahul@example.com", "phone": "9999988888"}

# Response - SAVE THIS userId!
{
  "id": 1,  ← This is your userId
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  ...
}
```

#### Step 2: Create Organization (User Becomes Manager)
```bash
POST /users/1/organizations
Body: {"name": "PaddleHouse", "slug": "paddlehouse"}

# Response - SAVE THIS orgId!
{
  "id": 10,  ← This is your orgId
  "name": "PaddleHouse",
  "slug": "paddlehouse",
  "memberships": [
    {
      "id": 1,
      "userId": 1,
      "role": "manager"  ← You're automatically a manager
    }
  ]
}
```

#### Step 3: Other Users Can Join Organization
```bash
# First, register another user
POST /users/register
Body: {"name": "Amit Shah", "email": "amit@example.com"}

# Response
{
  "id": 2,  ← Second user's userId
  ...
}

# Then user 2 joins the organization
POST /users/2/organizations/join
Body: {"organizationId": 10, "role": "follower"}

# Now user 2 is a member of orgId 10
```

#### Step 3: Create Tournament (As Manager)
```bash
POST /users/1/tournaments
Body: {"orgId": 10, "gameId": 1, "name": "PaddleHouse Open 2025", "slug": "paddlehouse-open-2025", ...}
# Returns tournamentId: 100

POST /users/1/tournaments/categories
Body: {"tournamentId": 100, "name": "Men's Singles", "key": "men-singles", "entryType": "INDIVIDUAL"}
# Returns categoryId: 301

POST /users/1/tournaments/categories
Body: {"tournamentId": 100, "name": "Men's Doubles", "key": "men-doubles", "entryType": "TEAM"}
# Returns categoryId: 302
```

#### Step 4: Register for Individual Category
```bash
POST /users/1/registrations
Body: {"tournamentId": 100, "categoryId": 301}
```

#### Step 5: Create Team for Team Category
```bash
POST /users/1/teams
Body: {"tournamentId": 100, "categoryId": 302, "name": "Smash Bros"}
# Returns teamId: 55

POST /users/1/teams/invite
Body: {"teamId": 55, "userId": 2}
```

#### Step 6: Teammate Accepts & Team Registers
```bash
# User 2 accepts
POST /users/2/teams/respond
Body: {"teamId": 55, "action": "accept"}

# Captain registers team
POST /users/1/registrations
Body: {"tournamentId": 100, "categoryId": 302, "teamId": 55}
```

#### Step 7: Check Profile & Stats
```bash
GET /users/1/profile
GET /users/1/matches?limit=50
GET /users/1/stats
GET /users/1/tournaments/history
GET /users/1/notifications
```

---

## 📝 NOTES

1. **Authentication**: This is a simplified system. In production, implement JWT or session-based authentication.

2. **User ID**: In real applications, the `userId` would come from the authentication token, not the URL parameter.

3. **Manager Permissions**: 
   - **Super Managers** (`super_manager`): Can create tournaments, add categories, and manage other managers (manager management not yet implemented)
   - **Managers** (`manager`): Can create tournaments and add categories
   - **Followers** (`follower`): Can view organization info and receive updates
   - Only users with `role="manager"` or `role="super_manager"` in an organization can create tournaments.

4. **Team Flow**: 
   - Captain creates team
   - Captain invites members
   - Members accept invitations
   - Captain registers team for tournament

5. **Individual vs Team**: Check the `entryType` of the category before registration.

6. **Notifications**: Created automatically for:
   - Team invitations
   - Registration confirmations
   - Team member updates
   - Match scheduling

---

## ⚙️ TESTING ORDER

1. Create users (register + login)
2. Create/join organization
3. Create tournament + categories (as manager)
4. Register for individual categories
5. Create teams + invite members
6. Accept team invitations
7. Register teams for team categories
8. View matches, stats, and history
9. Check notifications

---

## 🚀 QUICK START POSTMAN COLLECTION

Import this collection structure in Postman:

```
Pickleeeee API/
├── 1. Auth/
│   ├── Register
│   ├── Login
│   ├── Get Profile
│   └── Update Profile
├── 2. Organizations/
│   ├── Create Organization
│   ├── Join Organization
│   └── Get My Organizations
├── 3. Tournaments (Manager)/
│   ├── Create Tournament
│   ├── Add Category
│   └── Get Hosted Tournaments
├── 4. Registration (Player)/
│   ├── Register Individual
│   ├── Register Team
│   ├── Get My Registrations
│   └── Get Tournament History
├── 5. Teams/
│   ├── Create Team
│   ├── Invite Member
│   ├── Accept Invite
│   ├── Reject Invite
│   ├── Get My Teams
│   └── Get Team Invites
├── 6. Matches & Stats/
│   ├── Get My Matches
│   └── Get My Stats
├── 7. Notifications/
│   ├── Get Notifications
│   └── Mark as Read
└── 8. Player Profiles/
    ├── Create Profile
    ├── Update Profile
    └── Get Profiles
```

---

## 🔍 ENVIRONMENT VARIABLES (Postman)

```
baseUrl: http://localhost:3000
userId: 1
orgId: 10
tournamentId: 100
categoryId: 301
teamId: 55
```

Use `{{baseUrl}}/users/{{userId}}/profile` in your requests.
