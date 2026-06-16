-- Make passwordHash optional to support OAuth providers (e.g. Google)
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
