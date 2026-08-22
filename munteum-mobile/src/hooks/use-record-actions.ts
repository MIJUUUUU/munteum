import { createDefaultFinishForm } from "../screens/overlay-sheets";
import { DraftNote, FinishForm, OverlayState, SetAppState, ShowToast } from "./munteum-hook-types";
import { Note, UserBook, makeId, normalizeText, todayIsoDate } from "../lib/munteum-data";

export function useRecordActions({
  setState,
  readingBooks,
  recordDraft,
  setRecordDraft,
  setRecordError,
  selectedEditNote,
  selectedFinishBook,
  finishForm,
  setFinishForm,
  setSelectedDate,
  setOverlay,
  showToast,
}: {
  setState: SetAppState;
  readingBooks: UserBook[];
  recordDraft: DraftNote;
  setRecordDraft: (value: DraftNote) => void;
  setRecordError: (value: string | null) => void;
  selectedEditNote: Note | null;
  selectedFinishBook: UserBook | null;
  finishForm: FinishForm;
  setFinishForm: (value: FinishForm) => void;
  setSelectedDate: (value: string) => void;
  setOverlay: (overlay: OverlayState) => void;
  showToast: ShowToast;
}) {
  function resetRecordDraft(userBookId?: string) {
    setRecordDraft({
      userBookId: userBookId ?? readingBooks[0]?.id ?? "",
      page: "",
      quote: "",
      thought: "",
    });
    setRecordError(null);
  }

  function handleSaveRecord() {
    const quote = normalizeText(recordDraft.quote);
    const thought = normalizeText(recordDraft.thought);
    const page = recordDraft.page.trim();

    if (!recordDraft.userBookId) {
      setRecordError("기록할 책을 선택해주세요.");
      return;
    }
    if (!quote && !thought) {
      setRecordError("문장 또는 생각 중 하나는 입력해주세요.");
      return;
    }
    if (page && !/^\d+$/.test(page)) {
      setRecordError("페이지는 숫자만 입력해주세요.");
      return;
    }

    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notes: [
        {
          id: makeId("note"),
          userBookId: recordDraft.userBookId,
          page: page ? Number(page) : null,
          quote,
          thought,
          createdAt: now,
          updatedAt: now,
        },
        ...prev.notes,
      ],
      userBooks: prev.userBooks.map((item) =>
        item.id === recordDraft.userBookId ? { ...item, updatedAt: now } : item,
      ),
    }));
    setSelectedDate(todayIsoDate());
    setOverlay(null);
    resetRecordDraft();
    showToast("success", "오늘의 문장을 남겨두었어요.");
  }

  function openEditNote(note: Note) {
    setRecordDraft({
      userBookId: note.userBookId,
      page: note.page ? String(note.page) : "",
      quote: note.quote ?? "",
      thought: note.thought ?? "",
    });
    setRecordError(null);
    setOverlay({ type: "edit-note", noteId: note.id });
  }

  function handleUpdateNote() {
    if (!selectedEditNote) {
      return;
    }

    const quote = normalizeText(recordDraft.quote);
    const thought = normalizeText(recordDraft.thought);
    const page = recordDraft.page.trim();

    if (!quote && !thought) {
      setRecordError("문장 또는 생각 중 하나는 입력해주세요.");
      return;
    }
    if (page && !/^\d+$/.test(page)) {
      setRecordError("페이지는 숫자만 입력해주세요.");
      return;
    }

    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === selectedEditNote.id
          ? {
              ...note,
              page: page ? Number(page) : null,
              quote,
              thought,
              updatedAt: now,
            }
          : note,
      ),
    }));
    setOverlay(null);
    resetRecordDraft();
    showToast("success", "기록을 수정했어요.");
  }

  function handleDeleteNote(noteId: string) {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== noteId),
    }));
    setOverlay(null);
    showToast("success", "기록을 삭제했어요.");
  }

  function handleFinishBook() {
    if (!selectedFinishBook) {
      return;
    }

    setState((prev) => ({
      ...prev,
      userBooks: prev.userBooks.map((item) =>
        item.id === selectedFinishBook.id
          ? {
              ...item,
              status: "FINISHED",
              finishedAt: finishForm.finishedAt,
              rating: finishForm.rating || null,
              review: normalizeText(finishForm.review),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
    setOverlay(null);
    setFinishForm({ finishedAt: todayIsoDate(), rating: 0, review: "" });
    showToast("success", "완독한 책으로 기록했어요.");
  }

  function openQuickRecord(userBookId?: string) {
    resetRecordDraft(userBookId);
    setOverlay({ type: "record" });
  }

  function openFinishSheet(userBook: UserBook) {
    setFinishForm(createDefaultFinishForm(userBook));
    setOverlay({ type: "finish", userBookId: userBook.id });
  }

  return {
    handleSaveRecord,
    openEditNote,
    handleUpdateNote,
    handleDeleteNote,
    handleFinishBook,
    openQuickRecord,
    openFinishSheet,
  };
}
