/**
 * BackupEngine - Motor de Respaldo Integral y Sincronización Móvil ↔ PC ↔ Tablet
 * Unifica el historial de partidas, bóveda de retos personales, récords del Salón de la Fama
 * y retos semanales en una sola estructura sin servidores (Zero-Server, 100% en cliente).
 * 
 * Permite:
 * 1. Exportar la base de datos completa a un archivo JSON unificado.
 * 2. Compartir directamente en móviles vía Web Share API (WhatsApp, Gmail, Telegram, Drive, etc.).
 * 3. Importar con Fusión Inteligente (Smart Merge): suma datos sin duplicar ni destruir lo existente.
 */

class BackupEngine {
  constructor(options = {}) {
    this.historyStorage = options.historyStorage || (typeof window !== 'undefined' && window.HistoryStorage ? new window.HistoryStorage() : null);
    this.vaultStorage = options.vaultStorage || (typeof window !== 'undefined' && window.VaultStorage ? new window.VaultStorage() : null);
    this.hallOfFame = options.hallOfFame || (typeof window !== 'undefined' && window.HallOfFameEngine ? new window.HallOfFameEngine() : null);
    this.weeklyEngine = options.weeklyEngine || (typeof window !== 'undefined' && window.WeeklyChallengeEngine ? new window.WeeklyChallengeEngine() : null);
  }

  /**
   * Obtiene un resumen cuantitativo del estado actual de la base de datos
   */
  getStatsSummary() {
    let historyCount = 0;
    try {
      if (this.historyStorage) {
        historyCount = (this.historyStorage.getAll() || []).length;
      } else {
        const raw = localStorage.getItem('sudoku_arena_player_history_v1');
        historyCount = raw ? (JSON.parse(raw) || []).length : 0;
      }
    } catch (e) {}

    let vaultCount = 0;
    try {
      if (this.vaultStorage) {
        vaultCount = (this.vaultStorage.getAll() || []).length;
      } else {
        const raw = localStorage.getItem('sudoku_arena_vault_v1');
        vaultCount = raw ? (JSON.parse(raw) || []).length : 0;
      }
    } catch (e) {}

    let weeklyCount = 0;
    try {
      let weeklyHistory = null;
      if (this.weeklyEngine) {
        weeklyHistory = this.weeklyEngine.getUserHistory();
      } else {
        const raw = localStorage.getItem('sudoku_arena_weekly_history_v1');
        weeklyHistory = raw ? JSON.parse(raw) : null;
      }
      if (weeklyHistory && typeof weeklyHistory === 'object') {
        weeklyCount = Object.keys(weeklyHistory).length;
      }
    } catch (e) {}

    let hasMasterProfile = false;
    let profileName = '';
    let profileCountry = '';
    let profileCity = '';
    try {
      let profile = null;
      if (this.hallOfFame) {
        profile = this.hallOfFame.getPlayerProfile();
      } else {
        const raw = localStorage.getItem('sudoku_arena_player_master_profile_v1');
        profile = raw ? JSON.parse(raw) : null;
      }
      if (profile && profile.name) {
        hasMasterProfile = true;
        profileName = profile.name;
        profileCountry = profile.flag ? `${profile.flag} ${profile.country || ''}`.trim() : (profile.country || '');
        profileCity = profile.city || '';
      }
    } catch (e) {}

    return {
      historyCount,
      vaultCount,
      weeklyCount,
      hasMasterProfile,
      profileName,
      profileCountry,
      profileCity
    };
  }

  /**
   * Genera el payload de datos completo
   */
  exportUnifiedData() {
    const summary = this.getStatsSummary();

    let historyList = [];
    try {
      historyList = this.historyStorage ? this.historyStorage.getAll() : JSON.parse(localStorage.getItem('sudoku_arena_player_history_v1') || '[]');
    } catch (e) {}

    let vaultList = [];
    try {
      vaultList = this.vaultStorage ? this.vaultStorage.getAll() : JSON.parse(localStorage.getItem('sudoku_arena_vault_v1') || '[]');
    } catch (e) {}

    let masterProfile = null;
    try {
      masterProfile = this.hallOfFame ? this.hallOfFame.getPlayerProfile() : JSON.parse(localStorage.getItem('sudoku_arena_player_master_profile_v1') || 'null');
    } catch (e) {}

    let weeklyHistory = {};
    try {
      weeklyHistory = this.weeklyEngine ? this.weeklyEngine.getUserHistory() : JSON.parse(localStorage.getItem('sudoku_arena_weekly_history_v1') || '{}');
    } catch (e) {}

    let compromised = [];
    try {
      compromised = JSON.parse(localStorage.getItem('sudoku_arena_compromised_puzzles_v1') || '[]');
    } catch (e) {}

    return {
      version: 1,
      type: 'sudoku_arena_unified_backup',
      appName: 'Sudoku Arena',
      exportedAt: new Date().toISOString(),
      summary: {
        historyCount: historyList.length,
        vaultCount: vaultList.length,
        weeklyCount: Object.keys(weeklyHistory || {}).length,
        hasMasterProfile: !!(masterProfile && masterProfile.name)
      },
      data: {
        history: historyList,
        vault: vaultList,
        masterProfile: masterProfile,
        weeklyHistory: weeklyHistory,
        compromisedPuzzles: compromised
      }
    };
  }

