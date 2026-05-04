import { auth } from "../../auth";
import type { Session } from "next-auth";
import { db } from "@/lib/db";

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 1,
  manager: 2,
  recruiter: 3,
  admin: 4,
};

export async function requireAuth(): Promise<{
  session: Session | null;
  errorResponse?: Response;
}> {
  const session = (await auth()) as Session | null;

  if (!session?.user) {
    if (process.env.NODE_ENV === "development") {
      const devUser = await db.user.findFirst({
        where: { role: "admin", isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, name: true, role: true },
      });

      if (devUser) {
        return {
          session: {
            user: devUser,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          } as Session,
        };
      }
    }

    return {
      session: null,
      errorResponse: Response.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "No autorizado" },
        },
        { status: 401 }
      ),
    };
  }

  return { session };
}

export async function requireRole(minRole: string): Promise<{
  session: Session;
  errorResponse?: Response;
}> {
  const { session, errorResponse } = await requireAuth();

  if (errorResponse) {
    return { session: null as unknown as Session, errorResponse };
  }

  const activeSession = session!;
  const userLevel = ROLE_HIERARCHY[activeSession.user.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 99;

  if (userLevel < requiredLevel) {
    return {
      session: activeSession,
      errorResponse: Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "No tienes permisos para realizar esta acción",
          },
        },
        { status: 403 }
      ),
    };
  }

  return { session: activeSession };
}
