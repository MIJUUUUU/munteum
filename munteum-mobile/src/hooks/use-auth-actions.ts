import { User, AppState, makeId } from "../lib/munteum-data";
import { AuthFields, AuthMode, SetAppState, ShowToast } from "./munteum-hook-types";

export function useAuthActions({
  state,
  setState,
  authMode,
  authFields,
  setAuthFields,
  setAuthError,
  showToast,
}: {
  state: AppState;
  setState: SetAppState;
  authMode: AuthMode;
  authFields: AuthFields;
  setAuthFields: (fields: AuthFields) => void;
  setAuthError: (value: string | null) => void;
  showToast: ShowToast;
}) {
  function handleAuth() {
    const email = authFields.email.trim().toLowerCase();
    const password = authFields.password.trim();
    const nickname = authFields.nickname.trim();

    if (!email) {
      setAuthError("이메일을 입력해주세요.");
      return;
    }
    if (!password) {
      setAuthError("비밀번호를 입력해주세요.");
      return;
    }

    if (authMode === "signup") {
      if (password.length < 8) {
        setAuthError("비밀번호는 8자 이상 입력해주세요.");
        return;
      }
      if (!nickname) {
        setAuthError("닉네임을 입력해주세요.");
        return;
      }
      if (state.users.some((user) => user.email === email)) {
        setAuthError("이미 사용 중인 이메일이에요.");
        return;
      }

      const newUser: User = {
        id: makeId("user"),
        email,
        nickname,
        password,
      };
      setState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        sessionUserId: newUser.id,
      }));
      setAuthFields({ email: "", password: "", nickname: "" });
      setAuthError(null);
      showToast("success", "회원가입이 완료되었어요.");
      return;
    }

    const user = state.users.find((item) => item.email === email && item.password === password);
    if (!user) {
      setAuthError("이메일 또는 비밀번호를 다시 확인해주세요.");
      return;
    }

    setState((prev) => ({ ...prev, sessionUserId: user.id }));
    setAuthFields({ email: "", password: "", nickname: "" });
    setAuthError(null);
    showToast("success", "기록해둔 문장으로 돌아왔어요.");
  }

  return { handleAuth };
}
