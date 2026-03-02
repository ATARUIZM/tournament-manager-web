-- AlterTable
ALTER TABLE "bracket_nodes" ADD COLUMN     "seed_team_id" TEXT;

-- AddForeignKey
ALTER TABLE "bracket_nodes" ADD CONSTRAINT "bracket_nodes_seed_team_id_fkey" FOREIGN KEY ("seed_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
