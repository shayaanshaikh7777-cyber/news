import prisma from "./prisma";

export interface WhatsAppOptInParams {
  name: string;
  phone: string;
  location?: string | null;
  preferredCategories?: string[];
  consent: boolean;
}

export async function subscribeWhatsApp(params: WhatsAppOptInParams) {
  const { name, phone, location, preferredCategories, consent } = params;

  if (!consent) {
    throw new Error("व्हॉट्सॲप अपडेट्स मिळवण्यासाठी संमती आवश्यक आहे.");
  }

  // Clean phone number (Indian standard format: +91XXXXXXXXXX)
  let cleanPhone = phone.replace(/[^0-9+]/g, "");
  if (!cleanPhone.startsWith("+")) {
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      cleanPhone = `+${cleanPhone}`;
    }
  }

  return await prisma.whatsAppSubscriber.upsert({
    where: { phone: cleanPhone },
    update: {
      name,
      location: location || null,
      preferredCategories: preferredCategories ? JSON.stringify(preferredCategories) : null,
      consent: true,
      status: "ACTIVE",
    },
    create: {
      name,
      phone: cleanPhone,
      location: location || null,
      preferredCategories: preferredCategories ? JSON.stringify(preferredCategories) : null,
      consent: true,
      status: "ACTIVE",
    },
  });
}

export async function unsubscribeWhatsApp(phone: string) {
  let cleanPhone = phone.replace(/[^0-9+]/g, "");
  if (!cleanPhone.startsWith("+") && cleanPhone.length === 10) {
    cleanPhone = `+91${cleanPhone}`;
  }

  return await prisma.whatsAppSubscriber.update({
    where: { phone: cleanPhone },
    data: { status: "UNSUBSCRIBED", consent: false },
  });
}

export async function sendWhatsAppCloudTemplate(params: {
  toPhone: string;
  templateName: string;
  bodyParameters: string[];
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    // Return mock successful queue for development
    return { success: true, mocked: true, messageId: `mock_wamid_${Date.now()}` };
  }

  const endpoint = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: params.toPhone.replace("+", ""),
      type: "template",
      template: {
        name: params.templateName,
        language: { code: "mr" },
        components: [
          {
            type: "body",
            parameters: params.bodyParameters.map((text) => ({ type: "text", text })),
          },
        ],
      },
    }),
  });

  const resData = await response.json();
  return { success: response.ok, data: resData };
}

