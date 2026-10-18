/**
 * WeeklyEngine - Motor de Retos Semanales Deterministas y Posicionamiento de Puntos
 * Genera plantillas oficiales idénticas para todos los jugadores del mundo cada semana.
 */

class WeeklyChallengeEngine {
  constructor() {
    this.storageKey = 'sudoku_arena_weekly_history_v1';
  }

  /**
   * Obtiene información de la semana ISO actual (Año, Número de semana 1-53, días restantes)
   */
  getCurrentWeekInfo(date = new Date()) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7; // Lunes = 0, Domingo = 6
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    const year = new Date(firstThursday).getFullYear();

    // Calcular tiempo restante hasta el próximo lunes 00:00:00
    const now = new Date(date.valueOf());
    const nextMonday = new Date(now.valueOf());
    nextMonday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);
    const diffMs = Math.max(0, nextMonday - now);

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      year,
      week: weekNumber,
      weekId: `${year}-W${String(weekNumber).padStart(2, '0')}`,
      daysLeft: days,
      hoursLeft: hours,
      minsLeft: mins,
      diffMs
    };
  }

  /**
   * Genera una semilla matemática fija y reproducible para cada nivel en una semana dada
   */
  getWeeklySeed(difficulty, year, week) {
    const diffMap = { facil: 101, medio: 202, dificil: 303, endemoniado: 404 };
    const salt = diffMap[difficulty] || 101;
    // Fórmula determinista para semilla entre 10000 y 99999
    const seed = 10000 + ((year * 41 + week * 179 + salt * 31) % 89999);
    return seed;
  }

  /**
   * Genera el código oficial del reto semanal (ej: SEM-2026W42-DIFI-84210)
   */
  getWeeklyCode(difficulty, year, week) {
    const seed = this.getWeeklySeed(difficulty, year, week);
    const diffPrefix = difficulty.substring(0, 4).toUpperCase();
    return `SEM-${year}W${String(week).padStart(2, '0')}-${diffPrefix}-${seed}`;
  }

  /**
   * Carga el historial de puntuaciones semanales del usuario
   */
  getUserHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Registra el resultado obtenido por el usuario en el reto semanal
   */
  saveWeeklyResult(difficulty, score, ceiling, autonomy, timeSec) {
    const weekInfo = this.getCurrentWeekInfo();
    const history = this.getUserHistory();

    if (!history[weekInfo.weekId]) {
      history[weekInfo.weekId] = {};
    }

    const previous = history[weekInfo.weekId][difficulty];
    const efficiency = ceiling > 0 ? Math.round((score / ceiling) * 100) : 0;

    // Guardar si es nuevo o si superó su puntuación anterior
    if (!previous || score > previous.score) {
      history[weekInfo.weekId][difficulty] = {
        score,
        ceiling,
        efficiency,
        autonomy,
        timeSec,
        tier: this.getEfficiencyTier(efficiency),
        completedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(this.storageKey, JSON.stringify(history));
      } catch (e) {}
      return true;
    }
    return false;
  }

  /**
   * Obtiene el resultado de un nivel en la semana actual
   */
  getLevelStatus(difficulty) {
    const weekInfo = this.getCurrentWeekInfo();
    const history = this.getUserHistory();
    const weekData = history[weekInfo.weekId] || {};
    return weekData[difficulty] || null;
  }

  /**
   * Baremo oficial de clasificación competitiva de puntos
   */
  getEfficiencyTier(efficiencyPct) {
    if (efficiencyPct >= 95) {
      return { id: 'diamond', name: 'Diamante / Élite', icon: '💎', color: '#38bdf8', percentile: 'Top 5%' };
    }
    if (efficiencyPct >= 85) {
      return { id: 'gold', name: 'Oro / Maestro', icon: '🥇', color: '#f59e0b', percentile: 'Top 15%' };
    }
    if (efficiencyPct >= 70) {
      return { id: 'silver', name: 'Plata / Avanzado', icon: '🥈', color: '#94a3b8', percentile: 'Top 35%' };
    }
    if (efficiencyPct >= 50) {
      return { id: 'bronze', name: 'Bronce / Competidor', icon: '🥉', color: '#d97706', percentile: 'Top 60%' };
    }
    return { id: 'participant', name: 'Participante', icon: '🎖️', color: '#64748b', percentile: 'Completado' };
  }
}

window.weeklyEngine = new WeeklyChallengeEngine();
