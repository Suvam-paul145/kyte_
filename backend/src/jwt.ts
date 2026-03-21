import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export function createToken(user: { email: string; name?: string | null }): string {
  return jwt.sign(
    {
      email: user.email,
      name: user.name ?? null,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { email: string; name?: string | null } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email?: string; name?: string | null };
    if (!decoded.email) return null;
    return {
      email: decoded.email,
      name: decoded.name ?? null,
    };
  } catch {
    return null;
  }
}
