export type ReadingStatus = "WANT_TO_READ" | "READING" | "FINISHED";
export type TabId = "home" | "library" | "calendar" | "my";

export type User = {
  id: string;
  email: string;
  nickname: string;
  password: string;
};

export type Book = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverColor: string;
  accentColor: string;
};

export type UserBook = {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  startedAt: string | null;
  finishedAt: string | null;
  rating: number | null;
  review: string | null;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string | null;
};

export type Note = {
  id: string;
  userBookId: string;
  page: number | null;
  quote: string | null;
  thought: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppState = {
  users: User[];
  books: Book[];
  userBooks: UserBook[];
  notes: Note[];
  sessionUserId: string | null;
};

export const statusLabels: Record<ReadingStatus, string> = {
  WANT_TO_READ: "읽고 싶어요",
  READING: "읽고 있어요",
  FINISHED: "다 읽었어요",
};

export const libraryFilters: Array<{ id: "ALL" | ReadingStatus; label: string }> = [
  { id: "ALL", label: "전체" },
  { id: "READING", label: "읽고 있어요" },
  { id: "FINISHED", label: "다 읽었어요" },
  { id: "WANT_TO_READ", label: "읽고 싶어요" },
];

export const navItems: Array<{ id: TabId; label: string }> = [
  { id: "home", label: "홈" },
  { id: "library", label: "책장" },
  { id: "calendar", label: "캘린더" },
  { id: "my", label: "나" },
];

export const searchCatalog: Book[] = [
  {
    id: "catalog-1",
    isbn: "9788936434120",
    title: "아무튼, 기록",
    author: "정혜윤",
    publisher: "위고",
    coverColor: "#d5c4ff",
    accentColor: "#4f378a",
  },
  {
    id: "catalog-2",
    isbn: "9788937473401",
    title: "소년이 온다",
    author: "한강",
    publisher: "창비",
    coverColor: "#98b8b2",
    accentColor: "#25453f",
  },
  {
    id: "catalog-3",
    isbn: "9788936434595",
    title: "읽는 생활",
    author: "임진아",
    publisher: "위즈덤하우스",
    coverColor: "#ffd8ae",
    accentColor: "#834d15",
  },
  {
    id: "catalog-4",
    isbn: "9788932922980",
    title: "여행의 이유",
    author: "김영하",
    publisher: "문학동네",
    coverColor: "#aac8f5",
    accentColor: "#27446f",
  },
  {
    id: "catalog-5",
    isbn: "9788932030517",
    title: "작별하지 않는다",
    author: "한강",
    publisher: "문학동네",
    coverColor: "#cdd4d9",
    accentColor: "#42515b",
  },
  {
    id: "catalog-6",
    isbn: "9788932473901",
    title: "달러구트 꿈 백화점",
    author: "이미예",
    publisher: "팩토리나인",
    coverColor: "#fde5ac",
    accentColor: "#6a4e0f",
  },
];

export const initialState: AppState = {
  users: [
    {
      id: "user-demo",
      email: "demo@munteum.app",
      nickname: "문틈러",
      password: "demo1234",
    },
  ],
  books: [
    {
      id: "book-demo-1",
      isbn: "9788936434120",
      title: "아무튼, 기록",
      author: "정혜윤",
      publisher: "위고",
      coverColor: "#d5c4ff",
      accentColor: "#4f378a",
    },
    {
      id: "book-demo-2",
      isbn: "9788937473401",
      title: "소년이 온다",
      author: "한강",
      publisher: "창비",
      coverColor: "#98b8b2",
      accentColor: "#25453f",
    },
    {
      id: "book-demo-3",
      isbn: "9788936434595",
      title: "읽는 생활",
      author: "임진아",
      publisher: "위즈덤하우스",
      coverColor: "#ffd8ae",
      accentColor: "#834d15",
    },
  ],
  userBooks: [
    {
      id: "user-book-demo-1",
      userId: "user-demo",
      bookId: "book-demo-1",
      status: "READING",
      startedAt: "2026-08-18",
      finishedAt: null,
      rating: null,
      review: null,
      createdAt: "2026-08-18T09:00:00.000Z",
      updatedAt: "2026-08-21T12:00:00.000Z",
      lastViewedAt: "2026-08-24T09:30:00.000Z",
    },
    {
      id: "user-book-demo-2",
      userId: "user-demo",
      bookId: "book-demo-2",
      status: "FINISHED",
      startedAt: "2026-08-05",
      finishedAt: "2026-08-16",
      rating: 5,
      review: "오래 두고 다시 펼쳐보고 싶은 책.",
      createdAt: "2026-08-05T09:00:00.000Z",
      updatedAt: "2026-08-16T12:00:00.000Z",
      lastViewedAt: "2026-08-25T08:20:00.000Z",
    },
    {
      id: "user-book-demo-3",
      userId: "user-demo",
      bookId: "book-demo-3",
      status: "WANT_TO_READ",
      startedAt: null,
      finishedAt: null,
      rating: null,
      review: null,
      createdAt: "2026-08-20T09:00:00.000Z",
      updatedAt: "2026-08-20T09:00:00.000Z",
      lastViewedAt: null,
    },
  ],
  notes: [
    {
      id: "note-demo-1",
      userBookId: "user-book-demo-1",
      page: 132,
      quote: "좋은 기록은 지나간 감정을 다시 살아나게 한다.",
      thought: "짧게 적어둔 메모가 생각보다 오래 남는다는 걸 다시 느꼈다.",
      createdAt: "2026-08-21T08:45:00.000Z",
      updatedAt: "2026-08-21T08:45:00.000Z",
    },
    {
      id: "note-demo-2",
      userBookId: "user-book-demo-1",
      page: 58,
      quote: "읽는 일은 결국 나를 더 오래 들여다보는 일이다.",
      thought: null,
      createdAt: "2026-08-20T21:30:00.000Z",
      updatedAt: "2026-08-20T21:30:00.000Z",
    },
    {
      id: "note-demo-3",
      userBookId: "user-book-demo-2",
      page: 201,
      quote: "마침내 우리는 서로를 잊지 않기로 한다.",
      thought: "완독 후에도 마지막 문장이 계속 남았다.",
      createdAt: "2026-08-16T14:00:00.000Z",
      updatedAt: "2026-08-16T14:00:00.000Z",
    },
  ],
  sessionUserId: "user-demo",
};

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function todayIsoDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function formatMonthLabel(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getDayKey(dateString: string) {
  return dateString.slice(0, 10);
}

export function getMonthKey(dateString: string) {
  return dateString.slice(0, 7);
}
