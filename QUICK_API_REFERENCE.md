# 🚀 QUICK API REFERENCE - Copy & Paste for Postman

## 1️⃣ REGISTER USER
```http
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "name": "Rahul Patel",
  "email": "rahul@example.com",
  "phone": "9999988888"
}
```

## 2️⃣ LOGIN
```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "rahul@example.com"
}
```

## 3️⃣ GET PROFILE
```http
GET http://localhost:3000/users/1/profile
```

## 4️⃣ UPDATE PROFILE
```http
PUT http://localhost:3000/users/1/profile
Content-Type: application/json

{
  "name": "Rahul P",
  "phone": "8888877777"
}
```

## 5️⃣ CREATE ORGANIZATION
```http
POST http://localhost:3000/users/1/organizations
Content-Type: application/json

{
  "name": "PaddleHouse",
  "slug": "paddlehouse"
}
```
**Note:** Omit `defaultGameId` unless you have games in the database

## 6️⃣ JOIN ORGANIZATION
```http
POST http://localhost:3000/users/1/organizations/join
Content-Type: application/json

{
  "organizationId": 10,
  "role": "manager"
}
```

## 7️⃣ CREATE TOURNAMENT
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

## 8️⃣ ADD INDIVIDUAL CATEGORY
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

## 9️⃣ ADD TEAM CATEGORY
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

## 🔟 REGISTER FOR INDIVIDUAL CATEGORY
```http
POST http://localhost:3000/users/1/registrations
Content-Type: application/json

{
  "tournamentId": 100,
  "categoryId": 301
}
```

## 1️⃣1️⃣ CREATE TEAM
```http
POST http://localhost:3000/users/1/teams
Content-Type: application/json

{
  "tournamentId": 100,
  "categoryId": 302,
  "name": "Smash Bros"
}
```

## 1️⃣2️⃣ INVITE TEAM MEMBER
```http
POST http://localhost:3000/users/1/teams/invite
Content-Type: application/json

{
  "teamId": 55,
  "userId": 2
}
```

## 1️⃣3️⃣ ACCEPT TEAM INVITE
```http
POST http://localhost:3000/users/2/teams/respond
Content-Type: application/json

{
  "teamId": 55,
  "action": "accept"
}
```

## 1️⃣4️⃣ REGISTER TEAM FOR TOURNAMENT
```http
POST http://localhost:3000/users/1/registrations
Content-Type: application/json

{
  "tournamentId": 100,
  "categoryId": 302,
  "teamId": 55
}
```

## 1️⃣5️⃣ GET MY TEAMS
```http
GET http://localhost:3000/users/1/teams
```

## 1️⃣6️⃣ GET TEAM INVITES
```http
GET http://localhost:3000/users/2/teams/invites
```

## 1️⃣7️⃣ GET MY REGISTRATIONS
```http
GET http://localhost:3000/users/1/registrations
```

## 1️⃣8️⃣ GET MY MATCHES
```http
GET http://localhost:3000/users/1/matches?limit=50
```

## 1️⃣9️⃣ GET MY STATS
```http
GET http://localhost:3000/users/1/stats
```

## 2️⃣0️⃣ GET TOURNAMENT HISTORY
```http
GET http://localhost:3000/users/1/tournaments/history
```

## 2️⃣1️⃣ GET NOTIFICATIONS
```http
GET http://localhost:3000/users/1/notifications
```

## 2️⃣2️⃣ MARK NOTIFICATION AS READ
```http
PUT http://localhost:3000/users/1/notifications/1/read
```

## 2️⃣3️⃣ CREATE PLAYER PROFILE
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

## 2️⃣4️⃣ UPDATE PLAYER PROFILE
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

## 2️⃣5️⃣ GET PLAYER PROFILES
```http
GET http://localhost:3000/users/1/player-profiles
```

## 2️⃣6️⃣ GET ORGANIZATIONS
```http
GET http://localhost:3000/users/1/organizations
```

## 2️⃣7️⃣ GET HOSTED TOURNAMENTS
```http
GET http://localhost:3000/users/1/tournaments/hosted
```

---

## 📝 TESTING SEQUENCE

**Complete Flow Test:**

1. Register user (userId: 1)
2. Login user
3. Create organization (orgId: 10)
4. Create tournament (tournamentId: 100)
5. Add individual category (categoryId: 301)
6. Add team category (categoryId: 302)
7. Register for individual category
8. Create team (teamId: 55)
9. Register another user (userId: 2)
10. Invite user 2 to team
11. User 2 accepts invite
12. Register team for tournament
13. Check teams, registrations, notifications
14. View matches and stats

---

## 🎯 KEY IDs TO TRACK

```
userId: 1 (Rahul - Manager)
userId: 2 (Amit - Player)
orgId: 10 (PaddleHouse)
gameId: 1 (Pickleball)
tournamentId: 100 (PaddleHouse Open 2025)
categoryId: 301 (Men's Singles - INDIVIDUAL)
categoryId: 302 (Men's Doubles - TEAM)
teamId: 55 (Smash Bros)
```

Replace these IDs with actual values returned from your API responses.
