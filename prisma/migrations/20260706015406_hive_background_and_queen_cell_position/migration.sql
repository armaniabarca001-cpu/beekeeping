-- AlterTable
ALTER TABLE "hives" ADD COLUMN     "background_theme" TEXT NOT NULL DEFAULT 'garden';

-- AlterTable
ALTER TABLE "queen_cells" ADD COLUMN     "position_x" DOUBLE PRECISION,
ADD COLUMN     "position_y" DOUBLE PRECISION;
