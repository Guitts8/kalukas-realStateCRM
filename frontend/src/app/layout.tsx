// frontend/src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/contexts/authContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
