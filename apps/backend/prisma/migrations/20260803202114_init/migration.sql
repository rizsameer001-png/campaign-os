-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notification_preferences" JSONB;

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);
