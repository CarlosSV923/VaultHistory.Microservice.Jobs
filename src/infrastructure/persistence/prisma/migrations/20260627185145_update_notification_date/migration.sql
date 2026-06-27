/*
  Warnings:

  - You are about to drop the column `notficationDate` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "notficationDate",
ADD COLUMN     "notificationDate" TIMESTAMP(3);
