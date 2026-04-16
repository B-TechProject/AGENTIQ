import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import protectRoute from "./middlewares/auth.middleware.js";
import requestRoutes from "./routes/request.routes.js";
import testRoutes from "./routes/test.routes.js";
import securityRoutes from "./routes/security.routes.js";
import analyzeRoutes from "./routes/analyze.routes.js";
import testRunRoutes from "./routes/testRun.routes.js";
import aiRoutes from "./routes/ai.routes.js";

dotenv.config();

const app = express();

// 🔥 TRUST PROXY (IMPORTANT for OAuth)
app.set("trust proxy", 1);

// ── CORS ───────────────────────────────────────────
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ── MIDDLEWARES ────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 🔥 FIXED SESSION CONFIG
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false, // ✅ FIXED
    cookie: {
      secure: false, // true only in HTTPS
      httpOnly: true,
    },
  })
);

// ── PASSPORT INIT ──────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── GOOGLE STRATEGY ────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
      proxy: true, // 🔥 CRITICAL FIX
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        return done(null, profile);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ── SERIALIZATION ──────────────────────────────────
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// ── GOOGLE ROUTES ──────────────────────────────────
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/failed",
    session: true,
  }),
  (req, res) => {
    try {
      const profile = req.user;

      // 🔥 NORMALIZE USER
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar: profile.photos?.[0]?.value,
        plan: "free",
      };

      // 🔥 TEMP TOKEN (replace with JWT later)
      const token = "google-auth-token";

      // 🔥 REDIRECT TO FRONTEND
      res.redirect(
        `http://localhost:5173/google-success?token=${token}&name=${encodeURIComponent(
          user.name
        )}`
      );
    } catch (err) {
      console.error(err);
      res.redirect("/failed");
    }
  }
);

// ── API ROUTES ─────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/runs", testRunRoutes);
app.use("/api/ai", aiRoutes);

// ── TEST ROUTES ────────────────────────────────────
app.get("/", (req, res) => {
  res.send("working");
});

app.get("/failed", (req, res) => {
  res.send("Google authentication failed ❌");
});

app.get("/home", protectRoute, (req, res) => {
  res.send(
    `Welcome ${req.user.fullName || req.user.email} to the home page! 🎉`
  );
});

// ── START SERVER ───────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
  connectDB()
    .then(() => console.log("Database connected"))
    .catch((err) => console.error("DB error:", err));
});