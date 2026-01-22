import { db } from "./db";
import {
  users, appointments, availabilities,
  type User, type InsertUser,
  type Appointment, type InsertAppointment,
  type Availability, type InsertAvailability
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getUsersByRole(role: "client" | "admin"): Promise<User[]>;

  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByClientId(clientId: number): Promise<Appointment[]>;
  getAllAppointments(): Promise<(Appointment & { client: User | null })[]>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
  
  // Availability
  getAvailability(): Promise<Availability[]>;
  updateAvailability(availability: InsertAvailability[]): Promise<Availability[]>;
  
  // Session store (for passport)
  sessionStore: any;
}

import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsersByRole(role: "client" | "admin"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Appointments
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentsByClientId(clientId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.date), desc(appointments.time));
  }

  async getAllAppointments(): Promise<(Appointment & { client: User | null })[]> {
    // Join with client data
    const results = await db.select({
      appointment: appointments,
      client: users
    })
    .from(appointments)
    .leftJoin(users, eq(appointments.clientId, users.id))
    .orderBy(desc(appointments.date), desc(appointments.time));
    
    return results.map(r => ({
      ...r.appointment,
      client: r.client
    }));
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    const [updated] = await db.update(appointments)
      .set({ status: status as any })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  // Availability
  async getAvailability(): Promise<Availability[]> {
    return await db.select().from(availabilities).orderBy(availabilities.dayOfWeek);
  }

  async updateAvailability(newAvailabilities: InsertAvailability[]): Promise<Availability[]> {
    // Simple strategy: wipe and recreate for now, or upsert.
    // For simplicity: delete all and insert new.
    await db.delete(availabilities);
    if (newAvailabilities.length > 0) {
      return await db.insert(availabilities).values(newAvailabilities).returning();
    }
    return [];
  }
}

export const storage = new DatabaseStorage();
