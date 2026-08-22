import { AppState, Book, ReadingStatus, User, makeId, todayIsoDate } from "../lib/munteum-data";
import { OverlayState, SetAppState, ShowToast } from "./munteum-hook-types";

export function useLibraryActions({
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
}: {
  state: AppState;
  setState: SetAppState;
  currentUser: User | null;
  userBooks: Array<{ id: string; bookId: string }>;
  booksById: Record<string, Book>;
  selectedDraftBook: Book | null;
  selectedStatus: ReadingStatus;
  statusDate: string;
  setSelectedDraftBook: (book: Book | null) => void;
  setSearchQuery: (value: string) => void;
  setSelectedStatus: (status: ReadingStatus) => void;
  setStatusDate: (value: string) => void;
  setOverlay: (overlay: OverlayState) => void;
  showToast: ShowToast;
}) {
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

  return { handleAddBook };
}
