import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, organizations, departments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
  createToken,
  setSessionCookie,
  SessionUser,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-post og passord er påkrevd" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Feil e-post eller passord" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Feil e-post eller passord" },
        { status: 401 }
      );
    }

    // Get org and department names
    let organizationName: string | undefined;
    let departmentName: string | undefined;

    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);
      organizationName = org?.name;
    }

    if (user.departmentId) {
      const [dept] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, user.departmentId))
        .limit(1);
      departmentName = dept?.name;
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      departmentId: user.departmentId,
      organizationName,
      departmentName,
    };

    const token = createToken(sessionUser);
    const cookie = setSessionCookie(token);

    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "En feil oppstod. Prøv igjen." },
      { status: 500 }
    );
  }
}
