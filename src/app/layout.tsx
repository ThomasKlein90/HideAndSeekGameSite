import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hide and Seek Hong Kong",
  description: "A private companion for a Hong Kong transit hide and seek game.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-HK">
      <body>{children}</body>
    </html>
  );
}
