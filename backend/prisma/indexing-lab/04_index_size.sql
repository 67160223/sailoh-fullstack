SELECT c.relname AS table_name,
       pg_size_pretty(pg_table_size(c.oid))   AS table_size,
       pg_size_pretty(pg_indexes_size(c.oid)) AS all_indexes_size
FROM pg_class c WHERE c.relnamespace = 'lab'::regnamespace AND c.relname IN ('users','refresh_tokens','wallet_transactions','tickets') ORDER BY 1;

SELECT indexrelid::regclass AS index_name, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index WHERE indrelid IN ('users'::regclass,'refresh_tokens'::regclass)
ORDER BY pg_relation_size(indexrelid) DESC;
