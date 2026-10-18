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

      // Reconstruir puzzle matemáticamente con la misma semilla exacta
      this.gameData = SudokuEngine.generateGame(saved.difficulty, saved.seed);
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
      this.scoring.registerCorrectCell(r, c, num);
      this.boardUI.triggerSuccessAnimation(r, c);
      this.triggerHaptic(25);
      window.soundFx.playSuccess();
      this.render();
      this.saveActiveGame();
      this.checkVictoryCondition();
    } else {
      // Error
      this.scoring.registerError(r, c, num);
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
    return;

    const code = CompetitionEngine.generateChallengeCode(this.selectedDifficulty, this.currentSeed);
    const codeElem = document.getElementById('comp-current-code');
    if (codeElem) codeElem.textContent = code;

    const copyBtn = document.getElementById('btn-copy-challenge-url');
    copyBtn.onclick = () => {
      const url = CompetitionEngine.getChallengeUrl(code);
      navigator.clipboard.writeText(url).then(() => {
        this.showToast(window.i18n.t('toast_duel_copied'), 'success');
      }).catch(() => {
        prompt('Copia este enlace para retar a tu rival:', url);
      });
    };

    const loadBtn = document.getElementById('btn-load-custom-challenge');
    loadBtn.onclick = () => {
      const input = document.getElementById('comp-input-code').value.trim();
      const parsed = CompetitionEngine.parseChallengeCode(input);
      if (parsed) {
        this.closeModal('modal-competition');
        this.newGame(parsed.difficulty, parsed.seed);
        this.showToast(`¡Partida cargada! Reto: ${parsed.code}`, 'info');
      } else {
        this.showToast('Código de desafío no válido. Formato: ARENA-DIFI-XXXXX', 'error');
      }
    };

    this.openModal('modal-competition');
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
    window.soundFx.playVictory();
    this.triggerHaptic([50, 100, 50, 100, 150]);

    const summary = this.scoring.getSummary();

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
      const code = CompetitionEngine.generateChallengeCode(this.selectedDifficulty, this.currentSeed);
      const text = `🏆 ¡He resuelto Sudoku Arena en nivel ${this.selectedDifficulty.toUpperCase()}!\n🎯 Puntuación: ${summary.currentScore} pts (Autonomía: ${summary.autonomyIndex}% - ${summary.rank})\n⏱️ Tiempo: ${this.formatTime(this.timerSeconds)}\n⚔️ ¿Te atreves a superarme? Juega el mismo tablero con este enlace:\n${CompetitionEngine.getChallengeUrl(code)}`;

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

    document.getElementById('btn-tool-competition-sidebar')?.addEventListener('click', () => this.openCompetitionModal());

    // Auto-guardado al cerrar o recargar la ventana
    window.addEventListener('beforeunload', () => {
      this.saveActiveGame();
    });

    // Botones de selector de dificultad con confirmación si hay partida viva
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.diff;
        if (diff !== this.selectedDifficulty) {
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
