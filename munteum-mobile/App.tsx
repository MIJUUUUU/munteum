import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Book,
  Note,
  ReadingStatus,
  TabId,
  User,
  formatDate,
  formatMonthLabel,
  getDayKey,
  getMonthKey,
  initialState,
  libraryFilters,
  makeId,
  navItems,
  normalizeText,
  searchCatalog,
  statusLabels,
  todayIsoDate,
} from "./src/lib/munteum-data";
import { usePersistentAppState } from "./src/hooks/use-persistent-app-state";
import { COLORS, styles } from "./src/styles/munteum-styles";
import {
  BookCover,
  EmptyState,
  Input,
  NavButton,
  Overlay,
  Toast,
} from "./src/components/munteum-ui";
import { AuthScreen } from "./src/screens/auth-screen";
import { CalendarScreen, HomeScreen, LibraryScreen, MyScreen } from "./src/screens/tab-screens";

type ToastState = { kind: "success" | "error"; message: string } | null;
type DraftBook = Book | null;

type DraftNote = {
  userBookId: string;
  page: string;
  quote: string;
  thought: string;
};

type OverlayState =
  | { type: "search" }
  | { type: "record" }
  | { type: "book"; userBookId: string }
  | { type: "edit-note"; noteId: string }
  | { type: "finish"; userBookId: string }
  | { type: "delete-note"; noteId: string }
  | null;

