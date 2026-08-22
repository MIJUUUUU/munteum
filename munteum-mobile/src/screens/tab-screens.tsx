import { Pressable, ScrollView, Text, View } from "react-native";
import {
  Book,
  Note,
  ReadingStatus,
  UserBook,
  formatDate,
  formatMonthLabel,
} from "../lib/munteum-data";
import { buildCalendarCells } from "../lib/calendar";
import { BookCover, Card, EmptyState, MenuRow, StatCard } from "../components/munteum-ui";
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
        actionLabel={currentReadingBook ? "기록 남기기" : undefined}
        onAction={currentReadingBook ? () => onQuickRecord(currentReadingBook.id) : undefined}
      >
        {currentReadingBook ? (
          <Pressable onPress={() => onOpenBook(currentReadingBook.id)}>
            <BookCover book={booksById[currentReadingBook.bookId]} large />
            <Text style={styles.bookTitle}>{booksById[currentReadingBook.bookId].title}</Text>
            <Text style={styles.bookMeta}>{booksById[currentReadingBook.bookId].author}</Text>
            <Text style={styles.caption}>
              {currentReadingBook.startedAt ? `시작 ${formatDate(currentReadingBook.startedAt)}` : "읽고 있어요"}
            </Text>
          </Pressable>
        ) : (
          <EmptyState
            title="지금 읽고 있는 책이 없어요."
            description="책장에 책을 놓고 기록을 시작해보세요."
            actionLabel="책장에 책 놓기"
            onAction={onGoLibrarySearch}
          />
        )}
      </Card>

      <Card title="최근 기록">
        {recentNotes.length > 0 ? (
          recentNotes.map((note) => {
            const userBook = userBooksById[note.userBookId];
            const book = booksById[userBook.bookId];
            return (
              <Pressable key={note.id} onPress={() => onOpenNote(note)} style={styles.noteCard}>
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
            title="아직 머문 문장이 없어요."
            description="마음에 남은 문장이나 생각을 가볍게 남겨보세요."
            actionLabel="첫 기록 남기기"
            onAction={() => onQuickRecord()}
          />
        )}
      </Card>
    </>
  );
}

export function LibraryScreen({
  libraryFilter,
  filters,
  filteredLibrary,
  booksById,
  onFilterChange,
  onOpenBook,
  onOpenSearch,
}: {
  libraryFilter: "ALL" | ReadingStatus;
  filters: Array<{ id: "ALL" | ReadingStatus; label: string }>;
  filteredLibrary: UserBook[];
  booksById: Record<string, Book>;
  onFilterChange: (filter: "ALL" | ReadingStatus) => void;
  onOpenBook: (userBookId: string) => void;
  onOpenSearch: () => void;
}) {
  return (
    <Card title="책장" actionLabel="+ 책 추가" onAction={onOpenSearch}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filters.map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => onFilterChange(filter.id)}
            style={[styles.filterChip, libraryFilter === filter.id && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipLabel, libraryFilter === filter.id && styles.filterChipLabelActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {filteredLibrary.length > 0 ? (
        <View style={styles.grid}>
          {filteredLibrary.map((item) => (
            <Pressable key={item.id} onPress={() => onOpenBook(item.id)} style={styles.gridItem}>
              <BookCover book={booksById[item.bookId]} />
              <Text style={styles.gridTitle}>{booksById[item.bookId].title}</Text>
              <Text style={styles.gridMeta}>{booksById[item.bookId].author}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          title="아직 책장이 비어 있어요."
          description="첫 번째 책을 책장에 놓아볼까요?"
          actionLabel="책 찾아보기"
          onAction={onOpenSearch}
        />
      )}
    </Card>
  );
}

export function CalendarScreen({
  selectedDate,
  daysWithNotes,
  dailyNotes,
  booksById,
  userBooksById,
  onSelectDate,
  onOpenNote,
}: {
  selectedDate: string;
  daysWithNotes: string[];
  dailyNotes: Note[];
  booksById: Record<string, Book>;
  userBooksById: Record<string, UserBook>;
  onSelectDate: (date: string) => void;
  onOpenNote: (note: Note) => void;
}) {
  return (
    <>
      <Card title="캘린더">
        <View style={styles.calendarHeader}>
          <Text style={styles.sectionSubhead}>{formatMonthLabel(selectedDate)}</Text>
          <Text style={styles.caption}>{selectedDate}</Text>
        </View>
        <View style={styles.daysRow}>
          {buildCalendarCells(selectedDate).map((cell) =>
            cell.empty ? (
              <View key={cell.value} style={styles.dayCellEmpty} />
            ) : (
              <Pressable
                key={cell.value}
                onPress={() => onSelectDate(cell.value)}
                style={[styles.dayCell, cell.value === selectedDate && styles.dayCellActive]}
              >
                <Text style={[styles.dayCellLabel, cell.value === selectedDate && styles.dayCellLabelActive]}>
                  {cell.day}
                </Text>
                <View
                  style={[
                    styles.dot,
                    daysWithNotes.includes(cell.value) ? styles.dotVisible : null,
                    cell.value === selectedDate && daysWithNotes.includes(cell.value) ? styles.dotSelected : null,
                  ]}
                />
              </Pressable>
            ),
          )}
        </View>
      </Card>
      <Card title={`${new Date(selectedDate).getMonth() + 1}월 ${new Date(selectedDate).getDate()}일의 기록`}>
        {dailyNotes.length > 0 ? (
          dailyNotes.map((note) => {
            const userBook = userBooksById[note.userBookId];
            const book = booksById[userBook.bookId];
            return (
              <Pressable key={note.id} onPress={() => onOpenNote(note)} style={styles.noteCard}>
                <Text style={styles.bookTitleSmall}>{book.title}</Text>
                {note.page ? <Text style={styles.caption}>p.{note.page}</Text> : null}
                <Text style={styles.notePreview}>{note.quote ?? note.thought}</Text>
                {note.quote && note.thought ? <Text style={styles.noteThought}>{note.thought}</Text> : null}
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            title={daysWithNotes.length > 0 ? "이 날짜에는 기록이 없어요." : "이번 달에는 아직 남겨둔 문장이 없어요."}
            description={daysWithNotes.length > 0 ? "다른 날짜를 선택해보세요." : "기록을 남기면 날짜별로 다시 볼 수 있어요."}
          />
        )}
      </Card>
    </>
  );
}

export function MyScreen({
  stats,
  recentFinished,
  booksById,
  onOpenBook,
  onLogout,
}: {
  stats: { finishedBooks: number; notesCount: number; recordedDays: number };
  recentFinished: UserBook[];
  booksById: Record<string, Book>;
  onOpenBook: (userBookId: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <Card title="올해의 기록">
        <View style={styles.statRow}>
          <StatCard label="읽은 책" value={stats.finishedBooks} />
          <StatCard label="남긴 기록" value={stats.notesCount} />
          <StatCard label="기록한 날" value={stats.recordedDays} />
        </View>
      </Card>
      <Card title="최근 읽은 책">
        {recentFinished.length > 0 ? (
          <View style={styles.grid}>
            {recentFinished.map((item) => (
              <Pressable key={item.id} onPress={() => onOpenBook(item.id)} style={styles.gridItem}>
                <BookCover book={booksById[item.bookId]} />
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState title="아직 다 읽은 책이 없어요." description="한 권을 끝까지 읽고 이곳에 남겨보세요." />
        )}
      </Card>
      <Card title="설정">
        <MenuRow label="프로필" />
        <MenuRow label="비밀번호 변경" />
        <Pressable style={styles.menuRow} onPress={onLogout}>
          <Text style={styles.menuLabel}>로그아웃</Text>
        </Pressable>
      </Card>
    </>
  );
}
