import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calendarNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { eventEmitter, CalendarChangeEvent } from "@/lib/event-emitter";

// GET single calendar note
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db
      .select()
      .from(calendarNotes)
      .where(eq(calendarNotes.id, id));

    if (!result[0]) {
      return NextResponse.json(
        { error: "Calendar note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Failed to fetch calendar note:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar note" },
      { status: 500 }
    );
  }
}

// PUT update calendar note
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { note } = body;

    if (!note) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(calendarNotes)
      .set({
        note,
        updatedAt: new Date(),
      })
      .where(eq(calendarNotes.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Calendar note not found" },
        { status: 404 }
      );
    }

    // Emit event for SSE
    eventEmitter.emit("calendar-change", {
      type: "note",
      action: "update",
      calendarId: updated.calendarId,
      data: updated,
    } as CalendarChangeEvent);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update calendar note:", error);
    return NextResponse.json(
      { error: "Failed to update calendar note" },
      { status: 500 }
    );
  }
}

// DELETE calendar note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .delete(calendarNotes)
      .where(eq(calendarNotes.id, id))
      .returning();

    if (!result[0]) {
      return NextResponse.json(
        { error: "Calendar note not found" },
        { status: 404 }
      );
    }

    // Emit event for SSE
    eventEmitter.emit("calendar-change", {
      type: "note",
      action: "delete",
      calendarId: result[0].calendarId,
      data: { id },
    } as CalendarChangeEvent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete calendar note:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar note" },
      { status: 500 }
    );
  }
}
