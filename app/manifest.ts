import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: "One Wish Willow",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ED1C24",
    theme_color: "#ED1C24",
    icons: [
      {
        src: "/icon.png",
        sizes: "256x255",
        type: "image/png",
      },
    ],
  };
}
