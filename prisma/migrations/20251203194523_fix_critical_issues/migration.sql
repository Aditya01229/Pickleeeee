/*
  Warnings:

  - A unique constraint covering the columns `[tournament_id,category_id,user_id,team_id]` on the table `registrations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "matches_game_id_key";

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_tournament_id_category_id_idx" ON "matches"("tournament_id", "category_id");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_tournament_id_category_id_user_id_team_id_key" ON "registrations"("tournament_id", "category_id", "user_id", "team_id");

-- CreateIndex
CREATE INDEX "team_members_status_idx" ON "team_members"("status");
