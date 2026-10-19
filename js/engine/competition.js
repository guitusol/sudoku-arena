/**
 * Competition Engine - Gestión de Semillas de Duelo, Códigos de Desafío y Sincronización
 * Permite que varios jugadores jueguen el mismo sudoku exacto y comparen auditorías de puntos
 */

class CompetitionEngine {
  /**
   * Genera un código de desafío legible para humanos
   * Ej: "ARENA-MEDIO-72941"
   */
  static generateChallengeCode(difficulty, seed = Math.floor(10000 + Math.random() * 90000)) {
    const diffCode = (difficulty || 'medio').toUpperCase().substring(0, 4);
    return `ARENA-${diffCode}-${seed}`;
  }

  /**
   * Decodifica un código de desafío
   */
  static parseChallengeCode(code) {
    if (!code) return null;
    const parts = code.trim().toUpperCase().split('-');
    if (parts.length < 3 || parts[0] !== 'ARENA') return null;

    const diffMap = {
      'FACI': 'facil',
      'MEDI': 'medio',
      'DIFI': 'dificil',
      'ENDE': 'endemoniado'
    };

    const diff = diffMap[parts[1]] || 'medio';
    const seed = parseInt(parts[2], 10);
    if (isNaN(seed)) return null;

    return {
      code,
      difficulty: diff,
      seed
    };
  }

  /**
   * Genera una URL de desafío compartible
   */
  static getChallengeUrl(code) {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('desafio', code);
    return url.toString();
  }

  static generateShareUrl(difficulty, seed) {
    const code = this.generateChallengeCode(difficulty, seed);
    const url = new URL(window.location.href);
    url.searchParams.set('desafio', code);
    return url.toString();
  }

  /**
   * Lee si el usuario ha entrado con un código de desafío en la URL
   */
  static getChallengeFromUrl() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('desafio');
    return this.parseChallengeCode(code);
  }

  /**
   * Genera una URL para compartir un duelo de Sudoku personalizado (escaneado o creado)
   */
  static generateCustomChallengeUrl(boardString, name = 'Reto') {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('tablero', boardString);
    if (name) url.searchParams.set('nombre', encodeURIComponent(name));
    return url.toString();
  }

  /**
   * Detecta si la URL trae un Sudoku personalizado completo en parámetros (?tablero=...81chars)
   */
  static getCustomChallengeFromUrl() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const boardStr = params.get('tablero') || params.get('board') || params.get('custom');
    if (!boardStr) return null;
    const name = params.get('nombre') ? decodeURIComponent(params.get('nombre')) : 'Reto Personalizado';
    return {
      boardString: boardStr,
      name
    };
  }

  /**
   * Crea un paquete de evento listo para enviar por WebSockets en una futura sala
   */
  static createEventPayload(playerName, summary, actionType) {
    return {
      version: '1.0',
      timestamp: Date.now(),
      player: playerName || 'Jugador 1',
      action: actionType,
      currentScore: summary.currentScore,
      currentMaxPossible: summary.currentMaxPossible,
      autonomyIndex: summary.autonomyIndex,
      rank: summary.rank,
      errorsCount: summary.errorsCount,
      peeksCount: summary.peeksCellCount + summary.peeksAllCount
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CompetitionEngine };
}
