import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirDropX – Premium Offline WebRTC P2P File Transfer Engine",
  description: "Secure, instant peer-to-peer file sharing directly between devices without uploading to any cloud server.",
  keywords: ["AirDropX", "WebRTC", "P2P", "File Transfer", "Offline Sharing", "Socket.IO", "End-to-End Encryption"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
