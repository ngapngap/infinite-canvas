import { FileText, ImagePlus, Images, Maximize2 } from "lucide-react";

export const navigationTools = [
  {
    slug: "canvas",
    labelKey: "myCanvas",
    icon: Maximize2,
  },
  {
    slug: "image",
    labelKey: "imageWorkbench",
    icon: ImagePlus,
  },
  {
    slug: "prompts",
    labelKey: "promptLibrary",
    icon: FileText,
  },
  {
    slug: "assets",
    labelKey: "myAssets",
    icon: Images,
  },
] as const;

export type NavigationToolSlug = (typeof navigationTools)[number]["slug"];
