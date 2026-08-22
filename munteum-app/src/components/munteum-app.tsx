"use client";

import { FormEvent, ReactNode, startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  AppState,
  Book,
  Note,
  ReadingStatus,
  STORAGE_KEY,
  TabId,
  User,
  formatDate,
  formatMonthLabel,
  getDayKey,
  getMonthKey,
  initialState,
  makeId,
  normalizeText,
  searchCatalog,
  statusLabels,
  todayIsoDate,
} from "@/lib/munteum-data";

type ToastState = {
  kind: "success" | "error";
  message: string;
} | null;

type DraftBook = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverColor: string;
  accentColor: string;
};

type DraftNote = {
  userBookId: string;
  page: string;
  quote: string;
  thought: string;
};

const navItems: Array<{ id: TabId; label: string }> = [
  { id: "home", label: "홈" },
  { id: "library", label: "책장" },
  { id: "calendar", label: "캘린더" },
  { id: "my", label: "나" },
];

const libraryFilters: Array<{ id: "ALL" | ReadingStatus; label: string }> = [
  { id: "ALL", label: "전체" },
  { id: "READING", label: "읽고 있어요" },
  { id: "FINISHED", label: "다 읽었어요" },
  { id: "WANT_TO_READ", label: "읽고 싶어요" },
];

function readStoredState() {
  if (typeof window === "undefined") {
    return initialState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialState;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    return parsed;
  } catch {
    return initialState;
  }
}

