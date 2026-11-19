# REPİO(M) veritabanı: Supabase Postgres + pgBackRest (sürekli WAL arşivi ve yedek; Alpine resmi paket deposundan).
FROM public.ecr.aws/supabase/postgres:17.12.0.000

RUN apk add --no-cache pgbackrest \
 && mkdir -p /var/spool/pgbackrest /var/log/pgbackrest /var/lib/pgbackrest /yedek-deposu \
 && chown -R postgres:postgres /var/spool/pgbackrest /var/log/pgbackrest /var/lib/pgbackrest /yedek-deposu

COPY roles.sql /docker-entrypoint-initdb.d/init-scripts/99-roles.sql
COPY jwt.sql /docker-entrypoint-initdb.d/init-scripts/99-jwt.sql
COPY giris.sh /usr/local/bin/repiom-giris.sh
COPY yedekci.sh /usr/local/bin/repiom-yedekci.sh
COPY yedek.sh /usr/local/bin/yedek
RUN chmod 755 /usr/local/bin/repiom-giris.sh /usr/local/bin/repiom-yedekci.sh /usr/local/bin/yedek

ENTRYPOINT ["/usr/local/bin/repiom-giris.sh"]
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
