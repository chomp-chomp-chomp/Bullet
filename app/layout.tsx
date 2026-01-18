import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bullet Journal",
  description: "A minimal shared bullet journal app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-dark-bg text-dark-text font-sans">
        {children}
      </body>
    </html>
  );
}
