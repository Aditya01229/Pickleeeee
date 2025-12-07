# 🧪 TESTING FLOW - Step by Step

## ✅ COMPLETE TESTING SEQUENCE

Follow these steps IN ORDER. Save the IDs from each response!

---

## 🔸 STEP 1: Register First User

**Request:**
```http
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "phone": "9999988888"
}
```

**Expected Response:**
```json
{
  "id": 1,  ← SAVE THIS as userId1
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "phone": "9999988888",
  "avatarUrl": null,
  "createdAt": "2025-12-07T...",
  "updatedAt": "2025-12-07T...",
  "orgMemberships": []
}
```

**✅ Save:** `userId1 = 1`

---

## 🔸 STEP 2: Login First User

**Request:**
```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "rahul@example.com"
}
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "name": "Rahul Patel",
    ...
  },
  "message": "Login successful"
}
```

---

## 🔸 STEP 3: Create Organization

**Request:**
```http
POST http://localhost:3000/users/1/organizations
Content-Type: application/json

{
  "name": "PaddleHouse",
  "slug": "paddlehouse"
}
```

**Expected Response:**
```json
{
  "id": 10,  ← SAVE THIS as orgId
  "name": "PaddleHouse",
  "slug": "paddlehouse",
  "defaultGameId": null,
  "branding": null,
  "createdAt": "2025-12-07T...",
  "updatedAt": "2025-12-07T...",
  "memberships": [
    {
      "id": 1,
      "orgId": 10,
      "userId": 1,
      "role": "manager",
      "createdAt": "2025-12-07T...",
      "user": {
        "id": 1,
        "name": "Rahul Patel",
        "email": "rahul@example.com"
      }
    }
  ],
  "defaultGame": null
}
```

**✅ Save:** `orgId = 10`

**⚠️ Important:** 
- If you get "Organization with slug 'paddlehouse' already exists", use a different slug like "paddlehouse-2"
- The orgId is returned in the `id` field at the top level

---

## 🔸 STEP 4: Get User Profile (Verify Organization Membership)

**Request:**
```http
GET http://localhost:3000/users/1/profile
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "orgMemberships": [
    {
      "id": 1,
      "role": "manager",
      "organization": {
        "id": 10,  ← Your orgId is here!
        "name": "PaddleHouse",
        "slug": "paddlehouse"
      }
    }
  ],
  ...
}
```

---

## 🔸 STEP 5: Register Second User

**Request:**
```http
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "name": "Amit Shah",
  "email": "amit@example.com",
  "phone": "8888877777"
}
```

**Expected Response:**
```json
{
  "id": 2,  ← SAVE THIS as userId2
  "name": "Amit Shah",
  "email": "amit@example.com",
  ...
}
```

**✅ Save:** `userId2 = 2`

---

## 🔸 STEP 6: Second User Joins Organization

**Request:**
```http
POST http://localhost:3000/users/2/organizations/join
Content-Type: application/json

{
  "organizationId": 10,
  "role": "player"
}
```

**Expected Response:**
```json
{
  "id": 2,
  "userId": 2,
  "orgId": 10,
  "role": "player",
  "createdAt": "2025-12-07T...",
  "organization": {
    "id": 10,
    "name": "PaddleHouse",
    "slug": "paddlehouse"
  },
  "user": {
    "id": 2,
    "name": "Amit Shah",
    "email": "amit@example.com"
  }
}
```

---

## 🔸 STEP 7: Get Organizations for User 1

**Request:**
```http
GET http://localhost:3000/users/1/organizations
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "orgId": 10,
    "role": "manager",
    "createdAt": "2025-12-07T...",
    "organization": {
      "id": 10,
      "name": "PaddleHouse",
      "slug": "paddlehouse",
      ...
    }
  }
]
```

---

## ✅ CHECKPOINT: What You Should Have Now

| Variable | Value | Description |
|----------|-------|-------------|
| `userId1` | 1 | First user (Rahul - Manager) |
| `userId2` | 2 | Second user (Amit - Player) |
| `orgId` | 10 | PaddleHouse organization |

---

## 🎯 NEXT STEPS: Tournament Flow (Requires Games)

### Prerequisites Check: Do You Have Games?

**Request:**
```http
GET http://localhost:3000/users/games
```

**If Response is Empty Array `[]`:**
You need to seed games first! See `SETUP_GUIDE.md` section 2 for instructions.

**If Response Has Games:**
```json
[
  {
    "id": 1,
    "key": "pickleball",
    "name": "Pickleball"
  }
]
```
Great! You can proceed with tournament creation. Use `"gameId": 1` in your tournament requests.

### Step 8: Create Tournament (Manager Only)

**Request:**
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

**Expected Response:**
```json
{
  "id": 100,  ← SAVE THIS as tournamentId
  "orgId": 10,
  "gameId": 1,
  "name": "PaddleHouse Open 2025",
  ...
}
```

**✅ Save:** `tournamentId = 100`

---

## 📊 TRACKING YOUR IDs

Create a note file to track your IDs:

```
USER IDs:
- userId1 (Rahul - Manager): 1
- userId2 (Amit - Player): 2

ORGANIZATION IDs:
- orgId (PaddleHouse): 10

TOURNAMENT IDs:
- tournamentId (PaddleHouse Open 2025): 100

CATEGORY IDs:
- categoryId (Men's Singles): 301
- categoryId (Men's Doubles): 302

TEAM IDs:
- teamId (Smash Bros): 55
```

---

## 🔄 IF YOU NEED TO START OVER

### Clear Organization Data:
```sql
-- Connect to your database
DELETE FROM registrations;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM tournament_categories;
DELETE FROM tournaments;
DELETE FROM org_memberships;
DELETE FROM organizations;
DELETE FROM player_profiles;
DELETE FROM notifications;
DELETE FROM users;
```

### Or Reset Database:
```bash
npx prisma migrate reset
```

---

## 🐛 TROUBLESHOOTING

### "Organization with slug 'paddlehouse' already exists"
**Solution:** The organization was created successfully the first time! Get its ID:
```http
GET http://localhost:3000/users/1/organizations
```
Look for the `organization.id` in the response.

### "orgId is not returned"
**Problem:** You're not looking at the right field.
**Solution:** The orgId is in the `id` field of the create organization response, NOT in `orgId` or `organizationId`.

### "Cannot create tournament"
**Problem:** Either:
1. You're not a manager of the organization
2. The game doesn't exist in the database

**Solution:** 
1. Make sure you created or joined the org as "manager"
2. Seed games first (see SETUP_GUIDE.md)

### "Foreign key constraint violated"
**Problem:** You're referencing an ID that doesn't exist (game, organization, user, etc.)
**Solution:** Make sure all referenced IDs exist in the database. Check your saved IDs.

---

## ✅ SUCCESS CRITERIA

After completing steps 1-7, you should be able to:

- ✅ Create users
- ✅ Login users
- ✅ Create organizations
- ✅ Users become managers automatically when creating orgs
- ✅ Other users can join organizations
- ✅ View organization memberships
- ✅ See correct roles (manager/player)

**You're ready for tournament testing once you seed games!**
