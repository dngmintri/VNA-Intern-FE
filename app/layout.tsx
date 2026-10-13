import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cơ Sở Dữ Liệu An Toàn Vệ Sinh Lao Động",
  description: "Hệ thống quản lý thông tin dữ liệu An toàn Vệ sinh Lao động", 
  
  icons: {
    icon: "/vnalogo.png", 
    apple: "/vnalogo.png", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white [&&]:has([data-nobar=true]):overflow-hidden">
        {children}
        <Toaster
          position="top-right"
          containerStyle={{
            top: 70,
          }}
          toastOptions={{
            duration: 2000,
            style: { fontSize: '14px' },
            success: {
              style: {
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#166534',
              },
              iconTheme: { primary: '#16A34A', secondary: '#F0FDF4' },
            },
            error: {
              style: {
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
              },
              iconTheme: { primary: '#DC2626', secondary: '#FEF2F2' },
            },
          }}
        />
      </body>
    </html>
  );
}