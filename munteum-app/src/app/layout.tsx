import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "문틈 MVP",
  description: "문장 사이, 나의 생각이 머무는 곳.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
