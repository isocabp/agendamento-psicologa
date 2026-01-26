import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // UploadThing
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: uploadRouter,
    }),
  );

  // Auth (Passport)
  setupAuth(app);

  // ============================
  // Users
  // ============================

  // GET user by id (Admin only)
  app.get(api.users.get.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(403);
    }

    const userId = Number(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json(user);
  });

  // UPDATE user
  app.put(api.users.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = Number(req.params.id);

    // Users can only update themselves. Admin can update anyone.
    if (req.user!.id !== userId && req.user!.role !== "admin") {
      return res.sendStatus(403);
    }

    const input = api.users.update.input.parse(req.body);
    const updated = await storage.updateUser(userId, input);
    res.json(updated);
  });

  // LIST users (Admin only)
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(403);
    }

    const clients = await storage.getUsersByRole("client");
    res.json(clients);
  });

  // ============================
  // Appointments
  // ============================

  // LIST appointments (Admin sees all with client, client sees their own)
  app.get(api.appointments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (req.user!.role === "admin") {
      const all = await storage.getAllAppointments();
      res.json(all);
    } else {
      const mine = await storage.getAppointmentsByClientId(req.user!.id);
      res.json(mine);
    }
  });

  // GET appointment details (Admin only)
  app.get(api.appointments.get.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(403);
    }

    const id = Number(req.params.id);
    const appointment = await storage.getAppointmentWithClient(id);

    if (!appointment) {
      return res.status(404).json({ message: "Agendamento não encontrado" });
    }

    res.json(appointment);
  });

  // CREATE appointment
  app.post(api.appointments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const input = api.appointments.create.input.parse(req.body);

    // Force clientId to be the current user if they are a client
    if (req.user!.role === "client") {
      input.clientId = req.user!.id;
    }

    const created = await storage.createAppointment(input);
    res.status(201).json(created);
  });

  // UPDATE appointment status (Admin only)
  app.patch(api.appointments.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(403);
    }

    const { status } = api.appointments.updateStatus.input.parse(req.body);

    const updated = await storage.updateAppointmentStatus(
      Number(req.params.id),
      status,
    );

    res.json(updated);
  });

  // ============================
  // Availability
  // ============================

  app.get(api.availability.list.path, async (_req, res) => {
    const availability = await storage.getAvailability();
    res.json(availability);
  });

  app.post(api.availability.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(403);
    }

    const input = api.availability.update.input.parse(req.body);
    const updated = await storage.updateAvailability(input);
    res.json(updated);
  });

  // Seed Data (mantive como você tinha)
  await seed();

  return httpServer;
}

async function seed() {
  const existingAdmin = await storage.getUserByUsername("admin@psi.com");
  if (!existingAdmin) {
    console.log("Seeding database...");
    // (seu seed ainda está “placeholder” — tá ok por agora)
  }
}
