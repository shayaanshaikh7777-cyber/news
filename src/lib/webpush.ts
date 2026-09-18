import prisma from "./prisma";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  return await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: {
      p256dh: sub.p256dh,
      auth: sub.auth,
      userAgent: sub.userAgent || null,
    },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      userAgent: sub.userAgent || null,
    },
  });
}

export async function broadcastPushNotification(payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({});
  console.log(`Broadcasting push notification to ${subscriptions.length} active devices:`, payload);

  return {
    success: true,
    recipientsCount: subscriptions.length,
    payload,
  };
}

