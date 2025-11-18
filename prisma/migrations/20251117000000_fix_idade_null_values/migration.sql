/*
  Fix null values in idade column
  - First, update all null values to 0
  - Then alter the column to be NOT NULL with default 0
*/

-- Update existing null values to 0
UPDATE "public"."pets" 
SET "idade" = 0 
WHERE "idade" IS NULL;

-- Ensure the column has NOT NULL constraint with default value
ALTER TABLE "public"."pets" 
ALTER COLUMN "idade" SET DEFAULT 0,
ALTER COLUMN "idade" SET NOT NULL;
