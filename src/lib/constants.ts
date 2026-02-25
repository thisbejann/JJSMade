export const STATUS_CONFIG = {
  ordered: { label: "Ordered", color: "info" },
  qc_sent: { label: "QC Sent", color: "warning" },
  item_shipout: { label: "Item Shipout", color: "info" },
  arrived_ph_warehouse: { label: "Arrived in PH", color: "warning" },
  delivered_to_customer: { label: "Delivered", color: "success" },
  refunded: { label: "Refunded", color: "danger" },
} as const;

export type ItemStatus = keyof typeof STATUS_CONFIG;

export const STATUS_FLOW: ItemStatus[] = [
  "ordered",
  "qc_sent",
  "item_shipout",
  "arrived_ph_warehouse",
  "delivered_to_customer",
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
  forwarderBuyServiceRate: 8.6,
  forwarderRate: 480,
  markupMin: 700,
  markupMax: 850,
} as const;

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ItemStatus[];
export const ALL_QC_STATUSES = Object.keys(QC_STATUS_CONFIG) as QcStatus[];
export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as ItemCategory[];
