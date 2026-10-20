-- รันไฟล์นี้ 2 รอบ: ก่อนและหลังใส่ migration 00000000000008 แล้วเทียบ "Execution Time" กับชนิด scan
\timing off
\pset pager off
\set ON_ERROR_STOP off

\echo '\n===== Q1: logout-all  UPDATE refresh_tokens WHERE userId = ?  (auth.service) ====='
BEGIN;
EXPLAIN (ANALYZE, BUFFERS) UPDATE refresh_tokens SET revoked = true WHERE "userId" = 12345;
ROLLBACK;

\echo '\n===== Q2: ค้นผู้ใช้ ILIKE ''%a3f9%'' (user.service list: username OR email) ====='
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE username ILIKE '%a3f9%' OR email ILIKE '%a3f9%' ORDER BY id LIMIT 20;
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM users WHERE username ILIKE '%a3f9%' OR email ILIKE '%a3f9%';

\echo '\n===== Q3: (มี index อยู่แล้ว) ประวัติกระเป๋าเงินของ walletId = 777 ====='
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM wallet_transactions WHERE "walletId" = 777 ORDER BY "createdAt" DESC LIMIT 20;

\echo '\n===== Q4: (มี index อยู่แล้ว) ตั๋วของ userId = 777 ====='
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM tickets WHERE "userId" = 777 ORDER BY "purchasedAt" DESC;

\echo '\n===== Q5: Leftmost rule  ใช้เฉพาะคอลัมน์ที่สองของ composite index (walletId, createdAt) ====='
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM wallet_transactions WHERE "createdAt" > now() - interval '1 day';

\echo '\n===== ขนาดของ index ====='
SELECT indexrelid::regclass AS index_name, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index WHERE indrelid IN ('users'::regclass, 'refresh_tokens'::regclass,
                                 'wallet_transactions'::regclass, 'tickets'::regclass)
ORDER BY pg_relation_size(indexrelid) DESC;
