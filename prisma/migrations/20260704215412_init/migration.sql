-- CreateEnum
CREATE TYPE "EquipmentWidth" AS ENUM ('eight_frame', 'ten_frame');

-- CreateEnum
CREATE TYPE "BoxType" AS ENUM ('hive_stand', 'landing_board', 'entrance_reducer', 'deep', 'medium_super', 'shallow_super', 'queen_excluder', 'inner_cover', 'outer_cover');

-- CreateEnum
CREATE TYPE "FoundationType" AS ENUM ('wax', 'plastic', 'foundationless');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('audio', 'video');

-- CreateEnum
CREATE TYPE "FrameSide" AS ENUM ('side_a', 'side_b');

-- CreateEnum
CREATE TYPE "Quadrant" AS ENUM ('top_left', 'top_right', 'bottom_left', 'bottom_right');

-- CreateEnum
CREATE TYPE "QueenCellType" AS ENUM ('swarm', 'supersedure', 'emergency', 'play_cup');

-- CreateEnum
CREATE TYPE "QueenCellLocation" AS ENUM ('bottom_edge', 'side_edge', 'mid_face', 'unknown');

-- CreateEnum
CREATE TYPE "TargetPest" AS ENUM ('varroa', 'small_hive_beetle', 'nosema', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "years_beekeeping" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apiaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hives" (
    "id" TEXT NOT NULL,
    "apiary_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipment_width" "EquipmentWidth" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hive_boxes" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "box_type" "BoxType" NOT NULL,
    "position_order" INTEGER NOT NULL,
    "frame_capacity" INTEGER NOT NULL,
    "frames_installed_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hive_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frames" (
    "id" TEXT NOT NULL,
    "hive_box_id" TEXT NOT NULL,
    "frame_number" INTEGER NOT NULL,
    "foundation_type" "FoundationType" NOT NULL,
    "date_installed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entered_by_user_id" TEXT NOT NULL,
    "general_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_media" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "frame_id" TEXT,
    "media_type" "MediaType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "raw_transcript" TEXT,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frame_observations" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "frame_id" TEXT NOT NULL,
    "side" "FrameSide" NOT NULL,
    "has_brood" BOOLEAN NOT NULL DEFAULT false,
    "has_capped_brood" BOOLEAN NOT NULL DEFAULT false,
    "has_eggs" BOOLEAN NOT NULL DEFAULT false,
    "has_larvae" BOOLEAN NOT NULL DEFAULT false,
    "queen_present" BOOLEAN NOT NULL DEFAULT false,
    "has_capped_honey" BOOLEAN NOT NULL DEFAULT false,
    "has_nectar" BOOLEAN NOT NULL DEFAULT false,
    "capped_honey_pct" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frame_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frame_quadrant_observations" (
    "id" TEXT NOT NULL,
    "frame_observation_id" TEXT NOT NULL,
    "quadrant" "Quadrant" NOT NULL,
    "has_brood" BOOLEAN NOT NULL DEFAULT false,
    "has_capped_brood" BOOLEAN NOT NULL DEFAULT false,
    "has_eggs" BOOLEAN NOT NULL DEFAULT false,
    "has_larvae" BOOLEAN NOT NULL DEFAULT false,
    "has_capped_honey" BOOLEAN NOT NULL DEFAULT false,
    "has_nectar" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "frame_quadrant_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queen_cells" (
    "id" TEXT NOT NULL,
    "frame_observation_id" TEXT NOT NULL,
    "cell_type" "QueenCellType" NOT NULL,
    "location_on_frame" "QueenCellLocation" NOT NULL,
    "capped" BOOLEAN NOT NULL DEFAULT false,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "queen_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "target_pest" "TargetPest" NOT NULL,
    "strip_count" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "mite_count_before" INTEGER,
    "mite_count_after" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_reminders" (
    "id" TEXT NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "google_calendar_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_snapshots" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT,
    "inspection_id" TEXT,
    "wind" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "temp" DOUBLE PRECISION,
    "pollen" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "apiaries_user_id_idx" ON "apiaries"("user_id");

-- CreateIndex
CREATE INDEX "hives_apiary_id_idx" ON "hives"("apiary_id");

-- CreateIndex
CREATE INDEX "hive_boxes_hive_id_idx" ON "hive_boxes"("hive_id");

-- CreateIndex
CREATE INDEX "frames_hive_box_id_idx" ON "frames"("hive_box_id");

-- CreateIndex
CREATE INDEX "inspections_hive_id_idx" ON "inspections"("hive_id");

-- CreateIndex
CREATE INDEX "inspection_media_inspection_id_idx" ON "inspection_media"("inspection_id");

-- CreateIndex
CREATE INDEX "inspection_media_frame_id_idx" ON "inspection_media"("frame_id");

-- CreateIndex
CREATE INDEX "frame_observations_inspection_id_idx" ON "frame_observations"("inspection_id");

-- CreateIndex
CREATE INDEX "frame_observations_frame_id_idx" ON "frame_observations"("frame_id");

-- CreateIndex
CREATE INDEX "frame_quadrant_observations_frame_observation_id_idx" ON "frame_quadrant_observations"("frame_observation_id");

-- CreateIndex
CREATE INDEX "queen_cells_frame_observation_id_idx" ON "queen_cells"("frame_observation_id");

-- CreateIndex
CREATE INDEX "treatments_hive_id_idx" ON "treatments"("hive_id");

-- CreateIndex
CREATE INDEX "treatment_reminders_treatment_id_idx" ON "treatment_reminders"("treatment_id");

-- CreateIndex
CREATE INDEX "weather_snapshots_hive_id_idx" ON "weather_snapshots"("hive_id");

-- CreateIndex
CREATE INDEX "weather_snapshots_inspection_id_idx" ON "weather_snapshots"("inspection_id");

-- AddForeignKey
ALTER TABLE "apiaries" ADD CONSTRAINT "apiaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hives" ADD CONSTRAINT "hives_apiary_id_fkey" FOREIGN KEY ("apiary_id") REFERENCES "apiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hive_boxes" ADD CONSTRAINT "hive_boxes_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frames" ADD CONSTRAINT "frames_hive_box_id_fkey" FOREIGN KEY ("hive_box_id") REFERENCES "hive_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_media" ADD CONSTRAINT "inspection_media_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_media" ADD CONSTRAINT "inspection_media_frame_id_fkey" FOREIGN KEY ("frame_id") REFERENCES "frames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_observations" ADD CONSTRAINT "frame_observations_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_observations" ADD CONSTRAINT "frame_observations_frame_id_fkey" FOREIGN KEY ("frame_id") REFERENCES "frames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_quadrant_observations" ADD CONSTRAINT "frame_quadrant_observations_frame_observation_id_fkey" FOREIGN KEY ("frame_observation_id") REFERENCES "frame_observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queen_cells" ADD CONSTRAINT "queen_cells_frame_observation_id_fkey" FOREIGN KEY ("frame_observation_id") REFERENCES "frame_observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_reminders" ADD CONSTRAINT "treatment_reminders_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
