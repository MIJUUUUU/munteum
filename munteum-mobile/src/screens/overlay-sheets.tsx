import { Pressable, ScrollView, Text, View } from "react-native";
import { Book, Note, ReadingStatus, UserBook, statusLabels, todayIsoDate, formatDate } from "../lib/munteum-data";
import { BookCover, EmptyState, Input, Overlay } from "../components/munteum-ui";
import { COLORS, styles } from "../styles/munteum-styles";

export function SearchSheet({
  visible,
  selectedDraftBook,
  searchQuery,
  searchResults,
  selectedStatus,
  statusDate,
  onClose,
  onSearchQueryChange,
  onSelectDraftBook,
  onSelectStatus,
  onStatusDateChange,
  onAddBook,
}: {
  visible: boolean;
  selectedDraftBook: Book | null;
  searchQuery: string;
  searchResults: Book[];
  selectedStatus: ReadingStatus;
  statusDate: string;
  onClose: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelectDraftBook: (book: Book) => void;
  onSelectStatus: (status: ReadingStatus) => void;
  onStatusDateChange: (value: string) => void;
  onAddBook: () => void;
}) {
  return (
    <Overlay
      visible={visible}
      title={selectedDraftBook ? "책장에 놓기" : "책 검색"}
      onClose={onClose}
    >
      {!selectedDraftBook ? (
        <>
          <Input
            label="책 검색"
            placeholder="책 제목 또는 저자를 입력해주세요"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
          />
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.listGap}>
            {searchResults.length > 0 ? (
              searchResults.map((book) => (
                <Pressable key={book.id} onPress={() => onSelectDraftBook(book)} style={styles.searchResult}>
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
              <Pressable
                key={status}
                onPress={() => onSelectStatus(status)}
                style={[styles.statusRow, selectedStatus === status && styles.statusRowActive]}
              >
                <Text style={[styles.statusLabel, selectedStatus === status && styles.statusLabelActive]}>
                  {statusLabels[status]}
                </Text>
                <Text style={[styles.caption, selectedStatus === status && styles.statusLabelActive]}>
                  {selectedStatus === status ? "선택됨" : ""}
                </Text>
              </Pressable>
            ))}
          </View>
          {selectedStatus !== "WANT_TO_READ" ? (
            <Input
              label={selectedStatus === "READING" ? "독서 시작일" : "완독일"}
              value={statusDate}
              onChangeText={onStatusDateChange}
            />
          ) : null}
          <Pressable style={styles.primaryButton} onPress={onAddBook}>
            <Text style={styles.primaryButtonLabel}>책장에 놓기</Text>
          </Pressable>
        </>
      )}
    </Overlay>
  );
}

