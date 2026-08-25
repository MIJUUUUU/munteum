import { Pressable, ScrollView, Text, View } from "react-native";
import { libraryFilters, navItems } from "../lib/munteum-data";
import { useMunteumApp } from "../hooks/use-munteum-app";
import { styles } from "../styles/munteum-styles";
import { NavButton } from "../components/munteum-ui";
import { CalendarScreen, HomeScreen, LibraryScreen, MyScreen } from "./tab-screens";
import {
  BookDetailSheet,
  DeleteNoteSheet,
  EditNoteSheet,
  FinishBookSheet,
  RecordSheet,
  SearchSheet,
} from "./overlay-sheets";

type MunteumApp = ReturnType<typeof useMunteumApp>;

export function MainShell({ app }: { app: MunteumApp }) {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={[styles.shellAura, styles.shellAuraTop]} />
      <View pointerEvents="none" style={[styles.shellAura, styles.shellAuraBottom]} />

      <ScrollView contentContainerStyle={styles.content}>
        {app.activeTab === "home" ? (
          <HomeScreen
            currentReadingBook={app.currentReadingBook}
            booksById={app.booksById}
            recentNotes={app.recentNotes}
            userBooksById={app.userBooksById}
            onOpenBook={app.openBookDetail}
            onQuickRecord={app.openQuickRecord}
            onOpenNote={app.openEditNote}
            onGoLibrarySearch={() => {
              app.setActiveTab("library");
              app.setOverlay({ type: "search" });
            }}
          />
        ) : null}

        {app.activeTab === "library" ? (
          <LibraryScreen
            libraryFilter={app.libraryFilter}
            filters={libraryFilters}
            filteredLibrary={app.filteredLibrary}
            booksById={app.booksById}
            onFilterChange={app.setLibraryFilter}
            onOpenBook={app.openBookDetail}
            onOpenSearch={() => app.setOverlay({ type: "search" })}
          />
        ) : null}

        {app.activeTab === "calendar" ? (
          <CalendarScreen
            selectedDate={app.selectedDate}
            daysWithNotes={app.calendarDaysWithNotes}
            dailyNotes={app.dailyNotes}
            booksById={app.booksById}
            userBooksById={app.userBooksById}
            onSelectDate={app.setSelectedDate}
            onOpenNote={app.openEditNote}
          />
        ) : null}

        {app.activeTab === "my" ? (
          <MyScreen
            stats={app.stats}
            recentFinished={app.recentFinished}
            booksById={app.booksById}
            onOpenBook={app.openBookDetail}
            onLogout={() => app.setState((prev) => ({ ...prev, sessionUserId: null }))}
          />
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        {navItems.slice(0, 2).map((item) => (
          <NavButton key={item.id} item={item} activeTab={app.activeTab} onPress={app.setActiveTab} />
        ))}
        <Pressable onPress={() => app.openQuickRecord()} style={styles.plusButton}>
          <Text style={styles.plusLabel}>+</Text>
        </Pressable>
        {navItems.slice(2).map((item) => (
          <NavButton key={item.id} item={item} activeTab={app.activeTab} onPress={app.setActiveTab} />
        ))}
      </View>
    </View>
  );
}

export function AppOverlays({ app }: { app: MunteumApp }) {
  return (
    <>
      <SearchSheet
        visible={app.overlay?.type === "search"}
        selectedDraftBook={app.selectedDraftBook}
        searchQuery={app.searchQuery}
        searchResults={app.searchResults}
        selectedStatus={app.selectedStatus}
        statusDate={app.statusDate}
        onClose={() => {
          app.setSelectedDraftBook(null);
          app.setOverlay(null);
        }}
        onSearchQueryChange={app.setSearchQuery}
        onSelectDraftBook={app.setSelectedDraftBook}
        onSelectStatus={app.setSelectedStatus}
        onStatusDateChange={app.setStatusDate}
        onAddBook={app.handleAddBook}
      />

      <RecordSheet
        visible={app.overlay?.type === "record"}
        readingBooks={app.readingBooks}
        booksById={app.booksById}
        recordDraft={app.recordDraft}
        recordError={app.recordError}
        onClose={() => app.setOverlay(null)}
        onGoSearch={() => {
          app.setOverlay(null);
          app.setActiveTab("library");
          app.setOverlay({ type: "search" });
        }}
        onSelectUserBook={(userBookId) => app.setRecordDraft((prev) => ({ ...prev, userBookId }))}
        onDraftChange={(field, value) => app.setRecordDraft((prev) => ({ ...prev, [field]: value }))}
        onSave={app.handleSaveRecord}
      />

      <BookDetailSheet
        visible={app.overlay?.type === "book" && !!app.selectedBookDetail}
        selectedBookDetail={app.selectedBookDetail}
        selectedBookNotes={app.selectedBookNotes}
        booksById={app.booksById}
        onClose={() => app.setOverlay(null)}
        onQuickRecord={app.openQuickRecord}
        onOpenFinish={app.openFinishSheet}
        onOpenEditNote={app.openEditNote}
        onOpenDeleteNote={(noteId) => app.setOverlay({ type: "delete-note", noteId })}
      />

      <EditNoteSheet
        visible={app.overlay?.type === "edit-note" && !!app.selectedEditNote}
        recordDraft={app.recordDraft}
        recordError={app.recordError}
        onClose={() => app.setOverlay(null)}
        onDraftChange={(field, value) => app.setRecordDraft((prev) => ({ ...prev, [field]: value }))}
        onSave={app.handleUpdateNote}
        onDelete={() =>
          app.selectedEditNote ? app.setOverlay({ type: "delete-note", noteId: app.selectedEditNote.id }) : undefined
        }
      />

      <FinishBookSheet
        visible={app.overlay?.type === "finish" && !!app.selectedFinishBook}
        selectedFinishBook={app.selectedFinishBook}
        booksById={app.booksById}
        finishForm={app.finishForm}
        onClose={() => app.setOverlay(null)}
        onFinishFormChange={(field, value) => app.setFinishForm((prev) => ({ ...prev, [field]: value }))}
        onSave={app.handleFinishBook}
      />

      <DeleteNoteSheet
        visible={app.overlay?.type === "delete-note"}
        onClose={() => app.setOverlay(null)}
        onDelete={() => (app.overlay?.type === "delete-note" ? app.handleDeleteNote(app.overlay.noteId) : undefined)}
      />
    </>
  );
}
