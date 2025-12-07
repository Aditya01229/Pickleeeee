# 🔧 SETUP GUIDE - Initial Data Setup

## Prerequisites

Before testing the user module endpoints, you need some initial data in your database.

---

## 1️⃣ SETUP DATABASE

Make sure your database is running and migrations are applied:

```bash
npx prisma migrate dev
```

---

## 2️⃣ SEED GAMES (Required for Full Testing)

Games are referenced by tournaments and player profiles. You need at least one game in the database.

### Option A: Manual Insert via Prisma Studio

```bash
npx prisma studio
```

Then add a game:
- **id**: 1
- **key**: `pickleball`
- **name**: `Pickleball`
- **defaultSettings**: `{}` (empty JSON)

### Option B: Create Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create games
  const pickleball = await prisma.game.upsert({
    where: { key: 'pickleball' },
    update: {},
    create: {
      key: 'pickleball',
      name: 'Pickleball',
      defaultSettings: {}
    }
  });

  const badminton = await prisma.game.upsert({
    where: { key: 'badminton' },
    update: {},
    create: {
      key: 'badminton',
      name: 'Badminton',
      defaultSettings: {}
    }
  });

  const tennis = await prisma.game.upsert({
    where: { key: 'tennis' },
    update: {},
    create: {
      key: 'tennis',
      name: 'Tennis',
      defaultSettings: {}
    }
  });

  console.log('✅ Seeded games:', { pickleball, badminton, tennis });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seed:
```bash
npm install -D ts-node
npx prisma db seed
```

---

## 3️⃣ BASIC TESTING FLOW (Without Games)

If you just want to test user and organization features without tournaments:

### Step 1: Create User
```http
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "phone": "9999988888"
}
```
**Save the returned `id` (e.g., 1)**

### Step 2: Login
```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "rahul@example.com"
}
```

### Step 3: Create Organization (Without Game)
```http
POST http://localhost:3000/users/1/organizations
Content-Type: application/json

{
  "name": "PaddleHouse",
  "slug": "paddlehouse"
}
```
**Save the returned `id` (e.g., 10)**

### Step 4: Get User Profile
```http
GET http://localhost:3000/users/1/profile
```

### Step 5: Get User Organizations
```http
GET http://localhost:3000/users/1/organizations
```

---

## 4️⃣ FULL TESTING FLOW (With Games)

Once you have games in the database:

### Step 1-3: Same as above

### Step 4: Create Tournament
```http
POST http://localhost:3000/users/1/tournaments
Content-Type: application/json

{
  "orgId": 10,
  "gameId": 1,
  "name": "PaddleHouse Open 2025",
  "slug": "paddlehouse-open-2025",
  "description": "Annual championship",
  "regDeadline": "2025-12-20T23:59:59.000Z",
  "startDate": "2025-12-25T09:00:00.000Z",
  "endDate": "2025-12-26T18:00:00.000Z",
  "courtsCount": 5,
  "matchDurationMinutes": 45,
  "bufferMinutes": 15
}
```
**Save the returned `id` (e.g., 100)**

### Step 5: Add Individual Category
```http
POST http://localhost:3000/users/1/tournaments/categories
Content-Type: application/json

{
  "tournamentId": 100,
  "name": "Men's Singles",
  "key": "men-singles",
  "entryType": "INDIVIDUAL",
  "entryLimit": 16
}
```
**Save the returned `id` (e.g., 301)**

### Step 6: Register for Tournament
```http
POST http://localhost:3000/users/1/registrations
Content-Type: application/json

{
  "tournamentId": 100,
  "categoryId": 301
}
```

### Step 7: Check Registrations
```http
GET http://localhost:3000/users/1/registrations
```

### Step 8: Check Notifications
```http
GET http://localhost:3000/users/1/notifications
```

---

## 5️⃣ TEAM TESTING FLOW

### Step 1: Add Team Category
```http
POST http://localhost:3000/users/1/tournaments/categories
Content-Type: application/json

{
  "tournamentId": 100,
  "name": "Men's Doubles",
  "key": "men-doubles",
  "entryType": "TEAM",
  "entryLimit": 16
}
```
**Save the returned `id` (e.g., 302)**

### Step 2: Create Another User
```http
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "name": "Amit Shah",
  "email": "amit@example.com",
  "phone": "8888877777"
}
```
**Save the returned `id` (e.g., 2)**

### Step 3: User 1 Creates Team
```http
POST http://localhost:3000/users/1/teams
Content-Type: application/json

{
  "tournamentId": 100,
  "categoryId": 302,
  "name": "Smash Bros"
}
```
**Save the returned `id` (e.g., 55)**

