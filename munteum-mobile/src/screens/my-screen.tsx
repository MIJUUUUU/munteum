import { Pressable, ScrollView, Text, View } from "react-native";
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
        <Text style={styles.sectionLead}>올해 읽은 책과 남겨둔 감상을 한눈에 볼 수 있어요.</Text>
        <View style={styles.statRow}>
          <StatCard label="읽은 책" value={stats.finishedBooks} variant="featured" />
          <StatCard label="쓴 감상문" value={stats.notesCount} />
          <StatCard label="쓴 날짜" value={stats.recordedDays} variant="soft" />
        </View>
      </Card>
      <Card title="최근 읽은 책">
        {recentFinished.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentBooksRow}
          >
            {recentFinished.map((item) => (
              <Pressable key={item.id} onPress={() => onOpenBook(item.id)} style={styles.recentBookCard}>
                <BookCover book={booksById[item.bookId]} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <EmptyState title="아직 다 읽은 책이 없어요." description="한 권을 끝까지 읽고 감상문으로 남겨보세요." />
        )}
      </Card>
      <Card title="설정">
        <Text style={styles.sectionLead}>계정과 앱 환경을 여기서 정리할 수 있어요.</Text>
        <MenuRow label="프로필" />
        <MenuRow label="비밀번호 변경" />
        <Pressable style={styles.menuRow} onPress={onLogout}>
          <Text style={styles.menuLabel}>로그아웃</Text>
          <Text style={[styles.menuChevron, styles.logoutChevron]}>›</Text>
        </Pressable>
      </Card>
    </>
  );
}
