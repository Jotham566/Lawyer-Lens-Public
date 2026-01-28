import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "lawlens-public-frontend",
    timestamp: new Date().toISOString(),
  });
}
