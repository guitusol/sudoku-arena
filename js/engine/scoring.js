/**
 * Scoring Engine - Motor de Puntuación Transaccional, Penalizaciones y Auditoría
 * Diseñado según las especificaciones de juego de Guillermo para Sudoku Arena
 */

class ScoringEngine {
  constructor(gameData) {
    this.initialClues = gameData.initialClues;
    this.initialTotalPoints = gameData.totalPoints;
    this.difficulty = gameData.difficulty || 'medio';
    this.cellScores = gameData.cellScores.map(row => [...row]); // Puntos vivos por celda
    this.cellTechniques = gameData.cellTechniques;
    this.cellPeeked = Array.from({ length: 9 }, () => Array(9).fill(false));
    this.cellSolvedBySystem = Array.from({ length: 9 }, () => Array(9).fill(false));
    this.cellCompleted = Array.from({ length: 9 }, () => Array(9).fill(false));

    this.currentScore = 0;
    this.totalPenalties = 0;
    this.currentMaxPossible = gameData.totalPoints;
    this.errorsCount = 0;
    this.peeksCellCount = 0;
    this.peeksAllCount = 0;
    this.isAutoSolved = false;
    this.ledger = [];

    // Centinela de Juego Limpio (Detección Anti-Copia / Anti-IA)
    this.moveHistory = [];
    this.scanStreak = 0;
    this.reverseScanStreak = 0;
    this.fairPlayFlag = false;
    this.fairPlayReason = null;
    this.fairPlayWarningTriggered = false;

    // Marcar las celdas iniciales fijas
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (gameData.board[r][c] !== 0) {
          this.cellCompleted[r][c] = true;
          this.cellScores[r][c] = 0; // Las pistas iniciales no dan puntos
        }
      }
    }

    this._logTransaction('INIT', null, null, 0, this.currentScore, `Inicio de partida. Techo teórico inicial: ${this.initialTotalPoints} pts.`);
  }

  /**
   * Registra una transacción en el libro mayor de auditoría
   */
  _logTransaction(type, row, col, delta, balance, description) {
    const entry = {
      timestamp: new Date().toLocaleTimeString('es-ES'),
      type,
      row,
      col,
      delta,
      balance,
      maxPossible: this.currentMaxPossible,
      description
    };
    this.ledger.push(entry);
    return entry;
  }

  /**
   * El jugador acierta una casilla a pulso
   */
  registerCorrectCell(row, col, value) {
    if (this.cellCompleted[row][col]) return null;

    this.cellCompleted[row][col] = true;
    let pointsAwarded = this.cellScores[row][col];
    if (pointsAwarded <= 0 && !this.cellPeeked[row][col] && !this.cellSolvedBySystem[row][col]) {
      const diff = this.difficulty || 'medio';
      pointsAwarded = diff === 'endemoniado' ? 100 : (diff === 'dificil' ? 50 : (diff === 'medio' ? 15 : 10));
      this.initialTotalPoints += pointsAwarded;
      this.currentMaxPossible += pointsAwarded;
    }
    this.currentScore += pointsAwarded;
    this.cellScores[row][col] = 0; // Ya se han cobrado

    const technique = this.cellTechniques[row][col] || 'Deducción Directa';
    const desc = pointsAwarded > 0
      ? `Acierto Fila ${row + 1}, Col ${col + 1} (${value}) [+${pointsAwarded} pts] — ${technique}`
      : `Colocada Fila ${row + 1}, Col ${col + 1} (${value}) [0 pts, casilla previamente consultada o penalizada]`;

    const tx = this._logTransaction('HIT', row, col, pointsAwarded, this.currentScore, desc);

    // Centinela de Juego Limpio Calibrado:
    // Detección inteligente adaptada a la dificultad y a la fase de partida (inmunidad en cascada final)
    const now = Date.now();
    const cellIndex = row * 9 + col;
    let fairPlayJustTriggered = false;

    if (!Array.isArray(this.moveHistory)) {
      this.moveHistory = [];
    }
    if (typeof this.scanStreak !== 'number') {
      this.scanStreak = 0;
    }
    if (typeof this.reverseScanStreak !== 'number') {
      this.reverseScanStreak = 0;
    }

    // Contar cuántas casillas vacías quedan por resolver
    let remainingEmpty = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!this.cellCompleted[r][c]) remainingEmpty++;
      }
    }

    const diff = (this.difficulty || 'medio').toLowerCase();

    // 1. Inmunidad Total en Nivel Fácil: los maestros y jugadores experimentados resuelven rapidísimo
    // 2. Inmunidad Total en Fase Final (Desencadenamiento / Cascada): con 28 casillas o menos restantes,
    //    las deducciones caen como fichas de dominó de forma legítima y fluida.
    const isImmune = (diff === 'facil') || (remainingEmpty <= 28);

    if (isImmune) {
      this.scanStreak = 0;
      this.reverseScanStreak = 0;
    } else if (this.moveHistory.length > 0) {
      const lastMove = this.moveHistory[this.moveHistory.length - 1];
      const timeDiff = (now - lastMove.time) / 1000;

      // Umbrales calibrados por dificultad para la fase de apertura/media:
      const configByDiff = {
        'medio': { minStreak: 12, maxSecondsPerCell: 1.8, pauseResetSeconds: 3.0 },
        'dificil': { minStreak: 8, maxSecondsPerCell: 2.2, pauseResetSeconds: 3.5 },
        'endemoniado': { minStreak: 7, maxSecondsPerCell: 2.5, pauseResetSeconds: 4.0 }
      };
      const cfg = configByDiff[diff] || configByDiff['medio'];

      // Si el jugador se detiene a pensar (pausa superior al umbral), se rompe la racha
      if (timeDiff >= cfg.pauseResetSeconds) {
        this.scanStreak = 1;
        this.reverseScanStreak = 1;
      } else {
        // Barrido ascendente rápido en orden de lectura
        if (cellIndex > lastMove.cellIndex && timeDiff <= cfg.maxSecondsPerCell) {
          this.scanStreak++;
          this.reverseScanStreak = 1;
        } else if (cellIndex < lastMove.cellIndex && timeDiff <= cfg.maxSecondsPerCell) {
          // Barrido descendente rápido
          this.reverseScanStreak++;
          this.scanStreak = 1;
        } else {
          this.scanStreak = 1;
          this.reverseScanStreak = 1;
        }
      }

      // Evaluar activación solo si se alcanza la racha mecánica extrema
      if ((this.scanStreak >= cfg.minStreak || this.reverseScanStreak >= cfg.minStreak) && !this.fairPlayFlag) {
        this.fairPlayFlag = true;
        this.fairPlayReason = 'LINEAR_SCAN_PATTERN';
        fairPlayJustTriggered = true;
        const streakCount = Math.max(this.scanStreak, this.reverseScanStreak);
        this._logTransaction(
          'FAIR_PLAY_ALERT',
          row,
          col,
          0,
          this.currentScore,
          `⚠️ Alerta de Integridad: Detectada secuencia de ${streakCount} casillas consecutivas a ritmo mecánico (< ${cfg.maxSecondsPerCell}s) en apertura/media de nivel ${diff.toUpperCase()}.`
        );
      }
    } else {
      this.scanStreak = 1;
      this.reverseScanStreak = 1;
    }

    this.moveHistory.push({ row, col, cellIndex, time: now });

    return { ...tx, fairPlayJustTriggered };
  }

  /**
   * El jugador comete un error al teclear un número incorrecto
   */
  registerError(row, col, value) {
    this.errorsCount++;
    const penalty = 15;
    this.currentScore = Math.max(0, this.currentScore - penalty);
    this.totalPenalties += penalty;
    this.currentMaxPossible = Math.max(this.currentScore, this.currentMaxPossible - penalty);

    return this._logTransaction(
      'ERROR',
      row,
      col,
      -penalty,
      this.currentScore,
      `Número erróneo en Fila ${row + 1}, Col ${col + 1} (${value}). Penalización: -${penalty} pts.`
    );
  }

  /**
   * Consulta Quirúrgica (Modo Lupa):
   * Muestra solo las posibilidades de la casilla seleccionada.
   * Se penalizan los puntos asignados a esa casilla específica.
   */
  registerCellPeek(row, col, candidates) {
    if (this.cellCompleted[row][col] || this.cellPeeked[row][col]) return null;

    this.cellPeeked[row][col] = true;
    this.peeksCellCount++;

    const potentialPoints = this.cellScores[row][col];
    // Se anulan los puntos que se podían ganar en esta celda
    this.cellScores[row][col] = 0;
    this.currentMaxPossible -= potentialPoints;
    this.totalPenalties += potentialPoints;

    return this._logTransaction(
      'PEEK_CELL',
      row,
      col,
      -potentialPoints,
      this.currentScore,
      `Consulta de posibilidades en Fila ${row + 1}, Col ${col + 1} (Opciones: [${candidates.join(', ')}]). Penalización casilla: -${potentialPoints} pts del techo.`
    );
  }

  /**
   * Consulta Global (Modo Rayos X):
   * Muestra todas las posibilidades del tablero entero.
   * Regla de Guillermo:
   * - 100% de puntos para casillas con 1 sola posibilidad.
   * - 50% de puntos para casillas con 2 posibilidades.
   * - 25% de puntos para casillas con 3 posibilidades.
   * - 10% para casillas con 4 o más posibilidades.
   */
  registerGlobalPeek(candidateMap) {
    this.peeksAllCount++;
    let totalDeduction = 0;
    let singlesCount = 0;
    let doublesCount = 0;
    let othersCount = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!this.cellCompleted[r][c] && this.cellScores[r][c] > 0) {
          const cands = candidateMap[r][c] || [];
          const count = cands.length;
          let factor = 0;

          if (count === 1) {
            factor = 1.0; // 100%
            singlesCount++;
          } else if (count === 2) {
            factor = 0.5; // 50%
            doublesCount++;
          } else if (count === 3) {
            factor = 0.25; // 25%
            othersCount++;
          } else if (count >= 4) {
            factor = 0.10; // 10%
            othersCount++;
          }

          const deduction = Math.round(this.cellScores[r][c] * factor);
          this.cellScores[r][c] = Math.max(0, this.cellScores[r][c] - deduction);
          totalDeduction += deduction;
        }
      }
    }

    this.currentMaxPossible = Math.max(this.currentScore, this.currentMaxPossible - totalDeduction);
    this.totalPenalties += totalDeduction;

    return this._logTransaction(
      'PEEK_ALL',
      null,
      null,
      -totalDeduction,
      this.currentScore,
      `Activación de Rayos X Globales (${singlesCount} celdas de 1 opción [-100%], ${doublesCount} de 2 opciones [-50%], ${othersCount} restantes). Penalización total: -${totalDeduction} pts del techo.`
    );
  }

  /**
   * Resolución Automática por el Sistema (Auto-solve):
   * La máquina rellena lo que queda. Se anulan todos los puntos de las casillas restantes.
   */
  registerAutoSolve() {
    this.isAutoSolved = true;
    let lostPoints = 0;
    let remainingCells = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!this.cellCompleted[r][c]) {
          this.cellSolvedBySystem[r][c] = true;
          this.cellCompleted[r][c] = true;
          lostPoints += this.cellScores[r][c];
          this.cellScores[r][c] = 0;
          remainingCells++;
        }
      }
    }

    this.currentMaxPossible = this.currentScore;
    this.totalPenalties += lostPoints;

    return this._logTransaction(
      'AUTO_SOLVE',
      null,
      null,
      -lostPoints,
      this.currentScore,
      `Rendición y resolución automática por el sistema. ${remainingCells} casillas completadas por la máquina (0 pts otorgados). Puntos perdidos: -${lostPoints} pts.`
    );
  }

  /**
   * Calcula el estado actual de maestría
   */
  getSummary() {
    const autonomyIndex = this.initialTotalPoints > 0
      ? Math.round((this.currentScore / this.initialTotalPoints) * 100)
      : 0;

    let rankKey = 'rank_training_wheels';
    let rankBadge = 'badge-starter';
    let rankColor = '#ef4444';

    if (this.isAutoSolved) {
      rankKey = 'rank_system_solved';
      rankBadge = 'badge-starter';
      rankColor = '#64748b';
    } else if (autonomyIndex >= 90 && this.peeksCellCount === 0 && this.peeksAllCount === 0) {
      rankKey = 'rank_grandmaster';
      rankBadge = 'badge-master';
      rankColor = '#10b981';
    } else if (autonomyIndex >= 80) {
      rankKey = 'rank_surgical_logician';
      rankBadge = 'badge-expert';
      rankColor = '#06b6d4';
    } else if (autonomyIndex >= 50) {
      rankKey = 'rank_pragmatic_solver';
      rankBadge = 'badge-pragmatic';
      rankColor = '#f59e0b';
    }

    const rank = (typeof window !== 'undefined' && window.i18n)
      ? window.i18n.t(rankKey)
      : 'Nivel Muy Bajo';

    return {
      currentScore: this.currentScore,
      initialTotalPoints: this.initialTotalPoints,
      currentMaxPossible: this.currentMaxPossible,
      totalPenalties: this.totalPenalties,
      autonomyIndex,
      rankKey,
      rank,
      rankBadge,
      rankColor,
      errorsCount: this.errorsCount,
      peeksCount: this.peeksCellCount + this.peeksAllCount,
      peeksCellCount: this.peeksCellCount,
      peeksAllCount: this.peeksAllCount,
      ledger: this.ledger,
      isAutoSolved: this.isAutoSolved,
      fairPlayFlag: this.fairPlayFlag,
      fairPlayReason: this.fairPlayReason
    };
  }

  /**
   * Serializa el estado completo del motor de puntuación para guardado persistente
   */
  serialize() {
    return {
      initialClues: this.initialClues,
      initialTotalPoints: this.initialTotalPoints,
      difficulty: this.difficulty,
      cellScores: this.cellScores,
      cellTechniques: this.cellTechniques,
      cellPeeked: this.cellPeeked,
      cellSolvedBySystem: this.cellSolvedBySystem,
      cellCompleted: this.cellCompleted,
      currentScore: this.currentScore,
      totalPenalties: this.totalPenalties,
      currentMaxPossible: this.currentMaxPossible,
      errorsCount: this.errorsCount,
      peeksCellCount: this.peeksCellCount,
      peeksAllCount: this.peeksAllCount,
      ledger: this.ledger,
      moveHistory: this.moveHistory,
      scanStreak: this.scanStreak,
      reverseScanStreak: this.reverseScanStreak,
      fairPlayFlag: this.fairPlayFlag,
      fairPlayReason: this.fairPlayReason,
      fairPlayWarningTriggered: this.fairPlayWarningTriggered,
      isAutoSolved: this.isAutoSolved
    };
  }

  /**
   * Restaura una instancia del motor de puntuación desde un estado persistido
   */
  static fromSerialized(data, gameData) {
    if (!data) return new ScoringEngine(gameData);
    const engine = Object.create(ScoringEngine.prototype);
    engine.difficulty = data.difficulty || gameData.difficulty || 'medio';
    engine.initialClues = data.initialClues ?? gameData.initialClues;
    engine.initialTotalPoints = data.initialTotalPoints ?? gameData.totalPoints;
    if (data.cellScores && data.cellScores.length === 9) {
      engine.cellScores = data.cellScores.map(r => [...r]);
      // Sincronizar casillas no jugadas que pudieran estar en 0 por fallo de análisis previo
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (gameData.board[r][c] === 0 && !data.cellCompleted?.[r]?.[c] && engine.cellScores[r][c] === 0 && gameData.cellScores && gameData.cellScores[r][c] > 0) {
            engine.cellScores[r][c] = gameData.cellScores[r][c];
          }
        }
      }
    } else {
      engine.cellScores = gameData.cellScores.map(r => [...r]);
    }
    engine.cellTechniques = data.cellTechniques || gameData.cellTechniques;
    engine.cellPeeked = (data.cellPeeked && data.cellPeeked.length === 9)
      ? data.cellPeeked.map(r => [...r])
      : Array.from({ length: 9 }, () => Array(9).fill(false));
    engine.cellSolvedBySystem = (data.cellSolvedBySystem && data.cellSolvedBySystem.length === 9)
      ? data.cellSolvedBySystem.map(r => [...r])
      : Array.from({ length: 9 }, () => Array(9).fill(false));
    engine.cellCompleted = (data.cellCompleted && data.cellCompleted.length === 9)
      ? data.cellCompleted.map(r => [...r])
      : Array.from({ length: 9 }, () => Array(9).fill(false));
    engine.currentScore = data.currentScore ?? 0;
    engine.totalPenalties = data.totalPenalties ?? 0;

    // Actualizar techo máximo si el total teórico fue corregido
    if (gameData.totalPoints && engine.initialTotalPoints < gameData.totalPoints) {
      const diff = gameData.totalPoints - engine.initialTotalPoints;
      engine.initialTotalPoints = gameData.totalPoints;
      engine.currentMaxPossible = (data.currentMaxPossible ?? engine.initialTotalPoints) + diff;
    } else {
      engine.currentMaxPossible = data.currentMaxPossible ?? engine.initialTotalPoints;
    }
    engine.errorsCount = data.errorsCount ?? 0;
    engine.peeksCellCount = data.peeksCellCount ?? 0;
    engine.peeksAllCount = data.peeksAllCount ?? 0;
    engine.ledger = Array.isArray(data.ledger) ? [...data.ledger] : [];

    // Centinela de Juego Limpio (Detección Anti-Copia / Anti-IA)
    engine.moveHistory = Array.isArray(data.moveHistory) ? [...data.moveHistory] : [];
    engine.scanStreak = typeof data.scanStreak === 'number' ? data.scanStreak : 0;
    engine.reverseScanStreak = typeof data.reverseScanStreak === 'number' ? data.reverseScanStreak : 0;
    engine.fairPlayFlag = Boolean(data.fairPlayFlag);
    engine.fairPlayReason = data.fairPlayReason || null;
    engine.fairPlayWarningTriggered = Boolean(data.fairPlayWarningTriggered);
    engine.isAutoSolved = Boolean(data.isAutoSolved);

    return engine;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScoringEngine };
}
