/*
  Warnings:

  - The values [OFFICER] on the enum `ClanRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClanRole_new" AS ENUM ('LEADER', 'DEPUTY', 'COMMANDER', 'SERGEANT', 'MEMBER');
ALTER TABLE "public"."ClanMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "ClanMember" ALTER COLUMN "role" TYPE "ClanRole_new" USING ("role"::text::"ClanRole_new");
ALTER TYPE "ClanRole" RENAME TO "ClanRole_old";
ALTER TYPE "ClanRole_new" RENAME TO "ClanRole";
DROP TYPE "public"."ClanRole_old";
ALTER TABLE "ClanMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;
