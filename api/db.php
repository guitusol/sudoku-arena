<?php
/**
 * Conexión a la Base de Datos MariaDB / MySQL
 * Compatible con entorno local de Laragon y servidor VPS Plesk
 * Diseño tolerante a fallos: no aborta la ejecución si la BD no está disponible
 */

// Configuración por defecto (Laragon)
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_DATABASE') ?: 'sudoku_arena';
$dbUser = getenv('DB_USERNAME') ?: 'root';
$dbPass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';

// Soporte para archivo de configuración local/producción si existe
if (file_exists(__DIR__ . '/config.local.php')) {
    include __DIR__ . '/config.local.php';
}

$pdo = null;
$dbConnectionError = null;

try {
    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ];
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
} catch (Throwable $e) {
    // Si la conexión falla, no interrumpimos con error 500 para permitir el almacenamiento de respaldo en disco
    $pdo = null;
    $dbConnectionError = $e->getMessage();
}
