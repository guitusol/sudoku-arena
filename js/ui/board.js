/**
 * BoardUI - Renderizador y Gestor del Tablero 9x9 interactivo
 */

class BoardUI {
  constructor(containerElement, onCellSelect) {
    this.container = containerElement;
    this.onCellSelect = onCellSelect;
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.globalRayosXActive = false;
    this.revealedCells = Array.from({ length: 9 }, () => Array(9).fill(false));
  }

  /**
   * Inicializa el DOM del tablero 9x9
   */
  initDOM() {
    this.container.innerHTML = '';
    const boardGrid = document.createElement('div');
    boardGrid.className = 'sudoku-grid';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Marcadores de bordes gruesos para cajas 3x3
        if (c === 2 || c === 5) cell.classList.add('border-right-thick');
        if (r === 2 || r === 5) cell.classList.add('border-bottom-thick');

        // Contenedor del valor grande
        const valElem = document.createElement('span');
        valElem.className = 'cell-value';
        cell.appendChild(valElem);

        // Insignia de puntos potenciales
        const pointsBadge = document.createElement('span');
        pointsBadge.className = 'cell-points-badge';
        cell.appendChild(pointsBadge);

        // Grid de candidatos (3x3 en miniatura)
        const candGrid = document.createElement('div');
        candGrid.className = 'cell-candidates-grid';
        for (let n = 1; n <= 9; n++) {
          const candSpan = document.createElement('span');
          candSpan.className = `cand-num cand-${n}`;
          candSpan.textContent = n;
          candGrid.appendChild(candSpan);
        }
        cell.appendChild(candGrid);

        // Eventos táctiles y de ratón
        cell.addEventListener('click', () => {
          this.selectCell(r, c);
        });

        boardGrid.appendChild(cell);
      }
    }

    this.container.appendChild(boardGrid);
  }

  /**
   * Selecciona una celda y resalta sus relaciones
   */
  selectCell(row, col) {
    if (row < 0 || row > 8 || col < 0 || col > 8) return;
    this.selectedRow = row;
    this.selectedCol = col;

    if (this.onCellSelect) {
      this.onCellSelect(row, col);
    }
  }

  /**
   * Actualiza el renderizado del tablero con los datos del juego
   */
  render(gameData, currentBoard, scoringEngine, candidateMap) {
    const cells = this.container.querySelectorAll('.sudoku-cell');

    const selVal = (this.selectedRow !== -1 && this.selectedCol !== -1)
      ? currentBoard[this.selectedRow][this.selectedCol]
      : 0;

    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      const val = currentBoard[r][c];
      const isInitial = gameData.board[r][c] !== 0;
      const isSelected = r === this.selectedRow && c === this.selectedCol;

      // Clases base
      cell.classList.remove('selected', 'highlight-related', 'highlight-same-num', 'fixed-clue', 'correct-user', 'auto-solved');

      if (isInitial) {
        cell.classList.add('fixed-clue');
      } else if (scoringEngine.cellSolvedBySystem[r][c]) {
        cell.classList.add('auto-solved');
      } else if (val !== 0) {
        cell.classList.add('correct-user');
      }

      // Resaltados
      if (isSelected) {
        cell.classList.add('selected');
      } else if (this.selectedRow !== -1 && this.selectedCol !== -1) {
        const sameRow = r === this.selectedRow;
        const sameCol = c === this.selectedCol;
        const sameBox = Math.floor(r / 3) === Math.floor(this.selectedRow / 3) &&
                        Math.floor(c / 3) === Math.floor(this.selectedCol / 3);

        if (sameRow || sameCol || sameBox) {
          cell.classList.add('highlight-related');
        }

        if (selVal !== 0 && val === selVal) {
          cell.classList.add('highlight-same-num');
        }
      }

      // Render del valor
      const valElem = cell.querySelector('.cell-value');
      valElem.textContent = val !== 0 ? val : '';

      // Insignia de puntos
      const badge = cell.querySelector('.cell-points-badge');
      let pts = (scoringEngine && scoringEngine.cellScores) ? scoringEngine.cellScores[r][c] : 0;
      const isInitialClue = gameData && gameData.board && gameData.board[r][c] !== 0;
      const isCompleted = scoringEngine && scoringEngine.cellCompleted && scoringEngine.cellCompleted[r][c];

      // Fallback defensivo: toda casilla vacía no completada debe mostrar su puntuación
      if (val === 0 && !isInitialClue && !isCompleted && (!pts || pts <= 0)) {
        const diff = (gameData && gameData.difficulty) || 'medio';
        pts = diff === 'endemoniado' ? 100 : (diff === 'dificil' ? 50 : (diff === 'medio' ? 15 : 10));
      }

      if (val === 0 && pts > 0 && !isInitialClue && !isCompleted) {
        badge.textContent = `+${pts}`;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }

      // Render de candidatos (Lupa o Rayos X)
      const candGrid = cell.querySelector('.cell-candidates-grid');
      const shouldShowCandidates = val === 0 && (this.globalRayosXActive || this.revealedCells[r][c]);

      if (shouldShowCandidates && candidateMap && candidateMap[r][c]) {
        candGrid.style.display = 'grid';
        const cands = candidateMap[r][c];
        for (let n = 1; n <= 9; n++) {
          const candSpan = candGrid.querySelector(`.cand-${n}`);
          if (cands.includes(n)) {
            candSpan.style.visibility = 'visible';
          } else {
            candSpan.style.visibility = 'hidden';
          }
        }
      } else {
        candGrid.style.display = 'none';
      }
    });
  }

  /**
   * Revela los candidatos de una casilla específica (Lupa)
   */
  revealCell(row, col) {
    this.revealedCells[row][col] = true;
  }

  /**
   * Activa o desactiva el modo Rayos X global
   */
  setGlobalRayosX(active) {
    this.globalRayosXActive = active;
  }

  /**
   * Anima un error en una celda
   */
  triggerErrorAnimation(row, col) {
    const cell = this.container.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      cell.classList.add('cell-shake-error');
      setTimeout(() => cell.classList.remove('cell-shake-error'), 450);
    }
  }

  /**
   * Anima un acierto correcto en una celda
   */
  triggerSuccessAnimation(row, col) {
    const cell = this.container.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      cell.classList.add('cell-pulse-success');
      setTimeout(() => cell.classList.remove('cell-pulse-success'), 400);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BoardUI };
}
