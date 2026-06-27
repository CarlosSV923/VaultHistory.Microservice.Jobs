-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT,
    "customDate" TIMESTAMP(3),
    "character" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_messages" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "updateAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("id")
);
