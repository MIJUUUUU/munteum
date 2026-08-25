import { Pressable, Text, View } from "react-native";
import { Book, UserBook } from "../lib/munteum-data";
import { BookCover, Card, EmptyState, MenuRow, StatCard } from "../components/munteum-ui";
import { styles } from "../styles/munteum-styles";

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
          <StatCard label="쓴 감상문" value={stats.notesCount} />
          <StatCard label="쓴 날짜" value={stats.recordedDays} />
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
          <EmptyState title="아직 다 읽은 책이 없어요." description="한 권을 끝까지 읽고 감상문으로 남겨보세요." />
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