### Step 4: User 1 Invites User 2
```http
POST http://localhost:3000/users/1/teams/invite
Content-Type: application/json

{
  "teamId": 55,
  "userId": 2
}
```

### Step 5: User 2 Checks Invites
```http
GET http://localhost:3000/users/2/teams/invites
```

### Step 6: User 2 Accepts Invite
```http
POST http://localhost:3000/users/2/teams/respond
Content-Type: application/json

{
  "teamId": 55,
  "action": "accept"
}
```

### Step 7: User 1 Registers Team
```http
POST http://localhost:3000/users/1/registrations
Content-Type: application/json

{
  "tournamentId": 100,
  "categoryId": 302,
  "teamId": 55
}
```

### Step 8: Check Team Members
```http
GET http://localhost:3000/users/1/teams
```

---

## 6️⃣ PLAYER PROFILE TESTING

### Create Player Profile
```http
POST http://localhost:3000/users/1/player-profiles
Content-Type: application/json

{
  "gameId": 1,
  "rating": 1200,
  "meta": {
    "skillLevel": "intermediate",
    "yearsPlaying": 2
  }
}
```

### Update Player Profile
```http
PUT http://localhost:3000/users/1/player-profiles/1
Content-Type: application/json

{
  "rating": 1450,
  "meta": {
    "skillLevel": "advanced",
    "yearsPlaying": 3
  }
}
```

### Get Player Profiles
```http
GET http://localhost:3000/users/1/player-profiles
```

---

## 🚨 COMMON ERRORS & SOLUTIONS

### Error: "Unique constraint failed on the fields: (`slug`)"
**Problem:** You're trying to create an organization with a slug that already exists.
**Solution:** Either:
- Use a different slug (e.g., `"paddlehouse-2"`, `"paddlehouse-sports"`)
- OR if you want to use the existing organization, get its ID and join it instead

**Example:**
```http
# First time - Creates org successfully
POST /users/1/organizations
Body: {"name": "PaddleHouse", "slug": "paddlehouse"}
Response: {"id": 10, ...}  ← Save this ID!

# Second time with same slug - ERROR!
POST /users/1/organizations
Body: {"name": "PaddleHouse", "slug": "paddlehouse"}
Error: "Organization with slug 'paddlehouse' already exists"

# Solution 1: Use different slug
POST /users/1/organizations
Body: {"name": "PaddleHouse 2", "slug": "paddlehouse-2"}

# Solution 2: Join existing organization
POST /users/2/organizations/join
Body: {"organizationId": 10}
```

### Error: "Organization ID not returned"
**Problem:** You didn't save the `id` from the create organization response.
**Solution:** The API DOES return the organization ID. Check your response:
```json
{
  "id": 10,  ← THIS IS YOUR ORG ID!
  "name": "PaddleHouse",
  "slug": "paddlehouse",
  ...
}
```
Always save the `id` field from POST responses.

### Error: "Foreign key constraint violated on the constraint: `organizations_default_game_id_fkey`"
**Solution:** Don't include `defaultGameId` in your create organization request, or make sure the game exists in the database first.

### Error: "Tournament not found"
**Solution:** Make sure you're using the correct tournament ID from the create tournament response.

### Error: "Only managers can create tournaments"
**Solution:** Make sure you joined/created the organization with role "manager".

### Error: "Team ID required for team categories"
**Solution:** For TEAM entry types, you must first create a team, then use its ID in the registration.

### Error: "User not found"
**Solution:** Make sure you've created the user first using the register endpoint.

---

## ✅ VERIFICATION CHECKLIST

- [ ] Database is running
- [ ] Migrations are applied (`npx prisma migrate dev`)
- [ ] At least one game exists in database (for tournament testing)
- [ ] Server is running (`npm run start`)
- [ ] Server is accessible at `http://localhost:3000`
- [ ] First user is created
- [ ] First organization is created
- [ ] User is a member of the organization

---

## 🎯 MINIMAL TEST SEQUENCE

**Just want to verify everything works? Try this minimal sequence:**

1. **Create User**: `POST /users/register` → Get userId: 1
2. **Login**: `POST /users/login` 
3. **Get Profile**: `GET /users/1/profile`
4. **Create Org**: `POST /users/1/organizations` (without gameId) → Get orgId: 10
5. **Get Orgs**: `GET /users/1/organizations`

**That's it!** If these 5 requests work, your user module is functioning correctly.

For full features including tournaments and teams, seed the games first using the instructions above.
