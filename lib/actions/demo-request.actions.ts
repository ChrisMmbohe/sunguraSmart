'use server';

import { z } from 'zod';
import { dbConnect, DemoRequest, FarmSizeRange } from '@/database';
import { sendDemoRequestNotifications } from '@/lib/email';

const demoRequestSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(100),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  farmName: z.string().trim().max(120).optional().or(z.literal('')),
  farmSize: z.nativeEnum(FarmSizeRange).optional(),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

export interface DemoRequestFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<'name' | 'email' | 'phone' | 'farmName' | 'farmSize' | 'message', string[]>>;
}

export async function submitDemoRequest(
  _prevState: DemoRequestFormState,
  formData: FormData
): Promise<DemoRequestFormState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    farmName: formData.get('farmName'),
    farmSize: formData.get('farmSize') || undefined,
    message: formData.get('message'),
  };

  const parsed = demoRequestSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the errors below.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await dbConnect();

    const lead = await DemoRequest.create({
      ...parsed.data,
      phone: parsed.data.phone || undefined,
      farmName: parsed.data.farmName || undefined,
      message: parsed.data.message || undefined,
      source: 'homepage',
    });

    // Best-effort — a lead that's saved but un-emailed is recoverable;
    // one that's lost because email failed is not.
    try {
      await sendDemoRequestNotifications(lead);
    } catch (emailErr) {
      console.error('[demo-request] Failed to send notification emails:', emailErr);
    }

    return {
      success: true,
      message: "Thanks — we've got your request. Someone from our team will reach out within one business day.",
    };
  } catch (err) {
    console.error('[demo-request] Failed to save demo request:', err);
    return {
      success: false,
      message: 'Something went wrong on our end. Please try again, or email us directly.',
    };
  }
}
