import { Pressable, ScrollView, Text, View } from "react-native";
import { Book, ReadingStatus, UserBook } from "../lib/munteum-data";
import { BookCover, Card, EmptyState } from "../components/munteum-ui";
import { styles } from "../styles/munteum-styles";

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
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
          description="첫 번째 책을 추가하고 감상문을 남겨볼까요?"
          actionLabel="책 찾아보기"
          onAction={onOpenSearch}
        />
      )}
    </Card>
  );
}
