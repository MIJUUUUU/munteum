import { Pressable, SafeAreaView, Text, View } from "react-native";
import { Input, Toast } from "../components/munteum-ui";
import { styles } from "../styles/munteum-styles";

export function AuthScreen({
  authMode,
  authFields,
  authError,
  onModeChange,
  onFieldChange,
  onSubmit,
  toast,
}: {
  authMode: "login" | "signup";
  authFields: { email: string; password: string; nickname: string };
  authError: string | null;
  onModeChange: (mode: "login" | "signup") => void;
  onFieldChange: (field: "email" | "password" | "nickname", value: string) => void;
  onSubmit: () => void;
  toast: { kind: "success" | "error"; message: string } | null;
}) {
  return (
    <SafeAreaView style={styles.authSafe}>
      <View style={styles.authWrap}>
        <Text style={styles.wordmark}>MUNTEUM</Text>
        <Text style={styles.authTitle}>문장 사이,{"\n"}나의 생각이 머무는 곳.</Text>
        <Text style={styles.authDescription}>
          책에서 마음에 머문 문장과 생각을 가볍게 남기는 개인 독서 아카이브
        </Text>

        <View style={styles.authCard}>
          <View style={styles.switchRow}>
            <Pressable
              onPress={() => onModeChange("login")}
              style={[styles.switchButton, authMode === "login" && styles.switchButtonActive]}
            >
              <Text style={[styles.switchLabel, authMode === "login" && styles.switchLabelActive]}>로그인</Text>
            </Pressable>
            <Pressable
              onPress={() => onModeChange("signup")}
              style={[styles.switchButton, authMode === "signup" && styles.switchButtonActive]}
            >
              <Text style={[styles.switchLabel, authMode === "signup" && styles.switchLabelActive]}>회원가입</Text>
            </Pressable>
          </View>

          <Input
            label="이메일"
            placeholder="you@example.com"
            value={authFields.email}
            onChangeText={(value) => onFieldChange("email", value)}
          />
          <Input
            label="비밀번호"
            placeholder="비밀번호를 입력해주세요"
            value={authFields.password}
            onChangeText={(value) => onFieldChange("password", value)}
            secureTextEntry
          />
          {authMode === "signup" ? (
            <Input
              label="닉네임"
              placeholder="문틈에서 사용할 이름"
              value={authFields.nickname}
              onChangeText={(value) => onFieldChange("nickname", value)}
            />
          ) : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonLabel}>{authMode === "login" ? "로그인" : "회원가입"}</Text>
          </Pressable>
          <Text style={styles.demoText}>체험용 계정: demo@munteum.app / demo1234</Text>
        </View>
      </View>
      {toast ? <Toast toast={toast} /> : null}
    </SafeAreaView>
  );
}
