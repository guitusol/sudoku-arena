<?php
/**
 * REST API — Salón de la Fama Global (Sudoku Arena & Club del Ingenio)
 * Soporta consulta pública (GET) y registro/actualización de Maestros (POST)
 */

// Cabeceras HTTP y CORS para permitir llamadas desde Web, Móvil y PWA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Responder a preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ============================================================================
// 1. GET — Obtener el Ranking Oficial de Maestros
// ============================================================================
if ($method === 'GET') {
    $diff = isset($_GET['diff']) ? trim($_GET['diff']) : 'all';
    $limit = isset($_GET['limit']) ? min(200, max(1, (int)$_GET['limit'])) : 100;

    $sql = "SELECT 
                id, device_uuid, name, flag, country, country_name, city, 
                age, age_group, difficulty, score, time_seconds, autonomy_index, 
                peeks_count, errors_count, seed, verified, created_at, updated_at
            FROM sudoku_hall_of_fame
            WHERE verified = 1";

    $params = [];
    if ($diff !== 'all' && in_array($diff, ['facil', 'medio', 'dificil', 'endemoniado'])) {
        $sql .= " AND difficulty = :diff";
        $params['diff'] = $diff;
    }

    $sql .= " ORDER BY score DESC, time_seconds ASC LIMIT :limit";

    try {
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        // Mapear al formato que espera el motor JavaScript
        $masters = array_map(function($r) {
            $diffLabels = [
                'facil' => 'Fácil',
                'medio' => 'Medio',
                'dificil' => 'Difícil',
                'endemoniado' => 'Endemoniado'
            ];

            return [
                'id'            => 'remote_' . $r['id'],
                'deviceUuid'    => $r['device_uuid'],
                'name'          => htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8'),
                'flag'          => $r['flag'] ?: '🇪🇸',
                'country'       => $r['country'],
                'countryName'   => $r['country_name'],
                'city'          => htmlspecialchars($r['city'], ENT_QUOTES, 'UTF-8'),
                'age'           => (int)$r['age'],
                'ageGroup'      => $r['age_group'],
                'difficulty'    => $r['difficulty'],
                'diffLabel'     => $diffLabels[$r['difficulty']] ?? ucfirst($r['difficulty']),
                'score'         => (int)$r['score'],
                'timeSeconds'   => (int)$r['time_seconds'],
                'autonomyIndex' => (int)$r['autonomy_index'],
                'peeksCount'    => (int)$r['peeks_count'],
                'errorsCount'   => (int)$r['errors_count'],
                'seed'          => (int)$r['seed'],
                'verified'      => (bool)$r['verified'],
                'rank'          => 'Gran Maestro Puro',
                'date'          => substr($r['updated_at'] ?: $r['created_at'], 0, 10)
            ];
        }, $rows);

        echo json_encode([
            'success' => true,
            'count'   => count($masters),
            'masters' => $masters
        ], JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Error al consultar el Salón de la Fama'
        ]);
    }
    exit;
}

