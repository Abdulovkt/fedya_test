import Database from "better-sqlite3";
const db = new Database("dev.db");

// Approach 1: nested correlated subquery (current)
const r1 = db.prepare(`
  SELECT o.id,
    (SELECT COUNT(*) FROM chat_messages cm
     WHERE cm.order_id = o.id
       AND cm.sender = 'customer'
       AND cm.created_at > COALESCE(
         (SELECT MAX(cm2.created_at) FROM chat_messages cm2
          WHERE cm2.order_id = o.id AND cm2.sender = 'admin'), 0
       )
    ) as unread
  FROM orders o
`).all();
console.log("Approach 1 (nested correlated):", r1);

// Approach 2: separate unread query without outer correlation
const lastAdminPerOrder = db.prepare(`
  SELECT order_id, MAX(created_at) as last_admin_at
  FROM chat_messages WHERE sender = 'admin'
  GROUP BY order_id
`).all();
console.log("Last admin per order:", lastAdminPerOrder);

// Debug: exact customer messages vs last admin timestamp for order 2
const debug = db.prepare(`
  SELECT cm.id, cm.created_at, cm.text,
         1776091137000 as last_admin_at,
         (cm.created_at > 1776091137000) as is_after
  FROM chat_messages cm
  WHERE cm.order_id = 2 AND cm.sender = 'customer'
`).all();
console.log("Customer messages detail:", debug);

// Approach 3: flat join approach
const r3 = db.prepare(`
  SELECT cm.order_id, COUNT(*) as unread
  FROM chat_messages cm
  LEFT JOIN (
    SELECT order_id, MAX(created_at) as last_admin_at
    FROM chat_messages WHERE sender = 'admin'
    GROUP BY order_id
  ) la ON la.order_id = cm.order_id
  WHERE cm.sender = 'customer'
    AND cm.created_at > COALESCE(la.last_admin_at, 0)
  GROUP BY cm.order_id
`).all();
console.log("Approach 3 (flat join):", r3);
