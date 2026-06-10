import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "One Wish Willow™ — Wish Consultation Line",
  description:
    "Consult your wish before something bad happens. Free 24/7 wish-risk assessment from the One Wish Willow™ support line. Every wish comes true exactly as worded.",
  openGraph: {
    title: "One Wish Willow™ — Wish Consultation Line",
    description:
      "Consult your wish before something bad happens. Every wish comes true exactly as worded.",
    images: [
      {
        url: "/og.svg",
        width: 712,
        height: 419,
        alt: "One Wish Willow wish consultation line",
        type: "image/svg+xml",
      },
      {
        url: "/og.png",
        width: 712,
        height: 419,
        alt: "One Wish Willow wish consultation line",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "One Wish Willow™ — Wish Consultation Line",
    description:
      "Consult your wish before something bad happens. Every wish comes true exactly as worded.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ED1C24",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${baloo.variable} ${nunito.variable}`}>{children}</body>
    </html>
  );
}
