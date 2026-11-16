-- D38: review and back up the selected database before executing manually.
-- This file is never executed by the application or the test setup.
-- Select the intended database explicitly in your SQL client; no USE/DROP DATABASE.
-- Preflight (read-only): verify the obsolete FK/column and the preserved links.
SELECT DATABASE() AS selected_database;
SHOW CREATE TABLE users;
SHOW CREATE TABLE fleets;
SHOW CREATE TABLE vehicle_assignments;

-- Apply only when fk_users_manager, its index and manager_id exist as shown above.
-- MySQL DDL implicitly commits. Take a backup before applying; do not wrap in a transaction.
-- No user rows, fleet ownership, assignments or history are deleted.
ALTER TABLE users
    DROP FOREIGN KEY fk_users_manager,
    DROP INDEX fk_users_manager,
    DROP COLUMN manager_id;

-- Postflight: fleets.manager_id and vehicle_assignments must remain unchanged.
SHOW CREATE TABLE users;
SHOW CREATE TABLE fleets;
SHOW CREATE TABLE vehicle_assignments;
