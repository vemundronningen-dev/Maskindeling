import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, organizations, departments } from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      organization: { id: organizations.id, name: organizations.name },
      department: { id: departments.id, name: departments.name },
    })
    .from(users)
    .leftJoin(organizations, eq(users.organizationId, organizations.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .orderBy(users.name);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role, organizationId, departmentId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Navn, e-post og passord er påkrevd" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role || "bruker",
        organizationId: organizationId ? parseInt(organizationId) : null,
        departmentId: departmentId ? parseInt(departmentId) : null,
      })
      .returning();

    const { passwordHash: _, ...userWithoutHash } = user;
    return NextResponse.json(userWithoutHash, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("unique")) {
      return NextResponse.json(
        { error: "E-postadressen er allerede i bruk" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Kunne ikke opprette bruker" },
      { status: 500 }
    );
  }
}
