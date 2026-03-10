import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="p-6">
        <main className="mx-auto max-w-5xl">{children}</main>
      </body>
    </html>
  );
}
