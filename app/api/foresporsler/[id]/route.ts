import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { machineRequests } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  const { id } = await params;
  const requestId = parseInt(id);

  try {
    const body = await request.json();
    const { status } = body;

    if (!["sendt", "godkjent", "avslått"].includes(status)) {
      return NextResponse.json({ error: "Ugyldig status" }, { status: 400 });
    }

    const [updated] = await db
      .update(machineRequests)
      .set({ status })
      .where(eq(machineRequests.id, requestId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Forespørsel ikke funnet" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere forespørsel" },
      { status: 500 }
    );
  }
}
