/** Включать в бейдж «мало осталось» активные товары со остатком 1..N */
export const ADMIN_LOW_STOCK_MAX = 5;

export type AdminNavBadgeCounts = {
  /** Сообщения клиентов после последнего прочтения чата (как на /admin/chats) */
  chatUnread: number;
  productOutOfStock: number;
  productLowStock: number;
  reviewsPending: number;
};

export const EMPTY_ADMIN_NAV_BADGES: AdminNavBadgeCounts = {
  chatUnread: 0,
  productOutOfStock: 0,
  productLowStock: 0,
  reviewsPending: 0,
};
