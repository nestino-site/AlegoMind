-- Add customizable message templates to Professional
ALTER TABLE "professionals" ADD COLUMN "welcomeMessage" TEXT;
ALTER TABLE "professionals" ADD COLUMN "topicResponseTemplate" TEXT;
