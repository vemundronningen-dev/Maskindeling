import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "bruker"]);

export const machineStatusEnum = pgEnum("machine_status", [
  "tilgjengelig",
  "opptatt",
  "på_service",
  "ute_av_drift",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "sendt",
  "godkjent",
  "avslått",
]);

// Organizations
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("bruker").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  departmentId: integer("department_id").references(() => departments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Machines
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  brand: text("brand"),
  model: text("model"),
  organizationId: integer("organization_id").references(() => organizations.id),
  departmentId: integer("department_id").references(() => departments.id),
  location: text("location"),
  status: machineStatusEnum("status").default("tilgjengelig").notNull(),
  availableFrom: text("available_from"),
  availableTo: text("available_to"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Machine Requests
export const machineRequests = pgTable("machine_requests", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id")
    .notNull()
    .references(() => machines.id, { onDelete: "cascade" }),
  requestedByUserId: integer("requested_by_user_id")
    .notNull()
    .references(() => users.id),
  fromDepartmentId: integer("from_department_id").references(
    () => departments.id
  ),
  toDepartmentId: integer("to_department_id").references(() => departments.id),
  message: text("message"),
  status: requestStatusEnum("status").default("sendt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  departments: many(departments),
  users: many(users),
  machines: many(machines),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [departments.organizationId],
    references: [organizations.id],
  }),
  users: many(users),
  machines: many(machines),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  requests: many(machineRequests),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [machines.organizationId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [machines.departmentId],
    references: [departments.id],
  }),
  requests: many(machineRequests),
}));

export const machineRequestsRelations = relations(
  machineRequests,
  ({ one }) => ({
    machine: one(machines, {
      fields: [machineRequests.machineId],
      references: [machines.id],
    }),
    requestedBy: one(users, {
      fields: [machineRequests.requestedByUserId],
      references: [users.id],
    }),
    fromDepartment: one(departments, {
      fields: [machineRequests.fromDepartmentId],
      references: [departments.id],
    }),
    toDepartment: one(departments, {
      fields: [machineRequests.toDepartmentId],
      references: [departments.id],
    }),
  })
);

// Types
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Machine = typeof machines.$inferSelect;
export type NewMachine = typeof machines.$inferInsert;
export type MachineRequest = typeof machineRequests.$inferSelect;
export type NewMachineRequest = typeof machineRequests.$inferInsert;
