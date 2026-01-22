import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication (Passport)
  setupAuth(app);

  // === Users ===
  
  app.put(api.users.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Users can only update themselves, Admin can update anyone (conceptually, but let's stick to safe defaults)
    const userId = Number(req.params.id);
    if (req.user!.id !== userId && req.user!.role !== 'admin') {
      return res.sendStatus(403);
    }

    const input = api.users.update.input.parse(req.body);
    const updated = await storage.updateUser(userId, input);
    res.json(updated);
  });

  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    const clients = await storage.getUsersByRole('client');
    res.json(clients);
  });

  // === Appointments ===

  app.get(api.appointments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (req.user!.role === 'admin') {
      const all = await storage.getAllAppointments();
      res.json(all);
    } else {
      const mine = await storage.getAppointmentsByClientId(req.user!.id);
      res.json(mine);
    }
  });

  app.post(api.appointments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const input = api.appointments.create.input.parse(req.body);
    
    // Force clientId to be the current user if they are a client
    if (req.user!.role === 'client') {
      input.clientId = req.user!.id;
    }

    const created = await storage.createAppointment(input);
    res.status(201).json(created);
  });

  app.patch(api.appointments.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    
    const { status } = api.appointments.updateStatus.input.parse(req.body);
    const updated = await storage.updateAppointmentStatus(Number(req.params.id), status);
    res.json(updated);
  });

  // === Availability ===

  app.get(api.availability.list.path, async (req, res) => {
    // Public or protected? Let's make it protected for simplicity, or public for landing page.
    // Client dashboard needs it.
    const availability = await storage.getAvailability();
    res.json(availability);
  });

  app.post(api.availability.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    
    const input = api.availability.update.input.parse(req.body);
    const updated = await storage.updateAvailability(input);
    res.json(updated);
  });

  // Seed Data function
  await seed();

  return httpServer;
}

async function seed() {
  const existingAdmin = await storage.getUserByUsername("admin@psi.com");
  if (!existingAdmin) {
    console.log("Seeding database...");
    
    // Create Admin
    // Using a simple hashing for seed (in auth.ts we handle real hashing)
    // Note: In real app, go through auth service. Here we assume Scrypt is used.
    // Ideally we should import `hashPassword` from auth.ts but for simplicity we'll rely on the auth flow or manual insert
    // Let's rely on the fact that `storage.createUser` inserts raw password and `setupAuth` handles comparison?
    // No, `setupAuth` usually hashes. We should probably expose a helper or just create via the proper flow.
    // For now, let's create users via storage and assume we need to hash if we want to log in.
    // Or simpler: The first time we register via API. 
    // Let's strictly add seed data if empty using the Auth helper would be best, but `auth.ts` isn't exported yet.
    // We will leave the DB empty or add a check in `server/index.ts`.
    // Actually, I'll add a simple seed here.
    
    // We need to hash passwords for them to work with Passport Local Strategy which usually uses scrypt/hashing.
    // Since I cannot import the local `hashPassword` easily without circular deps or restructuring, 
    // I will write the `server/auth.ts` file next and it will handle the hashing.
    // I'll skip seeding *here* and do it in `server/seed.ts` or just let the user register.
    // WAIT: User requested "seed básico: 1 admin padrão".
    // I will add a `seedDatabase` function export that I call from `index.ts`.
  }
}
