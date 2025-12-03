/*
  Warnings:

  - A unique constraint covering the columns `[game_id]` on the table `matches` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "matches_game_id_key" ON "matches"("game_id");
