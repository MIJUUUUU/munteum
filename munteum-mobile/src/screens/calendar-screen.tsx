import { Pressable, Text, View } from "react-native";
import { Book, Note, UserBook, formatMonthLabel } from "../lib/munteum-data";
import { buildCalendarCells } from "../lib/calendar";
import { Card, EmptyState } from "../components/munteum-ui";
import { styles } from "../styles/munteum-styles";

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
      <Card title="감상문 캘린더">
        <View style={styles.calendarHeader}>
          <Text style={styles.sectionSubhead}>{formatMonthLabel(selectedDate)}</Text>
          <Text style={styles.caption}>감상문을 남긴 날을 다시 볼 수 있어요.</Text>
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
      <Card title={`${new Date(selectedDate).getMonth() + 1}월 ${new Date(selectedDate).getDate()}일의 감상문`}>
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
            title={daysWithNotes.length > 0 ? "이 날짜에는 감상문이 없어요." : "이번 달에는 아직 감상문이 없어요."}
            description={
              daysWithNotes.length > 0
                ? "다른 날짜를 선택해보세요."
                : "감상문을 남기면 날짜별로 다시 꺼내볼 수 있어요."
            }
          />
        )}
      </Card>
    </>
  );
}
