-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('PENDING', 'AUCTIONING', 'FULFILLED', 'SETTLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Intent" (
    "id" TEXT NOT NULL,
    "maker" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "sourceChain" TEXT NOT NULL,
    "destinationChain" TEXT NOT NULL,
    "inputToken" TEXT NOT NULL,
    "outputToken" TEXT NOT NULL,
    "inputAmount" TEXT NOT NULL,
    "minOutputAmount" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "IntentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intent_pkey" PRIMARY KEY ("id")
);
