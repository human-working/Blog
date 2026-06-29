import "./globals.css";
import { AuthProvider } from "@/context/authContext";"../context/authContext"

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
    </AuthProvider>
  );
}