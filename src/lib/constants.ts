export const STATUS_CONFIG = {
  ordered: { label: "Ordered", color: "info" },
  shipped_to_warehouse: { label: "Shipped to CN", color: "info" },
  at_cn_warehouse: { label: "At CN Warehouse", color: "warning" },
  shipped_to_ph: { label: "Shipped to PH", color: "info" },
  at_ph_warehouse: { label: "At PH Warehouse", color: "warning" },
  delivered_to_me: { label: "Delivered", color: "accent" },
  sold: { label: "Sold", color: "success" },
  cancelled: { label: "Cancelled", color: "danger" },
  returned: { label: "Returned", color: "danger" },
} as const;

export type ItemStatus = keyof typeof STATUS_CONFIG;

export const STATUS_FLOW: ItemStatus[] = [
  "ordered",
  "shipped_to_warehouse",
  "at_cn_warehouse",
  "shipped_to_ph",
  "at_ph_warehouse",
  "delivered_to_me",
  "sold",
];

export const QC_STATUS_CONFIG = {
  not_received: { label: "Not Received", color: "tertiary" },
  pending_review: { label: "Pending Review", color: "warning" },
  gl: { label: "GL", color: "success" },
  rl: { label: "RL", color: "danger" },
} as const;

export type QcStatus = keyof typeof QC_STATUS_CONFIG;

export const CATEGORY_CONFIG = {
  shoes: { label: "Shoes", icon: "Footprints" },
  clothes: { label: "Clothes", icon: "Shirt" },
  watches_accessories: { label: "Watches & Accessories", icon: "Watch" },
} as const;

export type ItemCategory = keyof typeof CATEGORY_CONFIG;

export const PLATFORM_CONFIG = {
  weidian: { label: "Weidian" },
  taobao: { label: "Taobao" },
  "1688": { label: "1688" },
  yupoo: { label: "Yupoo" },
  direct: { label: "Direct" },
} as const;

export type SellerPlatform = keyof typeof PLATFORM_CONFIG;

export const DEFAULTS = {
  exchangeRate: 7.8,
  forwarderRate: 480,
  markupMin: 700,
  markupMax: 850,
} as const;

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ItemStatus[];
export const ALL_QC_STATUSES = Object.keys(QC_STATUS_CONFIG) as QcStatus[];
export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as ItemCategory[];
