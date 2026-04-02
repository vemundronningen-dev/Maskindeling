CREATE TYPE "public"."machine_status" AS ENUM('tilgjengelig', 'opptatt', 'på_service', 'ute_av_drift');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('sendt', 'godkjent', 'avslått');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'bruker');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer NOT NULL,
	"requested_by_user_id" integer NOT NULL,
	"from_department_id" integer,
	"to_department_id" integer,
	"message" text,
	"status" "request_status" DEFAULT 'sendt' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"brand" text,
	"model" text,
	"organization_id" integer,
	"department_id" integer,
	"location" text,
	"status" "machine_status" DEFAULT 'tilgjengelig' NOT NULL,
	"available_from" text,
	"available_to" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'bruker' NOT NULL,
	"organization_id" integer,
	"department_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_requests" ADD CONSTRAINT "machine_requests_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_requests" ADD CONSTRAINT "machine_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_requests" ADD CONSTRAINT "machine_requests_from_department_id_departments_id_fk" FOREIGN KEY ("from_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_requests" ADD CONSTRAINT "machine_requests_to_department_id_departments_id_fk" FOREIGN KEY ("to_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;