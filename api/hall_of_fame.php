<?php
/**
 * REST API — Salón de la Fama Global (Sudoku Arena & Club del Ingenio)
 * Soporta consulta pública (GET) y registro/actualización de Maestros (POST)
 * Arquitectura híbrida y resiliente: Base de Datos MariaDB + Fallback JSON en Servidor
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

// Configuración de almacenamiento en disco para respaldo
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$jsonFile = $dataDir . '/hall_of_fame.json';

// Lista de Maestros Oficiales Fundadores por defecto
function getDefaultMasters() {
    return [
        [
            'id'            => 'master_founder',
            'deviceUuid'    => 'founder_guillermo',
            'name'          => 'Guillermo T.',
            'flag'          => '🇪🇸',
            'country'       => 'ES',
            'countryName'   => 'España',
            'city'          => 'Valencia',
            'age'           => 73,
            'ageGroup'      => 'legend',
            'difficulty'    => 'endemoniado',
            'diffLabel'     => 'Endemoniado',
            'score'         => 3910,
            'timeSeconds'   => 1459,
            'autonomyIndex' => 96,
            'peeksCount'    => 0,
            'errorsCount'   => 10,
            'seed'          => 47316,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-11-07'
        ],
        [
            'id'            => 'master_1',
            'deviceUuid'    => 'master_javier',
            'name'          => 'Javier Navarro',
            'flag'          => '🇪🇸',
            'country'       => 'ES',
            'countryName'   => 'España',
            'city'          => 'Madrid',
            'age'           => 52,
            'ageGroup'      => 'senior',
            'difficulty'    => 'dificil',
            'diffLabel'     => 'Difícil',
            'score'         => 1485,
            'timeSeconds'   => 272,
            'autonomyIndex' => 94,
            'peeksCount'    => 0,
            'errorsCount'   => 2,
            'seed'          => 78421,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-24'
        ],
        [
            'id'            => 'master_2',
            'deviceUuid'    => 'master_elena',
            'name'          => 'Elena Morales',
            'flag'          => '🇪🇸',
            'country'       => 'ES',
            'countryName'   => 'España',
            'city'          => 'Valencia',
            'age'           => 34,
            'ageGroup'      => 'adult',
            'difficulty'    => 'dificil',
            'diffLabel'     => 'Difícil',
            'score'         => 1420,
            'timeSeconds'   => 315,
            'autonomyIndex' => 95,
            'peeksCount'    => 0,
            'errorsCount'   => 1,
            'seed'          => 64120,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-23'
        ],
        [
            'id'            => 'master_3',
            'deviceUuid'    => 'master_kenji',
            'name'          => 'Kenji Takahashi',
            'flag'          => '🇯🇵',
            'country'       => 'JP',
            'countryName'   => 'Japón',
            'city'          => 'Tokio',
            'age'           => 41,
            'ageGroup'      => 'adult',
            'difficulty'    => 'endemoniado',
            'diffLabel'     => 'Endemoniado',
            'score'         => 1920,
            'timeSeconds'   => 410,
            'autonomyIndex' => 93,
            'peeksCount'    => 0,
            'errorsCount'   => 3,
            'seed'          => 91024,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-22'
        ],
        [
            'id'            => 'master_4',
            'deviceUuid'    => 'master_marta',
            'name'          => 'Marta Gómez',
            'flag'          => '🇪🇸',
            'country'       => 'ES',
            'countryName'   => 'España',
            'city'          => 'Barcelona',
            'age'           => 71,
            'ageGroup'      => 'legend',
            'difficulty'    => 'dificil',
            'diffLabel'     => 'Difícil',
            'score'         => 1410,
            'timeSeconds'   => 325,
            'autonomyIndex' => 92,
            'peeksCount'    => 0,
            'errorsCount'   => 2,
            'seed'          => 45290,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-21'
        ],
        [
            'id'            => 'master_5',
            'deviceUuid'    => 'master_jeanluc',
            'name'          => 'Jean-Luc Dubois',
            'flag'          => '🇫🇷',
            'country'       => 'FR',
            'countryName'   => 'Francia',
            'city'          => 'Lyon',
            'age'           => 68,
            'ageGroup'      => 'legend',
            'difficulty'    => 'dificil',
            'diffLabel'     => 'Difícil',
            'score'         => 1445,
            'timeSeconds'   => 308,
            'autonomyIndex' => 98,
            'peeksCount'    => 0,
            'errorsCount'   => 1,
            'seed'          => 33205,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-20'
        ],
        [
            'id'            => 'master_6',
            'deviceUuid'    => 'master_carlos',
            'name'          => 'Carlos Rodríguez',
            'flag'          => '🇦🇷',
            'country'       => 'AR',
            'countryName'   => 'Argentina',
            'city'          => 'Buenos Aires',
            'age'           => 26,
            'ageGroup'      => 'adult',
            'difficulty'    => 'endemoniado',
            'diffLabel'     => 'Endemoniado',
            'score'         => 1890,
            'timeSeconds'   => 435,
            'autonomyIndex' => 92,
            'peeksCount'    => 0,
            'errorsCount'   => 2,
            'seed'          => 54109,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-19'
        ],
        [
            'id'            => 'master_7',
            'deviceUuid'    => 'master_sofia',
            'name'          => 'Sofia Meyer',
            'flag'          => '🇩🇪',
            'country'       => 'DE',
            'countryName'   => 'Alemania',
            'city'          => 'Múnich',
            'age'           => 17,
            'ageGroup'      => 'junior',
            'difficulty'    => 'dificil',
            'diffLabel'     => 'Difícil',
            'score'         => 1465,
            'timeSeconds'   => 295,
            'autonomyIndex' => 91,
            'peeksCount'    => 0,
            'errorsCount'   => 3,
            'seed'          => 12890,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-18'
        ],
        [
            'id'            => 'master_8',
            'deviceUuid'    => 'master_mateo',
            'name'          => 'Mateo Silva',
            'flag'          => '🇲🇽',
            'country'       => 'MX',
            'countryName'   => 'México',
            'city'          => 'Guadalajara',
            'age'           => 58,
            'ageGroup'      => 'senior',
            'difficulty'    => 'dificil',
            'diffLabel'     => 'Difícil',
            'score'         => 1395,
            'timeSeconds'   => 340,
            'autonomyIndex' => 90,
            'peeksCount'    => 0,
            'errorsCount'   => 3,
            'seed'          => 83712,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => '2026-10-17'
        ]
    ];
}

// Cargar lista desde JSON en disco
function loadMastersFromJson($file) {
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        if ($content) {
            $data = json_decode($content, true);
            if (is_array($data) && count($data) > 0) {
                return $data;
            }
        }
    }
    // Si no existe el archivo, inicializamos con los maestros por defecto
    $default = getDefaultMasters();
    saveMastersToJson($file, $default);
    return $default;
}

// Guardar lista en JSON de forma atómica y segura
function saveMastersToJson($file, array $masters) {
    // Ordenar siempre por puntuación descendente y tiempo ascendente
    usort($masters, function($a, $b) {
        $diffScore = ($b['score'] ?? 0) - ($a['score'] ?? 0);
        if ($diffScore !== 0) return $diffScore;
        return ($a['timeSeconds'] ?? 0) - ($b['timeSeconds'] ?? 0);
    });

    $encoded = json_encode($masters, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    @file_put_contents($file, $encoded, LOCK_EX);
}

// Conexión a Base de Datos (opcional/tolerante a fallos)
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// ============================================================================
// 1. GET — Obtener el Ranking Oficial de Maestros
// ============================================================================
if ($method === 'GET') {
    $diff = isset($_GET['diff']) ? trim($_GET['diff']) : 'all';
    $limit = isset($_GET['limit']) ? min(200, max(1, (int)$_GET['limit'])) : 100;

    $masters = null;

    // Intentar leer de Base de Datos MariaDB si está disponible
    if ($pdo !== null) {
        try {
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

            $stmt = $pdo->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            if (!empty($rows)) {
                $diffLabels = [
                    'facil'       => 'Fácil',
                    'medio'       => 'Medio',
                    'dificil'     => 'Difícil',
                    'endemoniado' => 'Endemoniado'
                ];

                $masters = array_map(function($r) use ($diffLabels) {
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
            }
        } catch (Throwable $e) {
            $masters = null;
        }
    }

    // Fallback: Si no hay base de datos o dio error, leer del almacenamiento JSON en servidor
    if ($masters === null) {
        $all = loadMastersFromJson($jsonFile);
        // Excluir registros temporales de prueba o depuración
        $all = array_values(array_filter($all, function($m) {
            $uuid = strtolower($m['deviceUuid'] ?? '');
            return strpos($uuid, 'test') === false;
        }));
        if ($diff !== 'all') {
            $all = array_values(array_filter($all, function($m) use ($diff) {
                return ($m['difficulty'] ?? '') === $diff;
            }));
        }
        $masters = array_slice($all, 0, $limit);
    }

    echo json_encode([
        'success' => true,
        'count'   => count($masters),
        'masters' => $masters,
        'source'  => ($pdo !== null ? 'database' : 'storage_resilient')
    ], JSON_UNESCAPED_UNICODE);
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

    $diffLabels = [
        'facil'       => 'Fácil',
        'medio'       => 'Medio',
        'dificil'     => 'Difícil',
        'endemoniado' => 'Endemoniado'
    ];

    // 1. Guardar en Base de Datos MariaDB si está disponible
    if ($pdo !== null) {
        try {
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
                        score          = IF(VALUES(score) > score OR (VALUES(score) = score AND VALUES(time_seconds) < time_seconds), VALUES(score), score),
                        time_seconds   = IF(VALUES(score) > score OR (VALUES(score) = score AND VALUES(time_seconds) < time_seconds), VALUES(time_seconds), time_seconds),
                        difficulty     = IF(VALUES(score) > score, VALUES(difficulty), difficulty),
                        seed           = IF(VALUES(score) > score, VALUES(seed), seed),
                        autonomy_index = IF(VALUES(score) > score, VALUES(autonomy_index), autonomy_index),
                        peeks_count    = VALUES(peeks_count),
                        errors_count   = VALUES(errors_count),
                        updated_at     = CURRENT_TIMESTAMP";

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
        } catch (Throwable $e) {
            // Ignoramos error en BD para respaldar en el archivo JSON
        }
    }

    // 2. Guardar SIEMPRE en almacenamiento persistente JSON
    $masters = loadMastersFromJson($jsonFile);
    $found = false;

    foreach ($masters as &$m) {
        if (($m['deviceUuid'] ?? '') === $deviceUuid) {
            $found = true;
            // Actualizar si bate su récord
            if ($score > ($m['score'] ?? 0) || ($score === ($m['score'] ?? 0) && $timeSeconds < ($m['timeSeconds'] ?? 9999))) {
                $m['name']          = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
                $m['city']          = htmlspecialchars($city, ENT_QUOTES, 'UTF-8');
                $m['age']           = $age;
                $m['ageGroup']      = $ageGroup;
                $m['country']       = $country;
                $m['countryName']   = $countryName;
                $m['flag']          = $flag;
                $m['difficulty']    = $difficulty;
                $m['diffLabel']     = $diffLabels[$difficulty] ?? ucfirst($difficulty);
                $m['score']         = $score;
                $m['timeSeconds']   = $timeSeconds;
                $m['autonomyIndex'] = $autonomyIndex;
                $m['peeksCount']    = $peeksCount;
                $m['errorsCount']   = $errorsCount;
                $m['seed']          = $seed;
                $m['date']          = date('Y-m-d');
            }
            break;
        }
    }
    unset($m);

    // Si es un nuevo maestro, lo incorporamos
    if (!$found) {
        $masters[] = [
            'id'            => 'remote_' . uniqid(),
            'deviceUuid'    => $deviceUuid,
            'name'          => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
            'city'          => htmlspecialchars($city, ENT_QUOTES, 'UTF-8'),
            'age'           => $age,
            'ageGroup'      => $ageGroup,
            'country'       => $country,
            'countryName'   => $countryName,
            'flag'          => $flag,
            'difficulty'    => $difficulty,
            'diffLabel'     => $diffLabels[$difficulty] ?? ucfirst($difficulty),
            'score'         => $score,
            'timeSeconds'   => $timeSeconds,
            'autonomyIndex' => $autonomyIndex,
            'peeksCount'    => $peeksCount,
            'errorsCount'   => $errorsCount,
            'seed'          => $seed,
            'verified'      => true,
            'rank'          => 'Gran Maestro Puro',
            'date'          => date('Y-m-d')
        ];
    }

    saveMastersToJson($jsonFile, $masters);

    echo json_encode([
        'success' => true,
        'message' => '¡Inscripción en el Salón de la Fama registrada con éxito!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Método no soportado
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
