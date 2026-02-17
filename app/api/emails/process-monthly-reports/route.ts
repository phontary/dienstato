import { NextRequest, NextResponse } from "next/server";
import { processMonthlyReports } from "@/lib/monthly-email-scheduler";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret-key";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      );
    }

    const result = await processMonthlyReports();

    return NextResponse.json({
      success: true,
      message: "Monthly reports processed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error processing monthly reports:", error);
    return NextResponse.json(
      { error: "Failed to process monthly reports" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
