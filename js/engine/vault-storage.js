/**
 * VaultStorage - Bóveda y Biblioteca de Retos Guardados para Sudoku Arena
 * Permite archivar sudokus escaneados por foto, importados o creados manualmente.
 */

class VaultStorage {
  constructor() {
    this.STORAGE_KEY = 'sudoku_arena_vault_v1';
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const list = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : [];
    } catch (e) {
      console.error('Error al leer la bóveda de retos:', e);
      return [];
    }
  }

  saveAll(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error al persistir la bóveda de retos:', e);
    }
  }

  /**
   * Guarda un puzle en la bóveda. Soporta tanto saveBoard(board, options) como savePuzzle(options)
   */
  saveBoard(boardOrOptions, maybeOptions = {}) {
    let board;
    let options = {};

    if (Array.isArray(boardOrOptions)) {
      board = boardOrOptions;
      options = maybeOptions || {};
    } else if (boardOrOptions && typeof boardOrOptions === 'object') {
      board = boardOrOptions.board;
      options = boardOrOptions;
    }

    if (!board || !Array.isArray(board)) {
      throw new Error('Tablero no válido para guardar en bóveda');
    }

    const list = this.getAll();
    const id = `vault_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const boardString = this.boardToString(board);
    const cluesCount = board.flat().filter(x => x > 0).length;

    const puzzle = {
      id,
      name: options.name || `Reto ${(options.difficulty || 'medio').toUpperCase()} #${list.length + 1}`,
      board: board,
      boardString: boardString,
      difficulty: options.difficulty || 'medio',
      cluesCount: options.cluesCount || options.clues || cluesCount,
      clues: options.cluesCount || options.clues || cluesCount,
      initialTotalPoints: options.initialTotalPoints || 0,
      techniqueAudit: options.techniqueAudit || null,
      origin: options.origin || 'scan',
      createdAt: Date.now(),
      bestScore: 0,
      bestTime: 0,
      bestRank: null,
      timesPlayed: 0
    };

    list.unshift(puzzle);
    this.saveAll(list);
    return puzzle;
  }

  savePuzzle(options) {
    return this.saveBoard(options);
  }

  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  }

  updateStats(id, stats = {}) {
    const list = this.getAll();
    const item = list.find(p => p.id === id);
    if (!item) return;

    item.timesPlayed = (item.timesPlayed || 0) + 1;
    const score = stats.score ?? stats.bestScore ?? 0;
    const timeSeconds = stats.timeSeconds ?? stats.bestTime ?? 0;
    const rank = stats.rank ?? stats.bestRank ?? null;

    if (score > (item.bestScore || 0)) {
      item.bestScore = score;
      item.bestTime = timeSeconds;
      item.bestRank = rank;
    }
    this.saveAll(list);
  }

  updateRecord(id, score, timeSeconds, rank) {
    return this.updateStats(id, { score, timeSeconds, rank });
  }

  delete(id) {
    const list = this.getAll().filter(p => p.id !== id);
    this.saveAll(list);
    return list;
  }

  deletePuzzle(id) {
    return this.delete(id);
  }

  boardToString(board) {
    if (!board || !Array.isArray(board)) return '';
    return board.map(row => row.map(cell => cell > 0 ? cell : '0').join('')).join('');
  }

  exportJson() {
    return JSON.stringify(this.getAll(), null, 2);
  }

  importJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      let items = null;
      if (Array.isArray(data)) {
        items = data;
      } else if (data && data.vault && Array.isArray(data.vault)) {
        items = data.vault;
      } else if (data && data.data && data.data.vault && Array.isArray(data.data.vault)) {
        items = data.data.vault;
      }
      if (!items) throw new Error('Formato inválido');
      const current = this.getAll();
      const currentIds = new Set(current.map(i => i.id));
      const currentBoards = new Set(current.map(i => i.boardString || this.boardToString(i.board)).filter(Boolean));
      const newItems = items.filter(i => {
        if (!i || !i.board) return false;
        if (i.id && currentIds.has(i.id)) return false;
        const bStr = i.boardString || this.boardToString(i.board);
        if (bStr && currentBoards.has(bStr)) return false;
        return true;
      });
      const merged = [...newItems, ...current];
      this.saveAll(merged);
      return newItems.length;
    } catch (e) {
      console.error('Error al importar bóveda:', e);
      return 0;
    }
  }
}

if (typeof window !== 'undefined') {
  window.VaultStorage = VaultStorage;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VaultStorage;
}
