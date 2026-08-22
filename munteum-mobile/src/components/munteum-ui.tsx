import { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Book, TabId } from "../lib/munteum-data";
import { COLORS, styles } from "../styles/munteum-styles";

export function Card({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {actionLabel ? (
          <Pressable onPress={onAction} style={styles.tagButton}>
            <Text style={styles.tagButtonLabel}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function BookCover({ book, large }: { book: Book; large?: boolean }) {
  return (
    <View style={[styles.cover, large ? styles.coverLarge : styles.coverSmall, { backgroundColor: book.coverColor }]}>
      <View style={[styles.coverAccent, { backgroundColor: book.accentColor }]} />
      <View style={styles.coverTextWrap}>
        <Text numberOfLines={2} style={[styles.coverTitle, large && styles.coverTitleLarge]}>
          {book.title}
        </Text>
        <Text style={styles.coverAuthor}>{book.author}</Text>
      </View>
    </View>
  );
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA3AB"
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.textarea]}
        value={value}
      />
    </View>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} style={styles.primaryButton}>
          <Text style={styles.primaryButtonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Overlay({
  visible,
  title,
  onClose,
  compact,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlayBackdrop}>
        <View style={[styles.overlayCard, compact && styles.overlayCompact]}>
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.tagButton}>
              <Text style={styles.tagButtonLabel}>닫기</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.overlayContent}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Toast({ toast }: { toast: { kind: "success" | "error"; message: string } }) {
  return (
    <View style={styles.toastWrap}>
      <View style={[styles.toast, toast.kind === "error" && { backgroundColor: COLORS.danger }]}>
        <Text style={styles.toastLabel}>{toast.message}</Text>
      </View>
    </View>
  );
}

export function NavButton({
  item,
  activeTab,
  onPress,
}: {
  item: { id: TabId; label: string };
  activeTab: TabId;
  onPress: (tab: TabId) => void;
}) {
  return (
    <Pressable onPress={() => onPress(item.id)} style={styles.navButton}>
      <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>{item.label}</Text>
    </Pressable>
  );
}

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function MenuRow({ label }: { label: string }) {
  return (
    <View style={styles.menuRow}>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
  );
}
