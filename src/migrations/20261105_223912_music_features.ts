import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Searches now include aliases, so names that found nothing deserve another try.
  await db.execute(sql`DELETE FROM "artist_names" WHERE "artist_id" IS NULL;`)
  await db.execute(sql`
   CREATE TABLE "songs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"artist_name" varchar NOT NULL,
  	"artist_id" integer,
  	"album" varchar,
  	"artwork_url" varchar,
  	"apple_preview_url" varchar,
  	"apple_url" varchar,
  	"deezer_track_id" numeric,
  	"deezer_url" varchar,
  	"checked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "plays" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"station" varchar NOT NULL,
  	"artist_name" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"song_key" varchar NOT NULL,
  	"played_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "spotify_accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"access_token" varchar NOT NULL,
  	"refresh_token" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "artists" ADD COLUMN "wikipedia_title" varchar;
  ALTER TABLE "artists" ADD COLUMN "wikipedia_url" varchar;
  ALTER TABLE "artists" ADD COLUMN "wikipedia_summary" varchar;
  ALTER TABLE "artists" ADD COLUMN "wikipedia_image" varchar;
  ALTER TABLE "artists" ADD COLUMN "apple_albums" jsonb;
  ALTER TABLE "artists" ADD COLUMN "extras_checked_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "songs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "plays_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "spotify_accounts_id" integer;
  ALTER TABLE "songs" ADD CONSTRAINT "songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "songs_key_idx" ON "songs" USING btree ("key");
  CREATE INDEX "songs_artist_idx" ON "songs" USING btree ("artist_id");
  CREATE INDEX "songs_updated_at_idx" ON "songs" USING btree ("updated_at");
  CREATE INDEX "songs_created_at_idx" ON "songs" USING btree ("created_at");
  CREATE INDEX "plays_song_key_idx" ON "plays" USING btree ("song_key");
  CREATE INDEX "plays_played_at_idx" ON "plays" USING btree ("played_at");
  CREATE INDEX "plays_updated_at_idx" ON "plays" USING btree ("updated_at");
  CREATE INDEX "plays_created_at_idx" ON "plays" USING btree ("created_at");
  CREATE UNIQUE INDEX "station_playedAt_idx" ON "plays" USING btree ("station","played_at");
  CREATE INDEX "spotify_accounts_updated_at_idx" ON "spotify_accounts" USING btree ("updated_at");
  CREATE INDEX "spotify_accounts_created_at_idx" ON "spotify_accounts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_songs_fk" FOREIGN KEY ("songs_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_plays_fk" FOREIGN KEY ("plays_id") REFERENCES "public"."plays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_spotify_accounts_fk" FOREIGN KEY ("spotify_accounts_id") REFERENCES "public"."spotify_accounts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_songs_id_idx" ON "payload_locked_documents_rels" USING btree ("songs_id");
  CREATE INDEX "payload_locked_documents_rels_plays_id_idx" ON "payload_locked_documents_rels" USING btree ("plays_id");
  CREATE INDEX "payload_locked_documents_rels_spotify_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("spotify_accounts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "songs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "plays" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "spotify_accounts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "songs" CASCADE;
  DROP TABLE "plays" CASCADE;
  DROP TABLE "spotify_accounts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_songs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_plays_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_spotify_accounts_fk";
  
  DROP INDEX "payload_locked_documents_rels_songs_id_idx";
  DROP INDEX "payload_locked_documents_rels_plays_id_idx";
  DROP INDEX "payload_locked_documents_rels_spotify_accounts_id_idx";
  ALTER TABLE "artists" DROP COLUMN "wikipedia_title";
  ALTER TABLE "artists" DROP COLUMN "wikipedia_url";
  ALTER TABLE "artists" DROP COLUMN "wikipedia_summary";
  ALTER TABLE "artists" DROP COLUMN "wikipedia_image";
  ALTER TABLE "artists" DROP COLUMN "apple_albums";
  ALTER TABLE "artists" DROP COLUMN "extras_checked_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "songs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "plays_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "spotify_accounts_id";`)
}
