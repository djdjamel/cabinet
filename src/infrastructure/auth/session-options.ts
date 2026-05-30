import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  cabinetId: string;
  role: "nurse" | "admin";
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "qr_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 heures
  },
};