export default function App() {
  const { state, setState, hydrated, storageError, setStorageError } = usePersistentAppState(initialState);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authFields, setAuthFields] = useState({ email: "", password: "", nickname: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<"ALL" | ReadingStatus>("ALL");
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDraftBook, setSelectedDraftBook] = useState<DraftBook>(null);
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

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.loadingSafe}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <Text style={styles.wordmark}>MUNTEUM</Text>
          <Text style={styles.loadingTitle}>문틈을 준비하고 있어요.</Text>
          <Text style={styles.authDescription}>저장해둔 책장과 기록을 불러오는 중입니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen
          authMode={authMode}
          authFields={authFields}
          authError={authError}
          onModeChange={(mode) => {
            setAuthMode(mode);
            setAuthError(null);
          }}
          onFieldChange={(field, value) => setAuthFields((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleAuth}
          toast={toast}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>MUNTEUM</Text>
            <Text style={styles.headerTitle}>문장 사이, 생각이 머무는 책장</Text>
            <Text style={styles.headerSubtitle}>{currentUser.nickname}님의 조용한 기록을 다시 꺼내보세요.</Text>
          </View>
          <Pressable onPress={() => setState((prev) => ({ ...prev, sessionUserId: null }))} style={styles.ghostPill}>
            <Text style={styles.ghostPillLabel}>로그아웃</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === "home" ? (
            <HomeScreen
              currentReadingBook={currentReadingBook}
              booksById={booksById}
              recentNotes={recentNotes}
              userBooksById={userBooksById}
              onOpenBook={(userBookId) => setOverlay({ type: "book", userBookId })}
              onQuickRecord={openQuickRecord}
              onOpenNote={openEditNote}
              onGoLibrarySearch={() => {
                setActiveTab("library");
                setOverlay({ type: "search" });
              }}
            />
          ) : null}

          {activeTab === "library" ? (
            <LibraryScreen
              libraryFilter={libraryFilter}
              filters={libraryFilters}
              filteredLibrary={filteredLibrary}
              booksById={booksById}
              onFilterChange={setLibraryFilter}
              onOpenBook={(userBookId) => setOverlay({ type: "book", userBookId })}
              onOpenSearch={() => setOverlay({ type: "search" })}
            />
          ) : null}

          {activeTab === "calendar" ? (
            <CalendarScreen
              selectedDate={selectedDate}
              daysWithNotes={calendarDaysWithNotes}
              dailyNotes={dailyNotes}
              booksById={booksById}
              userBooksById={userBooksById}
              onSelectDate={setSelectedDate}
              onOpenNote={openEditNote}
            />
          ) : null}

          {activeTab === "my" ? (
            <MyScreen
              stats={stats}
              recentFinished={recentFinished}
              booksById={booksById}
              onOpenBook={(userBookId) => setOverlay({ type: "book", userBookId })}
              onLogout={() => setState((prev) => ({ ...prev, sessionUserId: null }))}
            />
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          {navItems.slice(0, 2).map((item) => (
            <NavButton key={item.id} item={item} activeTab={activeTab} onPress={setActiveTab} />
          ))}
          <Pressable onPress={() => openQuickRecord()} style={styles.plusButton}>
            <Text style={styles.plusLabel}>+</Text>
          </Pressable>
          {navItems.slice(2).map((item) => (
            <NavButton key={item.id} item={item} activeTab={activeTab} onPress={setActiveTab} />
          ))}
        </View>
      </View>

      <Overlay visible={overlay?.type === "search"} title={selectedDraftBook ? "책장에 놓기" : "책 검색"} onClose={() => {
        setSelectedDraftBook(null);
        setOverlay(null);
      }}>
        {!selectedDraftBook ? (
          <>
            <Input label="책 검색" placeholder="책 제목 또는 저자를 입력해주세요" value={searchQuery} onChangeText={setSearchQuery} />
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.listGap}>
              {searchResults.length > 0 ? (
                searchResults.map((book) => (
                  <Pressable key={book.id} onPress={() => setSelectedDraftBook(book)} style={styles.searchResult}>
                    <View style={styles.searchCoverWrap}>
                      <BookCover book={book} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookTitleSmall}>{book.title}</Text>
                      <Text style={styles.bookMeta}>{book.author}</Text>
                      <Text style={styles.caption}>{book.publisher}</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <EmptyState title="검색 결과가 없어요." description="다른 제목이나 저자로 다시 찾아보세요." />
              )}
            </ScrollView>
          </>
        ) : (
          <>
            <BookCover book={selectedDraftBook} large />
            <Text style={styles.bookTitle}>{selectedDraftBook.title}</Text>
            <Text style={styles.bookMeta}>{selectedDraftBook.author}</Text>
            <View style={styles.listGap}>
              {(["WANT_TO_READ", "READING", "FINISHED"] as ReadingStatus[]).map((status) => (
                <Pressable key={status} onPress={() => setSelectedStatus(status)} style={[styles.statusRow, selectedStatus === status && styles.statusRowActive]}>
                  <Text style={[styles.statusLabel, selectedStatus === status && styles.statusLabelActive]}>{statusLabels[status]}</Text>
                  <Text style={[styles.caption, selectedStatus === status && styles.statusLabelActive]}>{selectedStatus === status ? "선택됨" : ""}</Text>
                </Pressable>
              ))}
            </View>
            {selectedStatus !== "WANT_TO_READ" ? (
              <Input label={selectedStatus === "READING" ? "독서 시작일" : "완독일"} value={statusDate} onChangeText={setStatusDate} />
            ) : null}
            <Pressable style={styles.primaryButton} onPress={handleAddBook}>
              <Text style={styles.primaryButtonLabel}>책장에 놓기</Text>
            </Pressable>
          </>
        )}
      </Overlay>

      <Overlay visible={overlay?.type === "record"} title="기록 남기기" onClose={() => setOverlay(null)}>
        {readingBooks.length === 0 ? (
          <EmptyState title="기록할 책이 아직 없어요." description="먼저 책장에 책을 놓아주세요." actionLabel="책장에 책 놓기" onAction={() => {
            setOverlay(null);
            setActiveTab("library");
            setOverlay({ type: "search" });
          }} />
        ) : (
          <>
            <Text style={styles.fieldLabel}>기록할 책</Text>
            <View style={styles.listGap}>
              {readingBooks.map((item) => (
                <Pressable key={item.id} onPress={() => setRecordDraft((prev) => ({ ...prev, userBookId: item.id }))} style={[styles.statusRow, recordDraft.userBookId === item.id && styles.statusRowActive]}>
                  <View>
                    <Text style={[styles.statusLabel, recordDraft.userBookId === item.id && styles.statusLabelActive]}>{booksById[item.bookId].title}</Text>
                    <Text style={[styles.caption, recordDraft.userBookId === item.id && styles.statusLabelActive]}>{booksById[item.bookId].author}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <Input label="페이지" placeholder="예: 132" value={recordDraft.page} onChangeText={(page) => setRecordDraft((prev) => ({ ...prev, page }))} />
            <Input multiline label="마음에 머문 문장" placeholder="마음에 남은 문장을 적어보세요" value={recordDraft.quote} onChangeText={(quote) => setRecordDraft((prev) => ({ ...prev, quote }))} />
            <Input multiline label="나의 생각" placeholder="그때 떠오른 생각을 남겨보세요" value={recordDraft.thought} onChangeText={(thought) => setRecordDraft((prev) => ({ ...prev, thought }))} />
            <Text style={styles.caption}>문장과 생각 중 하나는 꼭 남겨야 해요.</Text>
            {recordError ? <Text style={styles.errorText}>{recordError}</Text> : null}
            <Pressable style={styles.primaryButton} onPress={handleSaveRecord}>
              <Text style={styles.primaryButtonLabel}>남겨두기</Text>
            </Pressable>
          </>
        )}
      </Overlay>

      <Overlay visible={overlay?.type === "book" && !!selectedBookDetail} title="책 상세" onClose={() => setOverlay(null)}>
        {selectedBookDetail ? (
          <>
            <BookCover book={booksById[selectedBookDetail.bookId]} large />
            <Text style={styles.bookTitle}>{booksById[selectedBookDetail.bookId].title}</Text>
            <Text style={styles.bookMeta}>{booksById[selectedBookDetail.bookId].author}</Text>
            <Text style={styles.caption}>{statusLabels[selectedBookDetail.status]}</Text>
            {selectedBookDetail.startedAt ? <Text style={styles.caption}>독서 시작일 {formatDate(selectedBookDetail.startedAt)}</Text> : null}
            {selectedBookDetail.finishedAt ? <Text style={styles.caption}>완독일 {formatDate(selectedBookDetail.finishedAt)}</Text> : null}
            <View style={styles.actionRow}>
              <Pressable style={styles.primaryInlineButton} onPress={() => openQuickRecord(selectedBookDetail.id)}>
                <Text style={styles.primaryButtonLabel}>기록 남기기</Text>
              </Pressable>
              {selectedBookDetail.status !== "FINISHED" ? (
                <Pressable
                  style={styles.secondaryInlineButton}
                  onPress={() => {
                    setFinishForm({
                      finishedAt: todayIsoDate(),
                      rating: selectedBookDetail.rating ?? 0,
                      review: selectedBookDetail.review ?? "",
                    });
                    setOverlay({ type: "finish", userBookId: selectedBookDetail.id });
                  }}
                >
                  <Text style={styles.secondaryInlineLabel}>다 읽었어요</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.sectionSubhead}>남긴 기록</Text>
            <View style={styles.listGap}>
              {selectedBookNotes.length > 0 ? (
                selectedBookNotes.map((note) => (
                  <View key={note.id} style={styles.noteCard}>
                    {note.page ? <Text style={styles.caption}>p.{note.page}</Text> : null}
                    <Text style={styles.notePreview}>{note.quote ?? note.thought}</Text>
                    {note.quote && note.thought ? <Text style={styles.noteThought}>{note.thought}</Text> : null}
                    <Text style={styles.caption}>{formatDate(note.createdAt)}</Text>
                    <View style={styles.miniActions}>
                      <Pressable onPress={() => openEditNote(note)}><Text style={styles.miniAction}>수정</Text></Pressable>
                      <Pressable onPress={() => setOverlay({ type: "delete-note", noteId: note.id })}><Text style={[styles.miniAction, { color: COLORS.danger }]}>삭제</Text></Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState title="아직 이 책에 남겨둔 기록이 없어요." description="마음에 머문 문장이나 생각을 남겨보세요." />
              )}
            </View>
          </>
        ) : null}
      </Overlay>

      <Overlay visible={overlay?.type === "edit-note" && !!selectedEditNote} title="기록 수정" onClose={() => setOverlay(null)}>
        <Input label="페이지" placeholder="예: 132" value={recordDraft.page} onChangeText={(page) => setRecordDraft((prev) => ({ ...prev, page }))} />
        <Input multiline label="마음에 머문 문장" placeholder="마음에 남은 문장을 적어보세요" value={recordDraft.quote} onChangeText={(quote) => setRecordDraft((prev) => ({ ...prev, quote }))} />
        <Input multiline label="나의 생각" placeholder="그때 떠오른 생각을 남겨보세요" value={recordDraft.thought} onChangeText={(thought) => setRecordDraft((prev) => ({ ...prev, thought }))} />
        {recordError ? <Text style={styles.errorText}>{recordError}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={handleUpdateNote}>
          <Text style={styles.primaryButtonLabel}>저장하기</Text>
        </Pressable>
        {selectedEditNote ? (
          <Pressable style={styles.deleteButton} onPress={() => setOverlay({ type: "delete-note", noteId: selectedEditNote.id })}>
            <Text style={styles.deleteButtonLabel}>삭제하기</Text>
          </Pressable>
        ) : null}
      </Overlay>

      <Overlay visible={overlay?.type === "finish" && !!selectedFinishBook} title="다 읽었어요" onClose={() => setOverlay(null)}>
        {selectedFinishBook ? (
          <>
            <Text style={styles.bookTitle}>{booksById[selectedFinishBook.bookId].title}</Text>
            <Text style={styles.bookMeta}>{booksById[selectedFinishBook.bookId].author}</Text>
            <Input label="완독일" value={finishForm.finishedAt} onChangeText={(finishedAt) => setFinishForm((prev) => ({ ...prev, finishedAt }))} />
            <Text style={styles.fieldLabel}>별점</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => setFinishForm((prev) => ({ ...prev, rating: value }))} style={[styles.ratingButton, finishForm.rating === value && styles.ratingButtonActive]}>
                  <Text style={[styles.ratingLabel, finishForm.rating === value && styles.ratingLabelActive]}>{value}</Text>
                </Pressable>
              ))}
            </View>
            <Input multiline label="한줄평" placeholder="짧게 남겨도 괜찮아요" value={finishForm.review} onChangeText={(review) => setFinishForm((prev) => ({ ...prev, review }))} />
            <Pressable style={styles.primaryButton} onPress={handleFinishBook}>
              <Text style={styles.primaryButtonLabel}>완료</Text>
            </Pressable>
          </>
        ) : null}
      </Overlay>

      <Overlay visible={overlay?.type === "delete-note"} title="이 기록을 삭제할까요?" onClose={() => setOverlay(null)} compact>
        <Text style={styles.overlayDescription}>삭제한 기록은 다시 되돌릴 수 없어요.</Text>
        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryInlineButton} onPress={() => setOverlay(null)}>
            <Text style={styles.secondaryInlineLabel}>취소</Text>
          </Pressable>
          {overlay?.type === "delete-note" ? (
            <Pressable style={styles.dangerInlineButton} onPress={() => handleDeleteNote(overlay.noteId)}>
              <Text style={styles.primaryButtonLabel}>삭제</Text>
            </Pressable>
          ) : null}
        </View>
      </Overlay>

      {toast ? <Toast toast={toast} /> : null}
    </SafeAreaView>
  );
}
