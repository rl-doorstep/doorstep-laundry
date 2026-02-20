import { NextResponse } from "next/server";
import { getTimeSlots } from "@/lib/slots";

export async function GET() {
  const slots = getTimeSlots();
  return NextResponse.json(slots);
}
