import {
  HandBag01Icon,
  NecklaceIcon,
  RunningShoesIcon,
  Shirt01Icon,
  Watch01Icon,
} from "@hugeicons/core-free-icons";
import type { ItemCategory } from "../../lib/constants";

/** The Hugeicons glyph for each category, shared by badges, icons and pickers. */
export const CATEGORY_ICONS = {
  shoes: RunningShoesIcon,
  clothes: Shirt01Icon,
  watches: Watch01Icon,
  accessories: NecklaceIcon,
  bags: HandBag01Icon,
  watches_accessories: Watch01Icon,
} as const satisfies Record<ItemCategory, unknown>;
