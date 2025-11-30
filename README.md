# 🏗 App Structure (Short & Simple)

---

## 1️⃣ Organization (Club/Academy)
- One organization can support **multiple games** (pickleball, badminton, tennis).
- Organization Admin manages everything.

---

## 2️⃣ Game (Sport)
- Each game has its own rules, scoring, match duration.
- A tournament is always for **one specific game**.

---

## 3️⃣ Tournament
- Created under an organization for a chosen game.
- Handles **registration, scheduling, courts, matches, scoring**.

---

## 4️⃣ Roles inside a Tournament
- **Tournament Admin** – runs the event  
- **Scorers** – update live scores  
- **Players** – register & play (profile per game)  
- **Viewers** – watch scores  

---

## 📊 Hierarchy
Organization
   └── Games
         └── Tournaments
               ├── Tournament Admin
               ├── Scorers
               ├── Players
               └── Viewers


# Database Model

## 1. users
- id
- name
- email
- phone
- avatar_url
- created_at
- updated_at

## 2. organizations
- id
- name
- slug (unique for URL)
- default_game_id
- branding (json - colors, logo, etc.)
- created_at
- updated_at

## 3. org_memberships
- id
- org_id
- user_id
- role (org_admin - can manage all | manager - can manage tournaments)
- created_at
- updated_at

## 4. games
- id
- key (pickleball | badminton | tennis)
- name
- default_settings (json)
- created_at
- updated_at

## 5. org_games
- id
- org_id
- game_id
- settings (json)
- created_at
- updated_at

## 6. tournaments
- id
- org_id
- game_id
- name
- entry_type (individual | team)
- entry_limit
- reg_deadline
- start_date
- end_date
- courts_count
- match_duration_minutes
- buffer_minutes
- scorer_ids (json array)
- scoring_mode
- created_by
- created_at
- updated_at

## 7. teams
- id
- tournament_id
- name
- captain_user_id
- created_at

## 8. team_members
- id
- team_id
- user_id
- status (invited | accepted)
- joined_at

## 9. registrations
- id
- tournament_id
- user_id
- team_id
- paid (bool)
- payment_info (json)
- status (registered | cancelled)
- created_at

## 10. player_profiles
- id
- user_id
- game_id
- rating
- meta (json)
- created_at

## 11. matches
- id
- tournament_id
- game_id
- round
- bracket_pos
- team_a_id
- team_b_id
- player_a_id
- player_b_id
- scheduled_start
- scheduled_end
- court_no
- status (scheduled | live | finished)
- best_of
- scoring_mode
- created_at

## 12. match_events
- id
- match_id
- event_type (point | start | end | timeout | penalty | undo)
- payload (json)
- created_by
- created_at

## 13. player_stats
- id
- player_profile_id
- tournament_id
- stats (json)
- created_at

## 14. notifications
- id
- user_id
- type
- payload (json)
- delivered (bool)
- created_at


# API Endpoints (Basic Essential Set)

---

## 1. Authentication
POST /auth/signup
POST /auth/login
POST /auth/logout
POST /auth/refresh

---

## 2. Users
GET /users/me
GET /users/:id
PATCH /users/:id

---

## 3. Organizations
POST /organizations
GET /organizations/:orgId
GET /organizations/:orgId/tournaments
POST /organizations/:orgId/members        # add admin/manager
GET /organizations/:orgId/members

---

## 4. Games (Sports)
GET /games
POST /games                                # (super admin)
GET /games/:gameId

---

## 5. Organization Games (which games an org supports)
POST /organizations/:orgId/games
GET /organizations/:orgId/games

---

## 6. Tournaments
POST /organizations/:orgId/tournaments
GET /tournaments/:id
PATCH /tournaments/:id
POST /tournaments/:id/publish
GET /tournaments/:id/teams
GET /tournaments/:id/players

---

## 7. Teams (for team tournaments)
POST /tournaments/:id/teams
GET /teams/:teamId
POST /teams/:teamId/invite
POST /teams/:teamId/accept

---

## 8. Registrations
POST /tournaments/:id/register
GET /tournaments/:id/registrations
POST /payments/webhook                     # mark paid=true

---

## 9. Player Profiles (per game)
GET /users/:id/profiles
POST /users/:id/profiles                   # {game_id, meta}

---

## 10. Matches & Scheduling
POST /tournaments/:id/schedule             # auto-generate matches
GET /tournaments/:id/matches
GET /matches/:matchId
PATCH /matches/:matchId                    # reschedule / override

---

## 11. Scorers
POST /matches/:matchId/assign-scorer
GET /matches/:matchId/scorers

---

## 12. Live Scoring (WebSocket)
WS /ws/matches/:matchId

Events Sent by Client:
- score_event
- timeout
- undo
- start_match
- end_match

Events Sent by Server:
- score_update
- match_state
- error

---

## 13. Match Events (audit history)
GET /matches/:matchId/events

---

## 14. Player Stats
GET /player-profiles/:id/stats

---

## 15. Notifications
GET /notifications