// ============================================================================
// 2. POST — Inscribir o Actualizar Marca de Maestro
// ============================================================================
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!$data || !is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Payload JSON no válido']);
        exit;
    }

    // Validar campos obligatorios
    $deviceUuid    = trim($data['device_uuid'] ?? $data['deviceUuid'] ?? '');
    $name          = trim($data['name'] ?? '');
    $city          = trim($data['city'] ?? '');
    $age           = (int)($data['age'] ?? 0);
    $country       = strtoupper(trim($data['country'] ?? 'ES'));
    $countryName   = trim($data['country_name'] ?? $data['countryName'] ?? 'España');
    $flag          = trim($data['flag'] ?? '🇪🇸');
    $difficulty    = strtolower(trim($data['difficulty'] ?? 'dificil'));
    $score         = (int)($data['score'] ?? 0);
    $timeSeconds   = (int)($data['time_seconds'] ?? $data['timeSeconds'] ?? 0);
    $autonomyIndex = (int)($data['autonomy_index'] ?? $data['autonomyIndex'] ?? 0);
    $peeksCount    = (int)($data['peeks_count'] ?? $data['peeksCount'] ?? 0);
    $errorsCount   = (int)($data['errors_count'] ?? $data['errorsCount'] ?? 0);
    $seed          = (int)($data['seed'] ?? 0);

    // Reglas de Validación de Integridad Anti-Trampas
    if (empty($deviceUuid) || strlen($deviceUuid) < 6) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Identificador de dispositivo no válido']);
        exit;
    }

    if (empty($name) || mb_strlen($name) < 2 || mb_strlen($name) > 40) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'El nombre debe tener entre 2 y 40 caracteres']);
        exit;
    }

    if (empty($city) || mb_strlen($city) < 2) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'La ciudad es obligatoria']);
        exit;
    }

    if ($age < 5 || $age > 115) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'La edad debe estar comprendida entre 5 y 115 años']);
        exit;
    }

    // Requisito de Gran Maestro Puro: Autonomía >= 90% y 0 ayudas
    if ($autonomyIndex < 90 || $peeksCount > 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Se requiere al menos un 90% de autonomía y cero ayudas para acceder al Salón de la Fama']);
        exit;
    }

    // Tiempo mínimo creíble (anti-bots)
    if ($timeSeconds < 45) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Tiempo de resolución no válido']);
        exit;
    }

    // Determinar tramo de edad
    $ageGroup = 'adult';
    if ($age < 18) {
        $ageGroup = 'junior';
    } elseif ($age >= 65) {
        $ageGroup = 'legend';
    } elseif ($age >= 50) {
        $ageGroup = 'senior';
    }

    // Insertar o Actualizar si bate su propia marca (UPSERT)
    $sql = "INSERT INTO sudoku_hall_of_fame 
                (device_uuid, name, flag, country, country_name, city, age, age_group, difficulty, score, time_seconds, autonomy_index, peeks_count, errors_count, seed, verified)
            VALUES 
                (:device_uuid, :name, :flag, :country, :country_name, :city, :age, :age_group, :difficulty, :score, :time_seconds, :autonomy_index, :peeks_count, :errors_count, :seed, 1)
            ON DUPLICATE KEY UPDATE
                name           = VALUES(name),
                flag           = VALUES(flag),
                country        = VALUES(country),
                country_name   = VALUES(country_name),
                city           = VALUES(city),
                age            = VALUES(age),
                age_group      = VALUES(age_group),
                -- Si la nueva marca es mejor (más puntos o igual puntos en menos tiempo), actualizamos
                score          = IF(VALUES(score) > score OR (VALUES(score) = score AND VALUES(time_seconds) < time_seconds), VALUES(score), score),
                time_seconds   = IF(VALUES(score) > score OR (VALUES(score) = score AND VALUES(time_seconds) < time_seconds), VALUES(time_seconds), time_seconds),
                difficulty     = IF(VALUES(score) > score, VALUES(difficulty), difficulty),
                seed           = IF(VALUES(score) > score, VALUES(seed), seed),
                autonomy_index = IF(VALUES(score) > score, VALUES(autonomy_index), autonomy_index),
                peeks_count    = VALUES(peeks_count),
                errors_count   = VALUES(errors_count),
                updated_at     = CURRENT_TIMESTAMP";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'device_uuid'    => $deviceUuid,
            'name'           => $name,
            'flag'           => $flag,
            'country'        => $country,
            'country_name'   => $countryName,
            'city'           => $city,
            'age'            => $age,
            'age_group'      => $ageGroup,
            'difficulty'     => $difficulty,
            'score'          => $score,
            'time_seconds'   => $timeSeconds,
            'autonomy_index' => $autonomyIndex,
            'peeks_count'    => $peeksCount,
            'errors_count'   => $errorsCount,
            'seed'           => $seed
        ]);

        echo json_encode([
            'success' => true,
            'message' => '¡Inscripción en el Salón de la Fama registrada con éxito!'
        ], JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Error al registrar el récord de Maestro',
            'details' => $e->getMessage()
        ]);
    }
    exit;
}

// Método no soportado
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
