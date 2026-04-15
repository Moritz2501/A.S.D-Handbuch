-- CreateEnum
CREATE TYPE "TrainingCategory" AS ENUM ('AUSBILDUNG', 'FORTBILDUNG');

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "category" "TrainingCategory" NOT NULL DEFAULT 'AUSBILDUNG';
