/*
  Warnings:

  - You are about to drop the column `category` on the `events` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "events_category_idx";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "category",
ADD COLUMN     "category_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_name_key" ON "event_categories"("name");

-- CreateIndex
CREATE INDEX "events_category_id_idx" ON "events"("category_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
