import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "artists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mbid" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"data" jsonb NOT NULL,
  	"release_groups" jsonb NOT NULL,
  	"fetched_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artist_names" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"artist_id" integer,
  	"checked_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "artists_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "artist_names_id" integer;
  ALTER TABLE "artist_names" ADD CONSTRAINT "artist_names_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "artists_mbid_idx" ON "artists" USING btree ("mbid");
  CREATE INDEX "artists_updated_at_idx" ON "artists" USING btree ("updated_at");
  CREATE INDEX "artists_created_at_idx" ON "artists" USING btree ("created_at");
  CREATE UNIQUE INDEX "artist_names_key_idx" ON "artist_names" USING btree ("key");
  CREATE INDEX "artist_names_artist_idx" ON "artist_names" USING btree ("artist_id");
  CREATE INDEX "artist_names_updated_at_idx" ON "artist_names" USING btree ("updated_at");
  CREATE INDEX "artist_names_created_at_idx" ON "artist_names" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artist_names_fk" FOREIGN KEY ("artist_names_id") REFERENCES "public"."artist_names"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_artists_id_idx" ON "payload_locked_documents_rels" USING btree ("artists_id");
  CREATE INDEX "payload_locked_documents_rels_artist_names_id_idx" ON "payload_locked_documents_rels" USING btree ("artist_names_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "artists" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "artist_names" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "artists" CASCADE;
  DROP TABLE "artist_names" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_artists_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_artist_names_fk";
  
  DROP INDEX "payload_locked_documents_rels_artists_id_idx";
  DROP INDEX "payload_locked_documents_rels_artist_names_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "artists_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "artist_names_id";`)
}
