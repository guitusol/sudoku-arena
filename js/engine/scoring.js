/**
 * Scoring Engine - Motor de Puntuación Transaccional, Penalizaciones y Auditoría
 * Diseñado según las especificaciones de juego de Guillermo para Sudoku Arena
 */

class ScoringEngine {
  constructor(gameData) {
    this.initialClues = gameData.initialClues;
    this.initialTotalPoints = gameData.totalPoints;
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
    this.ledger = [];

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
    const pointsAwarded = this.cellScores[row][col];
    this.currentScore += pointsAwarded;
    this.cellScores[row][col] = 0; // Ya se han cobrado

    const technique = this.cellTechniques[row][col] || 'Deducción Directa';
    const desc = pointsAwarded > 0
      ? `Acierto Fila ${row + 1}, Col ${col + 1} (${value}) [+${pointsAwarded} pts] — ${technique}`
      : `Colocada Fila ${row + 1}, Col ${col + 1} (${value}) [0 pts, casilla previamente consultada o penalizada]`;

    return this._logTransaction('HIT', row, col, pointsAwarded, this.currentScore, desc);
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

    let rank = 'Con Ruedines (Dependiente de Ayudas)';
    let rankBadge = 'badge-starter';
    let rankColor = '#ef4444';

    if (autonomyIndex >= 90) {
      rank = 'Gran Maestro Puro (Mente de Acero)';
      rankBadge = 'badge-master';
      rankColor = '#10b981';
    } else if (autonomyIndex >= 70) {
      rank = 'Lógico Quirúrgico';
      rankBadge = 'badge-expert';
      rankColor = '#06b6d4';
    } else if (autonomyIndex >= 45) {
      rank = 'Resolutor Pragmático';
      rankBadge = 'badge-pragmatic';
      rankColor = '#f59e0b';
    }

    return {
      currentScore: this.currentScore,
      initialTotalPoints: this.initialTotalPoints,
      currentMaxPossible: this.currentMaxPossible,
      totalPenalties: this.totalPenalties,
      autonomyIndex,
      rank,
      rankBadge,
      rankColor,
      errorsCount: this.errorsCount,
      peeksCellCount: this.peeksCellCount,
      peeksAllCount: this.peeksAllCount,
      ledger: this.ledger
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScoringEngine };
}
