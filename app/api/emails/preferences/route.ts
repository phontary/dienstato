import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessions";
import {
  getUserEmailPreferences,
  updateUserEmailPreferences,
} from "@/lib/email-service";
import { rateLimit } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request.headers);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = rateLimit(
      request,
      user.id,
      "email-preferences-get"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const preferences = await getUserEmailPreferences(user.id);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching email preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch email preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request.headers);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = rateLimit(
      request,
      user.id,
      "email-preferences-update"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();

    const { monthlyReportEnabled, monthlyReportDay } = body;

    if (monthlyReportDay !== undefined) {
      if (
        typeof monthlyReportDay !== "number" ||
        monthlyReportDay < 1 ||
        monthlyReportDay > 28
      ) {
        return NextResponse.json(
          { error: "Monthly report day must be between 1 and 28" },
          { status: 400 }
        );
      }
    }

    const updates: {
      monthlyReportEnabled?: boolean;
      monthlyReportDay?: number;
    } = {};

    if (monthlyReportEnabled !== undefined) {
      updates.monthlyReportEnabled = monthlyReportEnabled;
    }

    if (monthlyReportDay !== undefined) {
      updates.monthlyReportDay = monthlyReportDay;
    }

    const updatedPreferences = await updateUserEmailPreferences(
      user.id,
      updates
    );

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update email preferences" },
      { status: 500 }
    );
  }
}
