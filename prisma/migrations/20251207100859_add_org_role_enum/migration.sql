-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('super_manager', 'manager', 'follower');

-- Convert existing data before changing column type
-- Convert 'player' to 'follower'
UPDATE "org_memberships" SET "role" = 'follower' WHERE "role" = 'player';
-- Convert 'org_admin' to 'super_manager'
UPDATE "org_memberships" SET "role" = 'super_manager' WHERE "role" = 'org_admin';
-- Ensure all 'manager' values remain as 'manager' (explicit cast)
UPDATE "org_memberships" SET "role" = 'manager' WHERE "role" = 'manager';

-- AlterTable
ALTER TABLE "org_memberships" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "org_memberships" ALTER COLUMN "role" TYPE "OrgRole" USING "role"::text::"OrgRole";
