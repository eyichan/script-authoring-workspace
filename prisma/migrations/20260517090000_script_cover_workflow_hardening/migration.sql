CREATE TABLE "ScriptCover" (
  "scriptId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "writtenBy" TEXT NOT NULL DEFAULT '',
  "draftDate" TEXT NOT NULL DEFAULT '',
  "contact" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScriptCover_pkey" PRIMARY KEY ("scriptId")
);

ALTER TABLE "ScriptCover"
  ADD CONSTRAINT "ScriptCover_scriptId_fkey"
  FOREIGN KEY ("scriptId") REFERENCES "Script"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
