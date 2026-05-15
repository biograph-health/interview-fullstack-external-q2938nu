import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
      </body>
    </html>
  );
}
