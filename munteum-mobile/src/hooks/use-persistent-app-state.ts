import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { AppState } from "../lib/munteum-data";

const STORAGE_KEY = "munteum-mobile-state";

export function usePersistentAppState(initialState: AppState) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadState() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          return;
        }

        const parsed = JSON.parse(stored) as AppState;
        if (mounted) {
          setState(parsed);
        }
      } catch {
        if (mounted) {
          setStorageError("저장된 데이터를 불러오지 못했어요.");
        }
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    }

    loadState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      setStorageError("데이터를 저장하지 못했어요.");
    });
  }, [hydrated, state]);

  return { state, setState, hydrated, storageError, setStorageError };
}
