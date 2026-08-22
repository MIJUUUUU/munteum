import { useEffect, useMemo, useState } from "react";
import {
  Book,
  Note,
  ReadingStatus,
  TabId,
  User,
  UserBook,
  getDayKey,
  getMonthKey,
  initialState,
  makeId,
  normalizeText,
  searchCatalog,
  todayIsoDate,
} from "../lib/munteum-data";
import { usePersistentAppState } from "./use-persistent-app-state";
import { createDefaultFinishForm } from "../screens/overlay-sheets";

export type ToastState = { kind: "success" | "error"; message: string } | null;

export type DraftNote = {
  userBookId: string;
  page: string;
  quote: string;
  thought: string;
};

export type OverlayState =
  | { type: "search" }
  | { type: "record" }
  | { type: "book"; userBookId: string }
  | { type: "edit-note"; noteId: string }
  | { type: "finish"; userBookId: string }
  | { type: "delete-note"; noteId: string }
  | null;

export function useMunteumApp() {
  const { state, setState, hydrated, storageError, setStorageError } = usePersistentAppState(initialState);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authFields, setAuthFields] = useState({ email: "", password: "", nickname: "" });
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
  const [finishForm, setFinishForm] = useState({
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
  const readingBooks = userBooks.filter((item) => item.status === "READING");
  const currentReadingBook = [...readingBooks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
  const recentNotes = userNotes.slice(0, 3);
  const filteredLibrary = userBooks
    .filter((item) => libraryFilter === "ALL" || item.status === libraryFilter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const selectedBookDetail =
    overlay?.type === "book" ? userBooks.find((item) => item.id === overlay.userBookId) ?? null : null;
  const selectedBookNotes = selectedBookDetail
    ? userNotes.filter((note) => note.userBookId === selectedBookDetail.id)
    : [];
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
    .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
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

  useEffect(() => {
    if (!storageError) {
      return;
    }

    setToast({ kind: "error", message: storageError });
    setStorageError(null);
  }, [setStorageError, storageError]);

  function resetRecordDraft(userBookId?: string) {
    setRecordDraft({
      userBookId: userBookId ?? readingBooks[0]?.id ?? "",
      page: "",
      quote: "",
      thought: "",
    });
    setRecordError(null);
  }

  function handleAuth() {
    const email = authFields.email.trim().toLowerCase();
    const password = authFields.password.trim();
    const nickname = authFields.nickname.trim();

    if (!email) {
      setAuthError("이메일을 입력해주세요.");
      return;
    }
    if (!password) {
      setAuthError("비밀번호를 입력해주세요.");
      return;
    }

    if (authMode === "signup") {
      if (password.length < 8) {
        setAuthError("비밀번호는 8자 이상 입력해주세요.");
        return;
      }
      if (!nickname) {
        setAuthError("닉네임을 입력해주세요.");
        return;
      }
      if (state.users.some((user) => user.email === email)) {
        setAuthError("이미 사용 중인 이메일이에요.");
        return;
      }

      const newUser: User = {
        id: makeId("user"),
        email,
        nickname,
        password,
      };
      setState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        sessionUserId: newUser.id,
      }));
      setAuthFields({ email: "", password: "", nickname: "" });
      setAuthError(null);
      showToast("success", "회원가입이 완료되었어요.");
      return;
    }

    const user = state.users.find((item) => item.email === email && item.password === password);
    if (!user) {
      setAuthError("이메일 또는 비밀번호를 다시 확인해주세요.");
      return;
    }

    setState((prev) => ({ ...prev, sessionUserId: user.id }));
    setAuthFields({ email: "", password: "", nickname: "" });
    setAuthError(null);
    showToast("success", "기록해둔 문장으로 돌아왔어요.");
  }

  function handleAddBook() {
    if (!currentUser || !selectedDraftBook) {
      return;
    }

    const duplicate = userBooks.some((item) => booksById[item.bookId]?.isbn === selectedDraftBook.isbn);
    if (duplicate) {
      showToast("error", "이미 책장에 놓인 책이에요.");
      return;
    }

    const existingBook = state.books.find((book) => book.isbn === selectedDraftBook.isbn);
    const bookId = existingBook?.id ?? makeId("book");
    const now = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      books: existingBook ? prev.books : [...prev.books, { ...selectedDraftBook, id: bookId }],
      userBooks: [
        ...prev.userBooks,
        {
          id: makeId("user-book"),
          userId: currentUser.id,
          bookId,
          status: selectedStatus,
          startedAt: selectedStatus === "READING" ? statusDate : null,
          finishedAt: selectedStatus === "FINISHED" ? statusDate : null,
          rating: null,
          review: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    }));
    setSelectedDraftBook(null);
    setSearchQuery("");
    setSelectedStatus("READING");
    setStatusDate(todayIsoDate());
    setOverlay(null);
    showToast("success", "책장에 책을 놓았어요.");
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
