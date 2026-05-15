-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'trashed');

-- CreateEnum
CREATE TYPE "ScriptBlockType" AS ENUM ('scene', 'action', 'character', 'paren', 'dialogue', 'transition', 'comment', 'subtitle');

-- CreateEnum
CREATE TYPE "AssetTaskKind" AS ENUM ('movie_poster', 'casting_poster', 'concept_trailer', 'scene_dramatization', 'director_roundtable', 'script_table_read');

-- CreateEnum
CREATE TYPE "AssetTaskStatus" AS ENUM ('queued', 'running', 'done', 'failed');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trashedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptBlock" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "type" "ScriptBlockType" NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beat" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prop" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTask" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "kind" "AssetTaskKind" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AssetTaskStatus" NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Script_projectId_idx" ON "Script"("projectId");

-- CreateIndex
CREATE INDEX "ScriptBlock_scriptId_idx" ON "ScriptBlock"("scriptId");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptBlock_scriptId_position_key" ON "ScriptBlock"("scriptId", "position");

-- CreateIndex
CREATE INDEX "Beat_scriptId_idx" ON "Beat"("scriptId");

-- CreateIndex
CREATE INDEX "Prop_scriptId_idx" ON "Prop"("scriptId");

-- CreateIndex
CREATE INDEX "AssetTask_scriptId_idx" ON "AssetTask"("scriptId");

-- CreateIndex
CREATE INDEX "AssetTask_status_idx" ON "AssetTask"("status");

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptBlock" ADD CONSTRAINT "ScriptBlock_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prop" ADD CONSTRAINT "Prop_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTask" ADD CONSTRAINT "AssetTask_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;
