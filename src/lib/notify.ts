import { prisma } from "./db";
import Twilio from "twilio";
import { Resend } from "resend";

export type NotifyEvent =
  | "order_created"
  | "pickup_scheduled"
  | "out_for_pickup"
  | "picked_up"
  | "in_progress"
  | "out_for_delivery"
  | "delivered"
  | "payment_received";

const eventMessages: Record<
  NotifyEvent,
  { sms: string; subject: string; body: string }
> = {
  order_created: {
    sms: "Your laundry order was created. We'll confirm pickup and delivery times.",
    subject: "Order created – Doorstep Laundry",
    body: "Your laundry order was created. We'll confirm pickup and delivery times.",
  },
  pickup_scheduled: {
    sms: "Your laundry pickup has been scheduled.",
    subject: "Pickup scheduled – Doorstep Laundry",
    body: "Your laundry pickup has been scheduled.",
  },
  out_for_pickup: {
    sms: "Our driver is on the way to pick up your laundry.",
    subject: "Out for pickup – Doorstep Laundry",
    body: "Our driver is on the way to pick up your laundry.",
  },
  picked_up: {
    sms: "Your laundry has been picked up and is on its way to our facility.",
    subject: "Laundry picked up – Doorstep Laundry",
    body: "Your laundry has been picked up and is on its way to our facility.",
  },
  in_progress: {
    sms: "Your laundry is being washed and folded.",
    subject: "In progress – Doorstep Laundry",
    body: "Your laundry is being washed and folded.",
  },
  out_for_delivery: {
    sms: "Your laundry is out for delivery.",
    subject: "Out for delivery – Doorstep Laundry",
    body: "Your laundry is out for delivery.",
  },
  delivered: {
    sms: "Your laundry has been delivered. Thank you!",
    subject: "Delivered – Doorstep Laundry",
    body: "Your laundry has been delivered. Thank you for using Doorstep Laundry!",
  },
  payment_received: {
    sms: "We've received your payment. Your order is confirmed.",
    subject: "Payment received – Order confirmed",
    body: "We've received your payment. Your order is confirmed.",
  },
};

export async function sendOrderNotification(
  orderId: string,
  event: NotifyEvent
): Promise<{ sms?: boolean; email?: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { email: true, name: true, phone: true } },
    },
  });
  if (!order) return {};

  const msg = eventMessages[event];
  if (!msg) return {};

  const result = { sms: false, email: false };
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "notifications@example.com";

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER && order.customer.phone) {
    try {
      const client = Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body: `[${order.orderNumber}] ${msg.sms}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: order.customer.phone,
      });
      result.sms = true;
    } catch (e) {
      console.error("Twilio SMS error:", e);
    }
  }

  if (process.env.RESEND_API_KEY && order.customer.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: fromEmail,
        to: order.customer.email,
        subject: msg.subject,
        text: `Order ${order.orderNumber}: ${msg.body}`,
      });
      result.email = true;
    } catch (e) {
      console.error("Resend email error:", e);
    }
  }

  return result;
}
