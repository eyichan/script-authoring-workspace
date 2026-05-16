-- Add metadata tables for reference-aligned workbench detail editing.
ALTER TABLE "Beat" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Prop" ADD COLUMN "themeColor" TEXT NOT NULL DEFAULT 'racing-green';

CREATE TABLE "CharacterProfile" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'racing-green',
    "gender" TEXT NOT NULL DEFAULT 'Not Set',
    "age" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "appearanceNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SceneProductionNote" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "artRequirements" TEXT NOT NULL DEFAULT '',
    "stillStatus" TEXT NOT NULL DEFAULT 'Pending',
    "videoStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneProductionNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocationProfile" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "scoutingStatus" TEXT NOT NULL DEFAULT 'Pending',
    "ownerName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "dailyRental" TEXT NOT NULL DEFAULT '',
    "deposit" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "availableFrom" TEXT NOT NULL DEFAULT '',
    "availableUntil" TEXT NOT NULL DEFAULT '',
    "shootingHours" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScriptOutline" (
    "scriptId" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptOutline_pkey" PRIMARY KEY ("scriptId")
);

CREATE INDEX "CharacterProfile_scriptId_idx" ON "CharacterProfile"("scriptId");
CREATE UNIQUE INDEX "CharacterProfile_scriptId_characterId_key" ON "CharacterProfile"("scriptId", "characterId");

CREATE INDEX "SceneProductionNote_scriptId_idx" ON "SceneProductionNote"("scriptId");
CREATE UNIQUE INDEX "SceneProductionNote_scriptId_sceneId_key" ON "SceneProductionNote"("scriptId", "sceneId");

CREATE INDEX "LocationProfile_scriptId_idx" ON "LocationProfile"("scriptId");
CREATE UNIQUE INDEX "LocationProfile_scriptId_locationId_key" ON "LocationProfile"("scriptId", "locationId");

ALTER TABLE "CharacterProfile" ADD CONSTRAINT "CharacterProfile_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SceneProductionNote" ADD CONSTRAINT "SceneProductionNote_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocationProfile" ADD CONSTRAINT "LocationProfile_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScriptOutline" ADD CONSTRAINT "ScriptOutline_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;
