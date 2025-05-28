/*
  Warnings:

  - You are about to drop the column `category_channel_id` on the `Guild` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChannelTopic" AS ENUM ('Category', 'Discussion', 'News', 'None');

-- DropIndex
DROP INDEX "Guild_category_channel_id_key";

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN "topic" "ChannelTopic" NOT NULL DEFAULT 'None';

-- AlterTable
ALTER TABLE "Guild" DROP COLUMN "category_channel_id";