export function MunteumApp() {
  const [state, setState] = useState<AppState>(() => readStoredState());
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFields, setAuthFields] = useState({
    email: "",
    password: "",
    nickname: "",
  });
  const [libraryFilter, setLibraryFilter] = useState<"ALL" | ReadingStatus>("ALL");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDraftBook, setSelectedDraftBook] = useState<DraftBook | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>("READING");
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [statusDate, setStatusDate] = useState(todayIsoDate());
  const [bookDetailId, setBookDetailId] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordDraft, setRecordDraft] = useState<DraftNote>({
    userBookId: "",
    page: "",
    quote: "",
    thought: "",
  });
  const [recordError, setRecordError] = useState<string | null>(null);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [finishBookId, setFinishBookId] = useState<string | null>(null);
  const [finishForm, setFinishForm] = useState({
    finishedAt: todayIsoDate(),
    rating: 0,
    review: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentUser = state.users.find((user) => user.id === state.sessionUserId) ?? null;
  const userBooks = state.userBooks.filter((userBook) => userBook.userId === currentUser?.id);
  const currentUserBookMap = Object.fromEntries(userBooks.map((item) => [item.id, item]));
  const booksById = Object.fromEntries(state.books.map((book) => [book.id, book]));
  const userNotes = state.notes
    .filter((note) => {
      const userBook = currentUserBookMap[note.userBookId];
      return Boolean(userBook);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const libraryItems = userBooks
    .filter((item) => libraryFilter === "ALL" || item.status === libraryFilter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const readingBooks = userBooks.filter((item) => item.status === "READING");
  const currentReadingBook =
    [...readingBooks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
  const recentNotes = userNotes.slice(0, 3);
  const bookDetail = bookDetailId
    ? userBooks.find((userBook) => userBook.id === bookDetailId) ?? null
    : null;
  const bookDetailNotes = bookDetail
    ? userNotes.filter((note) => note.userBookId === bookDetail.id)
    : [];
  const selectedNote = noteEditId ? state.notes.find((note) => note.id === noteEditId) ?? null : null;
  const finishTarget = finishBookId
    ? userBooks.find((userBook) => userBook.id === finishBookId) ?? null
    : null;
  const monthKey = getMonthKey(selectedDate);
  const monthDates = userNotes
    .filter((note) => getMonthKey(note.createdAt) === monthKey)
    .map((note) => getDayKey(note.createdAt));
  const uniqueMonthDates = Array.from(new Set(monthDates));
  const dailyNotes = userNotes.filter((note) => getDayKey(note.createdAt) === selectedDate);
  const finishedBooks = userBooks.filter((item) => item.status === "FINISHED");
  const year = new Date(selectedDate).getFullYear();
  const stats = {
    finishedBooks: finishedBooks.filter((item) => item.finishedAt?.startsWith(String(year))).length,
    notesCount: userNotes.filter((note) => note.createdAt.startsWith(String(year))).length,
    recordedDays: new Set(
      userNotes
        .filter((note) => note.createdAt.startsWith(String(year)))
        .map((note) => getDayKey(note.createdAt)),
    ).size,
  };

  const matchedCatalog = searchCatalog.filter((book) => {
    const query = deferredSearchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.publisher.toLowerCase().includes(query)
    );
  });

  function updateState(updater: (prev: AppState) => AppState) {
    setState((prev) => updater(prev));
  }

  function openToast(kind: "success" | "error", message: string) {
    setToast({ kind, message });
  }

  function resetRecordDraft(userBookId?: string) {
    setRecordDraft({
      userBookId: userBookId ?? readingBooks[0]?.id ?? "",
      page: "",
      quote: "",
      thought: "",
    });
    setRecordError(null);
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        createdAt: new Date().toISOString(),
      };

      updateState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        sessionUserId: newUser.id,
      }));

      setAuthFields({ email: "", password: "", nickname: "" });
      setAuthError(null);
      openToast("success", "회원가입이 완료되었어요.");
      return;
    }

    const matchedUser = state.users.find((user) => user.email === email && user.password === password);
    if (!matchedUser) {
      setAuthError("이메일 또는 비밀번호를 다시 확인해주세요.");
      return;
    }

    updateState((prev) => ({
      ...prev,
      sessionUserId: matchedUser.id,
    }));
    setAuthError(null);
    setAuthFields({ email: "", password: "", nickname: "" });
    openToast("success", "기록해둔 문장으로 돌아왔어요.");
  }

  function handleAddBook() {
    if (!currentUser || !selectedDraftBook) {
      return;
    }

    const duplicate = state.userBooks.find(
      (item) =>
        item.userId === currentUser.id &&
        booksById[item.bookId]?.isbn === selectedDraftBook.isbn,
    );
    if (duplicate) {
      openToast("error", "이미 책장에 놓인 책이에요.");
      return;
    }

    const matchedBook = state.books.find((book) => book.isbn === selectedDraftBook.isbn);
    const bookId = matchedBook?.id ?? makeId("book");
    const now = new Date().toISOString();

    updateState((prev) => ({
      ...prev,
      books: matchedBook
        ? prev.books
        : [
            ...prev.books,
            {
              id: bookId,
              isbn: selectedDraftBook.isbn,
              title: selectedDraftBook.title,
              author: selectedDraftBook.author,
              publisher: selectedDraftBook.publisher,
              coverColor: selectedDraftBook.coverColor,
              accentColor: selectedDraftBook.accentColor,
            },
          ],
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

    setSearchOpen(false);
    setSelectedDraftBook(null);
    setSelectedStatus("READING");
    setStatusDate(todayIsoDate());
    openToast("success", "책장에 책을 놓았어요.");
  }

  function handleSaveRecord() {
    const quote = normalizeText(recordDraft.quote);
    const thought = normalizeText(recordDraft.thought);
    const pageValue = recordDraft.page.trim();

    if (!recordDraft.userBookId) {
      setRecordError("기록할 책을 선택해주세요.");
      return;
    }
    if (!quote && !thought) {
      setRecordError("문장 또는 생각 중 하나는 입력해주세요.");
      return;
    }
    if (pageValue && !/^\d+$/.test(pageValue)) {
      setRecordError("페이지는 숫자만 입력해주세요.");
      return;
    }

    const now = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      notes: [
        {
          id: makeId("note"),
          userBookId: recordDraft.userBookId,
          page: pageValue ? Number(pageValue) : null,
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
    setRecordOpen(false);
    resetRecordDraft();
    openToast("success", "오늘의 문장을 남겨두었어요.");
  }

  function handleUpdateNote() {
    if (!selectedNote) {
      return;
    }

    const quote = normalizeText(recordDraft.quote);
    const thought = normalizeText(recordDraft.thought);
    const pageValue = recordDraft.page.trim();

    if (!quote && !thought) {
      setRecordError("문장 또는 생각 중 하나는 입력해주세요.");
      return;
    }
    if (pageValue && !/^\d+$/.test(pageValue)) {
      setRecordError("페이지는 숫자만 입력해주세요.");
      return;
    }

    const now = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === selectedNote.id
          ? {
              ...note,
              page: pageValue ? Number(pageValue) : null,
              quote,
              thought,
              updatedAt: now,
            }
          : note,
      ),
    }));

    setNoteEditId(null);
    resetRecordDraft();
    openToast("success", "기록을 수정했어요.");
  }

  function handleDeleteNote(noteId: string) {
    updateState((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== noteId),
    }));
    setConfirmDeleteId(null);
    setNoteEditId(null);
    openToast("success", "기록을 삭제했어요.");
  }

  function handleFinishBook() {
    if (!finishTarget) {
      return;
    }

    updateState((prev) => ({
      ...prev,
      userBooks: prev.userBooks.map((item) =>
        item.id === finishTarget.id
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

    setFinishBookId(null);
    setFinishForm({
      finishedAt: todayIsoDate(),
      rating: 0,
      review: "",
    });
    openToast("success", "완독한 책으로 기록했어요.");
  }

  function handleLogout() {
    updateState((prev) => ({
      ...prev,
      sessionUserId: null,
    }));
    setActiveTab("home");
    openToast("success", "로그아웃했어요.");
  }

  function openQuickRecord(userBookId?: string) {
    resetRecordDraft(userBookId);
    setRecordOpen(true);
  }

  function openNoteEditor(note: Note) {
    setRecordDraft({
      userBookId: note.userBookId,
      page: note.page ? String(note.page) : "",
      quote: note.quote ?? "",
      thought: note.thought ?? "",
    });
    setRecordError(null);
    setNoteEditId(note.id);
  }

  function renderBookCover(book: Book, compact?: boolean) {
    return (
      <div
        className={`relative overflow-hidden rounded-[24px] border border-black/5 ${
          compact ? "h-24" : "h-40"
        }`}
        style={{
          background: `linear-gradient(145deg, ${book.coverColor}, white)`,
        }}
      >
        <div
          className="absolute inset-x-4 top-4 h-1 rounded-full"
          style={{ backgroundColor: book.accentColor }}
        />
        <div className="absolute inset-x-4 bottom-4">
          <p className={`line-clamp-2 font-semibold text-slate-900 ${compact ? "text-sm" : "text-lg"}`}>
            {book.title}
          </p>
          <p className="mt-1 text-xs text-slate-600">{book.author}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(242,203,140,0.28),_transparent_38%),linear-gradient(180deg,_#f8f2e8,_#f6efe5_55%,_#efe5d5)] px-5 py-10 text-slate-900">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-between rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-[0_24px_80px_rgba(110,90,60,0.12)] backdrop-blur">
          <div>
            <p className="text-sm tracking-[0.22em] text-amber-900/70">MUNTEUM</p>
            <h1 className="mt-4 font-serif-display text-4xl leading-tight">
              문장 사이,
              <br />
              나의 생각이 머무는 곳.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              책에서 마음에 머문 문장과 생각을 가볍게 남기는 개인 독서 아카이브
            </p>
          </div>

          <div className="mt-8 rounded-[28px] bg-[#fffaf4] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="mb-5 flex gap-2 rounded-full bg-white p-1 text-sm">
              <button
                className={`flex-1 rounded-full px-4 py-2 ${authMode === "login" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError(null);
                }}
                type="button"
              >
                로그인
              </button>
              <button
                className={`flex-1 rounded-full px-4 py-2 ${authMode === "signup" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError(null);
                }}
                type="button"
              >
                회원가입
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleAuthSubmit}>
              <Field
                label="이메일"
                value={authFields.email}
                onChange={(value) => setAuthFields((prev) => ({ ...prev, email: value }))}
                placeholder="you@example.com"
                type="email"
              />
              <Field
                label="비밀번호"
                value={authFields.password}
                onChange={(value) => setAuthFields((prev) => ({ ...prev, password: value }))}
                placeholder="비밀번호를 입력해주세요"
                type="password"
              />
              {authMode === "signup" ? (
                <Field
                  label="닉네임"
                  value={authFields.nickname}
                  onChange={(value) => setAuthFields((prev) => ({ ...prev, nickname: value }))}
                  placeholder="문틈에서 사용할 이름"
                />
              ) : null}
              {authError ? <p className="text-sm text-rose-700">{authError}</p> : null}
              <button className="mt-2 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" type="submit">
                {authMode === "login" ? "로그인" : "회원가입"}
              </button>
            </form>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              체험용 계정은 <span className="font-medium text-slate-700">demo@munteum.app / demo1234</span> 입니다.
            </p>
          </div>
        </div>
        {toast ? <Toast toast={toast} /> : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(201,219,210,0.34),_transparent_26%),radial-gradient(circle_at_top_left,_rgba(251,221,170,0.3),_transparent_25%),linear-gradient(180deg,_#f5ede1,_#f7f2ea_56%,_#efe4d2)] pb-28 text-slate-900">
      <div className="mx-auto max-w-md px-4 pt-5">
        <header className="rounded-[28px] border border-white/65 bg-white/75 px-5 py-4 shadow-[0_24px_60px_rgba(89,70,44,0.08)] backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.22em] text-amber-900/60">MUNTEUM</p>
              <h1 className="mt-2 font-serif-display text-2xl">문장 사이, 생각이 머무는 책장</h1>
            </div>
            <button
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
              onClick={handleLogout}
              type="button"
            >
              로그아웃
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">{currentUser.nickname}님의 조용한 기록을 다시 꺼내보세요.</p>
        </header>

        <main className="mt-4 space-y-4">
          {activeTab === "home" ? (
            <section className="space-y-4">
              <Card>
                <SectionTitle title="지금 읽고 있는 책" actionLabel={currentReadingBook ? "기록 남기기" : undefined} onAction={currentReadingBook ? () => openQuickRecord(currentReadingBook.id) : undefined} />
                {currentReadingBook ? (
                  <button
                    className="mt-4 block w-full text-left"
                    onClick={() => setBookDetailId(currentReadingBook.id)}
                    type="button"
                  >
                    {renderBookCover(booksById[currentReadingBook.bookId])}
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{booksById[currentReadingBook.bookId].title}</h3>
                        <p className="text-sm text-slate-600">{booksById[currentReadingBook.bookId].author}</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {currentReadingBook.startedAt ? `시작 ${formatDate(currentReadingBook.startedAt)}` : statusLabels[currentReadingBook.status]}
                      </p>
                    </div>
                  </button>
                ) : (
                  <EmptyState
                    title="지금 읽고 있는 책이 없어요."
                    description="책장에 책을 놓고 기록을 시작해보세요."
                    actionLabel="책장에 책 놓기"
                    onAction={() => {
                      setActiveTab("library");
                      setSearchOpen(true);
                    }}
                  />
                )}
              </Card>

              <Card>
                <SectionTitle title="최근 기록" />
                {recentNotes.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {recentNotes.map((note) => {
                      const userBook = currentUserBookMap[note.userBookId];
                      const book = booksById[userBook.bookId];
                      return (
                        <button
                          className="w-full rounded-[24px] border border-slate-200/80 bg-[#fcfaf6] p-4 text-left"
                          key={note.id}
                          onClick={() => openNoteEditor(note)}
                          type="button"
                        >
                          <p className="line-clamp-2 text-sm leading-6 text-slate-800">{note.quote ?? note.thought}</p>
                          <p className="mt-3 text-xs text-slate-500">
                            {book.title}
                            {note.page ? ` · p.${note.page}` : ""}
                            {` · ${formatDate(note.createdAt)}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="아직 머문 문장이 없어요."
                    description="마음에 남은 문장이나 생각을 가볍게 남겨보세요."
                    actionLabel="첫 기록 남기기"
                    onAction={() => openQuickRecord()}
                  />
                )}
              </Card>
            </section>
          ) : null}

          {activeTab === "library" ? (
            <section className="space-y-4">
              <Card>
                <SectionTitle title="책장" actionLabel="+ 책 추가" onAction={() => setSearchOpen(true)} />
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {libraryFilters.map((filter) => (
                    <button
                      className={`rounded-full px-4 py-2 text-sm ${
                        libraryFilter === filter.id ? "bg-slate-900 text-white" : "bg-[#f7f1e6] text-slate-600"
                      }`}
                      key={filter.id}
                      onClick={() => setLibraryFilter(filter.id)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {libraryItems.length > 0 ? (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {libraryItems.map((item) => {
                      const book = booksById[item.bookId];
                      return (
                        <button
                          className="text-left"
                          key={item.id}
                          onClick={() => setBookDetailId(item.id)}
                          type="button"
                        >
                          {renderBookCover(book, true)}
                          <p className="mt-3 line-clamp-2 font-medium">{book.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{book.author}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="아직 책장이 비어 있어요."
                    description="첫 번째 책을 책장에 놓아볼까요?"
                    actionLabel="책 찾아보기"
                    onAction={() => setSearchOpen(true)}
                  />
                )}
              </Card>
            </section>
          ) : null}

          {activeTab === "calendar" ? (
            <section className="space-y-4">
              <Card>
                <SectionTitle title="캘린더" />
                <div className="mt-4 rounded-[24px] bg-[#fcfaf6] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{formatMonthLabel(selectedDate)}</h3>
                    <input
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                      onChange={(event) => setSelectedDate(event.target.value)}
                      type="date"
                      value={selectedDate}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <p key={day}>{day}</p>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-2">
                    {buildCalendarCells(selectedDate).map((cell) => {
                      if (cell.empty) {
                        return <div className="rounded-2xl" key={cell.value} />;
                      }

                      const hasNote = uniqueMonthDates.includes(cell.value);
                      const isSelected = cell.value === selectedDate;
                      return (
                        <button
                          className={`rounded-2xl px-2 py-3 text-center text-sm ${
                            isSelected ? "bg-slate-900 text-white" : "bg-white text-slate-700"
                          }`}
                          key={cell.value}
                          onClick={() => setSelectedDate(cell.value)}
                          type="button"
                        >
                          <div>{cell.day}</div>
                          <div className={`mx-auto mt-1 h-1.5 w-1.5 rounded-full ${hasNote ? (isSelected ? "bg-amber-200" : "bg-[#143642]") : "bg-transparent"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle title={`${new Date(selectedDate).getMonth() + 1}월 ${new Date(selectedDate).getDate()}일의 기록`} />
                {dailyNotes.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {dailyNotes.map((note) => {
                      const userBook = currentUserBookMap[note.userBookId];
                      const book = booksById[userBook.bookId];
                      return (
                        <button
                          className="w-full rounded-[24px] border border-slate-200/80 bg-[#fcfaf6] p-4 text-left"
                          key={note.id}
                          onClick={() => openNoteEditor(note)}
                          type="button"
                        >
                          <p className="text-sm font-medium text-slate-800">{book.title}</p>
                          {note.page ? <p className="mt-1 text-xs text-slate-500">p.{note.page}</p> : null}
                          <p className="mt-3 text-sm leading-6 text-slate-700">{note.quote ?? note.thought}</p>
                          {note.quote && note.thought ? <p className="mt-2 text-sm leading-6 text-slate-500">{note.thought}</p> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title={uniqueMonthDates.length > 0 ? "이 날짜에는 기록이 없어요." : "이번 달에는 아직 남겨둔 문장이 없어요."}
                    description={uniqueMonthDates.length > 0 ? "다른 날짜를 선택해보세요." : "기록을 남기면 날짜별로 다시 볼 수 있어요."}
                  />
                )}
              </Card>
            </section>
          ) : null}

          {activeTab === "my" ? (
            <section className="space-y-4">
              <Card>
                <SectionTitle title="올해의 기록" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <StatCard label="읽은 책" value={stats.finishedBooks} />
                  <StatCard label="남긴 기록" value={stats.notesCount} />
                  <StatCard label="기록한 날" value={stats.recordedDays} />
                </div>
              </Card>

              <Card>
                <SectionTitle title="최근 읽은 책" />
                {finishedBooks.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {finishedBooks
                      .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
                      .slice(0, 5)
                      .map((item) => (
                        <button className="text-left" key={item.id} onClick={() => setBookDetailId(item.id)} type="button">
                          {renderBookCover(booksById[item.bookId], true)}
                        </button>
                      ))}
                  </div>
                ) : (
                  <EmptyState title="아직 다 읽은 책이 없어요." description="한 권을 끝까지 읽고 이곳에 남겨보세요." />
                )}
              </Card>

              <Card>
                <SectionTitle title="설정" />
                <div className="mt-4 space-y-2">
                  {["프로필", "비밀번호 변경"].map((label) => (
                    <div className="rounded-[22px] bg-[#fcfaf6] px-4 py-3 text-sm text-slate-600" key={label}>
                      {label}
                    </div>
                  ))}
                  <button
                    className="w-full rounded-[22px] bg-[#fcfaf6] px-4 py-3 text-left text-sm text-slate-600"
                    onClick={handleLogout}
                    type="button"
                  >
                    로그아웃
                  </button>
                </div>
              </Card>
            </section>
          ) : null}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md px-4 pb-5">
        <div className="rounded-[28px] border border-white/65 bg-white/88 p-3 shadow-[0_-10px_40px_rgba(83,67,44,0.08)] backdrop-blur">
          <div className="grid grid-cols-5 items-center text-center text-xs text-slate-500">
            {navItems.slice(0, 2).map((item) => (
              <button
                className={activeTab === item.id ? "font-semibold text-slate-900" : ""}
                key={item.id}
                onClick={() => startTransition(() => setActiveTab(item.id))}
                type="button"
              >
                {item.label}
              </button>
            ))}
            <button
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#143642] text-lg font-semibold text-white shadow-lg shadow-[#143642]/30"
              onClick={() => openQuickRecord()}
              type="button"
            >
              +
            </button>
            {navItems.slice(2).map((item) => (
              <button
                className={activeTab === item.id ? "font-semibold text-slate-900" : ""}
                key={item.id}
                onClick={() => startTransition(() => setActiveTab(item.id))}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {searchOpen ? (
        <Overlay title={selectedDraftBook ? "책장에 놓기" : "책 검색"} onClose={() => {
          setSearchOpen(false);
          setSelectedDraftBook(null);
        }}>
          {!selectedDraftBook ? (
            <>
              <Field
                label="책 검색"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="책 제목 또는 저자를 입력해주세요"
              />
              <div className="mt-4 space-y-3">
                {matchedCatalog.length > 0 ? (
                  matchedCatalog.map((book) => (
                    <button
                      className="flex w-full items-center gap-3 rounded-[24px] bg-[#fcfaf6] p-3 text-left"
                      key={book.id}
                      onClick={() => {
                        setSelectedDraftBook(book);
                        setSelectedStatus("READING");
                      }}
                      type="button"
                    >
                      <div className="w-20 shrink-0">{renderBookCover(book, true)}</div>
                      <div>
                        <p className="font-medium">{book.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{book.author}</p>
                        <p className="mt-1 text-xs text-slate-500">{book.publisher}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <EmptyState title="검색 결과가 없어요." description="다른 제목이나 저자로 다시 찾아보세요." />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-[28px] bg-[#fcfaf6] p-4">
                {renderBookCover(selectedDraftBook)}
                <h3 className="mt-4 font-medium">{selectedDraftBook.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedDraftBook.author}</p>
              </div>
              <div className="mt-4 space-y-2">
                {(["WANT_TO_READ", "READING", "FINISHED"] as ReadingStatus[]).map((status) => (
                  <button
                    className={`flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left ${
                      selectedStatus === status ? "bg-slate-900 text-white" : "bg-[#fcfaf6] text-slate-700"
                    }`}
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    type="button"
                  >
                    <span>{statusLabels[status]}</span>
                    <span>{selectedStatus === status ? "선택됨" : ""}</span>
                  </button>
                ))}
              </div>
              {selectedStatus !== "WANT_TO_READ" ? (
                <div className="mt-4">
                  <Field
                    label={selectedStatus === "READING" ? "독서 시작일" : "완독일"}
                    onChange={setStatusDate}
                    type="date"
                    value={statusDate}
                  />
                </div>
              ) : null}
              <button className="mt-4 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={handleAddBook} type="button">
                책장에 놓기
              </button>
            </>
          )}
        </Overlay>
      ) : null}

      {recordOpen ? (
        <Overlay title="기록 남기기" onClose={() => setRecordOpen(false)}>
          {readingBooks.length === 0 ? (
            <EmptyState
              title="기록할 책이 아직 없어요."
              description="먼저 책장에 책을 놓아주세요."
              actionLabel="책장에 책 놓기"
              onAction={() => {
                setRecordOpen(false);
                setActiveTab("library");
                setSearchOpen(true);
              }}
            />
          ) : (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">기록할 책</label>
                <div className="grid gap-2">
                  {readingBooks.map((item) => {
                    const book = booksById[item.bookId];
                    return (
                      <button
                        className={`rounded-[22px] border px-4 py-3 text-left ${
                          recordDraft.userBookId === item.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-[#fcfaf6]"
                        }`}
                        key={item.id}
                        onClick={() => setRecordDraft((prev) => ({ ...prev, userBookId: item.id }))}
                        type="button"
                      >
                        <p className="font-medium">{book.title}</p>
                        <p className={`mt-1 text-sm ${recordDraft.userBookId === item.id ? "text-slate-200" : "text-slate-500"}`}>{book.author}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <Field
                  label="페이지"
                  value={recordDraft.page}
                  onChange={(value) => setRecordDraft((prev) => ({ ...prev, page: value }))}
                  placeholder="예: 132"
                />
                <TextareaField
                  label="마음에 머문 문장"
                  value={recordDraft.quote}
                  onChange={(value) => setRecordDraft((prev) => ({ ...prev, quote: value }))}
                  placeholder="마음에 남은 문장을 적어보세요"
                />
                <TextareaField
                  label="나의 생각"
                  value={recordDraft.thought}
                  onChange={(value) => setRecordDraft((prev) => ({ ...prev, thought: value }))}
                  placeholder="그때 떠오른 생각을 남겨보세요"
                />
                <p className="text-sm text-slate-500">문장과 생각 중 하나는 꼭 남겨야 해요.</p>
                {recordError ? <p className="text-sm text-rose-700">{recordError}</p> : null}
                <button className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={handleSaveRecord} type="button">
                  남겨두기
                </button>
              </div>
            </>
          )}
        </Overlay>
      ) : null}

      {bookDetail ? (
        <Overlay title="책 상세" onClose={() => setBookDetailId(null)}>
          <div className="rounded-[28px] bg-[#fcfaf6] p-4">
            {renderBookCover(booksById[bookDetail.bookId])}
            <div className="mt-4 space-y-1">
              <h3 className="font-medium">{booksById[bookDetail.bookId].title}</h3>
              <p className="text-sm text-slate-600">{booksById[bookDetail.bookId].author}</p>
              <p className="text-xs text-slate-500">{statusLabels[bookDetail.status]}</p>
              {bookDetail.startedAt ? <p className="text-xs text-slate-500">독서 시작일 {formatDate(bookDetail.startedAt)}</p> : null}
              {bookDetail.finishedAt ? <p className="text-xs text-slate-500">완독일 {formatDate(bookDetail.finishedAt)}</p> : null}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={() => openQuickRecord(bookDetail.id)} type="button">
              기록 남기기
            </button>
            {bookDetail.status !== "FINISHED" ? (
              <button
                className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                onClick={() => {
                  setFinishBookId(bookDetail.id);
                  setFinishForm({
                    finishedAt: todayIsoDate(),
                    rating: bookDetail.rating ?? 0,
                    review: bookDetail.review ?? "",
                  });
                }}
                type="button"
              >
                다 읽었어요
              </button>
            ) : null}
          </div>
          <div className="mt-5">
            <SectionTitle title="남긴 기록" />
            {bookDetailNotes.length > 0 ? (
              <div className="mt-3 space-y-3">
                {bookDetailNotes.map((note) => (
                  <div className="rounded-[24px] bg-[#fcfaf6] p-4" key={note.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {note.page ? <p className="text-xs text-slate-500">p.{note.page}</p> : null}
                        <p className="mt-2 text-sm leading-6 text-slate-800">{note.quote ?? note.thought}</p>
                        {note.quote && note.thought ? <p className="mt-2 text-sm leading-6 text-slate-500">{note.thought}</p> : null}
                        <p className="mt-3 text-xs text-slate-500">{formatDate(note.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button className="text-xs text-slate-500" onClick={() => openNoteEditor(note)} type="button">
                          수정
                        </button>
                        <button className="text-xs text-rose-700" onClick={() => setConfirmDeleteId(note.id)} type="button">
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="아직 이 책에 남겨둔 기록이 없어요." description="마음에 머문 문장이나 생각을 남겨보세요." />
            )}
          </div>
        </Overlay>
      ) : null}

      {selectedNote ? (
        <Overlay title="기록 수정" onClose={() => setNoteEditId(null)}>
          <div className="space-y-3">
            <Field
              label="페이지"
              value={recordDraft.page}
              onChange={(value) => setRecordDraft((prev) => ({ ...prev, page: value }))}
              placeholder="예: 132"
            />
            <TextareaField
              label="마음에 머문 문장"
              value={recordDraft.quote}
              onChange={(value) => setRecordDraft((prev) => ({ ...prev, quote: value }))}
              placeholder="마음에 남은 문장을 적어보세요"
            />
            <TextareaField
              label="나의 생각"
              value={recordDraft.thought}
              onChange={(value) => setRecordDraft((prev) => ({ ...prev, thought: value }))}
              placeholder="그때 떠오른 생각을 남겨보세요"
            />
            {recordError ? <p className="text-sm text-rose-700">{recordError}</p> : null}
            <button className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={handleUpdateNote} type="button">
              저장하기
            </button>
            <button className="w-full rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" onClick={() => setConfirmDeleteId(selectedNote.id)} type="button">
              삭제하기
            </button>
          </div>
        </Overlay>
      ) : null}

      {finishTarget ? (
        <Overlay title="다 읽었어요" onClose={() => setFinishBookId(null)}>
          <div className="rounded-[28px] bg-[#fcfaf6] p-4">
            <p className="font-medium">{booksById[finishTarget.bookId].title}</p>
            <p className="mt-1 text-sm text-slate-600">{booksById[finishTarget.bookId].author}</p>
          </div>
          <div className="mt-4 space-y-3">
            <Field
              label="완독일"
              value={finishForm.finishedAt}
              onChange={(value) => setFinishForm((prev) => ({ ...prev, finishedAt: value }))}
              type="date"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">별점</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    className={`rounded-2xl px-3 py-3 text-sm ${finishForm.rating === value ? "bg-slate-900 text-white" : "bg-[#fcfaf6] text-slate-600"}`}
                    key={value}
                    onClick={() => setFinishForm((prev) => ({ ...prev, rating: value }))}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <TextareaField
              label="한줄평"
              value={finishForm.review}
              onChange={(value) => setFinishForm((prev) => ({ ...prev, review: value }))}
              placeholder="짧게 남겨도 괜찮아요"
            />
            <button className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={handleFinishBook} type="button">
              완료
            </button>
          </div>
        </Overlay>
      ) : null}

      {confirmDeleteId ? (
        <Overlay title="이 기록을 삭제할까요?" onClose={() => setConfirmDeleteId(null)} compact>
          <p className="text-sm leading-6 text-slate-600">삭제한 기록은 다시 되돌릴 수 없어요.</p>
          <div className="mt-5 flex gap-2">
            <button className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700" onClick={() => setConfirmDeleteId(null)} type="button">
              취소
            </button>
            <button className="flex-1 rounded-full bg-rose-700 px-4 py-3 text-sm font-medium text-white" onClick={() => handleDeleteNote(confirmDeleteId)} type="button">
              삭제
            </button>
          </div>
        </Overlay>
      ) : null}

      {toast ? <Toast toast={toast} /> : null}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-[28px] border border-white/65 bg-white/78 p-5 shadow-[0_24px_60px_rgba(89,70,44,0.08)] backdrop-blur">{children}</section>;
}

function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-serif-display text-xl">{title}</h2>
      {actionLabel ? (
        <button className="rounded-full bg-[#f2e5d0] px-3 py-2 text-xs font-medium text-slate-700" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-[20px] border border-slate-200 bg-[#fcfaf6] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="min-h-28 w-full resize-none rounded-[20px] border border-slate-200 bg-[#fcfaf6] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[24px] bg-[#fcfaf6] px-5 py-8 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel ? (
        <button className="mt-4 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function Overlay({
  children,
  title,
  onClose,
  compact,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/28 backdrop-blur-[2px]">
      <div className={`mx-auto w-full max-w-md rounded-t-[36px] bg-white px-5 pb-8 pt-5 shadow-2xl ${compact ? "min-h-0" : "min-h-[40vh]"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif-display text-2xl">{title}</h3>
          <button className="rounded-full bg-[#f2e5d0] px-3 py-2 text-xs text-slate-700" onClick={onClose} type="button">
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] bg-[#fcfaf6] p-4 text-center">
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function Toast({ toast }: { toast: NonNullable<ToastState> }) {
  return (
    <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 px-4">
      <div
        className={`rounded-full px-4 py-3 text-sm font-medium shadow-lg ${
          toast.kind === "success" ? "bg-slate-900 text-white" : "bg-rose-700 text-white"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}

function buildCalendarCells(selectedDate: string) {
  const date = new Date(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();
  const cells: Array<{ day: number | null; value: string; empty: boolean }> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      day: null,
      value: `empty-${year}-${month + 1}-${index}`,
      empty: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      value: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      empty: false,
    });
  }

  return cells;
}
