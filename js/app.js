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

    // Motores de Visión OCR, Bóveda de Retos e Historial de Récords
    this.ocr = (typeof window !== 'undefined' && window.SudokuOCR) ? new window.SudokuOCR() : null;
    this.vault = (typeof window !== 'undefined' && window.VaultStorage) ? new window.VaultStorage() : null;
    this.history = (typeof window !== 'undefined' && window.HistoryStorage) ? new window.HistoryStorage() : null;
    this.backupEngine = (typeof window !== 'undefined' && window.BackupEngine) ? new window.BackupEngine({
      historyStorage: this.history,
      vaultStorage: this.vault,
      hallOfFame: (typeof window !== 'undefined' ? window.hallOfFameEngine : null),
      weeklyEngine: (typeof window !== 'undefined' ? window.weeklyEngine : null)
    }) : null;
    this.scanBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.scanSelectedRow = 0;
    this.scanSelectedCol = 0;
    this.scanAnalysis = null;
    this.scanConflicts = new Set();
    this.vaultFilter = 'all';
    this.vaultSearchQuery = '';
    this.historyFilter = 'all';
    this.hofActiveTab = 'all';
    this.hofActiveDiff = 'all';

    this.init();
  }

  
  onLanguageChanged(lang) {
    try { this.updateStatsUI(); } catch (e) { console.error('Error updating stats UI on lang change:', e); }
    try { this.updateDuelModalPreview(); } catch (e) { console.error('Error updating duel modal on lang change:', e); }
    try { this.render(); } catch (e) { console.error('Error rendering on lang change:', e); }
    try { this.updateCompromisedUI(); } catch (e) { console.error('Error updating compromised UI on lang change:', e); }
    try { this.updateTopSudokuLinks(); } catch (e) { console.error('Error updating Top-Sudoku links on lang change:', e); }
  }

  init() {
    const gridContainer = document.getElementById('board-container');
    this.boardUI = new BoardUI(gridContainer, (r, c) => this.onCellSelected(r, c));
    this.boardUI.initDOM();
    window.i18n.applyTranslations();

    this.bindEvents();
    this.checkMigrationPayload();
    this.updateTopSudokuLinks();
    this.buildReviewGrid();
    this.updateVaultBadge();
    this.updateHistoryBadge();
    this.checkUrlChallenge();
    this.updateCompromisedUI();
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
    const params = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null;
    const origen = params ? params.get('origen') : null;
    const seedParam = params ? (params.get('semilla') || params.get('seed')) : null;
    const diffParam = params ? (params.get('nivel') || params.get('diff') || params.get('level')) : null;

    // 1. Comprobar si es un duelo con tablero personalizado (?tablero=... o ?custom=...)
    if (typeof CompetitionEngine !== 'undefined' && CompetitionEngine.getCustomChallengeFromUrl) {
      const customChallenge = CompetitionEngine.getCustomChallengeFromUrl();
      if (customChallenge) {
        const boardToPlay = customChallenge.board || (customChallenge.boardString ? SudokuEngine.parseBoardString(customChallenge.boardString) : null);
        if (boardToPlay) {
          const customSeed = customChallenge.seed || (seedParam ? parseInt(seedParam, 10) : null);
          this.startCustomGame(boardToPlay, customChallenge.name, null, customSeed);
          if (diffParam && ['facil', 'medio', 'dificil', 'endemoniado'].includes(diffParam.toLowerCase())) {
            this.selectedDifficulty = diffParam.toLowerCase();
            this.gameData.difficulty = this.selectedDifficulty;
            document.querySelectorAll('.diff-btn').forEach(btn => {
              btn.classList.toggle('active', btn.dataset.diff === this.selectedDifficulty);
            });
          }
          if (origen === 'top-sudoku' || (customChallenge.name && customChallenge.name.includes('Top-Sudoku'))) {
            const toastMsg = window.i18n ? window.i18n.t('toast_transferred_from_top_sudoku', { seed: this.currentSeed || '' }) : `¡Partida transferida desde Top-Sudoku! Semilla: ${this.currentSeed || ''}`;
            this.showToast(toastMsg, 'success');
          } else {
            const toastMsg = window.i18n ? window.i18n.t('toast_duel_loaded', { name: customChallenge.name }) : `¡Duelo cargado: ${customChallenge.name}!`;
            this.showToast(toastMsg, 'info');
          }
          this.updateTopSudokuLinks();
          return;
        }
      }
    }

    // 2. Comprobar si la URL trae código de desafío (?desafio=ARENA-...)
    const challenge = CompetitionEngine.getChallengeFromUrl();
    if (challenge) {
      const raw = localStorage.getItem('sudoku_arena_active_game_v1');
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          if (saved && saved.difficulty === challenge.difficulty && saved.seed === challenge.seed && !saved.isGameOver) {
            if (this.restoreActiveGame()) {
              this.updateTopSudokuLinks();
              return;
            }
          }
        } catch (e) {}
      }
      this.selectedDifficulty = challenge.difficulty;
      this.newGame(challenge.difficulty, challenge.seed);
      if (origen === 'top-sudoku') {
        const toastMsg = window.i18n ? window.i18n.t('toast_transferred_from_top_sudoku', { seed: challenge.seed }) : `¡Partida transferida desde Top-Sudoku! Semilla: ${challenge.seed}`;
        this.showToast(toastMsg, 'success');
      } else {
        this.showToast(window.i18n ? window.i18n.t('toast_challenge_loaded', { code: challenge.code }) : `¡Desafío cargado! Código: ${challenge.code}`, 'info');
      }
      this.updateTopSudokuLinks();
      return;
    }

    // 3. Comprobar si la URL trae semilla directa (?semilla=... o ?seed=...) sin tablero ni desafio
    if (seedParam) {
      const parsedSeed = parseInt(seedParam, 10);
      if (!isNaN(parsedSeed)) {
        const diff = (diffParam && ['facil', 'medio', 'dificil', 'endemoniado'].includes(diffParam.toLowerCase()))
          ? diffParam.toLowerCase()
          : this.selectedDifficulty;
        this.selectedDifficulty = diff;
        this.newGame(diff, parsedSeed);
        if (origen === 'top-sudoku') {
          const toastMsg = window.i18n ? window.i18n.t('toast_transferred_from_top_sudoku', { seed: parsedSeed }) : `¡Partida transferida desde Top-Sudoku! Semilla: ${parsedSeed}`;
          this.showToast(toastMsg, 'success');
        } else {
          this.showToast(window.i18n ? window.i18n.t('toast_seed_loaded', { seed: parsedSeed }) : `¡Semilla cargada: ${parsedSeed}!`, 'info');
        }
        this.updateTopSudokuLinks();
        return;
      }
    }

    // 4. Sin parámetro en URL: reanudar partida activa previa si existe
    if (!this.restoreActiveGame()) {
      this.newGame('medio');
    }
    this.updateTopSudokuLinks();
  }

  /**
   * Inicia una partida basada en un tablero personalizado (OCR, planteado a mano o bóveda)
   */
  startCustomGame(board, name = 'Reto Personalizado', vaultId = null, customSeed = null) {
    this.stopTimer();
    this.isGameOver = false;
    this.isWeeklyMode = false;
    this.weeklyDiff = null;
    this.timerSeconds = 0;

    // Generar puzle y auditoría cognitiva humana desde el tablero personalizado
    this.gameData = SudokuEngine.createGameFromCustomBoard(board, name, customSeed);
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
    if (codeElem) {
      if (this.currentSeed) {
        const diffPrefixMap = { facil: 'FACI', medio: 'MEDI', dificil: 'DIFI', endemoniado: 'ENDE' };
        const diffCode = diffPrefixMap[this.selectedDifficulty] || 'MEDI';
        codeElem.textContent = `ARENA-${diffCode}-${this.currentSeed}`;
      } else {
        codeElem.textContent = 'CUSTOM';
      }
    }

    this.saveActiveGame();
    this.updateTopSudokuLinks();
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
    this.updateTopSudokuLinks();

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
      this.markCurrentPuzzleCompromised();
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
      this.updateCompromisedUI();
      this.checkVictoryCondition();
      this.showToast(window.i18n ? window.i18n.t('toast_autosolve_done') : 'Partida resuelta por la máquina', 'warning');
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
    this.showToast(window.i18n ? window.i18n.t('toast_weekly_started', { diff: diff.toUpperCase(), week: info.weekId }) : `🏆 ¡Iniciado Reto Semanal ${diff.toUpperCase()} (${info.weekId})!`, 'success');
  }

  openCompetitionModal() {
    this.openNewDuelModal(this.selectedDifficulty);
  }

  getPuzzleFingerprint() {
    if (!this.gameData) return null;
    if (this.gameData.isCustom) {
      return `custom_${this.gameData.boardString || this.gameData.vaultId || 'puzzle'}`;
    }
    const diff = this.selectedDifficulty || 'medio';
    const seed = this.currentSeed || 0;
    return `standard_${diff}_${seed}`;
  }

  getCompromisedPuzzles() {
    try {
      const data = localStorage.getItem('sudoku_arena_compromised_puzzles_v1');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  markCurrentPuzzleCompromised() {
    const key = this.getPuzzleFingerprint();
    if (!key) return;
    try {
      const list = this.getCompromisedPuzzles();
      if (!list.includes(key)) {
        list.push(key);
        if (list.length > 250) list.shift();
        localStorage.setItem('sudoku_arena_compromised_puzzles_v1', JSON.stringify(list));
      }
    } catch (e) {}
  }

  isCurrentPuzzleCompromised() {
    const key = this.getPuzzleFingerprint();
    if (!key) return false;
    const list = this.getCompromisedPuzzles();
    return list.includes(key);
  }

  updateCompromisedUI() {
    const banner = document.getElementById('board-compromised-banner');
    if (!banner) return;
    const isComp = this.isCurrentPuzzleCompromised() || Boolean(this.scoring?.isAutoSolved);
    if (isComp) {
      banner.classList.remove('hidden');
      const textElem = document.getElementById('board-compromised-banner-text');
      if (textElem && window.i18n) {
        textElem.textContent = window.i18n.t('banner_practice_revealed');
      }
    } else {
      banner.classList.add('hidden');
    }
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

    const isSystemSolved = Boolean(this.scoring?.isAutoSolved);
    const isCompromised = this.isCurrentPuzzleCompromised();

    let recordResult = null;

    if (!isSystemSolved && !isCompromised) {
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

      // Registrar la partida completada en el Historial y Récords
      if (this.history) {
        const summary = this.scoring.getSummary();
        recordResult = this.history.addRecord({
          difficulty: this.selectedDifficulty,
          mode: this.isWeeklyMode ? 'weekly' : (this.gameData?.isCustom ? 'custom' : 'standard'),
          seed: this.currentSeed,
          score: summary.currentScore,
          maxTheoreticalScore: summary.initialTotalPoints,
          autonomyIndex: summary.autonomyIndex,
          rank: summary.rank,
          rankKey: summary.rankKey,
          rankColor: summary.rankColor,
          timeSeconds: this.timerSeconds,
          peeksCount: (summary.peeksCount !== undefined ? summary.peeksCount : ((summary.peeksCellCount || 0) + (summary.peeksAllCount || 0))),
          peeksCellCount: summary.peeksCellCount || 0,
          peeksAllCount: summary.peeksAllCount || 0,
          errorsCount: summary.errorsCount,
          fairPlayFlag: summary.fairPlayFlag,
          customName: this.gameData?.customName || null
        });
        this.updateHistoryBadge();
      }

      window.soundFx.playVictory();
      this.triggerHaptic([50, 100, 50, 100, 150]);
    } else {
      // Rendición o solución copiada tras haber sido desvelada previamente por el sistema
      window.soundFx.playError();
      this.triggerHaptic([100, 100]);
    }

    const summary = this.scoring.getSummary();

    // Evento analítico de finalización de partida (solo legítimas)
    if (!isSystemSolved && !isCompromised && typeof window !== 'undefined' && typeof window.gtag === 'function') {
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

    const titleElem = document.getElementById('verdict-title');
    const iconElem = document.querySelector('#modal-gameover .modal-body > div:first-child');
    const rankElem = document.getElementById('verdict-rank');
    const compBanner = document.getElementById('verdict-compromised-banner');
    const compTitle = document.getElementById('verdict-compromised-title');
    const compDesc = document.getElementById('verdict-compromised-desc');
    const compIcon = document.getElementById('verdict-compromised-icon');
    const historyBtn = document.getElementById('btn-verdict-view-history');
    const shareBtn = document.getElementById('btn-share-verdict');

    if (isSystemSolved) {
      if (titleElem) titleElem.textContent = window.i18n ? window.i18n.t('verdict_autosolve_title') : 'Partida Resuelta por el Sistema';
      if (iconElem) iconElem.textContent = '🤖';
      if (rankElem) {
        rankElem.textContent = window.i18n ? window.i18n.t('verdict_autosolve_rank') : 'Sin Rango (Resolución Automática)';
        rankElem.style.color = '#94a3b8';
      }
      if (compBanner) {
        compBanner.classList.remove('hidden');
        if (compIcon) compIcon.textContent = '🤖';
        if (compTitle) compTitle.textContent = window.i18n ? window.i18n.t('verdict_compromised_banner_title') : 'Solución Desvelada por el Sistema';
        if (compDesc) compDesc.textContent = window.i18n ? window.i18n.t('verdict_compromised_banner_desc') : 'La máquina completó el tablero. No computa para Récords ni Duelos.';
      }
    } else if (isCompromised) {
      if (titleElem) titleElem.textContent = window.i18n ? window.i18n.t('verdict_practice_title') : '¡Tablero Completado (Modo Práctica)!';
      if (iconElem) iconElem.textContent = '⚠️';
      if (rankElem) {
        const baseRank = (window.i18n && summary.rankKey) ? window.i18n.t(summary.rankKey) : summary.rank;
        const pTag = window.i18n ? window.i18n.t("practice_tag") : "Modo Práctica";
        rankElem.textContent = `${baseRank} [${pTag}]`;
        rankElem.style.color = '#f59e0b';
      }
      if (compBanner) {
        compBanner.classList.remove('hidden');
        if (compIcon) compIcon.textContent = '⚠️';
        if (compTitle) compTitle.textContent = window.i18n ? window.i18n.t('verdict_compromised_banner_title') : 'Solución Previamente Desvelada';
        if (compDesc) compDesc.textContent = window.i18n ? window.i18n.t('verdict_compromised_banner_desc') : 'Este tablero fue resuelto por la máquina anteriormente. No computa para Récords ni Duelos.';
      }
    } else {
      if (titleElem) titleElem.textContent = window.i18n ? window.i18n.t('verdict_title') : '¡Sudoku Completado!';
      if (iconElem) iconElem.textContent = '🏅';
      if (rankElem) {
        rankElem.textContent = (window.i18n && summary.rankKey) ? window.i18n.t(summary.rankKey) : summary.rank;
        rankElem.style.color = summary.rankColor;
      }
      if (compBanner) compBanner.classList.add('hidden');
    }

    document.getElementById('verdict-score').textContent = `${summary.currentScore} pts`;
    document.getElementById('verdict-max-theoretical').textContent = `${summary.initialTotalPoints} pts`;
    document.getElementById('verdict-autonomy').textContent = `${summary.autonomyIndex}%`;
    document.getElementById('verdict-autonomy').style.color = isSystemSolved ? '#94a3b8' : summary.rankColor;
    document.getElementById('verdict-time').textContent = this.formatTime(this.timerSeconds);
    document.getElementById('verdict-penalties').textContent = `-${summary.totalPenalties} pts`;
    document.getElementById('verdict-peeks').textContent = summary.peeksCount;
    document.getElementById('verdict-errors').textContent = summary.errorsCount;

    // Distintivo de Nuevo Récord Personal (solo legítimas)
    const recordPill = document.getElementById('verdict-new-record-badge');
    if (recordPill) {
      if (!isSystemSolved && !isCompromised && recordResult && (recordResult.isNewBestScore || recordResult.isNewBestTime)) {
        recordPill.classList.remove('hidden');
        if (recordResult.isNewBestScore && recordResult.isNewBestTime) {
          recordPill.innerHTML = `<span>🔥</span> <span>${window.i18n ? window.i18n.t('verdict_new_record') : '¡Nuevo Récord Personal!'} (${recordResult.record.score} pts · ${this.formatTime(this.timerSeconds)})</span>`;
        } else if (recordResult.isNewBestScore) {
          recordPill.innerHTML = `<span>🔥</span> <span>${window.i18n ? window.i18n.t('verdict_new_record') : '¡Nuevo Récord de Puntuación!'} (${recordResult.record.score} pts)</span>`;
        } else {
          recordPill.innerHTML = `<span>⚡</span> <span>${window.i18n ? window.i18n.t('verdict_new_record') : '¡Nuevo Récord de Tiempo!'} (${this.formatTime(this.timerSeconds)})</span>`;
        }
      } else {
        recordPill.classList.add('hidden');
      }
    }

    if (historyBtn) {
      historyBtn.style.display = (isSystemSolved || isCompromised) ? 'none' : 'flex';
    }

    if (shareBtn) {
      if (isSystemSolved || isCompromised) {
        shareBtn.disabled = true;
        shareBtn.style.opacity = '0.5';
        shareBtn.style.cursor = 'not-allowed';
        const msgKey = isSystemSolved ? 'verdict_duel_blocked_autosolve' : 'verdict_duel_blocked_compromised';
        shareBtn.innerHTML = `<span>${window.i18n ? window.i18n.t(msgKey) : '⚠️ Duelo Deshabilitado (Solución Revelada)'}</span>`;
        shareBtn.onclick = () => {
          this.showToast(window.i18n ? window.i18n.t('toast_duel_blocked_revealed') : 'No se puede crear un duelo de un tablero cuya solución ya fue visualizada', 'warning');
        };
      } else {
        shareBtn.disabled = false;
        shareBtn.style.opacity = '1';
        shareBtn.style.cursor = 'pointer';
        shareBtn.innerHTML = `<span>${window.i18n ? window.i18n.t('verdict_share') : '📋 Copiar Resultado y Código de Desafío para Retar'}</span>`;
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
              this.showToast(window.i18n ? window.i18n.t('toast_result_copied') : '¡Resultado copiado para compartir!', 'success');
            });
          } else {
            prompt(window.i18n ? window.i18n.t('prompt_copy_result') : 'Copia tu resultado para retar a tus amigos:', text);
          }
        };
      }
    }

    // Distintivo o invitación de desbloqueo del Salón de la Fama si cumple requisitos (3+ victorias GM y sin registrar)
    const hofUnlockBtn = document.getElementById('btn-verdict-hof-unlock');
    if (hofUnlockBtn) {
      const historyList = this.history ? this.history.getAll() : [];
      const certified = window.hallOfFameEngine ? window.hallOfFameEngine.getCertifiedVictories(historyList) : [];
      const profile = window.hallOfFameEngine ? window.hallOfFameEngine.getPlayerProfile() : null;

      if (!isSystemSolved && !isCompromised && certified.length >= 3 && (!profile || !profile.name)) {
        hofUnlockBtn.classList.remove('hidden');
        hofUnlockBtn.style.display = 'flex';
      } else {
        hofUnlockBtn.classList.add('hidden');
        hofUnlockBtn.style.display = 'none';
      }
    }

    setTimeout(() => {
      this.openModal('modal-gameover');
    }, 450);

    return true;
  }

  /**
   * Actualiza los marcadores y tarjetas de estadísticas tanto en escritorio como en el HUD móvil
   */
  
  getRankBadge(autonomy) {
    if (!window.i18n) return 'Gran Maestro Puro';
    if (autonomy >= 90) return window.i18n.t('rank_grandmaster');
    if (autonomy >= 80) return window.i18n.t('rank_surgical_logician');
    if (autonomy >= 50) return window.i18n.t('rank_pragmatic_solver');
    return window.i18n.t('rank_training_wheels');
  }

  updateStatsUI() {
    this.updateCompromisedUI();
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
      this.showToast(window.i18n ? window.i18n.t('toast_ocr_unavailable') : 'Módulo OCR no disponible', 'error');
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
      this.showToast(window.i18n ? window.i18n.t('toast_string_invalid') : 'Cadena inválida. Debe tener 81 caracteres numéricos o puntos.', 'error');
      return;
    }
    this.scanBoard = parsed;
    this.renderReviewGrid();
    this.validateScanBoard();
    this.showToast(window.i18n ? window.i18n.t('toast_string_loaded') : '¡Cadena cargada en la cuadrícula de verificación!', 'success');
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
          this.showToast(window.i18n ? window.i18n.t('toast_vault_deleted') : 'Sudoku eliminado de la bóveda', 'info');
        }
      });

      container.appendChild(card);
    });
  }

  updateVaultBadge() {
    if (!this.vault) return;
    const badge = document.getElementById('vault-badge-count');
    const moreVaultBadge = document.getElementById('more-vault-badge-count');
    if (!badge) return;
    const count = this.vault.getAll().length;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
    if (moreVaultBadge) {
      if (count > 0) {
        moreVaultBadge.textContent = count;
        moreVaultBadge.classList.remove('hidden');
      } else {
        moreVaultBadge.classList.add('hidden');
      }
    }
  }

  updateHistoryBadge() {
    if (!this.history) return;
    const badge = document.getElementById('history-badge-count');
    const moreHistBadge = document.getElementById('more-history-badge-count');
    if (!badge) return;
    const count = this.history.getAll().length;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  openHallOfFameModal() {
    this.openModal('modal-hall-of-fame');
    this.renderHallOfFame();

    const historyList = this.history ? this.history.getAll() : [];

    // Sincronizar en segundo plano con la base de datos central de Club del Ingenio
    if (window.hallOfFameEngine && window.hallOfFameEngine.syncWithServer) {
      window.hallOfFameEngine.syncWithServer(historyList).then(updated => {
        if (updated) {
          this.renderHallOfFame();
        }
      });
    }
    const certified = window.hallOfFameEngine ? window.hallOfFameEngine.getCertifiedVictories(historyList) : [];
    const profile = window.hallOfFameEngine ? window.hallOfFameEngine.getPlayerProfile() : null;

    if (certified.length >= 3 && (!profile || !profile.name)) {
      setTimeout(() => {
        const regCard = document.getElementById('hof-registration-card');
        if (regCard) {
          regCard.classList.remove('hidden');
          regCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const nameInput = document.getElementById('hof-input-name');
          if (nameInput) {
            nameInput.focus();
          }
        }
        this.showToast(
          window.i18n ? window.i18n.t('hof_reg_welcome_toast') : '🎖️ ¡Cumples los requisitos para inscribirte en el Salón de la Fama! Completa tu ficha a continuación.',
          'info'
        );
      }, 250);
    }
  }

  renderHallOfFame() {
    if (!window.hallOfFameEngine) return;

    const historyList = this.history ? this.history.getAll() : [];
    const certified = window.hallOfFameEngine.getCertifiedVictories(historyList);
    const count = certified.length;

    // Actualizar progreso hacia el Salón de la Fama
    const countBadge = document.getElementById('hof-master-count-badge');
    if (countBadge) {
      countBadge.textContent = count + ' / 3';
      if (count >= 3) {
        countBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        countBadge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        countBadge.style.color = '#34d399';
      }
    }

    const progressFill = document.getElementById('hof-progress-bar-fill');
    if (progressFill) {
      progressFill.style.width = Math.min(100, Math.round((count / 3) * 100)) + '%';
    }

    const progressText = document.getElementById('hof-status-progress-text');
    if (progressText) {
      if (count >= 3) {
        progressText.textContent = window.i18n ? window.i18n.t('hof_status_unlocked') : '¡Has alcanzado la maestría consistente! Tienes acceso para inscribir tu récord en el Salón de la Fama.';
        progressText.style.color = '#34d399';
      } else {
        const remaining = 3 - count;
        progressText.textContent = window.i18n ? 
          (window.i18n.t('hof_status_desc') + ' (Te faltan ' + remaining + ' partida' + (remaining > 1 ? 's' : '') + ').') : 
          ('Se requieren al menos 3 victorias como Gran Maestro Puro (≥ 90% autonomía y 0 ayudas). (Te faltan ' + remaining + ' partida' + (remaining > 1 ? 's' : '') + ').');
        progressText.style.color = 'var(--text-muted)';
      }
    }

    // Gestionar tarjeta de inscripción y ficha de maestro
    const profile = window.hallOfFameEngine.getPlayerProfile();
    const regCard = document.getElementById('hof-registration-card');
    const enrolledCard = document.getElementById('hof-enrolled-card');
    const reopenBtn = document.getElementById('btn-hof-reopen-register');

    if (count >= 3) {
      if (!profile || !profile.name) {
        // Mostrar tarjeta de solicitud de inscripción
        if (regCard) {
          regCard.classList.remove('hidden');
          const subEl = document.getElementById('hof-reg-subtitle');
          if (subEl) {
            subEl.textContent = window.i18n ? 
              window.i18n.t('hof_reg_desc', { count }) : 
              ('Cumples con mérito propio los requisitos oficiales (' + count + ' victorias de Gran Maestro Puro). ¿Deseas inscribirte en el Salón de la Fama?');
          }
        }
        if (reopenBtn) reopenBtn.classList.add('hidden');
        if (enrolledCard) enrolledCard.classList.add('hidden');
      } else {
        // Ya está inscrito
        if (regCard) regCard.classList.add('hidden');
        if (reopenBtn) reopenBtn.classList.add('hidden');
        if (enrolledCard) {
          enrolledCard.classList.remove('hidden');
          const detailsEl = document.getElementById('hof-enrolled-details');
          if (detailsEl) {
            const ageGroupLabel = profile.ageGroup === 'junior' ? 'Júnior (<18)' :
                                  (profile.ageGroup === 'adult' ? 'Adultos (18-49)' :
                                  (profile.ageGroup === 'senior' ? 'Senior (50-64)' : 'Leyendas (65+)'));
            detailsEl.textContent = profile.name + ' • ' + profile.city + ', ' + (profile.countryName || profile.country) + ' ' + (profile.flag || '') + ' • ' + profile.age + ' años (' + ageGroupLabel + ')';
          }
        }
      }
    } else {
      if (regCard) regCard.classList.add('hidden');
      if (reopenBtn) reopenBtn.classList.add('hidden');
      if (enrolledCard) enrolledCard.classList.add('hidden');
    }

    // Obtener maestros agrupados por categoría (Generaciones, Países, Ciudades o General)
    const groups = window.hallOfFameEngine.getGroupedMasters({
      tab: this.hofActiveTab || 'all',
      diff: this.hofActiveDiff || 'all',
      historyList
    });

    const container = document.getElementById('hof-masters-list');
    if (!container) return;

    const totalMasters = groups.reduce((acc, g) => acc + g.masters.length, 0);

    if (totalMasters === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);"><div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div><div>No hay marcas de maestros registradas para este filtro.</div></div>';
      return;
    }

    let html = '';
    groups.forEach(group => {
      if (group.title) {
        const titleText = (group.titleKey && window.i18n) ? window.i18n.t(group.titleKey) : group.title;
        const countText = group.masters.length === 1 ? '1 Maestro' : (group.masters.length + ' Maestros');
        html += '<div class="hof-group-header">' +
          '<span class="hof-group-title">' + titleText + '</span>' +
          '<span class="hof-group-count">' + countText + '</span>' +
        '</div>';
      }

      group.masters.forEach((m, idx) => {
        let rankBadge = '#' + (idx + 1);
        let podiumClass = '';
        if (idx === 0) { rankBadge = '🥇'; podiumClass = 'podium-1'; }
        else if (idx === 1) { rankBadge = '🥈'; podiumClass = 'podium-2'; }
        else if (idx === 2) { rankBadge = '🥉'; podiumClass = 'podium-3'; }

        const diffBadgeClass = m.difficulty === 'facil' ? 'badge-emerald' : 
                               (m.difficulty === 'medio' ? 'badge-amber' : 
                               (m.difficulty === 'dificil' ? 'badge-rose' : 'badge-purple'));

        const diffLabel = m.difficulty === 'facil' ? (window.i18n ? window.i18n.t('diff_facil') : 'Fácil') :
                          (m.difficulty === 'medio' ? (window.i18n ? window.i18n.t('diff_medio') : 'Medio') :
                          (m.difficulty === 'dificil' ? (window.i18n ? window.i18n.t('diff_dificil') : 'Difícil') :
                          (window.i18n ? window.i18n.t('diff_endemoniado') : 'Endemoniado')));

        const challengeBtnLabel = window.i18n ? window.i18n.t('hof_btn_challenge') : '⚔️ Desafiar';

        html += '<div class="hof-master-card ' + podiumClass + ' ' + (m.isCurrentPlayer ? 'is-player' : '') + '">' +
          '<div class="hof-master-left">' +
            '<div class="hof-master-rank">' + rankBadge + '</div>' +
            '<div class="hof-master-meta">' +
              '<div class="hof-master-name">' +
                '<span>' + (m.flag || '🌍') + '</span>' +
                '<strong>' + m.name + '</strong>' +
                (m.isCurrentPlayer ? '<span style="font-size: 0.68rem; background: #10b981; color: #fff; padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.3rem;">¡TÚ!</span>' : '') +
              '</div>' +
              '<div class="hof-master-demog">' +
                '<span>' + m.city + ', ' + (m.countryName || m.country) + '</span>' +
                '<span>•</span>' +
                '<span>' + m.age + ' años</span>' +
                '<span>•</span>' +
                '<span class="badge ' + diffBadgeClass + '" style="font-size: 0.68rem; padding: 0.05rem 0.35rem;">' + diffLabel + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="hof-master-right">' +
            '<div class="hof-master-stats">' +
              '<div class="hof-master-score">' + m.score + ' pts</div>' +
              '<div class="hof-master-time">⏱️ ' + this.formatTime(m.timeSeconds) + ' • ' + m.autonomyIndex + '% aut.</div>' +
            '</div>' +
            '<button type="button" class="hof-btn-duel" data-master-id="' + m.id + '" title="Cargar mismo tablero y semilla del maestro">' +
              challengeBtnLabel +
            '</button>' +
          '</div>' +
        '</div>';
      });
    });

    container.innerHTML = html;

    // Conectar botones de Desafiar
    const allMasters = groups.flatMap(g => g.masters);
    container.querySelectorAll('.hof-btn-duel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const masterId = e.currentTarget.getAttribute('data-master-id');
        const master = allMasters.find(item => item.id === masterId);
        if (master) {
          this.challengeMaster(master);
        }
      });
    });
  }


    challengeMaster(master) {
    this.closeModal('modal-hall-of-fame');
    this.closeModal('modal-history');

    // Iniciar tablero con misma dificultad y semilla del maestro
    this.newGame(master.difficulty, master.seed);

    const toastMsg = window.i18n ? 
      window.i18n.t('toast_master_challenge_loaded', {
        name: master.name,
        city: master.city,
        country: master.countryName || master.country,
        score: master.score,
        time: this.formatTime(master.timeSeconds)
      }) : 
      ('⚔️ ¡Desafío a Maestro cargado! Tablero de ' + master.name + ' (' + master.city + ', ' + master.country + '). Récord a batir: ' + master.score + ' pts en ' + this.formatTime(master.timeSeconds) + '.');

    this.showToast(toastMsg, 'info');
  }

  /**
   * Abre el modal de Copia de Seguridad y Traspaso Integral
   */
  openBackupModal() {
    this.openModal('modal-backup');
    this.updateBackupModalUI();
  }

  /**
   * Actualiza el resumen en vivo de la base de datos en el modal de backup
   */
  updateBackupModalUI() {
    if (!this.backupEngine) {
      this.backupEngine = (typeof window !== 'undefined' && window.BackupEngine) ? new window.BackupEngine({
        historyStorage: this.history,
        vaultStorage: this.vault,
        hallOfFame: window.hallOfFameEngine,
        weeklyEngine: window.weeklyEngine
      }) : null;
    }
    if (!this.backupEngine) return;

    const summary = this.backupEngine.getStatsSummary();

    const histEl = document.getElementById('backup-stat-history');
    if (histEl) histEl.textContent = summary.historyCount;

    const vaultEl = document.getElementById('backup-stat-vault');
    if (vaultEl) vaultEl.textContent = summary.vaultCount;

    const weeklyEl = document.getElementById('backup-stat-weekly');
    if (weeklyEl) weeklyEl.textContent = summary.weeklyCount;

    const profileEl = document.getElementById('backup-stat-profile');
    if (profileEl) {
      if (summary.hasMasterProfile) {
        profileEl.textContent = summary.profileName;
        profileEl.title = `${summary.profileName} (${summary.profileCountry}, ${summary.profileCity})`;
      } else {
        profileEl.textContent = '—';
        profileEl.title = '';
      }
    }

    const shareBtn = document.getElementById('btn-backup-share');
    if (shareBtn) {
      if (typeof navigator !== 'undefined' && navigator.share) {
        shareBtn.style.display = 'inline-flex';
      } else {
        shareBtn.style.display = 'none';
      }
    }
  }

  /**
   * Ejecuta la exportación completa (descarga directa o menú de compartir nativo en móvil)
   */
  async handleBackupExport(useShare = false) {
    if (!this.backupEngine) {
      this.updateBackupModalUI();
    }
    if (!this.backupEngine) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `sudoku-arena-backup-${dateStr}.json`;
    const jsonStr = this.backupEngine.exportUnifiedJson();

    if (useShare && typeof navigator !== 'undefined' && navigator.share) {
      const res = await this.backupEngine.shareOrDownload(jsonStr, filename);
      if (res.success && res.method === 'share') {
        const msg = window.i18n ? window.i18n.t('toast_backup_exported') : 'Copia de seguridad lista para compartir';
        this.showToast(msg, 'success');
        return;
      }
      if (res.cancelled) {
        return;
      }
    }

    this.backupEngine.downloadFile(jsonStr, filename);
    const msg = window.i18n ? window.i18n.t('toast_backup_exported') : 'Copia de seguridad descargada';
    this.showToast(msg, 'success');
  }

  openHistoryModal() {

    this.openModal('modal-history');
    this.renderHistoryItems();
  }

  renderHistoryItems() {
    const container = document.getElementById('history-items-list');
    if (!container || !this.history) return;

    // 0. Actualizar banner hacia el Salón de la Fama según estatus
    const hofBanner = document.getElementById('btn-history-open-hof');
    if (hofBanner && window.hallOfFameEngine) {
      const historyList = this.history ? this.history.getAll() : [];
      const certified = window.hallOfFameEngine.getCertifiedVictories(historyList);
      const profile = window.hallOfFameEngine.getPlayerProfile();

      const titleEl = hofBanner.querySelector('.hof-entry-banner-title');
      const subEl = hofBanner.querySelector('.hof-entry-banner-sub');
      const btnEl = hofBanner.querySelector('.hof-entry-banner-btn');

      if (certified.length >= 3 && (!profile || !profile.name)) {
        hofBanner.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(30, 41, 59, 0.95))';
        hofBanner.style.borderColor = '#f59e0b';
        hofBanner.style.boxShadow = '0 0 18px rgba(245, 158, 11, 0.35)';
        hofBanner.style.cursor = 'pointer';
        if (titleEl) titleEl.innerHTML = `👑 <strong style="color: #fbbf24;">¡Has alcanzado la Maestría! (${certified.length}/3 victorias)</strong>`;
        if (subEl) subEl.textContent = 'Cumples los requisitos oficiales. ¡Inscríbete ahora en el Salón de la Fama!';
        if (btnEl) {
          btnEl.innerHTML = '🎖️ Inscribirme en el Salón de la Fama';
          btnEl.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
          btnEl.style.color = '#000';
          btnEl.style.fontWeight = '800';
        }
      } else if (certified.length >= 3 && profile && profile.name) {
        if (titleEl) titleEl.innerHTML = `🌟 <strong>Salón de la Fama Global</strong> (Inscrito: ${profile.name})`;
        if (subEl) subEl.textContent = `Consulta tu posición oficial y reta a los Maestros mundiales.`;
        if (btnEl) btnEl.innerHTML = '🏛️ Ver Salón de la Fama';
      }
    }

    const stats = this.history.getStats();

    // 1. Estadísticas Globales
    const totalElem = document.getElementById('hist-stat-total');
    if (totalElem) totalElem.textContent = stats.totalGames;

    const bestScoreElem = document.getElementById('hist-stat-best-score');
    if (bestScoreElem) bestScoreElem.textContent = stats.globalBestScore > 0 ? `${stats.globalBestScore} pts` : '0 pts';

    const bestTimeElem = document.getElementById('hist-stat-best-time');
    if (bestTimeElem) bestTimeElem.textContent = stats.globalBestTime > 0 ? this.formatTime(stats.globalBestTime) : '--:--';

    const avgAutonomyElem = document.getElementById('hist-stat-avg-autonomy');
    if (avgAutonomyElem) avgAutonomyElem.textContent = `${stats.avgAutonomy}%`;

    // 2. Resumen por Dificultad
    const diffs = ['facil', 'medio', 'dificil', 'endemoniado'];
    diffs.forEach(d => {
      const dStats = stats.diffStats[d];
      const countEl = document.getElementById(`hist-diff-count-${d}`);
      const scoreEl = document.getElementById(`hist-diff-score-${d}`);
      const timeEl = document.getElementById(`hist-diff-time-${d}`);

      if (countEl) countEl.textContent = `${dStats.count}`;
      if (scoreEl) scoreEl.textContent = dStats.bestScore > 0 ? `${dStats.bestScore} pts` : '-- pts';
      if (timeEl) timeEl.textContent = dStats.bestTime > 0 ? `⏱️ ${this.formatTime(dStats.bestTime)}` : '--:--';
    });

    // 3. Lista de Partidas filtrada
    let items = this.history.getAll();
    if (this.historyFilter && this.historyFilter !== 'all') {
      items = items.filter(it => it.difficulty === this.historyFilter);
    }

    if (items.length === 0) {
      const emptyTitle = window.i18n ? window.i18n.t('history_empty_title') : 'Aún no tienes partidas registradas';
      const emptyDesc = window.i18n ? window.i18n.t('history_empty_desc') : 'Completa tu primer sudoku en cualquier nivel y quedará guardado aquí con tu puntuación, medalla y tiempo récord.';
      const playNowText = window.i18n ? window.i18n.t('history_btn_play_now') : 'Jugar una Partida Ahora';

      container.innerHTML = `
        <div class="vault-empty-state">
          <div class="vault-empty-icon">🏆</div>
          <h4 class="vault-empty-title">${emptyTitle}</h4>
          <p class="vault-empty-desc">${emptyDesc}</p>
          <button id="btn-history-empty-play" class="modal-btn primary">
            <span>⚡</span> ${playNowText}
          </button>
        </div>
      `;
      document.getElementById('btn-history-empty-play')?.addEventListener('click', () => {
        this.closeModal('modal-history');
        this.newGame(this.selectedDifficulty);
      });
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';

      const diffKey = `diff_${item.difficulty}`;
      const diffLabel = window.i18n ? window.i18n.t(diffKey) : item.difficulty.toUpperCase();
      const rankLabel = (window.i18n && item.rankKey && window.i18n.t(item.rankKey) !== item.rankKey) ? window.i18n.t(item.rankKey) : (item.rank || 'Gran Maestro');
      const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString(undefined, {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) : '';

      const rematchLabel = window.i18n ? window.i18n.t('history_btn_rematch') : 'Revancha';
      const duelLabel = window.i18n ? window.i18n.t('vault_btn_duel') : 'Duelo';

      // Icono según rango de honor oficial (100 / 80 / 50)
      let medalIcon = '🚸';
      if (item.rankKey === 'rank_grandmaster' || item.autonomyIndex >= 90) medalIcon = '🥇';
      else if (item.rankKey === 'rank_surgical_logician' || item.autonomyIndex >= 80) medalIcon = '🥈';
      else if (item.rankKey === 'rank_pragmatic_solver' || item.autonomyIndex >= 50) medalIcon = '🥉';

      card.innerHTML = `
        <div class="history-card-left">
          <div class="history-card-rank-badge" title="${rankLabel}">
            ${medalIcon}
          </div>
          <div class="history-card-info">
            <div class="history-card-title-row">
              <span class="history-card-diff diff-badge" style="background:${item.rankColor}22; color:${item.rankColor}; border:1px solid ${item.rankColor}55;">
                ${diffLabel}
              </span>
              <strong style="color: #f8fafc; font-size: 0.88rem;">${rankLabel}</strong>
              <span class="history-card-date">${dateStr}</span>
            </div>
            <div class="history-card-meta">
              <span class="font-bold text-gold font-mono">${item.score} pts</span>
              ${item.maxTheoreticalScore ? `<span class="text-muted font-mono" style="font-size:0.75rem;">/ ${item.maxTheoreticalScore}</span>` : ''}
              <span>&bull;</span>
              <span class="font-mono text-emerald font-bold">${item.autonomyIndex}% aut.</span>
              <span>&bull;</span>
              <span class="font-mono text-accent">⏱️ ${this.formatTime(item.timeSeconds)}</span>
              ${(item.errorsCount > 0 || item.peeksCount > 0) ? `<span class="text-muted" style="font-size:0.75rem;">(${item.peeksCount} ay. / ${item.errorsCount} fallos)</span>` : '<span class="text-muted" style="font-size:0.75rem;">(Limpio)</span>'}
            </div>
          </div>
        </div>
        <div class="history-card-actions">
          ${item.seed ? `
            <button class="vault-card-btn btn-play" data-action="rematch" title="Volver a jugar con la misma semilla">
              <span>🔄</span> ${rematchLabel}
            </button>
            <button class="vault-card-btn btn-duel" data-action="duel" title="Compartir desafío en WhatsApp">
              <span>⚔️</span> ${duelLabel}
            </button>
          ` : ''}
          <button class="vault-card-btn btn-del" data-action="delete" title="Eliminar de historial">
            🗑️
          </button>
        </div>
      `;

      card.querySelector('[data-action="rematch"]')?.addEventListener('click', () => {
        this.closeModal('modal-history');
        this.newGame(item.difficulty, item.seed);
        this.showToast(window.i18n ? window.i18n.t('toast_rematch_loaded', { diff: diffLabel, seed: item.seed }) : `Cargada revancha en ${diffLabel} (Semilla: ${item.seed})`, 'info');
      });

      card.querySelector('[data-action="duel"]')?.addEventListener('click', () => {
        const itemKey = `standard_${item.difficulty}_${item.seed}`;
        const list = this.getCompromisedPuzzles();
        if (list.includes(itemKey)) {
          this.showToast(window.i18n ? window.i18n.t('toast_duel_blocked_revealed') : 'No se puede crear un duelo de un tablero cuya solución ya fue visualizada', 'warning');
          return;
        }
        const code = CompetitionEngine.generateChallengeCode(item.difficulty, item.seed);
        const url = CompetitionEngine.getChallengeUrl(code);
        const text = `🏆 ¡He logrado ${item.score} pts (Autonomía: ${item.autonomyIndex}%) en Sudoku Arena nivel ${diffLabel}!\n⏱️ Tiempo: ${this.formatTime(item.timeSeconds)}\n⚔️ ¿Te atreves a superarme? Juega el mismo tablero aquí:\n${url}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            this.showToast(window.i18n ? window.i18n.t('toast_duel_link_copied') : '¡Enlace de Duelo copiado al portapapeles!', 'success');
          });
        }
      });

      card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        const confirmMsg = window.i18n ? window.i18n.t('history_delete_confirm') : '¿Eliminar esta partida del historial?';
        if (confirm(confirmMsg)) {
          this.history.deleteRecord(item.id);
          this.updateHistoryBadge();
          this.renderHistoryItems();
        }
      });

      container.appendChild(card);
    });
  }

  bindEvents() {
    const updateTsLink = (e) => {
      const link = e.target.closest('.link-to-top-sudoku');
      if (link) {
        this.updateTopSudokuLinks();
      }
    };
    document.addEventListener('pointerdown', updateTsLink, true);
    document.addEventListener('mousedown', updateTsLink, true);
    document.addEventListener('click', updateTsLink, true);

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
        else if (action === 'duel') {
          if (this.isCurrentPuzzleCompromised() || Boolean(this.scoring?.isAutoSolved)) {
            this.showToast(window.i18n ? window.i18n.t('toast_duel_blocked_revealed') : 'No se puede crear un duelo de un tablero cuya solución ya fue visualizada', 'warning');
            return;
          }
          this.openCompetitionModal();
        }
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
    // Botón 'Otras opciones' y sus modales
    document.getElementById('btn-open-more-options')?.addEventListener('click', () => {
      this.openModal('modal-more-options');
    });

    document.getElementById('more-opt-weekly')?.addEventListener('click', () => {
      this.closeModal('modal-more-options');
      this.openWeeklyModal();
    });

    document.getElementById('more-opt-scan')?.addEventListener('click', () => {
      this.closeModal('modal-more-options');
      this.openScanModal();
    });

    document.getElementById('more-opt-vault')?.addEventListener('click', () => {
      this.closeModal('modal-more-options');
      this.openVaultModal();
    });

    document.getElementById('more-opt-history')?.addEventListener('click', () => {
      this.closeModal('modal-more-options');
      this.openHistoryModal();
    });

    document.getElementById('more-opt-hall-of-fame')?.addEventListener('click', () => {
      this.closeModal('modal-more-options');
      this.openHallOfFameModal();
    });

    document.getElementById('more-opt-backup')?.addEventListener('click', () => {
      this.closeModal('modal-more-options');
      this.openBackupModal();
    });

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
          this.showToast(window.i18n ? window.i18n.t('toast_weekly_summary_copied') : '¡Resumen del reto semanal copiado al portapapeles!', 'success');
        });
      } else {
        prompt(window.i18n ? window.i18n.t('prompt_copy_weekly') : 'Copia tus resultados semanales:', text);
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
        this.updateTopSudokuLinks();
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
      const itemKey = `standard_${this.duelSelectedDiff}_${this.duelSelectedSeed}`;
      const list = this.getCompromisedPuzzles();
      if (list.includes(itemKey)) {
        this.showToast(window.i18n ? window.i18n.t('toast_duel_blocked_revealed') : 'No se puede crear un duelo de un tablero cuya solución ya fue visualizada', 'warning');
        return;
      }
      const code = CompetitionEngine.generateChallengeCode(this.duelSelectedDiff, this.duelSelectedSeed);
      const url = CompetitionEngine.getChallengeUrl(code);
      const msg = window.i18n.t('duel_share_msg', {
        diff: this.duelSelectedDiff.toUpperCase(),
        code: code,
        url: url
      });

      if (navigator.clipboard) {
        navigator.clipboard.writeText(msg).then(() => {
          this.showToast(window.i18n ? window.i18n.t('toast_duel_link_copied') : '¡Enlace de Duelo copiado al portapapeles!', 'success');
        }).catch(() => {
          prompt(window.i18n ? window.i18n.t('prompt_copy_duel_link') : 'Copia este enlace para retar a tu rival:', url);
        });
      } else {
        prompt(window.i18n ? window.i18n.t('prompt_copy_duel_link') : 'Copia este enlace para retar a tu rival:', url);
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

    // Click en logotipo para mostrar presentación del logo
    document.getElementById('btn-brand-logo')?.addEventListener('click', () => {
      this.openModal('modal-logo-preview');
    });

    document.getElementById('btn-logo-like')?.addEventListener('click', () => {
      window.soundFx?.playVictory();
      this.showToast(window.i18n ? window.i18n.t('logo_modal_toast') : '¡Muchas gracias! Nos alegra mucho que te guste.');
    });

    // Botones del Salón de la Fama
    document.getElementById('btn-open-hall-of-fame')?.addEventListener('click', () => this.openHallOfFameModal());
    document.getElementById('btn-history-open-hof')?.addEventListener('click', () => {
      this.closeModal('modal-history');
      this.openHallOfFameModal();
    });
    document.getElementById('btn-sidebar-hof')?.addEventListener('click', () => this.openHallOfFameModal());

    // Pestañas del Salón de la Fama
    document.querySelectorAll('#hof-tabs-bar .hof-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#hof-tabs-bar .hof-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.hofActiveTab = btn.dataset.tab;
        this.renderHallOfFame();
      });
    });

    // Píldoras de dificultad en Salón de la Fama
    document.querySelectorAll('#hof-diff-pills .vault-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#hof-diff-pills .vault-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.hofActiveDiff = btn.dataset.diff;
        this.renderHallOfFame();
      });
    });

    // Formulario de inscripción y perfil en el Salón de la Fama
    document.getElementById('btn-hof-submit-profile')?.addEventListener('click', () => {
      const nameInput = document.getElementById('hof-input-name');
      const cityInput = document.getElementById('hof-input-city');
      const ageInput = document.getElementById('hof-input-age');
      const countrySelect = document.getElementById('hof-select-country');

      const name = nameInput ? nameInput.value.trim() : '';
      const city = cityInput ? cityInput.value.trim() : '';
      const age = ageInput ? parseInt(ageInput.value, 10) : 0;
      const countryOpt = countrySelect ? countrySelect.options[countrySelect.selectedIndex] : null;
      const country = countryOpt ? countryOpt.value : 'ES';
      const countryName = countryOpt ? countryOpt.getAttribute('data-name') : 'España';
      const flag = countryOpt ? countryOpt.getAttribute('data-flag') : '🇪🇸';

      if (!name) {
        alert('Por favor introduce tu nombre o alias para el Salón de la Fama.');
        nameInput?.focus();
        return;
      }
      if (!city) {
        alert('Por favor introduce tu ciudad o localidad.');
        cityInput?.focus();
        return;
      }
      if (!age || age < 5 || age > 110) {
        alert('Por favor introduce una edad válida.');
        ageInput?.focus();
        return;
      }

      const profileData = {
        name,
        city,
        age,
        ageGroup: window.hallOfFameEngine ? window.hallOfFameEngine.getAgeGroup(age) : 'adult',
        country,
        countryName,
        flag,
        registeredAt: Date.now()
      };

      window.hallOfFameEngine.savePlayerProfile(profileData);
      
      // Enviar a la base de datos central de Club del Ingenio en segundo plano
      if (window.hallOfFameEngine.submitMasterToServer) {
        window.hallOfFameEngine.submitMasterToServer(profileData, this.history ? this.history.getAll() : []).then(sent => {
          if (sent) {
            this.renderHallOfFame();
          }
        });
      }

      if (window.soundFx) window.soundFx.playVictory();

      this.showToast(window.i18n ? window.i18n.t('hof_reg_success_toast') : '🎉 ¡Inscripción completada! Ya formas parte oficial del Salón de la Fama.', 'success');
      this.renderHallOfFame();
    });

    document.getElementById('btn-hof-dismiss-profile')?.addEventListener('click', () => {
      document.getElementById('hof-registration-card')?.classList.add('hidden');
      const reopenBtn = document.getElementById('btn-hof-reopen-register');
      if (reopenBtn) reopenBtn.classList.remove('hidden');
    });

    document.getElementById('btn-hof-reopen-register')?.addEventListener('click', () => {
      const regCard = document.getElementById('hof-registration-card');
      if (regCard) {
        regCard.classList.remove('hidden');
        regCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        document.getElementById('hof-input-name')?.focus();
      }
      document.getElementById('btn-hof-reopen-register')?.classList.add('hidden');
    });

    document.getElementById('btn-verdict-hof-unlock')?.addEventListener('click', () => {
      this.closeModal('modal-gameover');
      this.openHallOfFameModal();
    });

    document.getElementById('btn-hof-edit-profile')?.addEventListener('click', () => {
      const p = window.hallOfFameEngine.getPlayerProfile();
      if (p) {
        const nameInput = document.getElementById('hof-input-name');
        const cityInput = document.getElementById('hof-input-city');
        const ageInput = document.getElementById('hof-input-age');
        const countrySelect = document.getElementById('hof-select-country');

        if (nameInput) nameInput.value = p.name || '';
        if (cityInput) cityInput.value = p.city || '';
        if (ageInput) ageInput.value = p.age || '';
        if (countrySelect && p.country) countrySelect.value = p.country;
      }
      document.getElementById('hof-registration-card')?.classList.remove('hidden');
      document.getElementById('hof-enrolled-card')?.classList.add('hidden');
    });

    // Botones de Historial y Récords
    document.getElementById('btn-open-history-modal')?.addEventListener('click', () => this.openHistoryModal());
    document.getElementById('btn-sidebar-history')?.addEventListener('click', () => this.openHistoryModal());
    document.getElementById('btn-verdict-view-history')?.addEventListener('click', () => {
      this.closeModal('modal-gameover');
      this.openHistoryModal();
    });

    // Píldoras de filtro en modal de historial
    document.querySelectorAll('#history-filter-pills .vault-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#history-filter-pills .vault-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.historyFilter = btn.dataset.filter;
        this.renderHistoryItems();
      });
    });

    // Exportar e Importar Historial JSON
    document.getElementById('btn-history-export')?.addEventListener('click', () => {
      if (!this.history) return;
      const json = this.history.exportJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sudoku-arena-records-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast(window.i18n ? window.i18n.t('toast_backup_downloaded') : 'Copia de seguridad del historial descargada', 'success');
    });

    const histFileInput = document.getElementById('history-file-input');
    document.getElementById('btn-history-import')?.addEventListener('click', () => {
      histFileInput?.click();
    });

    histFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file || !this.history) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = this.history.importJson(evt.target.result);
        if (res.success) {
          this.updateHistoryBadge();
          this.renderHistoryItems();
          this.showToast(window.i18n ? window.i18n.t('toast_history_imported', { count: res.count }) : `¡Importadas ${res.count} partidas!`, 'success');
        } else {
          this.showToast(window.i18n ? window.i18n.t('toast_import_error') : 'Error al importar el archivo JSON', 'error');
        }
        histFileInput.value = '';
      };
      reader.readAsText(file);
    });

    // Limpiar historial
    document.getElementById('btn-history-clear')?.addEventListener('click', () => {
      if (!this.history) return;
      const confirmMsg = window.i18n ? window.i18n.t('history_confirm_clear') : '¿Seguro que deseas borrar todo el historial?';
      if (confirm(confirmMsg)) {
        this.history.clearAll();
        this.updateHistoryBadge();
        this.renderHistoryItems();
        this.showToast(window.i18n ? window.i18n.t('toast_history_cleared') : 'Historial borrado', 'info');
      }
    });

    // -------------------------------------------------------------
    // EXPORTACIÓN E IMPORTACIÓN INTEGRAL DE BASE DE DATOS (MÓVIL ↔ PC)
    // -------------------------------------------------------------
    document.getElementById('btn-backup-export')?.addEventListener('click', () => {
      this.handleBackupExport(false);
    });

    document.getElementById('btn-backup-share')?.addEventListener('click', () => {
      this.handleBackupExport(true);
    });

    const backupFileInput = document.getElementById('backup-file-input');
    document.getElementById('btn-backup-import')?.addEventListener('click', () => {
      backupFileInput?.click();
    });

    backupFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!this.backupEngine) {
        this.updateBackupModalUI();
      }
      if (!this.backupEngine) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const res = this.backupEngine.importUnifiedJson(evt.target.result);
          if (res.success) {
            this.updateHistoryBadge();
            this.updateVaultBadge();
            this.updateBackupModalUI();
            if (this.renderHistoryItems) {
              try { this.renderHistoryItems(); } catch (err) {}
            }
            if (this.renderVaultItems) {
              try { this.renderVaultItems(); } catch (err) {}
            }
            if (this.renderHallOfFame) {
              try { this.renderHallOfFame(); } catch (err) {}
            }
            const msg = window.i18n 
              ? window.i18n.t('toast_backup_imported', { history: res.historyAdded, vault: res.vaultAdded })
              : `¡Base de datos importada con éxito! (+${res.historyAdded} partidas, +${res.vaultAdded} retos)`;
            this.showToast(msg, 'success');
          } else {
            const errMsg = res.error || (window.i18n ? window.i18n.t('toast_backup_error') : 'Error al importar archivo');
            this.showToast(errMsg, 'error');
          }
        } catch (err) {
          console.error('Error importando copia de seguridad:', err);
          this.showToast(window.i18n ? window.i18n.t('toast_backup_error') : 'Error al procesar archivo', 'error');
        }
        backupFileInput.value = '';
      };
      reader.readAsText(file);
    });

    // -------------------------------------------------------------
    // EXPORTACIÓN E IMPORTACIÓN INDIVIDUAL DE BÓVEDA DE RETOS
    // -------------------------------------------------------------
    document.getElementById('btn-vault-export')?.addEventListener('click', () => {
      if (!this.vault) return;
      const json = this.vault.exportJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sudoku-arena-vault-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const msg = window.i18n ? window.i18n.t('toast_vault_exported') : 'Copia de la Bóveda descargada';
      this.showToast(msg, 'success');
    });

    const vaultFileInput = document.getElementById('vault-file-input');
    document.getElementById('btn-vault-import')?.addEventListener('click', () => {
      vaultFileInput?.click();
    });

    vaultFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file || !this.vault) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const count = this.vault.importJson(evt.target.result);
        if (count > 0) {
          this.updateVaultBadge();
          this.renderVaultItems();
          const msg = window.i18n ? window.i18n.t('toast_vault_imported', { count }) : `¡Importados ${count} sudokus a la Bóveda!`;
          this.showToast(msg, 'success');
        } else {
          this.showToast(window.i18n ? window.i18n.t('toast_import_error') : 'No se importaron nuevos sudokus o archivo inválido', 'info');
        }
        vaultFileInput.value = '';
      };
      reader.readAsText(file);
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
        this.showToast(window.i18n ? window.i18n.t('toast_paste_instructions') : 'Por favor pulsa Ctrl+V dentro de la caja de texto', 'info');
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

  /**
   * Procesa el traspaso de partidas, récords y perfil si se accede desde una redirección de migración (?traspaso=...)
   */
  checkMigrationPayload() {
    try {
      const params = new URLSearchParams(window.location.search);
      const traspaso = params.get('traspaso');
      if (!traspaso) return;

      const decoded = decodeURIComponent(atob(traspaso));
      const backupData = JSON.parse(decoded);

      if (backupData && typeof backupData === 'object') {
        let importedCount = 0;

        if (backupData.history && Array.isArray(backupData.history)) {
          backupData.history.forEach(item => {
            if (this.history && item && item.id) {
              this.history.records.set(item.id, item);
              importedCount++;
            }
          });
          this.history?.save();
        }

        if (backupData.vault && Array.isArray(backupData.vault)) {
          backupData.vault.forEach(item => {
            if (this.vault && item && item.id) {
              this.vault.challenges.set(item.id, item);
            }
          });
          this.vault?.save();
        }

        if (backupData.profile && window.hallOfFameEngine) {
          window.hallOfFameEngine.savePlayerProfile(backupData.profile);
        }

        if (backupData.weekly) {
          localStorage.setItem('sudoku_arena_weekly_history_v1', JSON.stringify(backupData.weekly));
        }

        // Limpiar parámetro de la URL sin recargar
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        setTimeout(() => {
          this.showToast('🎉 ¡Bienvenido a Club del Ingenio! Tus partidas y récords se han transferido con éxito.', 'success');
          this.updateHistoryBadge();
          this.updateVaultBadge();
        }, 800);
      }
    } catch (e) {
      console.warn('No se pudo procesar el traspaso de migración:', e);
    }
  }

  /**
   * Actualiza los enlaces hacia Top-Sudoku para reflejar el idioma en curso
   * y resolver dinámicamente entre Club del Ingenio, localhost o producción en GitHub Pages.
   */
  updateTopSudokuLinks() {
    try {
      const lang = (window.i18n?.currentLang || localStorage.getItem('sudoku_arena_lang') || 'es').toLowerCase();
      const host = window.location.hostname;
      const isClub = host.includes('clubdelingenio') || window.location.pathname.includes('/clubdelingenio/');
      const isLocal = host === 'localhost' || host === '127.0.0.1';

      let baseUrl = '../top-sudoku/';
      let clubUrl = '../clubdelingenio/';

      if (isClub) {
        baseUrl = '../top-sudoku/';
        clubUrl = '/';
      } else if (isLocal) {
        baseUrl = '/top-sudoku/';
        clubUrl = '/clubdelingenio/';
      } else if (host.endsWith('.test')) {
        baseUrl = 'http://top-sudoku.test/';
        clubUrl = 'http://clubdelingenio.test/';
      } else {
        baseUrl = 'https://guitusol.github.io/top-sudoku/';
        clubUrl = 'https://clubdelingenio.com';
      }

      const clubBtn = document.getElementById('btn-header-club');
      if (clubBtn) clubBtn.href = clubUrl;

      const seed = this.currentSeed || '';
      const diff = this.selectedDifficulty || 'medio';
      let boardStr = '';
      if (this.gameData && this.gameData.board && typeof SudokuEngine !== 'undefined') {
        boardStr = SudokuEngine.boardToString(this.gameData.board);
      }

      const params = new URLSearchParams();
      params.set('lang', lang);
      if (seed) params.set('semilla', seed);
      if (diff) params.set('nivel', diff);
      if (boardStr && boardStr.length === 81) params.set('tablero', boardStr);
      params.set('origen', 'sudoku-arena');

      const targetUrl = `${baseUrl}?${params.toString()}`;
      document.querySelectorAll('.link-to-top-sudoku').forEach(el => {
        el.href = targetUrl;
      });
    } catch (e) {
      console.warn('Error al actualizar enlaces a Top-Sudoku:', e);
    }
  }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.sudokuApp = new SudokuApp();
});
