CREATE TABLE "site_members" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "site_members_site_user_unique" UNIQUE("site_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "data" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "name" SET DEFAULT 'Meine Seite';--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "site_id" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "storage" text DEFAULT 'db' NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "storage_key" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "sites" SET "slug" = 'seite-' || left("id", 8) WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "header" jsonb;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "footer" jsonb;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "canvas_height" integer DEFAULT 1400 NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "published_height" integer;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "site_members" ADD CONSTRAINT "site_members_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_members" ADD CONSTRAINT "site_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_slug_unique" UNIQUE("slug");