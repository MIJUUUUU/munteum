import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";
import { useMunteumApp } from "./src/hooks/use-munteum-app";
import { styles } from "./src/styles/munteum-styles";
import { AuthScreen } from "./src/screens/auth-screen";
import { MainShell, AppOverlays } from "./src/screens/app-shell";
import { LoadingScreen } from "./src/screens/overlay-sheets";

export default function App() {
  const app = useMunteumApp();

  if (!app.hydrated) {
    return (
      <SafeAreaView style={styles.loadingSafe}>
        <StatusBar style="dark" />
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (!app.currentUser) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen
          authMode={app.authMode}
          authFields={app.authFields}
          authError={app.authError}
          onModeChange={(mode) => {
            app.setAuthMode(mode);
            app.setAuthError(null);
          }}
          onFieldChange={(field, value) => app.setAuthFields((prev) => ({ ...prev, [field]: value }))}
          onSubmit={app.handleAuth}
          toast={app.toast}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <MainShell app={app} />
      <AppOverlays app={app} />
    </SafeAreaView>
  );
}
