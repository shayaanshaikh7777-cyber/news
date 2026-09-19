import prisma, { isDatabaseAvailable } from "./prisma";

export async function recordAuditLog(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}) {
  try {
    const isReady = await isDatabaseAvailable();
    if (!isReady) {
      // In unconfigured or offline database mode, gracefully skip audit log write
      return null;
    }

    const detailsString =
      typeof params.details === "object" && params.details !== null
        ? JSON.stringify(params.details)
        : (params.details as string) || null;

    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: detailsString,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.warn("Audit log skipped (database unavailable):", error instanceof Error ? error.message : error);
    return null;
  }
}

