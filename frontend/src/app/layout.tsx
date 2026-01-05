import "./globals.css";
import { AuthProvider } from "@/contexts/authContext";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 bg-black min-h-screen text-white">

              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
