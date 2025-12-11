# 📦 Complete Data Model (Final)

---

## 1. users
- id
- name
- email
- phone
- avatar_url
- created_at
- updated_at

---

## 2. organizations
- id
- name
- slug
- default_game_id
- branding (json)
- created_at
- updated_at

---

## 3. org_memberships
- id
- org_id
- user_id
- role                 # super_manager | manager | follower
- created_at

---

## 4. games
- id
- key                  # pickleball | badminton | tennis
- name
- default_settings (json)
- created_at

---

## 5. org_games
- id
- org_id
- game_id
- settings (json)
- created_at

---

## 6. tournaments
- id
- org_id
- game_id
- name
- slug
- description
- reg_deadline
- start_date
- end_date
- courts_count
- match_duration_minutes
- buffer_minutes
- scoring_mode
- scorer_id
- settings (json)
- created_by
- created_at
- updated_at

---

## 7. tournament_categories
- id
- tournament_id
- name
- key
- entry_type                 # individual | team
- entry_limit
- NN
- reg_deadline
- start_date
- end_date
- courts_count
- match_duration_minutes
- buffer_minutes
- scoring_mode
- scorer_ids (json array)
- NN
- settings (json)
- created_at
- updated_at

---

## 8. teams
- id
- tournament_id - NN
- category_id
- name
- captain_user_id
- created_at

---

## 9. team_members
- id
- team_id
- user_id
- status                    # invited | accepted
- joined_at

---

## 10. registrations
- id
- tournament_id - NN
- category_id
- user_id - NN
- team_id                   # if team entry
- paid (bool)
- payment_info (json)
- status                    # registered | cancelled
- created_at

---

## 11. player_profiles
- id
- user_id
- game_id
- rating
- meta (json)
- created_at

---

## 12. matches
- id
- tournament_id - NN
- category_id
- game_id
- round
- bracket_pos
- team_a_id
- team_b_id
- scheduled_start
- scheduled_end
- court_no
- status                    # scheduled | live | finished
- score_a
- score_b
- best_of
- scoring_mode
- meta (json)
- created_at

---

## 13. match_events
- id
- match_id
- event_type               # point | start | end | timeout | penalty | undo
- payload (json)
- created_by
- created_at

---

## 14. player_stats
- id
- player_profile_id
- tournament_id
- category_id
- stats (json)
- created_at

---

## 15. notifications
- id
- user_id
- type
- payload (json)
- delivered (bool)
- created_at