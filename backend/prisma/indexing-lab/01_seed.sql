-- สร้างข้อมูลจำลองจำนวนมากใน database ทดลอง (sailoh_lab) ห้ามรันกับ database จริง
SELECT setseed(0.42);
\timing on

INSERT INTO routes (number, name, "updatedAt")
SELECT 'R' || g, 'สายทดลอง ' || g, now() FROM generate_series(1, 40) g;

-- users 200,000
INSERT INTO users (username, email, "passwordHash", "displayName", "updatedAt")
SELECT 'u' || substr(md5(g::text), 1, 8) || g,
       'u' || substr(md5(g::text), 1, 8) || g || '@example.com',
       'x', 'ผู้ใช้ ' || g, now()
FROM generate_series(1, 200000) g;

-- refresh_tokens 600,000 (เฉลี่ย 3 ต่อคน)
INSERT INTO refresh_tokens (token, "userId", "expiresAt", revoked, "createdAt")
SELECT md5(g::text || 'tok'), 1 + (random() * 199999)::int,
       now() + interval '30 days', random() < 0.5,
       now() - (random() * 90) * interval '1 day'
FROM generate_series(1, 600000) g;

-- wallets 200,000 + wallet_transactions 1,000,000
INSERT INTO wallets ("userId", balance, "updatedAt") SELECT id, 100, now() FROM users;

INSERT INTO wallet_transactions ("walletId", type, amount, "balanceAfter", "createdAt")
SELECT 1 + (random() * 199999)::int,
       (ARRAY['TOPUP','TICKET_PURCHASE','REFUND'])[1 + (random() * 2)::int]::"WalletTxType",
       (random() * 200)::int, 100,
       now() - (random() * 365) * interval '1 day'
FROM generate_series(1, 1000000);

-- tickets 500,000
INSERT INTO tickets (code, "userId", "routeId", price, status, "purchasedAt")
SELECT md5(g::text || 'tk'), 1 + (random() * 199999)::int, 1 + (random() * 39)::int, 15,
       (ARRAY['UNUSED','USED','EXPIRED'])[1 + (random() * 2)::int]::"TicketStatus",
       now() - (random() * 365) * interval '1 day'
FROM generate_series(1, 500000) g;

ANALYZE users, refresh_tokens, wallet_transactions, tickets, wallets, routes;
SELECT 'users' t, count(*) FROM users UNION ALL SELECT 'refresh_tokens', count(*) FROM refresh_tokens
UNION ALL SELECT 'wallet_transactions', count(*) FROM wallet_transactions UNION ALL SELECT 'tickets', count(*) FROM tickets;
