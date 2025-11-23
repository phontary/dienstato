"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarNote } from "@/lib/db/schema";
import { formatDateToLocal } from "@/lib/date-utils";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => void;
  onDelete?: () => void;
  selectedDate?: Date;
  note?: CalendarNote;
}

export function NoteDialog({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  selectedDate,
  note,
}: NoteDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (open) {
      setNoteText(note?.note || "");
    }
  }, [open, note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      onSubmit(noteText);
      setNoteText("");
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
    }
  };

  const dateLocale = locale === "de" ? de : enUS;
  const formattedDate = selectedDate
    ? format(selectedDate, "PPP", { locale: dateLocale })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? t("note.edit") : t("note.create")}</DialogTitle>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">{t("note.note")}</Label>
            <Textarea
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t("note.notePlaceholder")}
              className="min-h-[100px]"
              required
            />
          </div>
          <div className="flex justify-between">
            <div>
              {note && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  {t("common.delete")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
