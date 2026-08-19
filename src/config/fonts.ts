import { IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";

/** Arabic UI face — clean, professional, excellent at large display sizes. */
export const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-omega-ar",
  display: "swap",
});

/** Latin face used for the English locale and for Latin words inside Arabic text. */
export const latinFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-omega-en",
  display: "swap",
});
