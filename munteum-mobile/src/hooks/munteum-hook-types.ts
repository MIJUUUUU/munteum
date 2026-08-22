import { Dispatch, SetStateAction } from "react";
import { AppState } from "../lib/munteum-data";

export type ToastState = { kind: "success" | "error"; message: string } | null;

export type DraftNote = {
  userBookId: string;
  page: string;
  quote: string;
  thought: string;
};

export type OverlayState =
  | { type: "search" }
  | { type: "record" }
  | { type: "book"; userBookId: string }
  | { type: "edit-note"; noteId: string }
  | { type: "finish"; userBookId: string }
  | { type: "delete-note"; noteId: string }
  | null;

export type AuthMode = "login" | "signup";

export type AuthFields = {
  email: string;
  password: string;
  nickname: string;
};

export type FinishForm = {
  finishedAt: string;
  rating: number;
  review: string;
};

export type SetAppState = Dispatch<SetStateAction<AppState>>;

export type ShowToast = (kind: "success" | "error", message: string) => void;
