import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Engineering Notes用Collectionと、そのversion・array・relationship用テーブルを追加します。
 * Payloadのschema差分から生成されたSQLで、既存コンテンツのテーブルは削除しません。
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_development_logs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_development_logs_visibility" AS ENUM('public', 'private');
  CREATE TYPE "public"."enum__development_logs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__development_logs_v_version_visibility" AS ENUM('public', 'private');
  CREATE TYPE "public"."enum_architecture_decisions_decision_status" AS ENUM('proposed', 'accepted', 'superseded');
  CREATE TYPE "public"."enum_architecture_decisions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_architecture_decisions_visibility" AS ENUM('public', 'private');
  CREATE TYPE "public"."enum__architecture_decisions_v_version_decision_status" AS ENUM('proposed', 'accepted', 'superseded');
  CREATE TYPE "public"."enum__architecture_decisions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__architecture_decisions_v_version_visibility" AS ENUM('public', 'private');
  CREATE TABLE "development_logs_next_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"task" varchar
  );
  
  CREATE TABLE "development_logs_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "development_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"log_date" timestamp(3) with time zone,
  	"project" varchar DEFAULT 'my_profile',
  	"summary" varchar,
  	"implementation" varchar,
  	"problem" varchar,
  	"cause" varchar,
  	"resolution" varchar,
  	"lessons_learned" varchar,
  	"status" "enum_development_logs_status" DEFAULT 'draft',
  	"visibility" "enum_development_logs_visibility" DEFAULT 'private',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_development_logs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "development_logs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"works_id" integer,
  	"architecture_decisions_id" integer
  );
  
  CREATE TABLE "_development_logs_v_version_next_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"task" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_development_logs_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_development_logs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_log_date" timestamp(3) with time zone,
  	"version_project" varchar DEFAULT 'my_profile',
  	"version_summary" varchar,
  	"version_implementation" varchar,
  	"version_problem" varchar,
  	"version_cause" varchar,
  	"version_resolution" varchar,
  	"version_lessons_learned" varchar,
  	"version_status" "enum__development_logs_v_version_status" DEFAULT 'draft',
  	"version_visibility" "enum__development_logs_v_version_visibility" DEFAULT 'private',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__development_logs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_development_logs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"works_id" integer,
  	"architecture_decisions_id" integer
  );
  
  CREATE TABLE "architecture_decisions_options_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "architecture_decisions_options_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "architecture_decisions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "architecture_decisions_positive_consequences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "architecture_decisions_negative_consequences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "architecture_decisions_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "architecture_decisions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"decision_id" varchar,
  	"title" varchar,
  	"slug" varchar,
  	"project" varchar DEFAULT 'my_profile',
  	"decision_status" "enum_architecture_decisions_decision_status" DEFAULT 'proposed',
  	"context" varchar,
  	"decision" varchar,
  	"rationale" varchar,
  	"decided_at" timestamp(3) with time zone,
  	"supersedes_id" integer,
  	"status" "enum_architecture_decisions_status" DEFAULT 'draft',
  	"visibility" "enum_architecture_decisions_visibility" DEFAULT 'private',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_architecture_decisions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "architecture_decisions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"works_id" integer,
  	"development_logs_id" integer
  );
  
  CREATE TABLE "_architecture_decisions_v_version_options_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_architecture_decisions_v_version_options_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_architecture_decisions_v_version_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_architecture_decisions_v_version_positive_consequences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_architecture_decisions_v_version_negative_consequences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_architecture_decisions_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_architecture_decisions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_decision_id" varchar,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_project" varchar DEFAULT 'my_profile',
  	"version_decision_status" "enum__architecture_decisions_v_version_decision_status" DEFAULT 'proposed',
  	"version_context" varchar,
  	"version_decision" varchar,
  	"version_rationale" varchar,
  	"version_decided_at" timestamp(3) with time zone,
  	"version_supersedes_id" integer,
  	"version_status" "enum__architecture_decisions_v_version_status" DEFAULT 'draft',
  	"version_visibility" "enum__architecture_decisions_v_version_visibility" DEFAULT 'private',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__architecture_decisions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_architecture_decisions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"works_id" integer,
  	"development_logs_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "development_logs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "architecture_decisions_id" integer;
  ALTER TABLE "development_logs_next_actions" ADD CONSTRAINT "development_logs_next_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."development_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "development_logs_tags" ADD CONSTRAINT "development_logs_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."development_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "development_logs_rels" ADD CONSTRAINT "development_logs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."development_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "development_logs_rels" ADD CONSTRAINT "development_logs_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "development_logs_rels" ADD CONSTRAINT "development_logs_rels_architecture_decisions_fk" FOREIGN KEY ("architecture_decisions_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_development_logs_v_version_next_actions" ADD CONSTRAINT "_development_logs_v_version_next_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_development_logs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_development_logs_v_version_tags" ADD CONSTRAINT "_development_logs_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_development_logs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_development_logs_v" ADD CONSTRAINT "_development_logs_v_parent_id_development_logs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."development_logs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_development_logs_v_rels" ADD CONSTRAINT "_development_logs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_development_logs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_development_logs_v_rels" ADD CONSTRAINT "_development_logs_v_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_development_logs_v_rels" ADD CONSTRAINT "_development_logs_v_rels_architecture_decisions_fk" FOREIGN KEY ("architecture_decisions_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_options_pros" ADD CONSTRAINT "architecture_decisions_options_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."architecture_decisions_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_options_cons" ADD CONSTRAINT "architecture_decisions_options_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."architecture_decisions_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_options" ADD CONSTRAINT "architecture_decisions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_positive_consequences" ADD CONSTRAINT "architecture_decisions_positive_consequences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_negative_consequences" ADD CONSTRAINT "architecture_decisions_negative_consequences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_tags" ADD CONSTRAINT "architecture_decisions_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions" ADD CONSTRAINT "architecture_decisions_supersedes_id_architecture_decisions_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "architecture_decisions_rels" ADD CONSTRAINT "architecture_decisions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_rels" ADD CONSTRAINT "architecture_decisions_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "architecture_decisions_rels" ADD CONSTRAINT "architecture_decisions_rels_development_logs_fk" FOREIGN KEY ("development_logs_id") REFERENCES "public"."development_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_version_options_pros" ADD CONSTRAINT "_architecture_decisions_v_version_options_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_architecture_decisions_v_version_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_version_options_cons" ADD CONSTRAINT "_architecture_decisions_v_version_options_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_architecture_decisions_v_version_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_version_options" ADD CONSTRAINT "_architecture_decisions_v_version_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_architecture_decisions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_version_positive_consequences" ADD CONSTRAINT "_architecture_decisions_v_version_positive_consequences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_architecture_decisions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_version_negative_consequences" ADD CONSTRAINT "_architecture_decisions_v_version_negative_consequences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_architecture_decisions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_version_tags" ADD CONSTRAINT "_architecture_decisions_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_architecture_decisions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v" ADD CONSTRAINT "_architecture_decisions_v_parent_id_architecture_decisions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v" ADD CONSTRAINT "_architecture_decisions_v_version_supersedes_id_architecture_decisions_id_fk" FOREIGN KEY ("version_supersedes_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_rels" ADD CONSTRAINT "_architecture_decisions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_architecture_decisions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_rels" ADD CONSTRAINT "_architecture_decisions_v_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_architecture_decisions_v_rels" ADD CONSTRAINT "_architecture_decisions_v_rels_development_logs_fk" FOREIGN KEY ("development_logs_id") REFERENCES "public"."development_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "development_logs_next_actions_order_idx" ON "development_logs_next_actions" USING btree ("_order");
  CREATE INDEX "development_logs_next_actions_parent_id_idx" ON "development_logs_next_actions" USING btree ("_parent_id");
  CREATE INDEX "development_logs_tags_order_idx" ON "development_logs_tags" USING btree ("_order");
  CREATE INDEX "development_logs_tags_parent_id_idx" ON "development_logs_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "development_logs_slug_idx" ON "development_logs" USING btree ("slug");
  CREATE INDEX "development_logs_project_idx" ON "development_logs" USING btree ("project");
  CREATE INDEX "development_logs_status_idx" ON "development_logs" USING btree ("status");
  CREATE INDEX "development_logs_visibility_idx" ON "development_logs" USING btree ("visibility");
  CREATE INDEX "development_logs_published_at_idx" ON "development_logs" USING btree ("published_at");
  CREATE INDEX "development_logs_updated_at_idx" ON "development_logs" USING btree ("updated_at");
  CREATE INDEX "development_logs_created_at_idx" ON "development_logs" USING btree ("created_at");
  CREATE INDEX "development_logs__status_idx" ON "development_logs" USING btree ("_status");
  CREATE INDEX "development_logs_rels_order_idx" ON "development_logs_rels" USING btree ("order");
  CREATE INDEX "development_logs_rels_parent_idx" ON "development_logs_rels" USING btree ("parent_id");
  CREATE INDEX "development_logs_rels_path_idx" ON "development_logs_rels" USING btree ("path");
  CREATE INDEX "development_logs_rels_works_id_idx" ON "development_logs_rels" USING btree ("works_id");
  CREATE INDEX "development_logs_rels_architecture_decisions_id_idx" ON "development_logs_rels" USING btree ("architecture_decisions_id");
  CREATE INDEX "_development_logs_v_version_next_actions_order_idx" ON "_development_logs_v_version_next_actions" USING btree ("_order");
  CREATE INDEX "_development_logs_v_version_next_actions_parent_id_idx" ON "_development_logs_v_version_next_actions" USING btree ("_parent_id");
  CREATE INDEX "_development_logs_v_version_tags_order_idx" ON "_development_logs_v_version_tags" USING btree ("_order");
  CREATE INDEX "_development_logs_v_version_tags_parent_id_idx" ON "_development_logs_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_development_logs_v_parent_idx" ON "_development_logs_v" USING btree ("parent_id");
  CREATE INDEX "_development_logs_v_version_version_slug_idx" ON "_development_logs_v" USING btree ("version_slug");
  CREATE INDEX "_development_logs_v_version_version_project_idx" ON "_development_logs_v" USING btree ("version_project");
  CREATE INDEX "_development_logs_v_version_version_status_idx" ON "_development_logs_v" USING btree ("version_status");
  CREATE INDEX "_development_logs_v_version_version_visibility_idx" ON "_development_logs_v" USING btree ("version_visibility");
  CREATE INDEX "_development_logs_v_version_version_published_at_idx" ON "_development_logs_v" USING btree ("version_published_at");
  CREATE INDEX "_development_logs_v_version_version_updated_at_idx" ON "_development_logs_v" USING btree ("version_updated_at");
  CREATE INDEX "_development_logs_v_version_version_created_at_idx" ON "_development_logs_v" USING btree ("version_created_at");
  CREATE INDEX "_development_logs_v_version_version__status_idx" ON "_development_logs_v" USING btree ("version__status");
  CREATE INDEX "_development_logs_v_created_at_idx" ON "_development_logs_v" USING btree ("created_at");
  CREATE INDEX "_development_logs_v_updated_at_idx" ON "_development_logs_v" USING btree ("updated_at");
  CREATE INDEX "_development_logs_v_latest_idx" ON "_development_logs_v" USING btree ("latest");
  CREATE INDEX "_development_logs_v_rels_order_idx" ON "_development_logs_v_rels" USING btree ("order");
  CREATE INDEX "_development_logs_v_rels_parent_idx" ON "_development_logs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_development_logs_v_rels_path_idx" ON "_development_logs_v_rels" USING btree ("path");
  CREATE INDEX "_development_logs_v_rels_works_id_idx" ON "_development_logs_v_rels" USING btree ("works_id");
  CREATE INDEX "_development_logs_v_rels_architecture_decisions_id_idx" ON "_development_logs_v_rels" USING btree ("architecture_decisions_id");
  CREATE INDEX "architecture_decisions_options_pros_order_idx" ON "architecture_decisions_options_pros" USING btree ("_order");
  CREATE INDEX "architecture_decisions_options_pros_parent_id_idx" ON "architecture_decisions_options_pros" USING btree ("_parent_id");
  CREATE INDEX "architecture_decisions_options_cons_order_idx" ON "architecture_decisions_options_cons" USING btree ("_order");
  CREATE INDEX "architecture_decisions_options_cons_parent_id_idx" ON "architecture_decisions_options_cons" USING btree ("_parent_id");
  CREATE INDEX "architecture_decisions_options_order_idx" ON "architecture_decisions_options" USING btree ("_order");
  CREATE INDEX "architecture_decisions_options_parent_id_idx" ON "architecture_decisions_options" USING btree ("_parent_id");
  CREATE INDEX "architecture_decisions_positive_consequences_order_idx" ON "architecture_decisions_positive_consequences" USING btree ("_order");
  CREATE INDEX "architecture_decisions_positive_consequences_parent_id_idx" ON "architecture_decisions_positive_consequences" USING btree ("_parent_id");
  CREATE INDEX "architecture_decisions_negative_consequences_order_idx" ON "architecture_decisions_negative_consequences" USING btree ("_order");
  CREATE INDEX "architecture_decisions_negative_consequences_parent_id_idx" ON "architecture_decisions_negative_consequences" USING btree ("_parent_id");
  CREATE INDEX "architecture_decisions_tags_order_idx" ON "architecture_decisions_tags" USING btree ("_order");
  CREATE INDEX "architecture_decisions_tags_parent_id_idx" ON "architecture_decisions_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "architecture_decisions_decision_id_idx" ON "architecture_decisions" USING btree ("decision_id");
  CREATE UNIQUE INDEX "architecture_decisions_slug_idx" ON "architecture_decisions" USING btree ("slug");
  CREATE INDEX "architecture_decisions_project_idx" ON "architecture_decisions" USING btree ("project");
  CREATE INDEX "architecture_decisions_decision_status_idx" ON "architecture_decisions" USING btree ("decision_status");
  CREATE INDEX "architecture_decisions_decided_at_idx" ON "architecture_decisions" USING btree ("decided_at");
  CREATE INDEX "architecture_decisions_supersedes_idx" ON "architecture_decisions" USING btree ("supersedes_id");
  CREATE INDEX "architecture_decisions_status_idx" ON "architecture_decisions" USING btree ("status");
  CREATE INDEX "architecture_decisions_visibility_idx" ON "architecture_decisions" USING btree ("visibility");
  CREATE INDEX "architecture_decisions_published_at_idx" ON "architecture_decisions" USING btree ("published_at");
  CREATE INDEX "architecture_decisions_updated_at_idx" ON "architecture_decisions" USING btree ("updated_at");
  CREATE INDEX "architecture_decisions_created_at_idx" ON "architecture_decisions" USING btree ("created_at");
  CREATE INDEX "architecture_decisions__status_idx" ON "architecture_decisions" USING btree ("_status");
  CREATE INDEX "architecture_decisions_rels_order_idx" ON "architecture_decisions_rels" USING btree ("order");
  CREATE INDEX "architecture_decisions_rels_parent_idx" ON "architecture_decisions_rels" USING btree ("parent_id");
  CREATE INDEX "architecture_decisions_rels_path_idx" ON "architecture_decisions_rels" USING btree ("path");
  CREATE INDEX "architecture_decisions_rels_works_id_idx" ON "architecture_decisions_rels" USING btree ("works_id");
  CREATE INDEX "architecture_decisions_rels_development_logs_id_idx" ON "architecture_decisions_rels" USING btree ("development_logs_id");
  CREATE INDEX "_architecture_decisions_v_version_options_pros_order_idx" ON "_architecture_decisions_v_version_options_pros" USING btree ("_order");
  CREATE INDEX "_architecture_decisions_v_version_options_pros_parent_id_idx" ON "_architecture_decisions_v_version_options_pros" USING btree ("_parent_id");
  CREATE INDEX "_architecture_decisions_v_version_options_cons_order_idx" ON "_architecture_decisions_v_version_options_cons" USING btree ("_order");
  CREATE INDEX "_architecture_decisions_v_version_options_cons_parent_id_idx" ON "_architecture_decisions_v_version_options_cons" USING btree ("_parent_id");
  CREATE INDEX "_architecture_decisions_v_version_options_order_idx" ON "_architecture_decisions_v_version_options" USING btree ("_order");
  CREATE INDEX "_architecture_decisions_v_version_options_parent_id_idx" ON "_architecture_decisions_v_version_options" USING btree ("_parent_id");
  CREATE INDEX "_architecture_decisions_v_version_positive_consequences_order_idx" ON "_architecture_decisions_v_version_positive_consequences" USING btree ("_order");
  CREATE INDEX "_architecture_decisions_v_version_positive_consequences_parent_id_idx" ON "_architecture_decisions_v_version_positive_consequences" USING btree ("_parent_id");
  CREATE INDEX "_architecture_decisions_v_version_negative_consequences_order_idx" ON "_architecture_decisions_v_version_negative_consequences" USING btree ("_order");
  CREATE INDEX "_architecture_decisions_v_version_negative_consequences_parent_id_idx" ON "_architecture_decisions_v_version_negative_consequences" USING btree ("_parent_id");
  CREATE INDEX "_architecture_decisions_v_version_tags_order_idx" ON "_architecture_decisions_v_version_tags" USING btree ("_order");
  CREATE INDEX "_architecture_decisions_v_version_tags_parent_id_idx" ON "_architecture_decisions_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_architecture_decisions_v_parent_idx" ON "_architecture_decisions_v" USING btree ("parent_id");
  CREATE INDEX "_architecture_decisions_v_version_version_decision_id_idx" ON "_architecture_decisions_v" USING btree ("version_decision_id");
  CREATE INDEX "_architecture_decisions_v_version_version_slug_idx" ON "_architecture_decisions_v" USING btree ("version_slug");
  CREATE INDEX "_architecture_decisions_v_version_version_project_idx" ON "_architecture_decisions_v" USING btree ("version_project");
  CREATE INDEX "_architecture_decisions_v_version_version_decision_statu_idx" ON "_architecture_decisions_v" USING btree ("version_decision_status");
  CREATE INDEX "_architecture_decisions_v_version_version_decided_at_idx" ON "_architecture_decisions_v" USING btree ("version_decided_at");
  CREATE INDEX "_architecture_decisions_v_version_version_supersedes_idx" ON "_architecture_decisions_v" USING btree ("version_supersedes_id");
  CREATE INDEX "_architecture_decisions_v_version_version_status_idx" ON "_architecture_decisions_v" USING btree ("version_status");
  CREATE INDEX "_architecture_decisions_v_version_version_visibility_idx" ON "_architecture_decisions_v" USING btree ("version_visibility");
  CREATE INDEX "_architecture_decisions_v_version_version_published_at_idx" ON "_architecture_decisions_v" USING btree ("version_published_at");
  CREATE INDEX "_architecture_decisions_v_version_version_updated_at_idx" ON "_architecture_decisions_v" USING btree ("version_updated_at");
  CREATE INDEX "_architecture_decisions_v_version_version_created_at_idx" ON "_architecture_decisions_v" USING btree ("version_created_at");
  CREATE INDEX "_architecture_decisions_v_version_version__status_idx" ON "_architecture_decisions_v" USING btree ("version__status");
  CREATE INDEX "_architecture_decisions_v_created_at_idx" ON "_architecture_decisions_v" USING btree ("created_at");
  CREATE INDEX "_architecture_decisions_v_updated_at_idx" ON "_architecture_decisions_v" USING btree ("updated_at");
  CREATE INDEX "_architecture_decisions_v_latest_idx" ON "_architecture_decisions_v" USING btree ("latest");
  CREATE INDEX "_architecture_decisions_v_rels_order_idx" ON "_architecture_decisions_v_rels" USING btree ("order");
  CREATE INDEX "_architecture_decisions_v_rels_parent_idx" ON "_architecture_decisions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_architecture_decisions_v_rels_path_idx" ON "_architecture_decisions_v_rels" USING btree ("path");
  CREATE INDEX "_architecture_decisions_v_rels_works_id_idx" ON "_architecture_decisions_v_rels" USING btree ("works_id");
  CREATE INDEX "_architecture_decisions_v_rels_development_logs_id_idx" ON "_architecture_decisions_v_rels" USING btree ("development_logs_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_development_logs_fk" FOREIGN KEY ("development_logs_id") REFERENCES "public"."development_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_architecture_decisions_fk" FOREIGN KEY ("architecture_decisions_id") REFERENCES "public"."architecture_decisions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_development_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("development_logs_id");
  CREATE INDEX "payload_locked_documents_rels_architecture_decisions_id_idx" ON "payload_locked_documents_rels" USING btree ("architecture_decisions_id");`)
}

/**
 * このmigrationで追加したEngineering Notes関連のDB要素だけを取り除きます。
 * 実データも削除されるため、down実行前には必ずバックアップと影響確認が必要です。
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "development_logs_next_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "development_logs_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "development_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "development_logs_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_development_logs_v_version_next_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_development_logs_v_version_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_development_logs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_development_logs_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions_options_pros" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions_options_cons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions_positive_consequences" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions_negative_consequences" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "architecture_decisions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v_version_options_pros" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v_version_options_cons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v_version_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v_version_positive_consequences" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v_version_negative_consequences" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v_version_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_architecture_decisions_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "development_logs_next_actions" CASCADE;
  DROP TABLE "development_logs_tags" CASCADE;
  DROP TABLE "development_logs" CASCADE;
  DROP TABLE "development_logs_rels" CASCADE;
  DROP TABLE "_development_logs_v_version_next_actions" CASCADE;
  DROP TABLE "_development_logs_v_version_tags" CASCADE;
  DROP TABLE "_development_logs_v" CASCADE;
  DROP TABLE "_development_logs_v_rels" CASCADE;
  DROP TABLE "architecture_decisions_options_pros" CASCADE;
  DROP TABLE "architecture_decisions_options_cons" CASCADE;
  DROP TABLE "architecture_decisions_options" CASCADE;
  DROP TABLE "architecture_decisions_positive_consequences" CASCADE;
  DROP TABLE "architecture_decisions_negative_consequences" CASCADE;
  DROP TABLE "architecture_decisions_tags" CASCADE;
  DROP TABLE "architecture_decisions" CASCADE;
  DROP TABLE "architecture_decisions_rels" CASCADE;
  DROP TABLE "_architecture_decisions_v_version_options_pros" CASCADE;
  DROP TABLE "_architecture_decisions_v_version_options_cons" CASCADE;
  DROP TABLE "_architecture_decisions_v_version_options" CASCADE;
  DROP TABLE "_architecture_decisions_v_version_positive_consequences" CASCADE;
  DROP TABLE "_architecture_decisions_v_version_negative_consequences" CASCADE;
  DROP TABLE "_architecture_decisions_v_version_tags" CASCADE;
  DROP TABLE "_architecture_decisions_v" CASCADE;
  DROP TABLE "_architecture_decisions_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_development_logs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_architecture_decisions_fk";
  
  DROP INDEX "payload_locked_documents_rels_development_logs_id_idx";
  DROP INDEX "payload_locked_documents_rels_architecture_decisions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "development_logs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "architecture_decisions_id";
  DROP TYPE "public"."enum_development_logs_status";
  DROP TYPE "public"."enum_development_logs_visibility";
  DROP TYPE "public"."enum__development_logs_v_version_status";
  DROP TYPE "public"."enum__development_logs_v_version_visibility";
  DROP TYPE "public"."enum_architecture_decisions_decision_status";
  DROP TYPE "public"."enum_architecture_decisions_status";
  DROP TYPE "public"."enum_architecture_decisions_visibility";
  DROP TYPE "public"."enum__architecture_decisions_v_version_decision_status";
  DROP TYPE "public"."enum__architecture_decisions_v_version_status";
  DROP TYPE "public"."enum__architecture_decisions_v_version_visibility";`)
}
