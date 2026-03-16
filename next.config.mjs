import "./globals.css";

export const metadata = {
  title: "Dock Permit AI",
  description: "Dock permit intake assistant"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
