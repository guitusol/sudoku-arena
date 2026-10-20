/**
 * Sudoku Engine - Motor Matemático, Generador, Solver y Clasificador de Dificultad
 * Desarrollado para Sudoku Arena
 */

class RandomPRNG {
  constructor(seed = Date.now()) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

class SudokuEngine {
  static DIFICULTADES = {
    FACIL: { id: 'facil', name: 'Fácil', minClues: 36, maxClues: 40, basePoints: 10, maxTechnique: 'single' },
    MEDIO: { id: 'medio', name: 'Medio', minClues: 30, maxClues: 34, basePoints: 25, maxTechnique: 'pairs' },
    DIFICIL: { id: 'dificil', name: 'Difícil', minClues: 25, maxClues: 28, basePoints: 50, maxTechnique: 'wings' },
    ENDEMONIADO: { id: 'endemoniado', name: 'Endemoniado', minClues: 21, maxClues: 24, basePoints: 100, maxTechnique: 'chains' }
  };

  /**
   * Crea un tablero vacío 9x9
   */
  static createEmptyBoard() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  /**
   * Clona una matriz de tablero
   */
  static cloneBoard(board) {
    return board.map(row => [...row]);
  }

  /**
   * Comprueba si un número puede colocarse en (row, col) sin violar reglas
   */
  static isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num && i !== col) return false;
      if (board[i][col] === num && i !== row) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const curR = startRow + r;
        const curC = startCol + c;
        if (board[curR][curC] === num && (curR !== row || curC !== col)) return false;
      }
    }
    return true;
  }

  /**
   * Encuentra todas las celdas que contienen números repetidos o en colisión
   * en su misma fila, columna o caja 3x3.
   * Devuelve un Set con las claves "r-c" de las celdas en conflicto.
   */
  static findBoardConflicts(board) {
    const conflicts = new Set();
    if (!board || !Array.isArray(board)) return conflicts;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val > 0) {
          if (!this.isValid(board, r, c, val)) {
            conflicts.add(`${r}-${c}`);
          }
        }
      }
    }
    return conflicts;
  }

  /**
   * Obtiene los candidatos legales para una celda
   */
  static getCandidates(board, row, col) {
    if (board[row][col] !== 0) return [];
    const candidates = [];
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(board, row, col, num)) {
        candidates.push(num);
      }
    }
    return candidates;
  }

  /**
   * Devuelve una matriz 9x9 con los arrays de candidatos para cada celda vacía
   */
  static getAllCandidates(board) {
    const candidateMap = Array.from({ length: 9 }, () => Array(9).fill(null));
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          candidateMap[r][c] = this.getCandidates(board, r, c);
        } else {
          candidateMap[r][c] = [];
        }
      }
    }
    return candidateMap;
  }

  /**
   * Cuenta soluciones de un tablero (hasta un límite para optimizar)
   */
  static countSolutions(board, limit = 2) {
    let count = 0;
    const b = this.cloneBoard(board);

    function solve() {
      let emptyRow = -1;
      let emptyCol = -1;
      let minCandidates = 10;

      // Heurística de celda con menor número de candidatos
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (b[r][c] === 0) {
            let candCount = 0;
            for (let n = 1; n <= 9; n++) {
              if (SudokuEngine.isValid(b, r, c, n)) candCount++;
            }
            if (candCount < minCandidates) {
              minCandidates = candCount;
              emptyRow = r;
              emptyCol = c;
            }
          }
        }
      }

      if (emptyRow === -1) {
        count++;
        return;
      }

      if (minCandidates === 0) return; // Rama sin solución

      for (let n = 1; n <= 9; n++) {
        if (SudokuEngine.isValid(b, emptyRow, emptyCol, n)) {
          b[emptyRow][emptyCol] = n;
          solve();
          b[emptyRow][emptyCol] = 0;
          if (count >= limit) return;
        }
      }
    }

    solve();
    return count;
  }

  /**
   * Resuelve el tablero por completo devolviendo la solución o null
   */
  static solve(board) {
    if (!board || !Array.isArray(board)) return null;

    // Validar que el tablero inicial no tenga conflictos de pistas
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val > 0 && !this.isValid(board, r, c, val)) {
          return null;
        }
      }
    }

    const b = this.cloneBoard(board);
    function backtrack() {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (b[r][c] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (SudokuEngine.isValid(b, r, c, num)) {
                b[r][c] = num;
                if (backtrack()) return true;
                b[r][c] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    }
    return backtrack() ? b : null;
  }

  /**
   * Genera un tablero completo válido aleatorio
   */
  static generateFullBoard(prng = new RandomPRNG()) {
    const b = this.createEmptyBoard();

    function fillCell(r, c) {
      if (r === 9) return true;
      const nextR = c === 8 ? r + 1 : r;
      const nextC = c === 8 ? 0 : c + 1;

      const nums = prng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const num of nums) {
        if (SudokuEngine.isValid(b, r, c, num)) {
          b[r][c] = num;
          if (fillCell(nextR, nextC)) return true;
          b[r][c] = 0;
        }
      }
      return false;
    }

    fillCell(0, 0);
    return b;
  }

  /**
   * Analizador Humano (Human-Style Solver)
   * Clasifica la dificultad del tablero y desglosa el coste lógico de cada casilla
   * según la dificultad solicitada o inferida.
   */
  static analyzeBoard(initialBoard, targetDifficulty = null) {
    const board = this.cloneBoard(initialBoard);
    const cellScores = Array.from({ length: 9 }, () => Array(9).fill(0));
    const cellTechniques = Array.from({ length: 9 }, () => Array(9).fill(''));
    let maxTechniqueTier = 1; // 1: Fácil, 2: Medio, 3: Difícil, 4: Endemoniado
    let totalInitialPoints = 0;
    let iterations = 0;
    let postReductionBonus = false;

    // Escala de puntuación armónica por nivel de exigencia cognitiva
    const SCALES = {
      facil: {
        naked: 10,
        hidden: 15,
        interm: 18,
        advanced: 20,
        fallback: 10
      },
      medio: {
        naked: 15,
        hidden: 20,
        interm: 25,
        advanced: 30,
        fallback: 20
      },
      dificil: {
        naked: 25,
        hidden: 35,
        interm: 40,
        advanced: 50,
        fallback: 35
      },
      endemoniado: {
        naked: 50,
        hidden: 75,
        interm: 80,
        advanced: 100,
        fallback: 100
      }
    };

    let chosenDiff = (typeof targetDifficulty === 'string' && SCALES[targetDifficulty.toLowerCase()])
      ? targetDifficulty.toLowerCase()
      : null;

    if (!chosenDiff) {
      let clues = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (initialBoard[r][c] !== 0) clues++;
        }
      }
      if (clues <= 24) chosenDiff = 'endemoniado';
      else if (clues <= 28) chosenDiff = 'dificil';
      else if (clues <= 34) chosenDiff = 'medio';
      else chosenDiff = 'facil';
    }

    const scale = SCALES[chosenDiff] || SCALES.medio;

    // Bucle de resolución humana
    let candidateMap = this.getAllCandidates(board);

    while (iterations < 200) {
      iterations++;
      let progress = false;

      // --- TÉCNICA 1: Naked Singles (Único en celda) ---
      for (let r = 0; r < 9 && !progress; r++) {
        for (let c = 0; c < 9 && !progress; c++) {
          if (board[r][c] === 0 && candidateMap[r][c].length === 1) {
            const val = candidateMap[r][c][0];
            board[r][c] = val;
            let pts = scale.naked;
            let tech = 'Naked Single (Única opción visual)';
            if (postReductionBonus) {
              pts = scale.interm;
              tech = 'Naked Single tras reducción de candidatos';
              postReductionBonus = false;
            }
            cellScores[r][c] = pts;
            cellTechniques[r][c] = `${tech} [${pts} pts]`;
            totalInitialPoints += pts;
            progress = true;
            candidateMap = this.getAllCandidates(board);
          }
        }
      }
      if (progress) continue;

      // --- TÉCNICA 2: Hidden Singles (Único en fila, columna o caja) ---
      for (let num = 1; num <= 9 && !progress; num++) {
        // Fila
        for (let r = 0; r < 9 && !progress; r++) {
          const matchingCols = [];
          for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0 && candidateMap[r][c].includes(num)) matchingCols.push(c);
          }
          if (matchingCols.length === 1) {
            const c = matchingCols[0];
            const candLen = candidateMap[r][c].length;
            board[r][c] = num;
            let pts = candLen >= 3 ? scale.advanced : scale.hidden;
            let tech = candLen >= 3 ? 'Hidden Single en Fila (Alta Inferencia)' : 'Hidden Single en Fila';
            if (postReductionBonus && pts < scale.interm) {
              pts = scale.interm;
              tech += ' tras reducción';
              postReductionBonus = false;
            }
            cellScores[r][c] = pts;
            cellTechniques[r][c] = `${tech} [${pts} pts]`;
            totalInitialPoints += pts;
            progress = true;
            candidateMap = this.getAllCandidates(board);
          }
        }
        if (progress) break;

        // Columna
        for (let c = 0; c < 9 && !progress; c++) {
          const matchingRows = [];
          for (let r = 0; r < 9; r++) {
            if (board[r][c] === 0 && candidateMap[r][c].includes(num)) matchingRows.push(r);
          }
          if (matchingRows.length === 1) {
            const r = matchingRows[0];
            const candLen = candidateMap[r][c].length;
            board[r][c] = num;
            let pts = candLen >= 3 ? scale.advanced : scale.hidden;
            let tech = candLen >= 3 ? 'Hidden Single en Columna (Alta Inferencia)' : 'Hidden Single en Columna';
            if (postReductionBonus && pts < scale.interm) {
              pts = scale.interm;
              tech += ' tras reducción';
              postReductionBonus = false;
            }
            cellScores[r][c] = pts;
            cellTechniques[r][c] = `${tech} [${pts} pts]`;
            totalInitialPoints += pts;
            progress = true;
            candidateMap = this.getAllCandidates(board);
          }
        }
        if (progress) break;

        // Caja 3x3
        for (let b = 0; b < 9 && !progress; b++) {
          const bRow = Math.floor(b / 3) * 3;
          const bCol = (b % 3) * 3;
          const matchingCells = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const curR = bRow + r;
              const curC = bCol + c;
              if (board[curR][curC] === 0 && candidateMap[curR][curC].includes(num)) {
                matchingCells.push([curR, curC]);
              }
            }
          }
          if (matchingCells.length === 1) {
            const [r, c] = matchingCells[0];
            const candLen = candidateMap[r][c].length;
            board[r][c] = num;
            let pts = candLen >= 3 ? scale.advanced : scale.hidden;
            let tech = candLen >= 3 ? 'Hidden Single en Región 3x3 (Alta Inferencia)' : 'Hidden Single en Región 3x3';
            if (postReductionBonus && pts < scale.interm) {
              pts = scale.interm;
              tech += ' tras reducción';
              postReductionBonus = false;
            }
            cellScores[r][c] = pts;
            cellTechniques[r][c] = `${tech} [${pts} pts]`;
            totalInitialPoints += pts;
            progress = true;
            candidateMap = this.getAllCandidates(board);
          }
        }
      }
      if (progress) continue;

      // --- TÉCNICA 3: Locked Candidates / Intersecciones (Nivel Medio) ---
      let lockedFound = false;
      for (let num = 1; num <= 9 && !lockedFound; num++) {
        for (let b = 0; b < 9 && !lockedFound; b++) {
          const bRow = Math.floor(b / 3) * 3;
          const bCol = (b % 3) * 3;
          const rowsWithNum = new Set();
          const colsWithNum = new Set();
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              if (board[bRow + r][bCol + c] === 0 && candidateMap[bRow + r][bCol + c].includes(num)) {
                rowsWithNum.add(bRow + r);
                colsWithNum.add(bCol + c);
              }
            }
          }
          // Si todos los 'num' en la caja están en la misma fila
          if (rowsWithNum.size === 1) {
            const targetRow = [...rowsWithNum][0];
            for (let c = 0; c < 9; c++) {
              if ((c < bCol || c >= bCol + 3) && board[targetRow][c] === 0 && candidateMap[targetRow][c].includes(num)) {
                candidateMap[targetRow][c] = candidateMap[targetRow][c].filter(n => n !== num);
                lockedFound = true;
                maxTechniqueTier = Math.max(maxTechniqueTier, 2);
              }
            }
          }
          // Si todos los 'num' en la caja están en la misma columna
          if (colsWithNum.size === 1) {
            const targetCol = [...colsWithNum][0];
            for (let r = 0; r < 9; r++) {
              if ((r < bRow || r >= bRow + 3) && board[r][targetCol] === 0 && candidateMap[r][targetCol].includes(num)) {
                candidateMap[r][targetCol] = candidateMap[r][targetCol].filter(n => n !== num);
                lockedFound = true;
                maxTechniqueTier = Math.max(maxTechniqueTier, 2);
              }
            }
          }
        }
      }
      if (lockedFound) {
        postReductionBonus = true;
        progress = true;
        continue;
      }

      // --- TÉCNICA 4: Naked Pairs (Nivel Medio/Difícil) ---
      let pairFound = false;
      for (let r = 0; r < 9 && !pairFound; r++) {
        for (let c1 = 0; c1 < 8 && !pairFound; c1++) {
          if (board[r][c1] === 0 && candidateMap[r][c1].length === 2) {
            for (let c2 = c1 + 1; c2 < 9; c2++) {
              if (board[r][c2] === 0 && candidateMap[r][c2].length === 2 &&
                  candidateMap[r][c1][0] === candidateMap[r][c2][0] &&
                  candidateMap[r][c1][1] === candidateMap[r][c2][1]) {
                const pairNums = candidateMap[r][c1];
                for (let c = 0; c < 9; c++) {
                  if (c !== c1 && c !== c2 && board[r][c] === 0) {
                    const prevLen = candidateMap[r][c].length;
                    candidateMap[r][c] = candidateMap[r][c].filter(n => !pairNums.includes(n));
                    if (candidateMap[r][c].length < prevLen) pairFound = true;
                  }
                }
              }
            }
          }
        }
      }
      if (pairFound) {
        postReductionBonus = true;
        maxTechniqueTier = Math.max(maxTechniqueTier, 2);
        progress = true;
        continue;
      }

      // Si los métodos lógicos directos no avanzan, requiere técnicas avanzadas (Wings/Chains)
      if (!progress) {
        let filledCount = 0;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (board[r][c] !== 0) filledCount++;
          }
        }
        if (filledCount === 81) break; // Completado

        if (chosenDiff === 'endemoniado' || maxTechniqueTier >= 3) {
          maxTechniqueTier = 4; // Endemoniado (Cadenas forzadas / inferencia profunda)
        } else {
          maxTechniqueTier = 3; // Difícil (X-Wing / XY-Wing)
        }

        // Forzar un paso con la solución real para seguir midiendo el resto de celdas
        const solved = this.solve(board);
        if (solved) {
          for (let r = 0; r < 9 && !progress; r++) {
            for (let c = 0; c < 9 && !progress; c++) {
              if (board[r][c] === 0) {
                board[r][c] = solved[r][c];
                const pts = scale.advanced;
                const tech = maxTechniqueTier >= 4
                  ? 'Cadena Forzada / Inferencia Avanzada'
                  : 'Patrón Geométrico (X-Wing/Wing)';
                cellScores[r][c] = pts;
                cellTechniques[r][c] = `${tech} [${pts} pts]`;
                totalInitialPoints += pts;
                progress = true;
                candidateMap = this.getAllCandidates(board);
              }
            }
          }
        }
      }
    }

    // Garantizar que cualquier casilla vacía residual tenga una puntuación base asignada
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (initialBoard[r][c] === 0 && cellScores[r][c] === 0) {
          const fallbackPts = scale.fallback;
          cellScores[r][c] = fallbackPts;
          cellTechniques[r][c] = `Deducción lógica estándar [${fallbackPts} pts]`;
          totalInitialPoints += fallbackPts;
        }
      }
    }

    let diffCategory = chosenDiff;
    if (!targetDifficulty || typeof targetDifficulty !== 'string') {
      if (maxTechniqueTier >= 4) diffCategory = 'endemoniado';
      else if (maxTechniqueTier === 3) diffCategory = 'dificil';
      else if (maxTechniqueTier === 2) diffCategory = 'medio';
      else diffCategory = 'facil';
    }

    return {
      difficulty: diffCategory,
      totalPoints: totalInitialPoints,
      initialTotalPoints: totalInitialPoints,
      cellScores,
      cellTechniques,
      techniqueAudit: cellTechniques
    };
  }

  /**
   * Genera un tablero jugable con dificultad específica y semilla
   */
  static generateGame(targetDifficulty = 'medio', seed = Date.now()) {
    const prng = new RandomPRNG(seed);
    const fullBoard = this.generateFullBoard(prng);
    const puzzle = this.cloneBoard(fullBoard);

    // Ajustar número de casillas a retirar según dificultad
    const targetClues = this.DIFICULTADES[targetDifficulty.toUpperCase()]?.minClues || 30;
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    const shuffledPositions = prng.shuffle(positions);

    let cluesRemaining = 81;
    for (const [r, c] of shuffledPositions) {
      if (cluesRemaining <= targetClues) break;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      // Asegurar solución única
      if (this.countSolutions(puzzle, 2) === 1) {
        cluesRemaining--;
      } else {
        puzzle[r][c] = backup; // Deshacer si se rompe la unicidad
      }
    }

    // Análisis de puntos y dificultad real vinculada a la escala de dificultad
    const analysis = this.analyzeBoard(puzzle, targetDifficulty);

    return {
      seed,
      difficulty: targetDifficulty,
      realAnalyzedDifficulty: analysis.difficulty,
      board: puzzle,
      solution: fullBoard,
      initialClues: cluesRemaining,
      totalPoints: analysis.totalPoints,
      cellScores: analysis.cellScores,
      cellTechniques: analysis.cellTechniques
    };
  }

  /**
   * Crea una estructura oficial de partida (gameData) a partir de un tablero personalizado
   * (escaneado por OCR, creado a mano o pegado en cadena).
   * Mide dificultad humana, calcula techo de puntos cognitivos y soluciona matemáticamente.
   */
  static createGameFromCustomBoard(board, name = 'Reto Personalizado', customSeed = null) {
    const solution = this.solve(board);
    if (!solution) return null;

    let clues = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== 0) clues++;
      }
    }

    let detectedDiff = 'medio';
    if (clues <= 24) detectedDiff = 'endemoniado';
    else if (clues <= 28) detectedDiff = 'dificil';
    else if (clues <= 34) detectedDiff = 'medio';
    else detectedDiff = 'facil';

    const analysis = this.analyzeBoard(board, detectedDiff);
    const seed = customSeed || Math.floor(10000 + Math.random() * 90000);

    return {
      seed,
      isCustom: true,
      customName: name,
      difficulty: analysis.difficulty,
      realAnalyzedDifficulty: analysis.difficulty,
      board: this.cloneBoard(board),
      solution: solution,
      initialClues: clues,
      totalPoints: analysis.totalPoints || (clues < 25 ? 5000 : (clues < 32 ? 3500 : 2000)),
      cellScores: analysis.cellScores,
      cellTechniques: analysis.cellTechniques
    };
  }

  /**
   * Parsea una cadena de 81 caracteres de números y puntos/ceros a una matriz 9x9
   */
  static parseBoardString(raw) {
    if (!raw) return null;
    const clean = String(raw).replace(/[\s\r\n|+-]/g, '');
    if (clean.length < 81) return null;

    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    let validClues = 0;

    for (let i = 0; i < 81; i++) {
      const ch = clean[i];
      const r = Math.floor(i / 9);
      const c = i % 9;
      const num = parseInt(ch, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        grid[r][c] = num;
        validClues++;
      } else {
        grid[r][c] = 0;
      }
    }

    return validClues >= 10 ? grid : null;
  }

  /**
   * Convierte una matriz 9x9 a una cadena estándar de 81 caracteres numéricos
   */
  static boardToString(board) {
    if (!board || !Array.isArray(board)) return '';
    return board.map(row => row.map(cell => (cell > 0 ? cell : '0')).join('')).join('');
  }
}

// Exportación compatible navegador y node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SudokuEngine, RandomPRNG };
}
