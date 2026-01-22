import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "r3pl1t_s3cr3t_k3y",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid username" });

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) return done(null, false, { message: "Invalid password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // register: cria usuário, MAS não inicia sessão automaticamente
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "E-mail já cadastrado" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      return res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  seedInitialData();
}

async function seedInitialData() {
  const admin = await storage.getUserByUsername("admin@psi.com");
  if (!admin) {
    console.log("Seeding initial data...");
    const adminPass = await hashPassword("admin123");
    await storage.createUser({
      username: "admin@psi.com",
      password: adminPass,
      role: "admin",
      fullName: "Dra. Ana Silva",
      phone: "11999999999",
      zipCode: "01001000",
      address: "Av. Paulista",
      number: "1000",
      city: "São Paulo",
      state: "SP",
    });

    const clientPass = await hashPassword("client123");
    const client = await storage.createUser({
      username: "cliente@email.com",
      password: clientPass,
      role: "client",
      fullName: "João da Silva",
      phone: "11888888888",
      zipCode: "01001001",
      address: "Rua das Flores",
      number: "123",
      city: "São Paulo",
      state: "SP",
    });

    await storage.updateAvailability([
      {
        dayOfWeek: 1,
        times: ["09:00", "10:00", "11:00", "14:00", "15:00"],
        isActive: true,
      },
      { dayOfWeek: 2, times: ["09:00", "10:00", "14:00"], isActive: true },
      {
        dayOfWeek: 3,
        times: ["09:00", "10:00", "11:00", "14:00", "15:00"],
        isActive: true,
      },
      { dayOfWeek: 4, times: ["09:00", "10:00", "14:00"], isActive: true },
      { dayOfWeek: 5, times: ["09:00", "10:00", "11:00"], isActive: true },
    ]);

    // ⚠️ o erro de "status" aqui a gente resolve no ajuste 2 (não mexi agora pra manter 1 mudança por vez)
    const today = new Date().toISOString().split("T")[0];
    await storage.createAppointment({
      clientId: client.id,
      date: today,
      time: "10:00",
      // status: "agendado",
      notes: "Primeira consulta",
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    await storage.createAppointment({
      clientId: client.id,
      date: nextWeekStr,
      time: "14:00",
      // status: "em_analise",
      notes: "Retorno",
    });

    console.log("Seeding complete.");
  }
}
