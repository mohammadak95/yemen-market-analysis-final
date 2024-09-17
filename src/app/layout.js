import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Yemen Market Analysis",
  description: "Comprehensive market analysis dashboard for Yemen",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link 
          rel="icon" 
          href={`${process.env.NODE_ENV === 'production' ? '/yemen-market-analysis-final' : ''}/favicon.ico`}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}