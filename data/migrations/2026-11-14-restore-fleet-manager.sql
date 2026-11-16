-- D27 restoration for the inspected development schema.
-- Manual only; never run from application startup or tests.
-- Owner mapping confirmed by the user: fleet_id 1 -> manager_id 1.
-- MySQL DDL implicitly commits. A verified backup is required before execution.
-- Execute in one session and stop on any error.
--
-- Read-only preflight:
SELECT DATABASE() AS selected_database;
SHOW COLUMNS FROM fleets;
SHOW COLUMNS FROM users;
SHOW CREATE TABLE fleets;
SHOW CREATE TABLE vehicles;
SHOW CREATE TABLE vehicle_assignments;
SELECT id, name, status, created_at FROM fleets ORDER BY id;
SELECT id, role, status, created_at, deleted_at FROM users ORDER BY id;

-- Guard: fail before persistent DDL if the selected database or inspected
-- records/schema have changed since this migration was reviewed.
CREATE TEMPORARY TABLE fleet_manager_restore_guard (
    ready TINYINT NOT NULL CHECK (ready = 1)
);

INSERT INTO fleet_manager_restore_guard (ready)
SELECT IF(
    DATABASE() = 'rotarix'
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fleets' AND COLUMN_NAME = 'manager_id'
    )
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'manager_id'
    )
    AND (SELECT COUNT(*) FROM fleets) = 1
    AND EXISTS (
        SELECT 1 FROM fleets
        WHERE id = 1 AND name = 'Frota Teste Patos - Atualizada' AND status = 'inactive'
    )
    AND (SELECT COUNT(*) FROM users WHERE id = 1 AND role = 'manager') = 1
    AND (SELECT COUNT(*) FROM vehicles) = 0
    AND (SELECT COUNT(*) FROM vehicle_assignments) = 0,
    1,
    0
);

ALTER TABLE fleets
    ADD COLUMN manager_id INT NULL AFTER id,
    ADD INDEX fk_fleets_manager (manager_id);

UPDATE fleets
SET manager_id = 1
WHERE id = 1;

-- Verify the explicit owner mapping before enforcing the required FK.
CREATE TEMPORARY TABLE fleet_manager_restore_validation (
    ready TINYINT NOT NULL CHECK (ready = 1)
);

INSERT INTO fleet_manager_restore_validation (ready)
SELECT IF(
    (SELECT COUNT(*) FROM fleets) = 1
    AND (SELECT COUNT(*) FROM fleets WHERE id = 1 AND manager_id = 1) = 1
    AND (SELECT COUNT(*) FROM fleets f
         LEFT JOIN users u ON u.id = f.manager_id
         WHERE f.manager_id IS NULL OR u.id IS NULL OR u.role <> 'manager') = 0,
    1,
    0
);

ALTER TABLE fleets
    MODIFY manager_id INT NOT NULL,
    ADD CONSTRAINT fk_fleets_manager
        FOREIGN KEY (manager_id) REFERENCES users (id);

DROP TEMPORARY TABLE fleet_manager_restore_validation;
DROP TEMPORARY TABLE fleet_manager_restore_guard;

-- Postflight:
SHOW CREATE TABLE fleets;
SHOW COLUMNS FROM users;
SHOW CREATE TABLE vehicles;
SHOW CREATE TABLE vehicle_assignments;
SELECT f.id, f.manager_id, u.role
FROM fleets f JOIN users u ON u.id = f.manager_id ORDER BY f.id;
