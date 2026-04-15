-- Add explicit order field for handbook pages so admins can reorder complete pages.
ALTER TABLE "HandbookPage"
ADD COLUMN "pageOrder" INTEGER NOT NULL DEFAULT 0;

-- Initialize existing rows with a stable order based on creation timestamp.
WITH ordered_pages AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) - 1 AS rn
  FROM "HandbookPage"
)
UPDATE "HandbookPage" hp
SET "pageOrder" = op.rn
FROM ordered_pages op
WHERE hp."id" = op."id";
