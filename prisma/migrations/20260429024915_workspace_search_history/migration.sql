-- CreateTable
CREATE TABLE "workspace_searches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized_query" TEXT NOT NULL,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "search_count" INTEGER NOT NULL DEFAULT 1,
    "last_searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_searches_organization_id_user_id_last_searched_at_idx" ON "workspace_searches"("organization_id", "user_id", "last_searched_at");

-- CreateIndex
CREATE INDEX "workspace_searches_organization_id_user_id_is_saved_idx" ON "workspace_searches"("organization_id", "user_id", "is_saved");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_searches_organization_id_user_id_normalized_query_key" ON "workspace_searches"("organization_id", "user_id", "normalized_query");

-- AddForeignKey
ALTER TABLE "workspace_searches" ADD CONSTRAINT "workspace_searches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_searches" ADD CONSTRAINT "workspace_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
