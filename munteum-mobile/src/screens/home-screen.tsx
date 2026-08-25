import { Pressable, Text } from "react-native";
import { Book, Note, UserBook, formatDate } from "../lib/munteum-data";
import { BookCover, Card, EmptyState } from "../components/munteum-ui";
import { styles } from "../styles/munteum-styles";

export function HomeScreen({
  currentReadingBook,
  booksById,
  recentNotes,
  userBooksById,
  onOpenBook,
  onQuickRecord,
  onOpenNote,
  onGoLibrarySearch,
}: {
  currentReadingBook: UserBook | null;
  booksById: Record<string, Book>;
  recentNotes: Note[];
  userBooksById: Record<string, UserBook>;
  onOpenBook: (userBookId: string) => void;
  onQuickRecord: (userBookId?: string) => void;
  onOpenNote: (note: Note) => void;
  onGoLibrarySearch: () => void;
}) {
  return (
    <>
      <Card
        title="지금 읽고 있는 책"
        actionLabel={currentReadingBook ? "감상 쓰기" : undefined}
        onAction={currentReadingBook ? () => onQuickRecord(currentReadingBook.id) : undefined}
      >
        {currentReadingBook ? (
          <Pressable onPress={() => onOpenBook(currentReadingBook.id)}>
            <BookCover book={booksById[currentReadingBook.bookId]} large />
            <Text style={styles.bookTitle}>{booksById[currentReadingBook.bookId].title}</Text>
            <Text style={styles.bookMeta}>{booksById[currentReadingBook.bookId].author}</Text>
            <Text style={styles.heroPrompt}>오늘은 어떤 문장이 가장 오래 남았나요?</Text>
            <Text style={styles.heroMetaLine}>
              {currentReadingBook.startedAt ? `시작 ${formatDate(currentReadingBook.startedAt)}` : "읽고 있어요"}
            </Text>
          </Pressable>
        ) : (
          <EmptyState
            title="지금 읽고 있는 책이 없어요."
            description="책을 추가하고 이 책의 한줄과 감상을 남겨보세요."
            actionLabel="책장에 책 놓기"
            onAction={onGoLibrarySearch}
          />
        )}
      </Card>

      <Card title="최근 감상">
        {recentNotes.length > 0 ? (
          recentNotes.map((note) => {
            const userBook = userBooksById[note.userBookId];
            const book = booksById[userBook.bookId];
            return (
              <Pressable key={note.id} onPress={() => onOpenNote(note)} style={styles.noteCard}>
                <Text style={styles.noteEyebrow}>MEMORY LINE</Text>
                <Text style={styles.notePreview}>{note.quote ?? note.thought}</Text>
                <Text style={styles.noteMeta}>
                  {book.title}
                  {note.page ? ` · p.${note.page}` : ""}
                  {` · ${formatDate(note.createdAt)}`}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            title="아직 감상문이 없어요."
            description="이 책을 읽고 기억에 남는 한줄과 감상을 남겨보세요."
            actionLabel="첫 감상 쓰기"
            onAction={() => onQuickRecord()}
          />
        )}
      </Card>
    </>
  );
}
