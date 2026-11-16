# Local database diagnosis (2026-11-14)

## Evidence

- No MYSQL_* environment variables were inherited by the diagnostic process.
- `.env` and `.env.test` had the same host, port and username, but different passwords. Values were never printed.
- Read-only mysql2 connections to that endpoint rejected `.env.test` with ER_ACCESS_DENIED_ERROR and accepted `.env`.
- The accepted account was root@%, with CREATE/DROP privileges sufficient for the guarded test database setup. This is not a recommendation to use root in production.
- `docker ps` identified mysql-container using mysql:latest, published on host port 3306. `docker inspect` identified a different Compose project and its persistent named volume, mounted at /var/lib/mysql. The container's configured root password matched `.env`, not `.env.test` (comparison only).
- The repository Compose describes mysql:8.0 and container name mysql. The container on port 3306 belongs to another Compose project and its persistent volume must not be changed or removed.

## Applied correction (2026-11-14)

A separate MySQL 8 service now runs for this repository on `127.0.0.1:3307`, using a new Compose-scoped volume. The existing `mysql-container` and its volume on port 3306 remain untouched. `.env` and `.env.test.local` use port 3307; only the port value changed, not the credentials. The new service's root password is interpolated from `MYSQL_PASSWORD` in the private `.env`, and Compose binds it only to loopback.

The current `rotarix` database was logically backed up, restored into the new MySQL 8 instance, and validated. It contains the restored `fleets.manager_id` FK; D38 is preserved (`users.manager_id` is absent). The prior instance remains available on port 3306 as an untouched recovery copy.

`src/config/environment.js` is shared by globalSetup and application bootstrap. For tests the precedence is: existing process variables, `.env.test.local`, `.env.test`. It never silently falls back to `.env`. All paths resolve from the repository root. Both the loader and database setup require exactly rotarix_test before any reset; the application loader rejects other database names in test mode too.

A local `.env.test.local`, ignored by Git, uses the verified credentials and explicitly selects rotarix_test on port 3307. It must not be committed or printed. CI continues to use its explicit environment on port 3306.

On another machine, fill `.env` privately with MYSQL_HOST, MYSQL_PORT=3307, MYSQL_DATABASE=rotarix, MYSQL_USERNAME and MYSQL_PASSWORD before starting Compose. The test override should use the same local host/port/credentials and MYSQL_DATABASE=rotarix_test. Prefer a dedicated test account with privileges restricted to the test database when practical; never remove a volume to resolve a credential mismatch.

## Safe verification

```powershell
docker ps --format '{{.Names}} {{.Image}} {{.Ports}}'
docker inspect mysql-container --format '{{json .Mounts}}'
docker compose ps
docker exec -it mysql mysql -u root -p -e "SELECT DATABASE(), VERSION(); SHOW COLUMNS FROM fleets;"
npm.cmd run test
```

The mysql command prompts for the password; do not place it on the command line. Do not print full `docker inspect`, `.env*`, process environments or password grants from old servers to public logs. The original shared container on port 3306 is not the Rotarix development target.

## Existing database upgrade

`data/migrations/2026-11-11-remove-driver-manager.sql` is a separate manual, reviewable D38 upgrade. It removes only the obsolete users FK/index/column. It does not execute automatically and has not been applied to development. Review its preflight output and back up the selected database before applying the ALTER. MySQL DDL implicitly commits; a transaction is not a rollback guarantee. A database without users.manager_id does not need this ALTER. Never run data/db.sql to upgrade an existing database.
