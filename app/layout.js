import "./globals.css";

export const metadata = {
  title: "Dock Permit AI",
  description: "Dock permit intake assistant"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
