/**
 * App - Controlador Principal de Sudoku Arena
 * Adaptado con soporte Mobile-First, háptica táctil y auditoría de puntuación.
 */

class SudokuApp {
  constructor() {
    this.gameData = null;
    this.currentBoard = null;
    this.scoring = null;
    this.boardUI = null;
    this.candidateMap = null;

    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isGameOver = false;
    this.selectedDifficulty = 'medio';
    this.currentSeed = null;
    this.duelSelectedDiff = 'medio';
    this.duelSelectedSeed = Math.floor(10000 + Math.random() * 90000);
    this.isWeeklyMode = false;
    this.weeklyDiff = null;

    // Motores de Visión OCR y Bóveda de Retos
    this.ocr = (typeof window !== 'undefined' && window.SudokuOCR) ? new window.SudokuOCR() : null;
    this.vault = (typeof window !== 'undefined' && window.VaultStorage) ? new window.VaultStorage() : null;
    this.scanBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.scanSelectedRow = 0;
    this.scanSelectedCol = 0;
    this.scanAnalysis = null;
    this.scanConflicts = new Set();
    this.vaultFilter = 'all';
    this.vaultSearchQuery = '';

    this.init();
  }

  
  onLanguageChanged(lang) {
    try { this.updateStatsUI(); } catch (e) { console.error('Error updating stats UI on lang change:', e); }
    try { this.updateDuelModalPreview(); } catch (e) { console.error('Error updating duel modal on lang change:', e); }
    try { this.render(); } catch (e) { console.error('Error rendering on lang change:', e); }
  }

  init() {
    const gridContainer = document.getElementById('board-container');
    this.boardUI = new BoardUI(gridContainer, (r, c) => this.onCellSelected(r, c));
    this.boardUI.initDOM();
    window.i18n.applyTranslations();

    this.bindEvents();
    this.buildReviewGrid();
    this.updateVaultBadge();
    this.checkUrlChallenge();
  }

