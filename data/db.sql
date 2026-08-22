DROP DATABASE IF EXISTS rotarix;

CREATE DATABASE IF NOT EXISTS rotarix;
USE rotarix;

-- Tabelas do domínio vão aqui.
--
-- Padrão usado no projeto:
--
-- CREATE TABLE `exemplo` (
-- 	`id` INT(11) NOT NULL AUTO_INCREMENT,
-- 	`created_at` BIGINT(20) NULL DEFAULT (unix_timestamp() * 1000),
-- 	`updated_at` BIGINT(20) NULL DEFAULT (unix_timestamp() * 1000),
-- 	PRIMARY KEY (`id`) USING BTREE
-- )
-- COLLATE='utf8mb4_general_ci'
-- ENGINE=InnoDB
-- ;
