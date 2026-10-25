/**
 * HistoryStorage - Motor de Historial de Partidas y Récords Personales para Sudoku Arena
 * Almacena en localStorage de forma persistente y privada el historial de sudokus resueltos,
 * calculando mejores marcas personales (puntuación y tiempo) por dificultad y modo de juego.
 */

class HistoryStorage {
  constructor() {
    this.STORAGE_KEY = 'sudoku_arena_player_history_v1';
  }

  /**
   * Obtiene todas las partidas guardadas, ordenadas de más reciente a más antigua
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const list = data ? JSON.parse(data) : [];
      if (!Array.isArray(list)) return [];

      let needsSave = false;
      list.forEach(r => {
        if (r && (r.peeksCount === undefined || r.peeksCount === null || isNaN(Number(r.peeksCount)))) {
          r.peeksCount = (Number(r.peeksCellCount) || 0) + (Number(r.peeksAllCount) || 0);
          needsSave = true;
        }
      });
      if (needsSave) {
        this.saveAll(list);
      }
      return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (e) {
      console.error('Error al leer el historial de partidas:', e);
      return [];
    }
  }

  /**
   * Persiste la lista completa en localStorage
   */
  saveAll(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error al persistir el historial de partidas:', e);
    }
  }

  /**
   * Registra una partida ganada y comprueba si bate récords previos
   * @param {Object} gameData Datos de la partida ganada
   * @returns {Object} { record, isNewBestScore, isNewBestTime, previousBestScore, previousBestTime }
   */
  addRecord(gameData) {
    const list = this.getAll();
    const diff = gameData.difficulty || 'medio';
    const score = Number(gameData.score) || 0;
    const timeSeconds = Number(gameData.timeSeconds) || 0;

    // Partidas previas en esta misma dificultad
    const previousInDiff = list.filter(r => r.difficulty === diff);
    const previousBestScore = previousInDiff.reduce((max, r) => Math.max(max, r.score || 0), 0);
    const previousBestTime = previousInDiff
      .filter(r => (r.timeSeconds || 0) > 0)
      .reduce((min, r) => Math.min(min, r.timeSeconds), Infinity);

    const isNewBestScore = score > 0 && (previousInDiff.length === 0 || score > previousBestScore);
    const isNewBestTime = timeSeconds > 0 && (previousInDiff.length === 0 || timeSeconds < previousBestTime);

    const record = {
      id: `game_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      difficulty: diff,
      mode: gameData.mode || 'standard', // 'standard', 'weekly', 'custom', 'duel'
      seed: gameData.seed ?? null,
      score: score,
      maxTheoreticalScore: Number(gameData.maxTheoreticalScore) || 0,
      autonomyIndex: Number(gameData.autonomyIndex) || 0,
      rank: gameData.rank || 'Gran Maestro',
      rankKey: gameData.rankKey || 'rank_grandmaster',
      rankColor: gameData.rankColor || '#10b981',
      timeSeconds: timeSeconds,
      peeksCount: Number(gameData.peeksCount) || 0,
      errorsCount: Number(gameData.errorsCount) || 0,
      fairPlayFlag: Boolean(gameData.fairPlayFlag),
      customName: gameData.customName || null,
      isNewBestScore,
      isNewBestTime
    };

    list.unshift(record);
    this.saveAll(list);

    return {
      record,
      isNewBestScore,
      isNewBestTime,
      previousBestScore,
      previousBestTime: previousBestTime === Infinity ? null : previousBestTime
    };
  }

  /**
   * Elimina un registro individual por ID
   */
  deleteRecord(id) {
    const list = this.getAll().filter(r => r.id !== id);
    this.saveAll(list);
    return list;
  }

  /**
   * Borra todo el historial
   */
  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Error al limpiar el historial:', e);
    }
  }

  /**
   * Calcula estadísticas agregadas para el panel de Récords
   */
  getStats() {
    const list = this.getAll();
    const totalGames = list.length;

    const emptyDiffs = {
      facil: { count: 0, bestScore: 0, bestTime: 0, bestRank: null, bestRankKey: null, bestRankColor: null },
      medio: { count: 0, bestScore: 0, bestTime: 0, bestRank: null, bestRankKey: null, bestRankColor: null },
      dificil: { count: 0, bestScore: 0, bestTime: 0, bestRank: null, bestRankKey: null, bestRankColor: null },
      endemoniado: { count: 0, bestScore: 0, bestTime: 0, bestRank: null, bestRankKey: null, bestRankColor: null }
    };

    if (totalGames === 0) {
      return {
        totalGames: 0,
        globalBestScore: 0,
        globalBestTime: 0,
        avgAutonomy: 0,
        diffStats: emptyDiffs
      };
    }

    const globalBestScore = list.reduce((max, r) => Math.max(max, r.score || 0), 0);
    const validTimes = list.filter(r => (r.timeSeconds || 0) > 0);
    const globalBestTime = validTimes.length > 0 ? validTimes.reduce((min, r) => Math.min(min, r.timeSeconds), Infinity) : 0;
    const avgAutonomy = Math.round(list.reduce((acc, r) => acc + (r.autonomyIndex || 0), 0) / totalGames);

    const diffs = ['facil', 'medio', 'dificil', 'endemoniado'];
    const diffStats = { ...emptyDiffs };

    diffs.forEach(d => {
      const inDiff = list.filter(r => r.difficulty === d);
      const bScore = inDiff.reduce((max, r) => Math.max(max, r.score || 0), 0);
      const times = inDiff.filter(r => (r.timeSeconds || 0) > 0);
      const bTime = times.length > 0 ? times.reduce((min, r) => Math.min(min, r.timeSeconds), Infinity) : 0;
      
      const topRecord = inDiff.find(r => r.score === bScore);

      diffStats[d] = {
        count: inDiff.length,
        bestScore: bScore,
        bestTime: bTime === Infinity ? 0 : bTime,
        bestRank: topRecord ? topRecord.rank : null,
        bestRankKey: topRecord ? topRecord.rankKey : null,
        bestRankColor: topRecord ? topRecord.rankColor : null
      };
    });

    return {
      totalGames,
      globalBestScore,
      globalBestTime: globalBestTime === Infinity ? 0 : globalBestTime,
      avgAutonomy,
      diffStats
    };
  }

  /**
   * Exporta todo el historial en formato JSON
   */
  exportJson() {
    return JSON.stringify({
      version: 1,
      appName: 'Sudoku Arena',
      exportedAt: new Date().toISOString(),
      history: this.getAll()
    }, null, 2);
  }

  /**
   * Importa registros desde un JSON
   */
  importJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      let items = null;
      if (Array.isArray(data)) {
        items = data;
      } else if (data && data.history && Array.isArray(data.history)) {
        items = data.history;
      } else if (data && data.data && data.data.history && Array.isArray(data.data.history)) {
        items = data.data.history;
      }
      if (!items) throw new Error('Formato inválido');

      const current = this.getAll();
      const currentIds = new Set(current.map(i => i.id));
      const newItems = items.filter(i => i && i.score !== undefined && !currentIds.has(i.id));

      const merged = [...newItems, ...current].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.saveAll(merged);
      return { success: true, count: newItems.length, total: merged.length };
    } catch (e) {
      console.error('Error al importar historial:', e);
      return { success: false, error: e.message };
    }
  }
}

if (typeof window !== 'undefined') {
  window.HistoryStorage = HistoryStorage;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HistoryStorage;
}