  /**
   * Disparo sutil de vibración háptica en dispositivos móviles compatibles
   */
  triggerHaptic(ms = 15) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Ignorar si el navegador no permite vibrar
      }
    }
  }

  /**
   * Comprueba si se ha recibido un código de desafío en la URL (?desafio=ARENA-DIFI-12345 o ?duel=...)
   */
  /**
   * Guarda el estado completo de la partida viva en localStorage para auto-guardado continuo
   */
  saveActiveGame() {
    if (!this.gameData || this.isGameOver) return;
    try {
      const state = {
        version: 1,
        difficulty: this.selectedDifficulty,
        seed: this.currentSeed,
        isCustom: this.gameData ? !!this.gameData.isCustom : false,
        customBoard: (this.gameData && this.gameData.isCustom) ? this.gameData.board : null,
        customName: (this.gameData && this.gameData.isCustom) ? this.gameData.customName : null,
        vaultId: (this.gameData && this.gameData.vaultId) ? this.gameData.vaultId : null,
        currentBoard: this.currentBoard,
        timerSeconds: this.timerSeconds,
        isWeeklyMode: this.isWeeklyMode || false,
        weeklyDiff: this.weeklyDiff || null,
        scoring: this.scoring ? this.scoring.serialize() : null,
        revealedCells: this.boardUI ? this.boardUI.revealedCells : null,
        globalRayosXActive: this.boardUI ? this.boardUI.globalRayosXActive : false,
        selectedRow: this.boardUI ? this.boardUI.selectedRow : 0,
        selectedCol: this.boardUI ? this.boardUI.selectedCol : 0,
        savedAt: Date.now()
      };
      localStorage.setItem('sudoku_arena_active_game_v1', JSON.stringify(state));
    } catch (e) {
      console.warn('No se pudo guardar la partida en localStorage:', e);
    }
  }

  /**
   * Restaura la partida viva desde localStorage (recuperación tras F5 o cierre involuntario)
   */
  restoreActiveGame() {
    try {
      const raw = localStorage.getItem('sudoku_arena_active_game_v1');
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !saved.difficulty || typeof saved.seed !== 'number' || !saved.currentBoard || saved.isGameOver) {
        return false;
      }

      this.stopTimer();
      this.isGameOver = false;
      this.selectedDifficulty = saved.difficulty;
      this.currentSeed = saved.seed;
      this.timerSeconds = saved.timerSeconds || 0;
      this.isWeeklyMode = !!saved.isWeeklyMode;
      this.weeklyDiff = saved.weeklyDiff || null;

      // Reconstruir puzzle: si era personalizado, crear desde customBoard
      if (saved.isCustom && saved.customBoard) {
        this.gameData = SudokuEngine.createGameFromCustomBoard(saved.customBoard, saved.customName, saved.seed);
        this.gameData.vaultId = saved.vaultId || null;
      } else {
        this.gameData = SudokuEngine.generateGame(saved.difficulty, saved.seed);
      }
      this.currentBoard = saved.currentBoard.map(row => [...row]);
      this.scoring = ScoringEngine.fromSerialized(saved.scoring, this.gameData);
      this.candidateMap = SudokuEngine.getAllCandidates(this.currentBoard);

      // Restaurar estado visual del tablero
      if (this.boardUI) {
        this.boardUI.revealedCells = (saved.revealedCells && saved.revealedCells.length === 9)
          ? saved.revealedCells.map(r => [...r])
          : Array.from({ length: 9 }, () => Array(9).fill(false));
        this.boardUI.setGlobalRayosX(!!saved.globalRayosXActive);
        this.boardUI.selectCell(saved.selectedRow ?? 0, saved.selectedCol ?? 0);
      }

      // Actualizar selector de dificultad en UI
      document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.diff === saved.difficulty);
      });

      // Actualizar reloj en pantalla
      const timerElem = document.getElementById('timer-display');
      if (timerElem) timerElem.textContent = this.formatTime(this.timerSeconds);

      // Actualizar código de desafío visible
      const challengeCode = CompetitionEngine.generateChallengeCode(saved.difficulty, saved.seed);
      const codeElem = document.getElementById('challenge-code-display');
      if (codeElem) codeElem.textContent = challengeCode;

      // Mantener la URL en la barra del navegador sin recargar la página
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('desafio', challengeCode);
          window.history.replaceState({ desafio: challengeCode }, '', url.toString());
        } catch (e) {}
      }

      this.startTimer();
      this.updateStatsUI();
      this.render();

      if (this.hasUserMadeMoves()) {
        const toastMsg = window.i18n ? window.i18n.t('toast_game_restored') : 'Partida reanudada automáticamente';
        this.showToast(toastMsg, 'info');
      }

      return true;
    } catch (e) {
      console.error('Error al restaurar partida guardada:', e);
      return false;
    }
  }

  /**
   * Elimina la partida activa guardada (tras victoria o abandono confirmado)
   */
  clearActiveGame() {
    try {
      localStorage.removeItem('sudoku_arena_active_game_v1');
    } catch (e) {}
  }

  /**
   * Comprueba si el jugador ha realizado movimientos o recibido penalizaciones
   */
  hasUserMadeMoves() {
    if (!this.gameData || this.isGameOver) return false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.gameData.board[r][c] === 0 && this.currentBoard[r][c] !== 0) {
          return true;
        }
      }
    }
    if (this.scoring && (this.scoring.errorsCount > 0 || this.scoring.peeksCellCount > 0 || this.scoring.peeksAllCount > 0)) {
      return true;
    }
    return false;
  }

  /**
   * Comprueba si se ha recibido un código de desafío en la URL (?desafio=ARENA-DIFI-12345 o ?duel=...)
   */
  checkUrlChallenge() {
    // 1. Comprobar si es un duelo con tablero personalizado (?tablero=... o ?custom=...)
    if (typeof CompetitionEngine !== 'undefined' && CompetitionEngine.getCustomChallengeFromUrl) {
      const customChallenge = CompetitionEngine.getCustomChallengeFromUrl();
      if (customChallenge) {
        const boardToPlay = customChallenge.board || (customChallenge.boardString ? SudokuEngine.parseBoardString(customChallenge.boardString) : null);
        if (boardToPlay) {
          this.startCustomGame(boardToPlay, customChallenge.name);
          const toastMsg = window.i18n ? window.i18n.t('toast_duel_loaded', { name: customChallenge.name }) : `¡Duelo cargado: ${customChallenge.name}!`;
          this.showToast(toastMsg, 'info');
          return;
        }
      }
    }
    const challenge = CompetitionEngine.getChallengeFromUrl();
    if (challenge) {
      // Si la URL trae un desafío específico, comprobar si ya teníamos progreso en esa semilla
      const raw = localStorage.getItem('sudoku_arena_active_game_v1');
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          if (saved && saved.difficulty === challenge.difficulty && saved.seed === challenge.seed && !saved.isGameOver) {
            if (this.restoreActiveGame()) {
              return;
            }
          }
        } catch (e) {}
      }
      this.selectedDifficulty = challenge.difficulty;
      this.newGame(challenge.difficulty, challenge.seed);
      this.showToast(`¡Desafío cargado! Código: ${challenge.code}`, 'info');
    } else {
      // Sin parámetro en URL: reanudar partida activa previa si existe
      if (!this.restoreActiveGame()) {
        this.newGame('medio');
      }
    }
  }

  /**
   * Inicia una partida basada en un tablero personalizado (OCR, planteado a mano o bóveda)
   */
  startCustomGame(board, name = 'Reto Personalizado', vaultId = null) {
    this.stopTimer();
    this.isGameOver = false;
    this.isWeeklyMode = false;
    this.weeklyDiff = null;
    this.timerSeconds = 0;

    // Generar puzle y auditoría cognitiva humana desde el tablero personalizado
    this.gameData = SudokuEngine.createGameFromCustomBoard(board, name);
    this.gameData.vaultId = vaultId;
    this.selectedDifficulty = this.gameData.difficulty;
    this.currentSeed = this.gameData.seed;

    this.currentBoard = SudokuEngine.cloneBoard(this.gameData.board);
    this.scoring = new ScoringEngine(this.gameData);
    this.candidateMap = SudokuEngine.getAllCandidates(this.currentBoard);

    // Actualizar botones de dificultad en UI
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === this.gameData.difficulty);
    });

    // Resetear UI
    this.boardUI.setGlobalRayosX(false);
    this.boardUI.revealedCells = Array.from({ length: 9 }, () => Array(9).fill(false));
    this.boardUI.selectCell(0, 0);

    const timerElem = document.getElementById('timer-display');
    if (timerElem) timerElem.textContent = this.formatTime(0);

    this.startTimer();
    this.updateStatsUI();
    this.render();

    // Actualizar etiqueta del desafío
    const codeElem = document.getElementById('challenge-code-display');
    if (codeElem) codeElem.textContent = 'CUSTOM';

    this.saveActiveGame();
    window.soundFx.playClick();
    this.closeAllModals();
  }

  /**
   * Inicia una nueva partida
   */
  newGame(difficulty = this.selectedDifficulty, seed = Math.floor(10000 + Math.random() * 90000)) {
    this.stopTimer();
    this.isGameOver = false;
    this.selectedDifficulty = difficulty;
    this.currentSeed = seed;
    this.timerSeconds = 0;

    // Actualizar botones de dificultad en UI
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === difficulty);
    });

    // Generar puzzle
    this.gameData = SudokuEngine.generateGame(difficulty, seed);
    this.currentBoard = SudokuEngine.cloneBoard(this.gameData.board);
    this.scoring = new ScoringEngine(this.gameData);
    this.candidateMap = SudokuEngine.getAllCandidates(this.currentBoard);

    // Resetear UI
    this.boardUI.setGlobalRayosX(false);
    this.boardUI.revealedCells = Array.from({ length: 9 }, () => Array(9).fill(false));
    this.boardUI.selectCell(0, 0);

    const timerElem = document.getElementById('timer-display');
    if (timerElem) timerElem.textContent = this.formatTime(0);

    this.startTimer();
    this.updateStatsUI();
    this.render();

    // Actualizar código de desafío visible
    const challengeCode = CompetitionEngine.generateChallengeCode(difficulty, seed);
    const codeElem = document.getElementById('challenge-code-display');
    if (codeElem) codeElem.textContent = challengeCode;

    // Sincronizar URL de forma transparente para que al compartir o pulsar F5 se conserve el puzle exacto
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('desafio', challengeCode);
        window.history.replaceState({ desafio: challengeCode }, '', url.toString());
      } catch (e) {}
    }

    // Persistir estado inicial de inmediato
    this.saveActiveGame();

    // Evento analítico de inicio de partida
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'game_start', {
        difficulty: difficulty,
        challenge_code: challengeCode
      });
    }

    window.soundFx.playClick();
  }

  /**
   * Renderiza el estado actual en el tablero y UI
   */
  render() {
    this.candidateMap = SudokuEngine.getAllCandidates(this.currentBoard);
    this.boardUI.render(this.gameData, this.currentBoard, this.scoring, this.candidateMap);
    this.updateStatsUI();
  }

  /**
   * Selección de una celda
   */
  onCellSelected(r, c) {
    this.render();
    this.triggerHaptic(10);
    window.soundFx.playClick();
  }

  /**
   * El usuario introduce un número (1 al 9 o 0 para borrar)
   */
  inputNumber(num) {
    if (this.isGameOver) return;
    const r = this.boardUI.selectedRow;
    const c = this.boardUI.selectedCol;

    if (r === -1 || c === -1) return;

    // No se pueden modificar las casillas fijas del tablero original
    if (this.gameData.board[r][c] !== 0) return;

    // Si ya fue resuelta por el sistema
    if (this.scoring.cellSolvedBySystem[r][c]) return;

    if (num === 0) {
      // Borrar casilla si no era fija
      if (this.currentBoard[r][c] !== 0) {
        this.currentBoard[r][c] = 0;
        this.scoring.cellCompleted[r][c] = false;
        this.render();
        this.saveActiveGame();
        this.triggerHaptic(15);
        window.soundFx.playClick();
      }
      return;
    }

    const expected = this.gameData.solution[r][c];

    if (num === expected) {
      // Acierto correcto
      this.currentBoard[r][c] = num;
      try {
        this.scoring.registerCorrectCell(r, c, num);
      } catch (err) {
        console.error('Error registrando acierto en scoring:', err);
      }
      this.boardUI.triggerSuccessAnimation(r, c);
      this.triggerHaptic(25);
      window.soundFx.playSuccess();
      this.render();
      this.saveActiveGame();

      // Centinela de Juego Limpio: Alerta si se detecta barrido lineal de copia externa (ChatGPT / Solver)
      if (this.scoring && this.scoring.fairPlayFlag && !this.scoring.fairPlayWarningTriggered) {
        this.scoring.fairPlayWarningTriggered = true;
        this.openModal('modal-fair-play');
        window.soundFx?.playPeek?.();
        this.triggerHaptic([100, 50, 100]);
      }

      this.checkVictoryCondition();
    } else {
      // Error
      try {
        this.scoring.registerError(r, c, num);
      } catch (err) {
        console.error('Error registrando error en scoring:', err);
      }
      this.boardUI.triggerErrorAnimation(r, c);
      this.triggerHaptic(45);
      window.soundFx.playError();
      this.render();
      this.saveActiveGame();
      this.showToast(window.i18n.t('toast_error_num', { num }), 'error');
    }
  }

  /**
   * Muestra la modal de Consulta Quirúrgica (Lupa) para la celda activa
   */
  openCellPeekModal() {
    if (this.isGameOver) return;
    const r = this.boardUI.selectedRow;
    const c = this.boardUI.selectedCol;

    if (r === -1 || c === -1) {
      this.showToast(window.i18n.t('toast_select_empty'), 'warning');
      return;
    }

    if (this.gameData.board[r][c] !== 0 || this.currentBoard[r][c] !== 0) {
      this.showToast(window.i18n.t('toast_cell_filled'), 'warning');
      return;
    }

    const candidates = this.candidateMap[r][c] || [];
    const pts = this.scoring.cellScores[r][c];
    const isAlreadyPeeked = this.scoring.cellPeeked[r][c];

    document.getElementById('peek-cell-coord').textContent = `Fila ${r + 1}, Columna ${c + 1}`;
    document.getElementById('peek-cell-points').textContent = isAlreadyPeeked ? '0 pts (ya consultada)' : `-${pts} pts del techo`;
    document.getElementById('peek-cell-options-preview').textContent = `[ ${candidates.join(', ')} ]`;

    const confirmBtn = document.getElementById('btn-confirm-cell-peek');
    confirmBtn.onclick = () => {
      this.boardUI.revealCell(r, c);
      this.scoring.registerCellPeek(r, c, candidates);
      this.closeModal('modal-cell-peek');
      window.soundFx.playPeek();
      this.triggerHaptic(30);
      this.render();
      this.saveActiveGame();
      this.showToast(window.i18n.t('toast_peek_revealed', { r: r + 1, c: c + 1 }), 'info');
    };

    this.openModal('modal-cell-peek');
  }

  /**
   * Muestra la modal de confirmación de Rayos X Globales
   */
  openGlobalRayosXModal() {
    if (this.isGameOver) return;

    if (this.boardUI.globalRayosXActive) {
      this.showToast(window.i18n.t('toast_rayosx_already'), 'info');
      return;
    }

    let totalDeduction = 0;
    let singles = 0;
    let doubles = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!this.scoring.cellCompleted[r][c] && this.scoring.cellScores[r][c] > 0) {
          const cands = this.candidateMap[r][c] || [];
          const count = cands.length;
          let factor = 0;
          if (count === 1) { factor = 1.0; singles++; }
          else if (count === 2) { factor = 0.5; doubles++; }
          else if (count === 3) { factor = 0.25; }
          else if (count >= 4) { factor = 0.10; }

          totalDeduction += Math.round(this.scoring.cellScores[r][c] * factor);
        }
      }
    }

    document.getElementById('rayosx-singles-count').textContent = singles;
    document.getElementById('rayosx-doubles-count').textContent = doubles;
    document.getElementById('rayosx-total-deduction').textContent = `-${totalDeduction} pts`;

    const confirmBtn = document.getElementById('btn-confirm-rayosx');
    confirmBtn.onclick = () => {
      this.boardUI.setGlobalRayosX(true);
      this.scoring.registerGlobalPeek(this.candidateMap);
      this.closeModal('modal-rayosx');
      window.soundFx.playPeek();
      this.triggerHaptic(40);
      this.render();
      this.saveActiveGame();
      this.showToast(window.i18n.t('toast_rayosx_active', { pts: totalDeduction }), 'warning');
    };

    this.openModal('modal-rayosx');
  }

  /**
   * Muestra la modal de Auto-Resolver por el sistema
   */
  openAutoSolveModal() {
    if (this.isGameOver) return;

    let remainingCells = 0;
    let pointsAtRisk = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentBoard[r][c] === 0) {
          remainingCells++;
          pointsAtRisk += this.scoring.cellScores[r][c];
        }
      }
    }

    if (remainingCells === 0) {
      this.showToast(window.i18n.t('toast_sudoku_done'), 'info');
      return;
    }

    document.getElementById('autosolve-cells-count').textContent = remainingCells;
    document.getElementById('autosolve-points-lost').textContent = `-${pointsAtRisk} pts`;

    const confirmBtn = document.getElementById('btn-confirm-autosolve');
    confirmBtn.onclick = () => {
      this.scoring.registerAutoSolve();
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.currentBoard[r][c] === 0) {
            this.currentBoard[r][c] = this.gameData.solution[r][c];
          }
        }
      }
      this.closeModal('modal-autosolve');
      window.soundFx.playError();
      this.render();
      this.checkVictoryCondition();
      this.showToast(window.i18n.t('toast_autosolve_done'), 'warning');
    };

    this.openModal('modal-autosolve');
  }

  /**
   * Abre la modal del Libro Mayor / Auditoría de Puntos
   */
  openLedgerModal() {
    const summary = this.scoring.getSummary();

    const fairPlayBanner = document.getElementById('verdict-fair-play-banner');
    if (fairPlayBanner) {
      if (summary.fairPlayFlag) {
        fairPlayBanner.classList.remove('hidden');
      } else {
        fairPlayBanner.classList.add('hidden');
      }
    }
    const ledger = this.scoring.ledger;

    document.getElementById('ledger-total-score').textContent = summary.currentScore;
    document.getElementById('ledger-max-possible').textContent = summary.currentMaxPossible;
    document.getElementById('ledger-total-penalties').textContent = `-${summary.totalPenalties}`;
    document.getElementById('ledger-autonomy-pct').textContent = `${summary.autonomyIndex}%`;

    const tbody = document.getElementById('ledger-table-body');
    tbody.innerHTML = '';

    ledger.forEach(entry => {
      const tr = document.createElement('tr');

      let deltaClass = 'text-neutral';
      let deltaStr = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`;
      if (entry.delta > 0) deltaClass = 'text-green';
      else if (entry.delta < 0) deltaClass = 'text-red';

      tr.innerHTML = `
        <td class="font-mono">${entry.timestamp}</td>
        <td><span class="type-badge badge-${entry.type}">${entry.type.toUpperCase()}</span></td>
        <td class="font-mono ${deltaClass}">${deltaStr}</td>
        <td class="font-mono font-bold">${entry.runningTotal}</td>
        <td class="font-mono text-muted">${entry.maxCeiling}</td>
        <td>${entry.description}</td>
      `;
      tbody.appendChild(tr);
    });

    this.openModal('modal-ledger');
  }

  /**
   * Abre la modal de Sala de Competición / Duelo
   */
  
  /**
   * Abre la modal de Creación de Nuevo Duelo indicándole la dificultad
   */
  openNewDuelModal(initialDiff = this.selectedDifficulty) {
    this.duelSelectedDiff = initialDiff;
    this.duelSelectedSeed = Math.floor(10000 + Math.random() * 90000);
    this.updateDuelModalPreview();

    // Actualizar botones activos de dificultad en el modal
    document.querySelectorAll('.duel-diff-card').forEach(card => {
      card.classList.toggle('active', card.dataset.diff === this.duelSelectedDiff);
    });

    const compInput = document.getElementById('comp-input-code');
    if (compInput) compInput.value = '';

    this.openModal('modal-competition');
  }

  /**
   * Actualiza la previsualización del código y dificultad dentro del modal de duelo
   */
  updateDuelModalPreview() {
    if (!this.duelSelectedDiff) this.duelSelectedDiff = this.selectedDifficulty || 'medio';
    if (!this.duelSelectedSeed) this.duelSelectedSeed = Math.floor(10000 + Math.random() * 90000);
    const code = CompetitionEngine.generateChallengeCode(this.duelSelectedDiff, this.duelSelectedSeed);
    const codeElem = document.getElementById('duel-modal-code');
    if (codeElem) codeElem.textContent = code;

    const diffLabels = {
      'facil': `${window.i18n.t('diff_facil')} (${window.i18n.t('duel_card_easy_sub')})`,
      'medio': `${window.i18n.t('diff_medio')} (${window.i18n.t('duel_card_med_sub')})`,
      'dificil': `${window.i18n.t('diff_dificil')} (${window.i18n.t('duel_card_hard_sub')})`,
      'endemoniado': `${window.i18n.t('diff_endemoniado')} (${window.i18n.t('duel_card_evil_sub')})`
    };

    const diffLabelElem = document.getElementById('duel-modal-diff-label');
    if (diffLabelElem) {
      diffLabelElem.textContent = diffLabels[this.duelSelectedDiff] || this.duelSelectedDiff;
    }
  }

  
  /**
   * Abre el Modal del Reto Semanal y actualiza puntuaciones e información
   */
  openWeeklyModal() {
    this.updateWeeklyModalUI();
    this.openModal('modal-weekly');
  }

  updateWeeklyModalUI() {
    if (!window.weeklyEngine) return;
    const info = window.weeklyEngine.getCurrentWeekInfo();

    const tagEl = document.getElementById('weekly-badge-tag');
    if (tagEl) tagEl.textContent = info.weekId;

    const cdEl = document.getElementById('weekly-countdown-display');
    if (cdEl) cdEl.textContent = `${info.daysLeft}d ${info.hoursLeft}h ${info.minsLeft}m`;

    const diffs = ['facil', 'medio', 'dificil', 'endemoniado'];
    diffs.forEach(diff => {
      const status = window.weeklyEngine.getLevelStatus(diff);
      const scoreEl = document.getElementById(`weekly-score-${diff}`);
      const statusEl = document.getElementById(`weekly-status-${diff}`);

      if (status) {
        if (scoreEl) scoreEl.textContent = `${status.score} / ${status.ceiling} (${status.efficiency}% ${status.tier.icon})`;
        if (statusEl) {
          statusEl.className = 'weekly-status-badge badge-done';
          statusEl.textContent = status.tier.name;
        }
      } else {
        if (scoreEl) scoreEl.textContent = '- / -';
        if (statusEl) {
          statusEl.className = 'weekly-status-badge badge-pending';
          statusEl.textContent = window.i18n ? window.i18n.t('weekly_status_pending') : 'Pendiente';
        }
      }
    });
  }

  startWeeklyGame(diff) {
    if (!window.weeklyEngine) return;
    const info = window.weeklyEngine.getCurrentWeekInfo();
    const seed = window.weeklyEngine.getWeeklySeed(diff, info.year, info.week);
    this.isWeeklyMode = true;
    this.weeklyDiff = diff;
    this.newGame(diff, seed);
    this.saveActiveGame();
    this.closeModal('modal-weekly');
    this.showToast(`🏆 ¡Iniciado Reto Semanal ${diff.toUpperCase()} (${info.weekId})!`, 'success');
  }

  openCompetitionModal() {
    this.openNewDuelModal(this.selectedDifficulty);
  }

  /**
   * Comprueba si el tablero está 100% completado y correcto
   */
  checkVictoryCondition() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentBoard[r][c] === 0 || this.currentBoard[r][c] !== this.gameData.solution[r][c]) {
          return false;
        }
      }
    }

    this.isGameOver = true;
    this.stopTimer();
    this.clearActiveGame();
    if (this.isWeeklyMode && window.weeklyEngine) {
      window.weeklyEngine.saveWeeklyResult(this.weeklyDiff, this.scoring.currentScore, this.scoring.initialTotalPoints, Math.round((this.scoring.currentScore / this.scoring.initialTotalPoints) * 100), this.timerSeconds);
    }
    // Si era un reto de la Bóveda, registrar récord personal
    if (this.gameData && this.gameData.isCustom && this.vault && this.gameData.vaultId) {
      const summary = this.scoring.getSummary();
      this.vault.updateStats(this.gameData.vaultId, {
        score: summary.currentScore,
        timeSeconds: this.timerSeconds,
        rank: summary.rank
      });
      this.updateVaultBadge();
    }
    window.soundFx.playVictory();
    this.triggerHaptic([50, 100, 50, 100, 150]);

    const summary = this.scoring.getSummary();

    // Evento analítico de finalización de partida
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'game_complete', {
        difficulty: this.selectedDifficulty,
        score: summary.currentScore,
        autonomy: summary.autonomyIndex,
        rank: summary.rank,
        time_seconds: this.timerSeconds,
        errors: summary.errorsCount,
        peeks: summary.peeksCount
      });
    }

    document.getElementById('verdict-rank').textContent = (window.i18n && summary.rankKey) ? window.i18n.t(summary.rankKey) : summary.rank;
    document.getElementById('verdict-rank').style.color = summary.rankColor;
    document.getElementById('verdict-score').textContent = `${summary.currentScore} pts`;
    document.getElementById('verdict-max-theoretical').textContent = `${summary.initialTotalPoints} pts`;
    document.getElementById('verdict-autonomy').textContent = `${summary.autonomyIndex}%`;
    document.getElementById('verdict-autonomy').style.color = summary.rankColor;
    document.getElementById('verdict-time').textContent = this.formatTime(this.timerSeconds);
    document.getElementById('verdict-penalties').textContent = `-${summary.totalPenalties} pts`;
    document.getElementById('verdict-peeks').textContent = summary.peeksCount;
    document.getElementById('verdict-errors').textContent = summary.errorsCount;

    const shareBtn = document.getElementById('btn-share-verdict');
    shareBtn.onclick = () => {
      let text = '';
      if (this.gameData && this.gameData.isCustom) {
        const url = CompetitionEngine.generateCustomChallengeUrl(this.gameData.boardString, this.gameData.customName || 'Reto Personalizado');
        text = `🏆 ¡He resuelto este Sudoku personalizado en Sudoku Arena!\n🎯 Puntuación: ${summary.currentScore} pts (Autonomía: ${summary.autonomyIndex}% - ${summary.rank})\n⏱️ Tiempo: ${this.formatTime(this.timerSeconds)}\n⚔️ ¿Te atreves a superarme en este reto? Juega aquí:\n${url}`;
      } else {
        const code = CompetitionEngine.generateChallengeCode(this.selectedDifficulty, this.currentSeed);
        text = `🏆 ¡He resuelto Sudoku Arena en nivel ${this.selectedDifficulty.toUpperCase()}!\n🎯 Puntuación: ${summary.currentScore} pts (Autonomía: ${summary.autonomyIndex}% - ${summary.rank})\n⏱️ Tiempo: ${this.formatTime(this.timerSeconds)}\n⚔️ ¿Te atreves a superarme? Juega el mismo tablero con este enlace:\n${CompetitionEngine.getChallengeUrl(code)}`;
      }

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('¡Resultado copiado para compartir!', 'success');
        });
      } else {
        prompt('Copia tu resultado para retar a tus amigos:', text);
      }
    };

    setTimeout(() => {
      this.openModal('modal-gameover');
    }, 450);

    return true;
  }

  /**
   * Actualiza los marcadores y tarjetas de estadísticas tanto en escritorio como en el HUD móvil
   */
  
  getRankBadge(autonomy) {
    if (!window.i18n) return 'Gran Maestro';
    if (autonomy >= 95) return window.i18n.t('rank_grandmaster');
    if (autonomy >= 80) return window.i18n.t('rank_tactical_master');
    if (autonomy >= 50) return window.i18n.t('rank_assisted_strategist');
    return window.i18n.t('rank_casual');
  }

  updateStatsUI() {
    const summary = this.scoring.getSummary();

    // Desktop elements
    const statScore = document.getElementById('stat-current-score');
    if (statScore) statScore.textContent = summary.currentScore;

    const statMax = document.getElementById('stat-max-possible');
    if (statMax) statMax.textContent = summary.currentMaxPossible;

    const statInit = document.getElementById('stat-initial-ceiling');
    if (statInit) statInit.textContent = summary.initialTotalPoints;

    const statAutonomy = document.getElementById('stat-autonomy-pct');
    if (statAutonomy) statAutonomy.textContent = `${summary.autonomyIndex}%`;

    const statPenalties = document.getElementById('stat-penalties');
    if (statPenalties) statPenalties.textContent = `-${summary.totalPenalties}`;

    const autonomyBar = document.getElementById('autonomy-progress-bar');
    if (autonomyBar) {
      autonomyBar.style.width = `${summary.autonomyIndex}%`;
      autonomyBar.style.backgroundColor = summary.rankColor;
    }

    const rankBadge = document.getElementById('stat-rank-badge');
    if (rankBadge) {
      rankBadge.textContent = (window.i18n && summary.rankKey) ? window.i18n.t(summary.rankKey) : summary.rank;
      rankBadge.style.color = summary.rankColor;
    }

    // Mobile HUD elements
    const mScore = document.getElementById('mobile-stat-score');
    if (mScore) mScore.textContent = summary.currentScore;

    const mCeiling = document.getElementById('mobile-stat-ceiling');
    if (mCeiling) mCeiling.textContent = summary.currentMaxPossible;

    const mAutonomy = document.getElementById('mobile-stat-autonomy');
    if (mAutonomy) mAutonomy.textContent = `${summary.autonomyIndex}%`;

    const mRank = document.getElementById('mobile-stat-rank');
    if (mRank) {
      mRank.textContent = (window.i18n && summary.rankKey) ? window.i18n.t(summary.rankKey) : summary.rank;
      mRank.style.color = summary.rankColor;
    }
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const timerElem = document.getElementById('timer-display');
      if (timerElem) timerElem.textContent = this.formatTime(this.timerSeconds);
      if (this.timerSeconds % 5 === 0) {
        this.saveActiveGame();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /**
   * Cierra o abandona la partida con confirmación previa si está empezada
   */
  exitGame() {
    if (this.hasUserMadeMoves()) {
      const msg = window.i18n ? window.i18n.t('confirm_abandon_exit') : 'Tienes una partida en curso. ¿Deseas abandonar la partida y salir? Se perderá el progreso actual.';
      if (!confirm(msg)) return;
    }
    this.clearActiveGame();
    this.stopTimer();
    this.isGameOver = true;

    // 1. Si se ejecuta dentro de aplicación móvil nativa (Capacitor / Cordova)
    try {
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.exitApp();
        return;
      }
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.App && typeof window.Capacitor.App.exitApp === 'function') {
        window.Capacitor.App.exitApp();
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.app && typeof navigator.app.exitApp === 'function') {
        navigator.app.exitApp();
        return;
      }
    } catch (e) {}

    // 2. Intentar cerrar la pestaña / ventana del navegador web
    try {
      window.open('', '_self', '');
      window.close();
    } catch (e) {}

    // 3. Si el usuario llegó desde otra aplicación o página previa, volver atrás en el historial
    try {
      if (window.history && window.history.length > 1) {
        window.history.back();
      }
    } catch (e) {}

    // 4. Si la pestaña sigue abierta en el navegador, mostrar la pantalla completa opaca de salida
    const exitScreen = document.getElementById('exit-screen');
    if (exitScreen) {
      exitScreen.classList.remove('hidden');
    }
  }

  /**
   * Cambia la semilla aleatoria dentro del nivel de dificultad actual (Botón 🎲 o Teclas S / N)
   */
  rerollSeedForCurrentDifficulty() {
    if (this.hasUserMadeMoves()) {
      const msg = window.i18n ? window.i18n.t('confirm_abandon') : 'Tienes una partida en curso. ¿Deseas abandonarla e iniciar un nuevo tablero? Se perderá el progreso.';
      if (!confirm(msg)) return;
    }
    this.clearActiveGame();
    this.isWeeklyMode = false;
    this.weeklyDiff = null;
    const newSeed = Math.floor(10000 + Math.random() * 90000);
    this.newGame(this.selectedDifficulty, newSeed);
    this.showToast(window.i18n ? window.i18n.t('toast_new_seed_generated', { seed: newSeed }) : `Nueva semilla generada: ${newSeed}`, 'info');
  }


  /* ==========================================================================
     MÉTODOS DE ESCANEO OCR Y PLANTEAMIENTO MANUAL
     ========================================================================== */

  openScanModal(initialTab = 'ocr') {
    this.openModal('modal-scan-create');
    this.switchScanTab(initialTab);
    this.renderReviewGrid();
    this.validateScanBoard();
  }

  switchScanTab(tabName) {
    document.querySelectorAll('.scan-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.getElementById('tab-pane-ocr')?.classList.toggle('active', tabName === 'ocr');
    document.getElementById('tab-pane-manual')?.classList.toggle('active', tabName === 'manual');
    document.getElementById('tab-pane-string')?.classList.toggle('active', tabName === 'string');
  }

  buildReviewGrid() {
    const container = document.getElementById('review-grid');
    if (!container) return;
    container.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'review-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', () => {
          this.selectScanCell(r, c);
        });
        container.appendChild(cell);
      }
    }
  }

  selectScanCell(r, c) {
    this.scanSelectedRow = r;
    this.scanSelectedCol = c;
    this.renderReviewGrid();
  }

  renderReviewGrid() {
    const cells = document.querySelectorAll('#review-grid .review-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      const val = this.scanBoard[r][c];
      const isConflict = this.scanConflicts && this.scanConflicts.has(`${r}-${c}`);

      cell.textContent = val > 0 ? val : '';
      cell.classList.toggle('has-clue', val > 0);
      cell.classList.toggle('invalid-conflict', isConflict);
      cell.classList.toggle('selected', r === this.scanSelectedRow && c === this.scanSelectedCol);
      cell.classList.toggle('highlighted', (r === this.scanSelectedRow || c === this.scanSelectedCol) && !(r === this.scanSelectedRow && c === this.scanSelectedCol));
    });
  }

  inputScanDigit(num) {
    this.scanBoard[this.scanSelectedRow][this.scanSelectedCol] = num;
    this.renderReviewGrid();
    this.validateScanBoard();

    // Auto-avanzar a la siguiente celda si se introdujo un número > 0
    if (num > 0) {
      if (this.scanSelectedCol < 8) {
        this.selectScanCell(this.scanSelectedRow, this.scanSelectedCol + 1);
      } else if (this.scanSelectedRow < 8) {
        this.selectScanCell(this.scanSelectedRow + 1, 0);
      }
    }
  }

  clearScanGrid() {
    this.scanBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.scanSelectedRow = 0;
    this.scanSelectedCol = 0;
    this.scanConflicts = new Set();
    this.renderReviewGrid();
    this.validateScanBoard();
  }

  async handleImageFile(fileOrUrl) {
    if (!this.ocr) {
      this.showToast('Módulo OCR no disponible', 'error');
      return;
    }

    const progressBox = document.getElementById('ocr-progress-box');
    const statusText = document.getElementById('ocr-status-text');
    const progressFill = document.getElementById('ocr-progress-fill');

    if (progressBox) progressBox.classList.remove('hidden');

    try {
      const result = await this.ocr.recognize(fileOrUrl, (progress) => {
        if (statusText) statusText.textContent = progress.status;
        if (progressFill) progressFill.style.width = `${Math.round(progress.percent * 100)}%`;
      });

      if (result && result.board) {
        this.scanBoard = result.board;
        this.renderReviewGrid();
        this.validateScanBoard();
        const toastMsg = window.i18n ? window.i18n.t('toast_ocr_success') : '¡Tablero detectado y digitalizado con éxito!';
        this.showToast(toastMsg, 'success');
        window.soundFx.playCorrect();
      } else {
        throw new Error('No se detectó tablero válido');
      }
    } catch (e) {
      console.error('Error OCR:', e);
      const toastErr = window.i18n ? window.i18n.t('toast_ocr_error') : 'No se pudo detectar el tablero. Revisa el contraste o introduce los dígitos a mano.';
      this.showToast(toastErr, 'error');
      window.soundFx.playError();
    } finally {
      if (progressBox) progressBox.classList.add('hidden');
    }
  }

  loadSampleNewspaper() {
    if (this.ocr) {
      const sample = this.ocr.getSampleSudoku ? this.ocr.getSampleSudoku() : [
        [0, 0, 0, 6, 0, 0, 4, 0, 0],
        [7, 0, 0, 0, 0, 3, 6, 0, 0],
        [0, 0, 0, 0, 9, 1, 0, 8, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 0, 1, 8, 0, 0, 0, 3],
        [0, 0, 0, 3, 0, 6, 0, 4, 5],
        [0, 4, 0, 2, 0, 0, 0, 6, 0],
        [9, 0, 3, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 1, 0, 0]
      ];
      this.scanBoard = sample.map(row => [...row]);
      this.renderReviewGrid();
      this.validateScanBoard();
      const toastMsg = window.i18n ? window.i18n.t('toast_ocr_success') : '¡Tablero detectado y digitalizado con éxito!';
      this.showToast(toastMsg, 'success');
      window.soundFx.playCorrect();
    }
  }

  loadStringIntoGrid() {
    const input = document.getElementById('scan-string-input');
    if (!input) return;
    const raw = input.value.trim();
    const parsed = SudokuEngine.parseBoardString(raw);
    if (!parsed) {
      this.showToast('Cadena inválida. Debe tener 81 caracteres numéricos o puntos.', 'error');
      return;
    }
    this.scanBoard = parsed;
    this.renderReviewGrid();
    this.validateScanBoard();
    this.showToast('¡Cadena cargada en la cuadrícula de verificación!', 'success');
  }

  validateScanBoard() {
    let cluesCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.scanBoard[r][c] > 0) cluesCount++;
      }
    }

    const cluesBadge = document.getElementById('review-clues-badge');
    const diffBadge = document.getElementById('review-diff-badge');
    const ptsBadge = document.getElementById('review-pts-badge');
    const valText = document.getElementById('review-validation-text');

    const saveBtn = document.getElementById('btn-save-to-vault');
    const playBtn = document.getElementById('btn-play-custom');
    const duelBtn = document.getElementById('btn-duel-custom');

    const cluesWord = window.i18n ? window.i18n.t('review_clues') : 'pistas';
    if (cluesBadge) cluesBadge.textContent = `${cluesCount} ${cluesWord}`;

    // 1. Detección inmediata de colisiones / números repetidos
    this.scanConflicts = (typeof SudokuEngine !== 'undefined' && SudokuEngine.findBoardConflicts)
      ? SudokuEngine.findBoardConflicts(this.scanBoard)
      : new Set();

    this.renderReviewGrid();

    if (this.scanConflicts.size > 0) {
      if (diffBadge) diffBadge.textContent = 'CONFLICTO';
      if (ptsBadge) ptsBadge.textContent = '0 pts';
      if (valText) {
        valText.className = 'review-validation-text text-invalid';
        valText.textContent = window.i18n ? window.i18n.t('review_invalid') : 'Hay números repetidos en la misma fila, columna o región 3x3.';
      }
      if (saveBtn) saveBtn.disabled = true;
      if (playBtn) playBtn.disabled = true;
      if (duelBtn) duelBtn.disabled = true;
      this.scanAnalysis = null;
      return false;
    }

    if (cluesCount < 17) {
      if (diffBadge) diffBadge.textContent = '--';
      if (ptsBadge) ptsBadge.textContent = '-- pts';
      if (valText) {
        valText.className = 'review-validation-text text-invalid';
        valText.textContent = `Se necesitan al menos 17 pistas para una solución única (actuales: ${cluesCount}).`;
      }
      if (saveBtn) saveBtn.disabled = true;
      if (playBtn) playBtn.disabled = true;
      if (duelBtn) duelBtn.disabled = true;
      this.scanAnalysis = null;
      return false;
    }

    // Comprobar si es resoluble
    const solution = SudokuEngine.solve(this.scanBoard);
    if (!solution) {
      if (diffBadge) diffBadge.textContent = 'SIN SOLUCIÓN';
      if (ptsBadge) ptsBadge.textContent = '0 pts';
      if (valText) {
        valText.className = 'review-validation-text text-invalid';
        valText.textContent = 'El tablero planteado no tiene ninguna solución válida.';
      }
      if (saveBtn) saveBtn.disabled = true;
      if (playBtn) playBtn.disabled = true;
      if (duelBtn) duelBtn.disabled = true;
      this.scanAnalysis = null;
      return false;
    }

    // Análisis cognitivo completo
    const analysis = SudokuEngine.analyzeBoard(this.scanBoard, solution);
    this.scanAnalysis = analysis;

    if (diffBadge) {
      const diffKey = `diff_${analysis.difficulty}`;
      diffBadge.textContent = window.i18n ? window.i18n.t(diffKey) : analysis.difficulty.toUpperCase();
    }
    const pts = analysis.totalPoints || analysis.initialTotalPoints || 0;
    if (ptsBadge) ptsBadge.textContent = `${pts} pts`;
    if (valText) {
      valText.className = 'review-validation-text text-valid';
      valText.textContent = window.i18n ? window.i18n.t('review_valid') : '✓ Tablero válido y resoluble.';
    }

    if (saveBtn) saveBtn.disabled = false;
    if (playBtn) playBtn.disabled = false;
    if (duelBtn) duelBtn.disabled = false;
    return true;
  }

  saveCurrentScanToVault() {
    if (!this.scanAnalysis || !this.vault) return;
    const nameInput = document.getElementById('scan-board-name');
    const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : `Sudoku Escaneado ${new Date().toLocaleDateString()}`;

    const totalPts = this.scanAnalysis.totalPoints || this.scanAnalysis.initialTotalPoints || 0;
    const saved = this.vault.saveBoard(this.scanBoard, {
      name,
      difficulty: this.scanAnalysis.difficulty,
      initialTotalPoints: totalPts,
      totalPoints: totalPts,
      techniqueAudit: this.scanAnalysis.cellTechniques || this.scanAnalysis.techniqueAudit
    });

    this.updateVaultBadge();
    const msg = window.i18n ? window.i18n.t('toast_saved_to_vault') : '¡Sudoku guardado con éxito en tu Bóveda!';
    this.showToast(msg, 'success');
    window.soundFx.playCorrect();
    this.closeModal('modal-scan-create');
  }

  /* ==========================================================================
     MÉTODOS DE LA BÓVEDA DE RETOS ("MIS SUDOKUS")
     ========================================================================== */

  openVaultModal() {
    this.openModal('modal-vault');
    this.renderVaultItems();
  }

  renderVaultItems() {
    const container = document.getElementById('vault-items-list');
    if (!container || !this.vault) return;

    let items = this.vault.getAll();

    // Filtro por estado
    if (this.vaultFilter === 'completed') {
      items = items.filter(it => it.timesPlayed > 0 && it.bestScore > 0);
    } else if (this.vaultFilter === 'pending') {
      items = items.filter(it => !it.timesPlayed || it.bestScore === 0);
    }

    // Filtro por búsqueda
    if (this.vaultSearchQuery.trim()) {
      const q = this.vaultSearchQuery.toLowerCase();
      items = items.filter(it => (it.name && it.name.toLowerCase().includes(q)) || (it.difficulty && it.difficulty.toLowerCase().includes(q)));
    }

    const statsElem = document.getElementById('vault-total-stats');
    if (statsElem) {
      const total = this.vault.getAll().length;
      const completed = this.vault.getAll().filter(i => i.bestScore > 0).length;
      statsElem.textContent = `${total} sudokus guardados · ${completed} completados`;
    }

    if (items.length === 0) {
      const emptyTitle = window.i18n ? window.i18n.t('vault_empty_title') : 'Tu Bóveda de Retos está vacía';
      const emptyDesc = window.i18n ? window.i18n.t('vault_empty_desc') : 'Escanea un sudoku desde un periódico o plantea tus propios desafíos para guardarlos aquí.';
      const scanNowText = window.i18n ? window.i18n.t('vault_btn_scan_now') : 'Escanear o Crear Primer Sudoku';

      container.innerHTML = `
        <div class="vault-empty-state">
          <div class="vault-empty-icon">📁</div>
          <h4 class="vault-empty-title">${emptyTitle}</h4>
          <p class="vault-empty-desc">${emptyDesc}</p>
          <button id="btn-vault-empty-scan" class="modal-btn primary">
            <span>📷</span> ${scanNowText}
          </button>
        </div>
      `;
      document.getElementById('btn-vault-empty-scan')?.addEventListener('click', () => {
        this.closeModal('modal-vault');
        this.openScanModal('ocr');
      });
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `vault-card ${item.bestScore > 0 ? 'completed' : ''}`;

      const diffKey = `diff_${item.difficulty}`;
      const diffLabel = window.i18n ? window.i18n.t(diffKey) : item.difficulty.toUpperCase();
      const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';

      const playLabel = window.i18n ? window.i18n.t('vault_btn_play') : 'Jugar';
      const duelLabel = window.i18n ? window.i18n.t('vault_btn_duel') : 'Duelo';

      card.innerHTML = `
        <div class="vault-card-main">
          <div class="vault-card-title-row">
            <strong class="vault-card-title">${item.name || 'Reto Sin Nombre'}</strong>
            <span class="review-chip diff-badge">${diffLabel}</span>
          </div>
          <div class="vault-card-meta">
            <span>📅 ${dateStr}</span>
            <span>&bull;</span>
            <span>🧩 ${item.cluesCount} pistas</span>
            ${item.bestScore > 0 ? `<span>&bull;</span> <span class="text-gold font-mono">🏆 ${item.bestScore} pts (${item.bestRank || 'Completado'})</span>` : ''}
          </div>
        </div>
        <div class="vault-card-actions">
          <button class="vault-card-btn btn-play" data-id="${item.id}" title="Jugar en Arena">
            <span>▶️</span> ${playLabel}
          </button>
          <button class="vault-card-btn btn-duel" data-id="${item.id}" title="Crear Duelo WhatsApp">
            <span>⚔️</span> ${duelLabel}
          </button>
          <button class="vault-card-btn btn-del" data-id="${item.id}" title="Eliminar">
            🗑️
          </button>
        </div>
      `;

      card.querySelector('.btn-play').addEventListener('click', () => {
        this.startCustomGame(item.board, item.name, item.id);
      });

      card.querySelector('.btn-duel').addEventListener('click', () => {
        const boardStr = SudokuEngine.boardToString(item.board);
        const url = CompetitionEngine.generateCustomChallengeUrl(boardStr, item.name);
        const text = `⚔️ ¡Te reto en Sudoku Arena a resolver este Sudoku de mi Bóveda!
🧩 Reto: ${item.name} (${diffLabel})
🔗 Pulsa aquí para jugar con cronómetro y auditoría de puntos:
${url}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }

        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');

        const toastMsg = window.i18n ? window.i18n.t('toast_duel_link_copied') : '¡Enlace de Duelo copiado y abriendo WhatsApp!';
        this.showToast(toastMsg, 'success');
        window.soundFx.playClick();
      });

      card.querySelector('.btn-del').addEventListener('click', () => {
        const confirmMsg = window.i18n ? window.i18n.t('vault_delete_confirm') : '¿Seguro que deseas eliminar este sudoku de tu bóveda?';
        if (confirm(confirmMsg)) {
          this.vault.delete(item.id);
          this.renderVaultItems();
          this.updateVaultBadge();
          this.showToast('Sudoku eliminado de la bóveda', 'info');
        }
      });

      container.appendChild(card);
    });
  }

  updateVaultBadge() {
    if (!this.vault) return;
    const badge = document.getElementById('vault-badge-count');
    if (!badge) return;
    const count = this.vault.getAll().length;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  bindEvents() {
    // Teclado físico
    window.addEventListener('keydown', (e) => {
      if (document.querySelector('.modal-overlay.active')) {
        if (e.key === 'Escape') this.closeAllModals();
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        this.inputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        this.inputNumber(0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.boardUI.selectCell(Math.max(0, this.boardUI.selectedRow - 1), this.boardUI.selectedCol);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.boardUI.selectCell(Math.min(8, this.boardUI.selectedRow + 1), this.boardUI.selectedCol);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.boardUI.selectCell(this.boardUI.selectedRow, Math.max(0, this.boardUI.selectedCol - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.boardUI.selectCell(this.boardUI.selectedRow, Math.min(8, this.boardUI.selectedCol + 1));
      } else if (e.key.toLowerCase() === 'p' || e.code === 'Space') {
        e.preventDefault();
        this.openCellPeekModal();
      } else if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        this.openGlobalRayosXModal();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        this.openLedgerModal();
      } else if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.rerollSeedForCurrentDifficulty();
      }
    });

    // Teclado numérico táctil (1 al 9)
    document.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num, 10);
        this.inputNumber(num);
      });
    });

    // Barra de operaciones tácticas móvil
    document.querySelectorAll('.tactical-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'erase') this.inputNumber(0);
        else if (action === 'peek') this.openCellPeekModal();
        else if (action === 'rayosx') this.openGlobalRayosXModal();
        else if (action === 'autosolve') this.openAutoSolveModal();
        else if (action === 'duel') this.openCompetitionModal();
      });
    });

    // Botones de acción táctiles en Sidebar desktop
    document.getElementById('btn-tool-peek')?.addEventListener('click', () => this.openCellPeekModal());
    document.getElementById('btn-tool-rayosx')?.addEventListener('click', () => this.openGlobalRayosXModal());
    document.getElementById('btn-tool-autosolve')?.addEventListener('click', () => this.openAutoSolveModal());
    document.getElementById('btn-tool-ledger')?.addEventListener('click', () => this.openLedgerModal());
    document.getElementById('btn-mobile-ledger')?.addEventListener('click', () => this.openLedgerModal());
    document.getElementById('btn-tool-competition')?.addEventListener('click', () => this.openCompetitionModal());

    // Botón de Nuevo Duelo en cabecera
    
    // Selector de Idioma (Modal 7)
    
    // Botón Reto Semanal en cabecera
    document.getElementById('btn-open-weekly-modal')?.addEventListener('click', () => {
      this.openWeeklyModal();
    });

    // Botones para jugar reto semanal de cada nivel
    document.querySelectorAll('.btn-play-weekly').forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.diff;
        this.startWeeklyGame(diff);
      });
    });

    // Compartir puntuaciones semanales
    document.getElementById('btn-share-weekly-progress')?.addEventListener('click', () => {
      if (!window.weeklyEngine) return;
      const info = window.weeklyEngine.getCurrentWeekInfo();
      const diffs = ['facil', 'medio', 'dificil', 'endemoniado'];
      let lines = [`🏆 Mis Puntuaciones en Sudoku Arena (Semana ${info.weekId}):`];

      diffs.forEach(d => {
        const st = window.weeklyEngine.getLevelStatus(d);
        if (st) {
          lines.push(`• ${d.toUpperCase()}: ${st.score}/${st.ceiling} pts (${st.efficiency}% ${st.tier.icon} ${st.tier.name})`);
        } else {
          lines.push(`• ${d.toUpperCase()}: Pendiente`);
        }
      });
      lines.push('¿Puedes superarme? Juega el reto semanal aquí:');
      lines.push('https://guitusol.github.io/sudoku-arena/');

      const text = lines.join('\n');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('¡Resumen del reto semanal copiado al portapapeles!', 'success');
        });
      } else {
        prompt('Copia tus resultados semanales:', text);
      }
    });

    document.getElementById('btn-open-lang-modal')?.addEventListener('click', () => {
      this.openModal('modal-language');
    });

    document.querySelectorAll('.lang-card').forEach(card => {
      card.addEventListener('click', () => {
        const lang = card.dataset.lang;
        window.i18n.setLanguage(lang);
        this.closeModal('modal-language');
        window.soundFx.playClick();
        this.showToast(window.i18n.t('toast_lang_changed'), 'success');
      });
    });

    document.getElementById('btn-open-new-duel-modal')?.addEventListener('click', () => {
      this.openNewDuelModal(this.selectedDifficulty);
    });

    // Selector de dificultad dentro del modal de nuevo duelo
    document.querySelectorAll('.duel-diff-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.duel-diff-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.duelSelectedDiff = card.dataset.diff;
        this.updateDuelModalPreview();
        window.soundFx.playClick();
      });
    });

    // Botón Cambiar Semilla (🎲) dentro del modal
    document.getElementById('btn-duel-reroll-seed')?.addEventListener('click', () => {
      this.duelSelectedSeed = Math.floor(10000 + Math.random() * 90000);
      this.updateDuelModalPreview();
      window.soundFx.playClick();
    });

    // Botón Jugar Este Duelo Ahora
    document.getElementById('btn-duel-start-now')?.addEventListener('click', () => {
      this.closeModal('modal-competition');
      this.newGame(this.duelSelectedDiff, this.duelSelectedSeed);
      const code = CompetitionEngine.generateChallengeCode(this.duelSelectedDiff, this.duelSelectedSeed);
      this.showToast(window.i18n.t('toast_duel_started', { code }), 'success');
    });

    // Botón Copiar Enlace para Rivales
    document.getElementById('btn-duel-copy-link')?.addEventListener('click', () => {
      const code = CompetitionEngine.generateChallengeCode(this.duelSelectedDiff, this.duelSelectedSeed);
      const url = CompetitionEngine.getChallengeUrl(code);
      const msg = window.i18n.t('duel_share_msg', {
        diff: this.duelSelectedDiff.toUpperCase(),
        code: code,
        url: url
      });

      if (navigator.clipboard) {
        navigator.clipboard.writeText(msg).then(() => {
          this.showToast('¡Enlace de duelo copiado al portapapeles!', 'success');
        }).catch(() => {
          prompt('Copia este enlace para retar a tu rival:', url);
        });
      } else {
        prompt('Copia este enlace para retar a tu rival:', url);
      }
    });

    // Cargar código de rival (Botón 'Cargar Desafío' o pulsar Enter en el input)
    const handleLoadCustomChallenge = () => {
      const inputEl = document.getElementById('comp-input-code');
      let input = inputEl ? inputEl.value.trim() : '';
      if (!input) return;

      // Si el rival pegó una URL completa (?desafio=ARENA-...), extraer el parámetro limpio
      if (input.includes('desafio=')) {
        try {
          const match = input.match(/desafio=([^&]+)/);
          if (match && match[1]) {
            input = decodeURIComponent(match[1]).trim();
          }
        } catch (e) {}
      }

      const parsed = CompetitionEngine.parseChallengeCode(input);
      if (parsed) {
        this.closeModal('modal-competition');
        if (inputEl) inputEl.value = '';
        this.newGame(parsed.difficulty, parsed.seed);
        const toastMsg = window.i18n ? window.i18n.t('toast_challenge_loaded', { code: parsed.code }) : `¡Desafío cargado! Código: ${parsed.code}`;
        this.showToast(toastMsg, 'success');
      } else {
        const errorMsg = window.i18n ? window.i18n.t('toast_invalid_duel_code') : 'Código de desafío no válido. Formato: ARENA-DIFI-XXXXX';
        this.showToast(errorMsg, 'error');
      }
    };

    document.getElementById('btn-load-custom-challenge')?.addEventListener('click', handleLoadCustomChallenge);
    document.getElementById('comp-input-code')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLoadCustomChallenge();
      }
    });

    document.getElementById('btn-tool-competition-sidebar')?.addEventListener('click', () => this.openCompetitionModal());

    // Auto-guardado al cerrar o recargar la ventana y aviso si hay partida empezada
    window.addEventListener('beforeunload', (e) => {
      this.saveActiveGame();
      if (this.hasUserMadeMoves()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });

    // Soporte para botón atrás físico en móviles Android
    document.addEventListener('backbutton', (e) => {
      e.preventDefault();
      this.exitGame();
    });
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('backButton', () => {
        this.exitGame();
      });
    }

    // Botón Salir en cabecera
    document.getElementById('btn-exit-game')?.addEventListener('click', () => {
      this.exitGame();
    });

    // Botones de la pantalla de salida
    document.getElementById('btn-exit-try-close')?.addEventListener('click', () => {
      try {
        window.open('', '_self', '');
        window.close();
      } catch (e) {}
      try {
        if (window.history && window.history.length > 1) {
          window.history.back();
        }
      } catch (e) {}
    });

    document.getElementById('btn-exit-new-sudoku')?.addEventListener('click', () => {
      document.getElementById('exit-screen')?.classList.add('hidden');
      this.newGame(this.selectedDifficulty);
    });

    // Botón Aceptar Aviso de Juego Limpio
    document.getElementById('btn-fair-play-ack')?.addEventListener('click', () => {
      this.closeModal('modal-fair-play');
    });

    // Botón Cambiar Semilla (🎲) en la barra de dificultad
    document.getElementById('btn-reroll-seed')?.addEventListener('click', () => {
      this.rerollSeedForCurrentDifficulty();
    });

    // Botones de selector de dificultad (cambiar de nivel o reroll al hacer clic en el nivel activo)
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.diff;
        if (diff === this.selectedDifficulty) {
          // Si pulsa el mismo nivel activo, cambia de semilla en este nivel
          this.rerollSeedForCurrentDifficulty();
        } else {
          if (this.hasUserMadeMoves()) {
            const msg = window.i18n ? window.i18n.t('confirm_abandon') : 'Tienes una partida en curso. ¿Deseas abandonarla e iniciar un nuevo tablero? Se perderá el progreso.';
            if (!confirm(msg)) return;
          }
          this.clearActiveGame();
          this.isWeeklyMode = false;
          this.weeklyDiff = null;
          this.newGame(diff);
        }
      });
    });

    // Botones de cabecera
    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      const msg = window.i18n ? window.i18n.t('confirm_restart') : '¿Deseas reiniciar esta misma partida desde cero? Se perderán los números colocados y tu puntuación actual.';
      if (confirm(msg)) {
        this.clearActiveGame();
        this.newGame(this.selectedDifficulty, this.currentSeed);
      }
    });

    document.getElementById('btn-new-game')?.addEventListener('click', () => {
      if (this.hasUserMadeMoves()) {
        const msg = window.i18n ? window.i18n.t('confirm_abandon') : 'Tienes una partida en curso. ¿Deseas abandonarla e iniciar un nuevo tablero? Se perderá el progreso.';
        if (!confirm(msg)) return;
      }
      this.clearActiveGame();
      this.isWeeklyMode = false;
      this.weeklyDiff = null;
      this.newGame(this.selectedDifficulty);
    });

    document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
      const active = window.soundFx.toggle();
      document.getElementById('sound-icon').textContent = active ? '🔊' : '🔇';
      this.showToast(active ? window.i18n.t('toast_sound_on') : window.i18n.t('toast_sound_off'), 'info');
    });

    // Cierre de modales
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });


    // Botones de Escaneo y Bóveda en Cabecera y Sidebar
    document.getElementById('btn-open-scan-modal')?.addEventListener('click', () => this.openScanModal('ocr'));
    document.getElementById('btn-sidebar-scan')?.addEventListener('click', () => this.openScanModal('ocr'));
    document.getElementById('btn-open-vault-modal')?.addEventListener('click', () => this.openVaultModal());
    document.getElementById('btn-sidebar-vault')?.addEventListener('click', () => this.openVaultModal());
    document.getElementById('btn-vault-new-btn')?.addEventListener('click', () => {
      this.closeModal('modal-vault');
      this.openScanModal('ocr');
    });

    // Pestañas del modal de escaneo
    document.querySelectorAll('.scan-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchScanTab(btn.dataset.tab);
      });
    });

    // Zona Dropzone OCR
    const dropzone = document.getElementById('ocr-dropzone');
    const fileInput = document.getElementById('ocr-file-input');
    const cameraInput = document.getElementById('ocr-camera-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleImageFile(e.dataTransfer.files[0]);
        }
      });
    }

    document.getElementById('btn-trigger-camera')?.addEventListener('click', (e) => {
      e.stopPropagation();
      cameraInput?.click();
    });

    document.getElementById('btn-trigger-browse')?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });

    document.getElementById('btn-trigger-sample')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.loadSampleNewspaper();
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleImageFile(e.target.files[0]);
      }
    });

    cameraInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleImageFile(e.target.files[0]);
      }
    });

    // Soporte Pegar (Ctrl+V) de capturas de pantalla de sudokus
    window.addEventListener('paste', (e) => {
      const scanModal = document.getElementById('modal-scan-create');
      if (scanModal && scanModal.classList.contains('active')) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            this.handleImageFile(blob);
            break;
          }
        }
      }
    });

    // Teclado numérico táctil de revisión (1 al 9 y Borrar)
    document.querySelectorAll('.arena-mini-keypad .mini-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.val, 10);
        this.inputScanDigit(val);
      });
    });

    // Botón Limpiar cuadrícula de escaneo
    document.getElementById('btn-clear-scan-grid')?.addEventListener('click', () => {
      this.clearScanGrid();
    });

    // Cadena 81 caracteres
    document.getElementById('btn-load-string')?.addEventListener('click', () => {
      this.loadStringIntoGrid();
    });

    document.getElementById('btn-paste-string')?.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          const input = document.getElementById('scan-string-input');
          if (input) input.value = text;
          this.loadStringIntoGrid();
        }
      } catch (err) {
        this.showToast('Por favor pulsa Ctrl+V dentro de la caja de texto', 'info');
      }
    });

    // Botón Guardar en Bóveda
    document.getElementById('btn-save-to-vault')?.addEventListener('click', () => {
      this.saveCurrentScanToVault();
    });

    // Botón Jugar Ahora en Arena desde Scan Modal
    document.getElementById('btn-play-custom')?.addEventListener('click', () => {
      if (this.scanBoard) {
        const nameInput = document.getElementById('scan-board-name');
        const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Reto Personalizado';
        this.startCustomGame(this.scanBoard, name);
      }
    });

    // Botón Crear Duelo WhatsApp desde Scan Modal
    document.getElementById('btn-duel-custom')?.addEventListener('click', () => {
      if (!this.scanBoard) return;
      const nameInput = document.getElementById('scan-board-name');
      const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Reto Personalizado';
      const boardStr = SudokuEngine.boardToString(this.scanBoard);
      const url = CompetitionEngine.generateCustomChallengeUrl(boardStr, name);
      const diffName = this.scanAnalysis ? (window.i18n ? window.i18n.t(`diff_${this.scanAnalysis.difficulty}`) : this.scanAnalysis.difficulty.toUpperCase()) : 'PERSONALIZADO';
      const text = `⚔️ ¡Te reto en Sudoku Arena a resolver este Sudoku!
🧩 Reto: ${name} (${diffName})
🎯 Auditoría de Puntos Cognitivos en Vivo
🔗 Pulsa aquí para jugar el mismo tablero:
${url}`;

      // Copiar al portapapeles de forma segura
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }

      // Abrir WhatsApp directamente
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');

      const toastMsg = window.i18n ? window.i18n.t('toast_duel_link_copied') : '¡Enlace de Duelo copiado y abriendo WhatsApp!';
      this.showToast(toastMsg, 'success');
      window.soundFx.playClick();
    });

    // Búsqueda y Filtros en la Bóveda
    document.getElementById('vault-search-input')?.addEventListener('input', (e) => {
      this.vaultSearchQuery = e.target.value;
      this.renderVaultItems();
    });

    document.querySelectorAll('.vault-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.vault-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.vaultFilter = pill.dataset.filter;
        this.renderVaultItems();
      });
    });

    // Teclas numéricas dentro del modal de escaneo
    window.addEventListener('keydown', (e) => {
      const scanModal = document.getElementById('modal-scan-create');
      if (scanModal && scanModal.classList.contains('active')) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key >= '1' && e.key <= '9') {
          this.inputScanDigit(parseInt(e.key, 10));
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
          this.inputScanDigit(0);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectScanCell(Math.max(0, this.scanSelectedRow - 1), this.scanSelectedCol);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectScanCell(Math.min(8, this.scanSelectedRow + 1), this.scanSelectedCol);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.selectScanCell(this.scanSelectedRow, Math.max(0, this.scanSelectedCol - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.selectScanCell(this.scanSelectedRow, Math.min(8, this.scanSelectedCol + 1));
        }
      }
    });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeAllModals();
      });
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      window.soundFx.playClick();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.className = `toast-box toast-${type} active`;
    toast.textContent = message;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 2800);
  }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.sudokuApp = new SudokuApp();
});
