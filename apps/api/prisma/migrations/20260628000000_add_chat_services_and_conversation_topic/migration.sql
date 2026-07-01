-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('PENDING_TOPIC', 'ACTIVE');

-- CreateEnum
CREATE TYPE "ConversationTopicType" AS ENUM ('FREE', 'PAID');

-- AlterTable: add topic fields to conversations
ALTER TABLE "conversations"
  ADD COLUMN "status" "ConversationStatus" NOT NULL DEFAULT 'PENDING_TOPIC',
  ADD COLUMN "topicLabel" TEXT,
  ADD COLUMN "topicType" "ConversationTopicType",
  ADD COLUMN "topicCost" DOUBLE PRECISION,
  ADD COLUMN "topicPaymentIntentId" TEXT;

-- CreateTable: chat_services
CREATE TABLE "chat_services" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_services_professionalId_idx" ON "chat_services"("professionalId");

-- AddForeignKey
ALTER TABLE "chat_services"
  ADD CONSTRAINT "chat_services_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
