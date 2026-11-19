# REPİO(M) veritabanı: Supabase Postgres + pgBackRest (sürekli WAL arşivi ve yedek; Alpine resmi paket deposundan)
# + migration'lar ve göç betiği (goc servisi aynı imajı kullanır). Derleme bağlamı: depo kökü (repiom/).
FROM public.ecr.aws/supabase/postgres:17.12.0.000

RUN apk add --no-cache pgbackrest \
 && mkdir -p /var/spool/pgbackrest /var/log/pgbackrest /var/lib/pgbackrest /yedek-deposu \
 && chown -R postgres:postgres /var/spool/pgbackrest /var/log/pgbackrest /var/lib/pgbackrest /yedek-deposu

COPY sunucu/db/roles.sql /docker-entrypoint-initdb.d/init-scripts/99-roles.sql
COPY sunucu/db/jwt.sql /docker-entrypoint-initdb.d/init-scripts/99-jwt.sql
COPY sunucu/db/giris.sh /usr/local/bin/repiom-giris.sh
COPY sunucu/db/yedekci.sh /usr/local/bin/repiom-yedekci.sh
COPY sunucu/db/yedek.sh /usr/local/bin/yedek
COPY supabase/migrations /goc/migrations
COPY sunucu/goc/goc.sh sunucu/goc/ilk-veri.sql /goc/
RUN chmod 755 /usr/local/bin/repiom-giris.sh /usr/local/bin/repiom-yedekci.sh /usr/local/bin/yedek /goc/goc.sh

ENTRYPOINT ["/usr/local/bin/repiom-giris.sh"]
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
