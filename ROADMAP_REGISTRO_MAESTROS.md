# Roadmap: Registro Global de Maestros y Salón de la Fama (Zero-Login) — Sudoku Arena

Documento de especificación funcional y técnica para la futura implementación del **Cuadro de Honor y Registro de Maestros sin Login** en Sudoku Arena.

---

## 1. Filosofía del Sistema (Zero-Login / Cero Fricción)

En lugar de forzar al jugador a crearse una cuenta con correo electrónico, contraseña o verificación por SMS (lo que produce un abandono superior al 80% y añade fricción legal de RGPD):

1. **Identidad Anónima en Dispositivo:**
   * La app genera un **UUID anónimo persistente** (`device_uuid`) almacenado en `localStorage` (web) o en Keychain/SharedPreferences (móvil Capacitor).
   * El jugador elige un **Alias / Nickname** y opcionalmente sus datos demográficos para los rankings.
   * Cero contraseñas que recordar o recuperar.

2. **Criterio de Consistencia y Trayectoria Probada (Anti-Suerte / Anti-Casualidad):**
   * **No basta con una sola partida afortunada**: Un único sudoku resuelto como Gran Maestro puede deberse a la suerte, a un tanteo fortuito o a una ayuda puntual. La maestría real exige **consistencia y solidez demostrada**.
   * **Umbral de Consistencia**: Para desbloquear el acceso al Salón de la Fama y obtener la ficha oficial de Maestro, el jugador debe haber completado un **mínimo de partidas certificadas como Gran Maestro** (por ejemplo, al menos **3 victorias** con ≥ 90% de autonomía y 0 ayudas en nivel *Medio*, *Difícil* o *Endemoniado*).
   * **Indicador de Progresión en la App**: La pantalla de récords e historial mostrará la barra de mérito: *"Maestría demostrada: 2 de 3 partidas requeridas para ingresar en el Salón de la Fama"*.

3. **Garantía Anti-Trampas y Auditoría Forense (Proof of Victory):**
   * El sistema empaqueta la semilla, la secuencia de movimientos, el libro mayor y la marca de tiempo de cada una de las victorias requeridas.
   * La app empaqueta:
     * Semilla exacta del tablero (`seed`).
     * Tiempo empleado y puntuación neta.
     * Libro Mayor de Auditoría de Movimientos (secuencia de coordenadas y tiempos).
     * Hash de firma criptográfica que certifica que el tablero fue resuelto legítimamente sin ayudas.

---

## 2. Datos del Maestro (Perfil Demográfico Anónimo)

Para permitir clasificaciones segmentadas y enriquecer la experiencia competitiva, el modal de inscripción solicitará:

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :---: | :--- | :--- |
| `nickname` | String (3-20) | Sí | Nombre público o apodo de jugador | `Guillermo T.` |
| `age` | Entero | Opcional | Edad del jugador (para tramos) | `45` |
| `age_group` | Enum | Auto (según edad) | Junior (<18), Promesa (18-29), Senior (30-49), Veterano (50-65), Gran Maestro (>65) | `Senior (30-49)` |
| `city` | String (2-40) | Opcional | Ciudad o localidad de residencia | `Getafe` / `Madrid` |
| `country` | String (2 ISO) | Opcional | País de residencia (con bandera emoji) | `ES` (🇪🇸 España) |
| `device_uuid` | UUID v4 | Auto | Identificador anónimo del dispositivo | `c83b...-4b1a` |

---

## 3. Tipos de Rankings y Cuadros de Honor

La interfaz del Salón de la Fama (`modal-hall-of-fame`) permitirá filtrar por:

1. **Ranking por Países (Copa de Naciones 🌍):**
   * Top jugadores por país, permitiendo clasificaciones patrias (ej: Top Maestros de España, México, Argentina, Francia, etc.).
2. **Ranking por Ciudades (Orgullo Local 🏙️):**
   * Competición entre resolutores de una misma ciudad o provincia (ej: "Mejor tiempo de Madrid", "Maestro de Barcelona", etc.).
3. **Ranking por Edades (Clasificación Generacional 🎂):**
   * Permite competir en igualdad de grupo etario:
     * **Júnior / Escolares:** < 18 años.
     * **Adultos:** 18 - 49 años.
     * **Veteranos / Senior:** 50 - 64 años.
     * **Leyendas / Master:** 65+ años (estimulación cognitiva saludable).
4. **Ranking por Dificultad y Tiempo:**
   * Clasificación absoluta por puntos netos y tiempo récord de resolución.

---

## 4. Arquitectura de Backend Ligera (Opciones)

### Endpoints de la API:
* `POST /api/masters/register`
  * Valida la firma del tablero resuelto.
  * Registra o actualiza el mejor récord del `device_uuid`.
  * Devuelve la posición global, nacional y local alcanzada.
* `GET /api/masters/leaderboard`
  * Parámetros: `difficulty`, `country`, `city`, `age_group`, `period` (`semanal` | `historico`).
  * Devuelve el Top 50 con medallas y banderas.

### Infraestructuras Sugeridas:
1. **Supabase (PostgreSQL en Nube - 100% Gratuito):**
   * Tabla `masters_records` con índices en `country`, `city`, `age_group`, `score`.
   * Row-Level Security (RLS) habilitada para inserciones anónimas verificadas.
2. **API Micro-servicio en Servidor Propio (PHP / MariaDB):**
   * Integrable en el hosting actual de Guillermo mediante un script PHP ultraligero de 1 solo archivo o controlador Laravel.

---

## 5. Dinámica de Reto Cruzado ("Desafiar al Maestro" ⚔️)

Cada entrada del Registro de Maestros incluye un botón **«Desafiar»**:
* Al pulsarlo, el juego carga automáticamente **el mismo tablero exacto (misma semilla)** con el que el maestro obtuvo su récord.
* Muestra el fantasma o marca del maestro como objetivo a batir: *"Récord a batir: 1.450 pts en 05:22 por Guillermo T. (Madrid, 🇪🇸)"*.

---
*Documento guardado para desarrollo e integración en fases posteriores de Sudoku Arena.*
