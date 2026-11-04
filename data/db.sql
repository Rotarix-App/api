DROP DATABASE IF EXISTS rotarix;

CREATE DATABASE IF NOT EXISTS rotarix;
USE rotarix;

CREATE TABLE `users` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`role` ENUM('manager','driver') NOT NULL,
	`name` VARCHAR(120) NOT NULL,
	`email` VARCHAR(160) NOT NULL,
	`password_hash` VARCHAR(255) NOT NULL,
	`phone` VARCHAR(20) NULL DEFAULT NULL,
	`cnh_number` VARCHAR(11) NULL DEFAULT NULL,
	`cnh_category` ENUM('B','C','D','E') NULL DEFAULT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_users_email` (`email`)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `fleets` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`manager_id` INT(11) NOT NULL,
	`name` VARCHAR(100) NOT NULL,
	`base_region` VARCHAR(120) NOT NULL,
	`description` VARCHAR(255) NULL DEFAULT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `fk_fleets_manager` (`manager_id`),
	CONSTRAINT `fk_fleets_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `vehicles` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`fleet_id` INT(11) NULL DEFAULT NULL,
	`plate` VARCHAR(7) NOT NULL,
	`brand` VARCHAR(60) NOT NULL,
	`model` VARCHAR(60) NOT NULL,
	`year` SMALLINT UNSIGNED NOT NULL,
	`current_odometer` INT UNSIGNED NOT NULL DEFAULT 0,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
	`active_plate` VARCHAR(7) AS (IF(`deleted_at` IS NULL, `plate`, NULL)) STORED,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_vehicles_active_plate` (`active_plate`),
	INDEX `fk_vehicles_fleet` (`fleet_id`),
	CONSTRAINT `fk_vehicles_fleet` FOREIGN KEY (`fleet_id`) REFERENCES `fleets` (`id`) ON DELETE SET NULL
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `vehicle_assignments` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`driver_id` INT(11) NOT NULL,
	`vehicle_id` INT(11) NOT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_vehicle_assignments_driver_vehicle` (`driver_id`, `vehicle_id`),
	INDEX `fk_vehicle_assignments_vehicle` (`vehicle_id`),
	CONSTRAINT `fk_vehicle_assignments_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_vehicle_assignments_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `photos` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`kind` ENUM('odometer','receipt','invoice') NOT NULL,
	`storage_key` VARCHAR(255) NOT NULL,
	`mime_type` VARCHAR(50) NOT NULL,
	`size_bytes` INT UNSIGNED NOT NULL,
	`uploaded_by` INT(11) NOT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_photos_storage_key` (`storage_key`),
	INDEX `fk_photos_uploaded_by` (`uploaded_by`),
	CONSTRAINT `fk_photos_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `odometer_readings` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`vehicle_id` INT(11) NOT NULL,
	`recorded_by` INT(11) NOT NULL,
	`value_km` INT UNSIGNED NOT NULL,
	`source` ENUM('manual','trip_start','trip_end','refueling','maintenance') NOT NULL,
	`photo_id` INT(11) NULL DEFAULT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_odometer_readings_photo` (`photo_id`),
	INDEX `ix_odometer_readings_vehicle_value` (`vehicle_id`, `value_km`),
	INDEX `fk_odometer_readings_recorded_by` (`recorded_by`),
	CONSTRAINT `fk_odometer_readings_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
	CONSTRAINT `fk_odometer_readings_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`),
	CONSTRAINT `fk_odometer_readings_photo` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `trips` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`driver_id` INT(11) NOT NULL,
	`vehicle_id` INT(11) NOT NULL,
	`origin` VARCHAR(120) NOT NULL,
	`destination` VARCHAR(120) NOT NULL,
	`status` ENUM('in_progress','finished','cancelled') NOT NULL DEFAULT 'in_progress',
	`start_reading_id` INT(11) NOT NULL,
	`end_reading_id` INT(11) NULL DEFAULT NULL,
	`notes` VARCHAR(500) NULL DEFAULT NULL,
	`started_at` DATETIME NOT NULL,
	`ended_at` DATETIME NULL DEFAULT NULL,
	`active_driver_id` INT(11) AS (IF(`status` = 'in_progress', `driver_id`, NULL)) STORED,
	`active_vehicle_id` INT(11) AS (IF(`status` = 'in_progress', `vehicle_id`, NULL)) STORED,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_trips_start_reading` (`start_reading_id`),
	UNIQUE INDEX `uq_trips_end_reading` (`end_reading_id`),
	UNIQUE INDEX `uq_trips_active_driver` (`active_driver_id`),
	UNIQUE INDEX `uq_trips_active_vehicle` (`active_vehicle_id`),
	INDEX `fk_trips_driver` (`driver_id`),
	INDEX `fk_trips_vehicle` (`vehicle_id`),
	INDEX `ix_trips_started_at` (`started_at`),
	CONSTRAINT `fk_trips_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`),
	CONSTRAINT `fk_trips_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
	CONSTRAINT `fk_trips_start_reading` FOREIGN KEY (`start_reading_id`) REFERENCES `odometer_readings` (`id`),
	CONSTRAINT `fk_trips_end_reading` FOREIGN KEY (`end_reading_id`) REFERENCES `odometer_readings` (`id`)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `expenses` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`driver_id` INT(11) NOT NULL,
	`vehicle_id` INT(11) NOT NULL,
	`trip_id` INT(11) NULL DEFAULT NULL,
	`category` ENUM('fuel','toll','food','tire_repair','urgent_maintenance') NOT NULL,
	`amount` DECIMAL(10,2) NOT NULL,
	`description` VARCHAR(255) NULL DEFAULT NULL,
	`receipt_photo_id` INT(11) NULL DEFAULT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_expenses_receipt_photo` (`receipt_photo_id`),
	INDEX `fk_expenses_driver` (`driver_id`),
	INDEX `fk_expenses_vehicle` (`vehicle_id`),
	INDEX `fk_expenses_trip` (`trip_id`),
	INDEX `ix_expenses_created_at` (`created_at`),
	CONSTRAINT `fk_expenses_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`),
	CONSTRAINT `fk_expenses_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
	CONSTRAINT `fk_expenses_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
	CONSTRAINT `fk_expenses_receipt_photo` FOREIGN KEY (`receipt_photo_id`) REFERENCES `photos` (`id`) ON DELETE SET NULL,
	CONSTRAINT `ck_expenses_amount` CHECK (`amount` > 0)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `refuelings` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`driver_id` INT(11) NOT NULL,
	`vehicle_id` INT(11) NOT NULL,
	`trip_id` INT(11) NULL DEFAULT NULL,
	`odometer_reading_id` INT(11) NOT NULL,
	`liters` DECIMAL(8,2) NOT NULL,
	`price_per_liter` DECIMAL(8,3) NOT NULL,
	`total_amount` DECIMAL(10,2) NOT NULL,
	`gas_station` VARCHAR(120) NOT NULL,
	`invoice_photo_id` INT(11) NULL DEFAULT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_refuelings_odometer_reading` (`odometer_reading_id`),
	UNIQUE INDEX `uq_refuelings_invoice_photo` (`invoice_photo_id`),
	INDEX `fk_refuelings_driver` (`driver_id`),
	INDEX `fk_refuelings_vehicle` (`vehicle_id`),
	INDEX `fk_refuelings_trip` (`trip_id`),
	INDEX `ix_refuelings_created_at` (`created_at`),
	CONSTRAINT `fk_refuelings_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`),
	CONSTRAINT `fk_refuelings_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
	CONSTRAINT `fk_refuelings_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
	CONSTRAINT `fk_refuelings_odometer_reading` FOREIGN KEY (`odometer_reading_id`) REFERENCES `odometer_readings` (`id`),
	CONSTRAINT `fk_refuelings_invoice_photo` FOREIGN KEY (`invoice_photo_id`) REFERENCES `photos` (`id`) ON DELETE SET NULL,
	CONSTRAINT `ck_refuelings_values` CHECK (`liters` > 0 AND `price_per_liter` > 0 AND `total_amount` > 0)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `maintenances` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`driver_id` INT(11) NOT NULL,
	`vehicle_id` INT(11) NOT NULL,
	`trip_id` INT(11) NULL DEFAULT NULL,
	`odometer_reading_id` INT(11) NOT NULL,
	`type` ENUM('preventive','corrective','urgent') NOT NULL,
	`service` VARCHAR(255) NOT NULL,
	`amount` DECIMAL(10,2) NOT NULL,
	`workshop` VARCHAR(120) NOT NULL,
	`invoice_photo_id` INT(11) NULL DEFAULT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `uq_maintenances_odometer_reading` (`odometer_reading_id`),
	UNIQUE INDEX `uq_maintenances_invoice_photo` (`invoice_photo_id`),
	INDEX `fk_maintenances_driver` (`driver_id`),
	INDEX `fk_maintenances_vehicle` (`vehicle_id`),
	INDEX `fk_maintenances_trip` (`trip_id`),
	INDEX `ix_maintenances_created_at` (`created_at`),
	CONSTRAINT `fk_maintenances_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`),
	CONSTRAINT `fk_maintenances_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
	CONSTRAINT `fk_maintenances_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
	CONSTRAINT `fk_maintenances_odometer_reading` FOREIGN KEY (`odometer_reading_id`) REFERENCES `odometer_readings` (`id`),
	CONSTRAINT `fk_maintenances_invoice_photo` FOREIGN KEY (`invoice_photo_id`) REFERENCES `photos` (`id`) ON DELETE SET NULL,
	CONSTRAINT `ck_maintenances_amount` CHECK (`amount` > 0)
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `service_reminders` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`vehicle_id` INT(11) NOT NULL,
	`title` VARCHAR(60) NOT NULL,
	`due_odometer` INT UNSIGNED NOT NULL,
	`interval_km` INT UNSIGNED NULL DEFAULT NULL,
	`completed_maintenance_id` INT(11) NULL DEFAULT NULL,
	`completed_at` DATETIME NULL DEFAULT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `ix_service_reminders_vehicle_due` (`vehicle_id`, `due_odometer`),
	INDEX `fk_service_reminders_maintenance` (`completed_maintenance_id`),
	CONSTRAINT `fk_service_reminders_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
	CONSTRAINT `fk_service_reminders_maintenance` FOREIGN KEY (`completed_maintenance_id`) REFERENCES `maintenances` (`id`) ON DELETE SET NULL
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;