  /**
   * Exporta a cadena JSON formateada
   */
  exportUnifiedJson() {
    return JSON.stringify(this.exportUnifiedData(), null, 2);
  }

  /**
   * Descarga estándar de archivo en navegador
   */
  downloadFile(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, method: 'download' };
  }

  /**
   * Comparte vía Web Share API en móviles o descarga en PC
   */
  async shareOrDownload(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Intento con Web Share API (archivos soportados en navegadores móviles modernos)
    if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
      try {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Sudoku Arena - Copia de Seguridad',
            text: 'Copia de seguridad completa de Sudoku Arena (Récords, Bóveda y Perfil)',
            files: [file]
          });
          return { success: true, method: 'share' };
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'share', cancelled: true };
        }
        console.warn('Fallo en navigator.share con fichero, fallback a descarga directa:', err);
      }
    }

    // Fallback: Descarga clásica
    return this.downloadFile(jsonString, filename);
  }

  /**
   * Importa y fusiona inteligentemente una cadena JSON
   * Acepta:
   * - Backup unificado completo (data.history, data.vault, etc.)
   * - Backup individual de historial ({ history: [...] } o [...])
   * - Backup individual de bóveda ({ vault: [...] } o [...])
   */
  importUnifiedJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('El archivo no contiene un JSON válido');
      }

      let historyIncoming = [];
      let vaultIncoming = [];
      let profileIncoming = null;
      let weeklyIncoming = {};
      let compromisedIncoming = [];

      // Detectar formato
      if (parsed.type === 'sudoku_arena_unified_backup' && parsed.data) {
        historyIncoming = Array.isArray(parsed.data.history) ? parsed.data.history : [];
        vaultIncoming = Array.isArray(parsed.data.vault) ? parsed.data.vault : [];
        profileIncoming = parsed.data.masterProfile && typeof parsed.data.masterProfile === 'object' ? parsed.data.masterProfile : null;
        weeklyIncoming = parsed.data.weeklyHistory && typeof parsed.data.weeklyHistory === 'object' ? parsed.data.weeklyHistory : {};
        compromisedIncoming = Array.isArray(parsed.data.compromisedPuzzles) ? parsed.data.compromisedPuzzles : [];
      } else if (parsed.history && Array.isArray(parsed.history)) {
        // Formato legado exportado desde modal de historial
        historyIncoming = parsed.history;
      } else if (parsed.vault && Array.isArray(parsed.vault)) {
        // Formato de bóveda
        vaultIncoming = parsed.vault;
      } else if (Array.isArray(parsed)) {
        // Array simple: determinar si son partidas (tienen score) o sudokus (tienen board)
        if (parsed.length > 0 && parsed[0].score !== undefined) {
          historyIncoming = parsed;
        } else if (parsed.length > 0 && parsed[0].board !== undefined) {
          vaultIncoming = parsed;
        }
      }

      if (historyIncoming.length === 0 && vaultIncoming.length === 0 && !profileIncoming && Object.keys(weeklyIncoming).length === 0) {
        throw new Error('No se encontraron datos reconocibles en el archivo');
      }

      let historyAdded = 0;
      let vaultAdded = 0;
      let weeklyAdded = 0;
      let profileImported = false;

      // 1. Fusión de Historial (Smart Merge)
      if (historyIncoming.length > 0) {
        const currentHist = this.historyStorage 
          ? this.historyStorage.getAll() 
          : JSON.parse(localStorage.getItem('sudoku_arena_player_history_v1') || '[]');
        
        const existingIds = new Set(currentHist.map(h => h.id));
        const newHistItems = historyIncoming.filter(h => h && h.score !== undefined && !existingIds.has(h.id));

        if (newHistItems.length > 0) {
          const mergedHist = [...newHistItems, ...currentHist].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          if (this.historyStorage) {
            this.historyStorage.saveAll(mergedHist);
          } else {
            localStorage.setItem('sudoku_arena_player_history_v1', JSON.stringify(mergedHist));
          }
          historyAdded = newHistItems.length;
        }
      }

      // 2. Fusión de Bóveda de Retos (Smart Merge)
      if (vaultIncoming.length > 0) {
        const currentVault = this.vaultStorage 
          ? this.vaultStorage.getAll() 
          : JSON.parse(localStorage.getItem('sudoku_arena_vault_v1') || '[]');

        const existingVaultIds = new Set(currentVault.map(v => v.id));
        const existingBoardStrings = new Set(currentVault.map(v => {
          if (v.boardString) return v.boardString;
          if (Array.isArray(v.board)) return v.board.map(r => r.join('')).join('');
          return '';
        }).filter(Boolean));

        const newVaultItems = vaultIncoming.filter(v => {
          if (!v || !v.board) return false;
          if (v.id && existingVaultIds.has(v.id)) return false;
          const bStr = v.boardString || (Array.isArray(v.board) ? v.board.map(r => r.join('')).join('') : '');
          if (bStr && existingBoardStrings.has(bStr)) return false;
          return true;
        });

        if (newVaultItems.length > 0) {
          const mergedVault = [...newVaultItems, ...currentVault];
          if (this.vaultStorage) {
            this.vaultStorage.saveAll(mergedVault);
          } else {
            localStorage.setItem('sudoku_arena_vault_v1', JSON.stringify(mergedVault));
          }
          vaultAdded = newVaultItems.length;
        }
      }

      // 3. Fusión de Perfil de Maestro
      if (profileIncoming && profileIncoming.name) {
        let currentProfile = null;
        try {
          currentProfile = this.hallOfFame 
            ? this.hallOfFame.getPlayerProfile() 
            : JSON.parse(localStorage.getItem('sudoku_arena_player_master_profile_v1') || 'null');
        } catch (e) {}

        if (!currentProfile || !currentProfile.name || (profileIncoming.registeredAt && (!currentProfile.registeredAt || profileIncoming.registeredAt >= currentProfile.registeredAt))) {
          // No tenía perfil configurado o el entrante es más reciente, adoptamos el importado
          if (this.hallOfFame) {
            this.hallOfFame.savePlayerProfile(profileIncoming);
          } else {
            localStorage.setItem('sudoku_arena_player_master_profile_v1', JSON.stringify(profileIncoming));
          }
          profileImported = true;
        }
      }

      // 4. Fusión de Retos Semanales
      if (Object.keys(weeklyIncoming).length > 0) {
        let currentWeekly = {};
        try {
          currentWeekly = this.weeklyEngine 
            ? this.weeklyEngine.getUserHistory() 
            : JSON.parse(localStorage.getItem('sudoku_arena_weekly_history_v1') || '{}');
        } catch (e) {}

        let changedWeekly = false;
        for (const weekId of Object.keys(weeklyIncoming)) {
          if (!currentWeekly[weekId]) {
            currentWeekly[weekId] = weeklyIncoming[weekId];
            weeklyAdded++;
            changedWeekly = true;
          } else {
            const incomingWeek = weeklyIncoming[weekId];
            for (const diff of Object.keys(incomingWeek)) {
              const incData = incomingWeek[diff];
              const curData = currentWeekly[weekId][diff];
              if (!curData || (incData && incData.score > curData.score)) {
                currentWeekly[weekId][diff] = incData;
                changedWeekly = true;
              }
            }
          }
        }

        if (changedWeekly) {
          localStorage.setItem('sudoku_arena_weekly_history_v1', JSON.stringify(currentWeekly));
        }
      }

      // 5. Fusión de Partidas Comprometidas (Juego Limpio)
      if (compromisedIncoming.length > 0) {
        try {
          const currentComp = JSON.parse(localStorage.getItem('sudoku_arena_compromised_puzzles_v1') || '[]');
          const compSet = new Set([...currentComp, ...compromisedIncoming]);
          localStorage.setItem('sudoku_arena_compromised_puzzles_v1', JSON.stringify(Array.from(compSet)));
        } catch (e) {}
      }

      return {
        success: true,
        historyAdded,
        vaultAdded,
        weeklyAdded,
        profileImported,
        totalHistory: this.getStatsSummary().historyCount,
        totalVault: this.getStatsSummary().vaultCount
      };

    } catch (e) {
      console.error('Error al importar base de datos:', e);
      return {
        success: false,
        error: e.message || 'Error al procesar el archivo JSON'
      };
    }
  }
}

if (typeof window !== 'undefined') {
  window.BackupEngine = BackupEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackupEngine;
}
