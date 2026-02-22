import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to req to match existing route usage patterns (req.user.claims.sub)
  req.user = {
    claims: {
      sub: session.user.id,
      email: session.user.email,
    },
  };

  return next();
};