export function RecordSheet({
  visible,
  readingBooks,
  booksById,
  recordDraft,
  recordError,
  onClose,
  onGoSearch,
  onSelectUserBook,
  onDraftChange,
  onSave,
}: {
  visible: boolean;
  readingBooks: UserBook[];
  booksById: Record<string, Book>;
  recordDraft: { userBookId: string; page: string; quote: string; thought: string };
  recordError: string | null;
  onClose: () => void;
  onGoSearch: () => void;
  onSelectUserBook: (userBookId: string) => void;
  onDraftChange: (field: "page" | "quote" | "thought", value: string) => void;
  onSave: () => void;
}) {
  return (
    <Overlay visible={visible} title="한줄과 감상 쓰기" onClose={onClose}>
      {readingBooks.length === 0 ? (
        <EmptyState
          title="감상문을 쓸 책이 아직 없어요."
          description="먼저 책을 추가해주세요."
          actionLabel="책장에 책 놓기"
          onAction={onGoSearch}
        />
      ) : (
        <>
          <Text style={styles.fieldLabel}>감상문을 쓸 책</Text>
          <View style={styles.listGap}>
            {readingBooks.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectUserBook(item.id)}
                style={[styles.statusRow, recordDraft.userBookId === item.id && styles.statusRowActive]}
              >
                <View>
                  <Text style={[styles.statusLabel, recordDraft.userBookId === item.id && styles.statusLabelActive]}>
                    {booksById[item.bookId].title}
                  </Text>
                  <Text style={[styles.caption, recordDraft.userBookId === item.id && styles.statusLabelActive]}>
                    {booksById[item.bookId].author}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Input label="페이지" placeholder="예: 132" value={recordDraft.page} onChangeText={(value) => onDraftChange("page", value)} />
          <Input multiline label="마음에 머문 문장" placeholder="마음에 남은 문장을 적어보세요" value={recordDraft.quote} onChangeText={(value) => onDraftChange("quote", value)} />
          <Input multiline label="감상문" placeholder="이 책을 읽고 남기고 싶은 감상을 적어보세요" value={recordDraft.thought} onChangeText={(value) => onDraftChange("thought", value)} />
          <Text style={styles.caption}>기억에 남는 한줄과 감상을 한 번에 정리해둘 수 있어요.</Text>
          {recordError ? <Text style={styles.errorText}>{recordError}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={onSave}>
            <Text style={styles.primaryButtonLabel}>감상 저장하기</Text>
          </Pressable>
        </>
      )}
    </Overlay>
  );
}

export function BookDetailSheet({
  visible,
  selectedBookDetail,
  selectedBookNotes,
  booksById,
  onClose,
  onQuickRecord,
  onOpenFinish,
  onOpenEditNote,
  onOpenDeleteNote,
}: {
  visible: boolean;
  selectedBookDetail: UserBook | null;
  selectedBookNotes: Note[];
  booksById: Record<string, Book>;
  onClose: () => void;
  onQuickRecord: (userBookId: string) => void;
  onOpenFinish: (userBook: UserBook) => void;
  onOpenEditNote: (note: Note) => void;
  onOpenDeleteNote: (noteId: string) => void;
}) {
  return (
    <Overlay visible={visible} title="책 상세" onClose={onClose}>
      {selectedBookDetail ? (
        <>
          <BookCover book={booksById[selectedBookDetail.bookId]} large />
          <Text style={styles.bookTitle}>{booksById[selectedBookDetail.bookId].title}</Text>
          <Text style={styles.bookMeta}>{booksById[selectedBookDetail.bookId].author}</Text>
          <Text style={styles.caption}>{statusLabels[selectedBookDetail.status]}</Text>
          {selectedBookDetail.startedAt ? <Text style={styles.caption}>독서 시작일 {formatDate(selectedBookDetail.startedAt)}</Text> : null}
          {selectedBookDetail.finishedAt ? <Text style={styles.caption}>완독일 {formatDate(selectedBookDetail.finishedAt)}</Text> : null}
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryInlineButton} onPress={() => onQuickRecord(selectedBookDetail.id)}>
              <Text style={styles.primaryButtonLabel}>감상 쓰기</Text>
            </Pressable>
            {selectedBookDetail.status !== "FINISHED" ? (
              <Pressable style={styles.secondaryInlineButton} onPress={() => onOpenFinish(selectedBookDetail)}>
                <Text style={styles.secondaryInlineLabel}>다 읽었어요</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.sectionSubhead}>남긴 감상문</Text>
          <View style={styles.listGap}>
            {selectedBookNotes.length > 0 ? (
              selectedBookNotes.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  {note.page ? <Text style={styles.caption}>p.{note.page}</Text> : null}
                  <Text style={styles.notePreview}>{note.quote ?? note.thought}</Text>
                  {note.quote && note.thought ? <Text style={styles.noteThought}>{note.thought}</Text> : null}
                  <Text style={styles.caption}>{formatDate(note.createdAt)}</Text>
                  <View style={styles.miniActions}>
                    <Pressable onPress={() => onOpenEditNote(note)}>
                      <Text style={styles.miniAction}>수정</Text>
                    </Pressable>
                    <Pressable onPress={() => onOpenDeleteNote(note.id)}>
                      <Text style={[styles.miniAction, { color: COLORS.danger }]}>삭제</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState title="아직 이 책의 감상문이 없어요." description="기억에 남는 한줄과 감상을 남겨보세요." />
            )}
          </View>
        </>
      ) : null}
    </Overlay>
  );
}

export function EditNoteSheet({
  visible,
  recordDraft,
  recordError,
  onClose,
  onDraftChange,
  onSave,
  onDelete,
}: {
  visible: boolean;
  recordDraft: { page: string; quote: string; thought: string };
  recordError: string | null;
  onClose: () => void;
  onDraftChange: (field: "page" | "quote" | "thought", value: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <Overlay visible={visible} title="감상문 수정" onClose={onClose}>
      <Input label="페이지" placeholder="예: 132" value={recordDraft.page} onChangeText={(value) => onDraftChange("page", value)} />
      <Input multiline label="마음에 머문 문장" placeholder="마음에 남은 문장을 적어보세요" value={recordDraft.quote} onChangeText={(value) => onDraftChange("quote", value)} />
      <Input multiline label="감상문" placeholder="이 책을 읽고 남기고 싶은 감상을 적어보세요" value={recordDraft.thought} onChangeText={(value) => onDraftChange("thought", value)} />
      {recordError ? <Text style={styles.errorText}>{recordError}</Text> : null}
      <Pressable style={styles.primaryButton} onPress={onSave}>
        <Text style={styles.primaryButtonLabel}>수정 저장하기</Text>
      </Pressable>
      <Pressable style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonLabel}>감상문 삭제하기</Text>
      </Pressable>
    </Overlay>
  );
}

export function FinishBookSheet({
  visible,
  selectedFinishBook,
  booksById,
  finishForm,
  onClose,
  onFinishFormChange,
  onSave,
}: {
  visible: boolean;
  selectedFinishBook: UserBook | null;
  booksById: Record<string, Book>;
  finishForm: { finishedAt: string; rating: number; review: string };
  onClose: () => void;
  onFinishFormChange: (field: "finishedAt" | "review" | "rating", value: string | number) => void;
  onSave: () => void;
}) {
  return (
    <Overlay visible={visible} title="다 읽었어요" onClose={onClose}>
      {selectedFinishBook ? (
        <>
          <Text style={styles.bookTitle}>{booksById[selectedFinishBook.bookId].title}</Text>
          <Text style={styles.bookMeta}>{booksById[selectedFinishBook.bookId].author}</Text>
          <Input label="완독일" value={finishForm.finishedAt} onChangeText={(value) => onFinishFormChange("finishedAt", value)} />
          <Text style={styles.fieldLabel}>별점</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => onFinishFormChange("rating", value)}
                style={[styles.ratingButton, finishForm.rating === value && styles.ratingButtonActive]}
              >
                <Text style={[styles.ratingLabel, finishForm.rating === value && styles.ratingLabelActive]}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <Input multiline label="짧은 감상" placeholder="완독 후 남기고 싶은 짧은 감상을 적어보세요" value={finishForm.review} onChangeText={(value) => onFinishFormChange("review", value)} />
          <Pressable style={styles.primaryButton} onPress={onSave}>
            <Text style={styles.primaryButtonLabel}>완료</Text>
          </Pressable>
        </>
      ) : null}
    </Overlay>
  );
}

export function DeleteNoteSheet({
  visible,
  onClose,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Overlay visible={visible} title="이 감상문을 삭제할까요?" onClose={onClose} compact>
      <Text style={styles.overlayDescription}>삭제한 감상문은 다시 되돌릴 수 없어요.</Text>
      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryInlineButton} onPress={onClose}>
          <Text style={styles.secondaryInlineLabel}>취소</Text>
        </Pressable>
        <Pressable style={styles.dangerInlineButton} onPress={onDelete}>
          <Text style={styles.primaryButtonLabel}>삭제</Text>
        </Pressable>
      </View>
    </Overlay>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.loadingSafe}>
      <View style={styles.loadingWrap}>
        <Text style={styles.wordmark}>MUNTEUM</Text>
        <Text style={styles.loadingTitle}>문틈을 준비하고 있어요.</Text>
        <Text style={styles.authDescription}>저장해둔 책장과 감상문을 불러오는 중입니다.</Text>
      </View>
    </View>
  );
}

export function createDefaultFinishForm(userBook: UserBook) {
  return {
    finishedAt: todayIsoDate(),
    rating: userBook.rating ?? 0,
    review: userBook.review ?? "",
  };
}
