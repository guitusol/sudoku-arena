-- ============================================================================
-- SUDOKU ARENA & CLUB DEL INGENIO — BASE DE DATOS CENTRAL: SALÓN DE LA FAMA
-- Tabla oficial para registro de Maestros (Zero-Login con device_uuid)
-- Compatible con MariaDB / MySQL (Laragon en local y Plesk en producción)
-- ============================================================================

-- 1. Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS `sudoku_arena` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `sudoku_arena`;

-- 2. Estructura de la tabla de Maestros
CREATE TABLE IF NOT EXISTS `sudoku_hall_of_fame` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `device_uuid` VARCHAR(64) NOT NULL COMMENT 'Identificador único anónimo del dispositivo/jugador',
    `name` VARCHAR(40) NOT NULL COMMENT 'Nombre o alias público del Maestro',
    `flag` VARCHAR(8) NOT NULL DEFAULT '🇪🇸' COMMENT 'Emoji de bandera del país',
    `country` VARCHAR(4) NOT NULL DEFAULT 'ES' COMMENT 'Código ISO del país (ES, MX, FR, JP, etc.)',
    `country_name` VARCHAR(50) NOT NULL DEFAULT 'España' COMMENT 'Nombre del país en texto',
    `city` VARCHAR(60) NOT NULL COMMENT 'Ciudad o localidad de residencia',
    `age` INT NOT NULL COMMENT 'Edad en años',
    `age_group` ENUM('junior', 'adult', 'senior', 'legend') NOT NULL DEFAULT 'adult' COMMENT 'Tramo generacional',
    `difficulty` ENUM('facil', 'medio', 'dificil', 'endemoniado') NOT NULL DEFAULT 'dificil' COMMENT 'Nivel de la partida',
    `score` INT NOT NULL COMMENT 'Puntuación neta obtenida',
    `time_seconds` INT NOT NULL COMMENT 'Tiempo empleado en segundos',
    `autonomy_index` INT NOT NULL DEFAULT 90 COMMENT 'Porcentaje de autonomía cognitiva (>= 90%)',
    `peeks_count` INT NOT NULL DEFAULT 0 COMMENT 'Número de ayudas (0 para Gran Maestro Puro)',
    `errors_count` INT NOT NULL DEFAULT 0 COMMENT 'Número de correcciones/errores',
    `seed` INT NOT NULL COMMENT 'Semilla matemática del tablero para permitir "Desafiar al Maestro"',
    `verified` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 si cumple los criterios oficiales anti-trampas',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para consultas instantáneas
    UNIQUE KEY `uk_device_master` (`device_uuid`),
    INDEX `idx_hof_ranking` (`difficulty`, `score` DESC, `time_seconds` ASC),
    INDEX `idx_hof_country` (`country`, `score` DESC),
    INDEX `idx_hof_city` (`city`, `score` DESC),
    INDEX `idx_hof_age_group` (`age_group`, `score` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Carga de Maestros Iniciales del Cuadro de Honor
-- Incluye a Guillermo Tudela Soler como Gran Maestro Leyenda Fundador
INSERT INTO `sudoku_hall_of_fame` 
  (`device_uuid`, `name`, `flag`, `country`, `country_name`, `city`, `age`, `age_group`, `difficulty`, `score`, `time_seconds`, `autonomy_index`, `seed`, `created_at`) 
VALUES
  ('founder_guillermo', 'Guillermo T.', '🇪🇸', 'ES', 'España', 'Madrid', 73, 'legend', 'endemoniado', 1980, 395, 96, 78421, '2026-10-27 10:00:00'),
  ('bench_master_1', 'Javier Navarro', '🇪🇸', 'ES', 'España', 'Madrid', 52, 'senior', 'dificil', 1485, 272, 94, 78421, '2026-10-24 12:00:00'),
  ('bench_master_2', 'Elena Morales', '🇪🇸', 'ES', 'España', 'Valencia', 34, 'adult', 'dificil', 1420, 315, 95, 64120, '2026-10-23 15:30:00'),
  ('bench_master_3', 'Kenji Takahashi', '🇯🇵', 'JP', 'Japón', 'Tokio', 41, 'adult', 'endemoniado', 1920, 410, 93, 91024, '2026-10-22 09:15:00'),
  ('bench_master_4', 'Marta Gómez', '🇪🇸', 'ES', 'España', 'Barcelona', 71, 'legend', 'dificil', 1410, 325, 92, 45290, '2026-10-21 18:40:00'),
  ('bench_master_5', 'Jean-Luc Dubois', '🇫🇷', 'FR', 'Francia', 'Lyon', 68, 'legend', 'dificil', 1445, 308, 98, 33205, '2026-10-20 14:20:00'),
  ('bench_master_6', 'Carlos Rodríguez', '🇦🇷', 'AR', 'Argentina', 'Buenos Aires', 26, 'adult', 'endemoniado', 1890, 435, 92, 54109, '2026-10-19 20:10:00'),
  ('bench_master_7', 'Sofia Meyer', '🇩🇪', 'DE', 'Alemania', 'Múnich', 17, 'junior', 'dificil', 1465, 295, 91, 12890, '2026-10-18 11:00:00'),
  ('bench_master_8', 'Mateo Silva', '🇲🇽', 'MX', 'México', 'Guadalajara', 58, 'senior', 'dificil', 1395, 340, 90, 83712, '2026-10-17 16:45:00')
ON DUPLICATE KEY UPDATE 
  `score` = VALUES(`score`),
  `time_seconds` = VALUES(`time_seconds`);
