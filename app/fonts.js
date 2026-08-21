import { Orbitron, Poppins } from "next/font/google";
import localFont from "next/font/local";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-orbitron",
});

export const nostromoLight = localFont({
  src: "../public/assets/fonts/nostromo/Nostromo_Light.otf",
  weight: "300",
  style: "normal",
  variable: "--font-nostromo-light",
});

export const nostromoMedium = localFont({
  src: "../public/assets/fonts/nostromo/Nostromo_Regular.otf",
  weight: "500",
  style: "normal",
  variable: "--font-nostromo-medium",
});

export const ruigslay = localFont({
  src: "../public/assets/fonts/ruigslay/Ruigslay_Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-ruigslay",
});

export const gulimche = localFont({
  src: "../public/assets/fonts/gulimche/GulimChe.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-gulimche",
});

export const t012 = localFont({
  src: "../public/assets/fonts/t012/T012Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-t012",
});
