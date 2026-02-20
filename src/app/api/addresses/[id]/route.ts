import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const address = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { label, street, city, state, zip, isDefault } = body as {
      label?: string;
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      isDefault?: boolean;
    };

    const data: {
      label?: string;
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      isDefault?: boolean;
    } = {};
    if (label != null) data.label = String(label);
    if (street != null) data.street = String(street);
    if (city != null) data.city = String(city);
    if (state != null) data.state = String(state);
    if (zip != null) data.zip = String(zip);
    if (isDefault != null) data.isDefault = Boolean(isDefault);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(address);
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Update address error:", e);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const address = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const inUse = await prisma.order.findFirst({
    where: {
      OR: [{ pickupAddressId: id }, { deliveryAddressId: id }],
    },
  });
  if (inUse) {
    return NextResponse.json(
      { error: "Address is used by an order and cannot be deleted" },
      { status: 400 }
    );
  }

  try {
    await prisma.address.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("Delete address error:", e);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
