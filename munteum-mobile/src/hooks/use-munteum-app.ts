import { useMemo, useState } from "react";
import {
  AppState,
  Book,
  Note,
  ReadingStatus,
  TabId,
  UserBook,
  getDayKey,
  getMonthKey,
  initialState,
  searchCatalog,
  todayIsoDate,
} from "../lib/munteum-data";
import { usePersistentAppState } from "./use-persistent-app-state";
import { AuthFields, AuthMode, DraftNote, FinishForm, OverlayState, ToastState } from "./munteum-hook-types";
import { useAuthActions } from "./use-auth-actions";
import { useLibraryActions } from "./use-library-actions";
import { useRecordActions } from "./use-record-actions";

export function useMunteumApp() {
  const { state, setState, hydrated, storageError, setStorageError } = usePersistentAppState(initialState);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authFields, setAuthFields] = useState<AuthFields>({ email: "", password: "", nickname: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<"ALL" | ReadingStatus>("ALL");
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDraftBook, setSelectedDraftBook] = useState<Book | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>("READING");
  const [statusDate, setStatusDate] = useState(todayIsoDate());
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [recordDraft, setRecordDraft] = useState<DraftNote>({
    userBookId: "",
    page: "",
    quote: "",
    thought: "",
  });
  const [recordError, setRecordError] = useState<string | null>(null);
  const [finishForm, setFinishForm] = useState<FinishForm>({
    finishedAt: todayIsoDate(),
    rating: 0,
    review: "",
  });

  const currentUser = state.users.find((user) => user.id === state.sessionUserId) ?? null;
  const userBooks = useMemo(
    () => state.userBooks.filter((item) => item.userId === currentUser?.id),
    [currentUser?.id, state.userBooks],
  );
  const booksById = useMemo(
    () => Object.fromEntries(state.books.map((book) => [book.id, book])),
    [state.books],
  );
  const userBooksById = useMemo(
    () => Object.fromEntries(userBooks.map((userBook) => [userBook.id, userBook])),
    [userBooks],
  );
  const userNotes = useMemo(
    () =>
      state.notes
        .filter((note) => Boolean(userBooksById[note.userBookId]))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.notes, userBooksById],
  );
  const notesByUserBookId = useMemo(
    () => Object.fromEntries(userNotes.map((note) => [note.userBookId, note])),
    [userNotes],
  );
  const readingBooks = userBooks.filter((item) => item.status === "READING");
  const currentReadingBook = [...readingBooks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
  const recentNotes = Object.values(notesByUserBookId).slice(0, 3);
  const filteredLibrary = userBooks
    .filter((item) => libraryFilter === "ALL" || item.status === libraryFilter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  function openBookDetail(userBookId: string) {
    const now = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      userBooks: prev.userBooks.map((item) =>
        item.id === userBookId ? { ...item, lastViewedAt: now } : item,
      ),
    }));
    setOverlay({ type: "book", userBookId });
  }

  const selectedBookDetail =
    overlay?.type === "book" ? userBooks.find((item) => item.id === overlay.userBookId) ?? null : null;
  const selectedBookNotes = selectedBookDetail && notesByUserBookId[selectedBookDetail.id] ? [notesByUserBookId[selectedBookDetail.id]] : [];
  const selectedEditNote = overlay?.type === "edit-note" ? userNotes.find((note) => note.id === overlay.noteId) ?? null : null;
  const selectedFinishBook =
    overlay?.type === "finish" ? userBooks.find((item) => item.id === overlay.userBookId) ?? null : null;
  const calendarDaysWithNotes = Array.from(
    new Set(
      userNotes
        .filter((note) => getMonthKey(note.createdAt) === getMonthKey(selectedDate))
        .map((note) => getDayKey(note.createdAt)),
    ),
  );
  const dailyNotes = userNotes.filter((note) => getDayKey(note.createdAt) === selectedDate);
  const currentYear = new Date(selectedDate).getFullYear().toString();
  const stats = {
    finishedBooks: userBooks.filter((item) => item.finishedAt?.startsWith(currentYear)).length,
    notesCount: userNotes.filter((note) => note.createdAt.startsWith(currentYear)).length,
    recordedDays: new Set(
      userNotes.filter((note) => note.createdAt.startsWith(currentYear)).map((note) => getDayKey(note.createdAt)),
    ).size,
  };
  const recentFinished = userBooks
    .filter((item) => item.status === "FINISHED")
    .sort((a, b) => {
      const recentCompare = (b.lastViewedAt ?? "").localeCompare(a.lastViewedAt ?? "");
      if (recentCompare !== 0) {
        return recentCompare;
      }
      return (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "");
    })
    .slice(0, 5);

  const searchResults = searchCatalog.filter((book) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.publisher.toLowerCase().includes(query)
    );
  });

  function showToast(kind: "success" | "error", message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 2200);
  }

  const { handleAuth } = useAuthActions({
    state,
    setState,
    authMode,
    authFields,
    setAuthFields,
    setAuthError,
    showToast,
  });

  const { handleAddBook } = useLibraryActions({
    state,
    setState,
    currentUser,
    userBooks,
    booksById,
    selectedDraftBook,
    selectedStatus,
    statusDate,
    setSelectedDraftBook,
    setSearchQuery,
    setSelectedStatus,
    setStatusDate,
    setOverlay,
    showToast,
  });

  const {
    handleSaveRecord,
    openEditNote,
    handleUpdateNote,
    handleDeleteNote,
    handleFinishBook,
    openQuickRecord,
    openFinishSheet,
  } = useRecordActions({
    setState,
    readingBooks,
    notesByUserBookId,
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
  });

  return {
    hydrated,
    setState,
    currentUser,
    activeTab,
    setActiveTab,
    authMode,
    setAuthMode,
    authFields,
    setAuthFields,
    authError,
    setAuthError,
    libraryFilter,
    setLibraryFilter,
    overlay,
    setOverlay,
    toast,
    searchQuery,
    setSearchQuery,
    selectedDraftBook,
    setSelectedDraftBook,
    selectedStatus,
    setSelectedStatus,
    statusDate,
    setStatusDate,
    selectedDate,
    setSelectedDate,
    recordDraft,
    setRecordDraft,
    recordError,
    finishForm,
    setFinishForm,
    booksById,
    userBooksById,
    readingBooks,
    currentReadingBook,
    recentNotes,
    filteredLibrary,
    openBookDetail,
    selectedBookDetail,
    selectedBookNotes,
    selectedEditNote,
    selectedFinishBook,
    calendarDaysWithNotes,
    dailyNotes,
    stats,
    recentFinished,
    searchResults,
    handleAuth,
    handleAddBook,
    handleSaveRecord,
    openEditNote,
    handleUpdateNote,
    handleDeleteNote,
    handleFinishBook,
    openQuickRecord,
    openFinishSheet,
  };
}
