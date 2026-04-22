import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const periodos = await prisma.periodo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: periodos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar períodos" },
      { status: 500 },
    );
  }
}
