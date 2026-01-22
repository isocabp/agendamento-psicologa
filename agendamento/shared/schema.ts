import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // email
  password: text("password").notNull(),
  role: text("role", { enum: ["client", "admin"] }).notNull().default("client"),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  
  // Client specific fields
  zipCode: text("zip_code"),
  address: text("address"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  
  // Admin only notes (stored on the client record for simplicity in this 1-admin system)
  privateNotes: text("private_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(), // Foreign key to users
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:mm
  status: text("status", { enum: ["em_analise", "agendado", "recusado", "cancelado"] })
    .notNull()
    .default("em_analise"),
  notes: text("notes"), // Optional message from client
  createdAt: timestamp("created_at").defaultNow(),
});

export const availabilities = pgTable("availabilities", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sun-Sat)
  times: text("times").array().notNull(), // ["09:00", "10:00", ...]
  isActive: boolean("is_active").default(true),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(users, {
    fields: [appointments.clientId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ 
  id: true, 
  createdAt: true,
  status: true // Status is managed by system/admin
});

export const insertAvailabilitySchema = createInsertSchema(availabilities).omit({ 
  id: true 
});

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Availability = typeof availabilities.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

// Request types
export type CreateUserRequest = InsertUser;
export type UpdateUserRequest = Partial<InsertUser>;
export type CreateAppointmentRequest = InsertAppointment;
export type UpdateAppointmentStatusRequest = { status: "em_analise" | "agendado" | "recusado" | "cancelado" };

// Response types
export type UserResponse = User;
export type AppointmentResponse = Appointment & { client?: User };
