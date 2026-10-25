/**
 * HallOfFameEngine - Motor de Salón de la Fama Global y Registro de Maestros (Zero-Login)
 * Gestiona el Cuadro de Honor mundial de Sudoku Arena, permitiendo consulta 100% pública
 * para todos los jugadores, clasificaciones segmentadas (países, ciudades y generaciones),
 * verificación de consistencia (mínimo 3 victorias de Gran Maestro Puro) y dinámicas
 * de reto cruzado ('Desafiar al Maestro' con su misma semilla y tablero).
 */

class HallOfFameEngine {
  constructor() {
    this.PROFILE_KEY = 'sudoku_arena_player_master_profile_v1';
    this.DEFAULT_MASTERS = [
      {
        id: 'master_1',
        name: 'Guillermo Tudela',
        flag: '🇪🇸',
        country: 'ES',
        countryName: 'España',
        city: 'Madrid',
        age: 52,
        ageGroup: 'senior',
        difficulty: 'dificil',
        diffLabel: 'Difícil',
        score: 1485,
        timeSeconds: 272,
        autonomyIndex: 94,
        peeksCount: 0,
        errorsCount: 2,
        seed: 78421,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-24'
      },
      {
        id: 'master_2',
        name: 'Elena Morales',
        flag: '🇪🇸',
        country: 'ES',
        countryName: 'España',
        city: 'Valencia',
        age: 34,
        ageGroup: 'adult',
        difficulty: 'dificil',
        diffLabel: 'Difícil',
        score: 1420,
        timeSeconds: 315,
        autonomyIndex: 95,
        peeksCount: 0,
        errorsCount: 1,
        seed: 64120,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-23'
      },
      {
        id: 'master_3',
        name: 'Kenji Takahashi',
        flag: '🇯🇵',
        country: 'JP',
        countryName: 'Japón',
        city: 'Tokio',
        age: 41,
        ageGroup: 'adult',
        difficulty: 'endemoniado',
        diffLabel: 'Endemoniado',
        score: 1920,
        timeSeconds: 410,
        autonomyIndex: 93,
        peeksCount: 0,
        errorsCount: 3,
        seed: 91024,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-22'
      },
      {
        id: 'master_4',
        name: 'Marta Gómez',
        flag: '🇪🇸',
        country: 'ES',
        countryName: 'España',
        city: 'Barcelona',
        age: 71,
        ageGroup: 'legend',
        difficulty: 'dificil',
        diffLabel: 'Difícil',
        score: 1410,
        timeSeconds: 325,
        autonomyIndex: 92,
        peeksCount: 0,
        errorsCount: 2,
        seed: 45290,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-21'
      },
      {
        id: 'master_5',
        name: 'Jean-Luc Dubois',
        flag: '🇫🇷',
        country: 'FR',
        countryName: 'Francia',
        city: 'Lyon',
        age: 68,
        ageGroup: 'legend',
        difficulty: 'medio',
        diffLabel: 'Medio',
        score: 960,
        timeSeconds: 198,
        autonomyIndex: 98,
        peeksCount: 0,
        errorsCount: 1,
        seed: 33205,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-20'
      },
      {
        id: 'master_6',
        name: 'Carlos Rodríguez',
        flag: '🇦🇷',
        country: 'AR',
        countryName: 'Argentina',
        city: 'Buenos Aires',
        age: 26,
        ageGroup: 'adult',
        difficulty: 'medio',
        diffLabel: 'Medio',
        score: 945,
        timeSeconds: 215,
        autonomyIndex: 92,
        peeksCount: 0,
        errorsCount: 2,
        seed: 54109,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-19'
      },
      {
        id: 'master_7',
        name: 'Sofia Meyer',
        flag: '🇩🇪',
        country: 'DE',
        countryName: 'Alemania',
        city: 'Múnich',
        age: 17,
        ageGroup: 'junior',
        difficulty: 'medio',
        diffLabel: 'Medio',
        score: 930,
        timeSeconds: 230,
        autonomyIndex: 91,
        peeksCount: 0,
        errorsCount: 3,
        seed: 12890,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-18'
      },
      {
        id: 'master_8',
        name: 'Mateo Silva',
        flag: '🇲🇽',
        country: 'MX',
        countryName: 'México',
        city: 'Guadalajara',
        age: 58,
        ageGroup: 'senior',
        difficulty: 'dificil',
        diffLabel: 'Difícil',
        score: 1395,
        timeSeconds: 340,
        autonomyIndex: 90,
        peeksCount: 0,
        errorsCount: 3,
        seed: 83712,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-17'
      }
    ];
  }

  /**
   * Obtiene la lista de victorias certificadas como Gran Maestro Puro del jugador local
   * (Nivel Medio, Difícil o Endemoniado con autonomía >= 90%, 0 ayudas y sin advertencias)
   */
  getCertifiedVictories(historyList = []) {
    if (!Array.isArray(historyList)) return [];
    return historyList.filter(r => 
      ['medio', 'dificil', 'endemoniado'].includes(r.difficulty) &&
      (Number(r.autonomyIndex) >= 90) &&
      (Number(r.peeksCount) === 0) &&
      !r.fairPlayFlag
    );
  }

  /**
   * Comprueba si el jugador cumple el requisito de Consistencia Anti-Suerte (mínimo 3 victorias GM)
   */
  isEligibleForHallOfFame(historyList = []) {
    return this.getCertifiedVictories(historyList).length >= 3;
  }

  /**
   * Devuelve el perfil demográfico anónimo guardado para el jugador
   */
  getPlayerProfile() {
    try {
      const data = localStorage.getItem(this.PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Guarda o actualiza el perfil del jugador
   */
  savePlayerProfile(profile) {
    try {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error guardando perfil de maestro:', e);
    }
  }

  /**
   * Genera la lista completa de maestros combinando el cuadro honorífico con el récord del jugador si califica
   */
  getAllMasters(historyList = []) {
    let list = [...this.DEFAULT_MASTERS];
    const profile = this.getPlayerProfile();
    const certified = this.getCertifiedVictories(historyList);

    if (certified.length >= 3 && profile && profile.name) {
      // Obtener su mejor partida certificada (mayor puntuación, menor tiempo)
      const best = certified.slice().sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds))[0];
      if (best) {
        const playerMaster = {
          id: 'player_local_master',
          name: profile.name,
          flag: profile.flag || '🌟',
          country: profile.country || 'ES',
          countryName: profile.countryName || 'Local',
          city: profile.city || 'Tu Ciudad',
          age: Number(profile.age) || 35,
          ageGroup: this.getAgeGroup(Number(profile.age) || 35),
          difficulty: best.difficulty,
          diffLabel: best.difficulty === 'medio' ? 'Medio' : (best.difficulty === 'dificil' ? 'Difícil' : 'Endemoniado'),
          score: best.score,
          timeSeconds: best.timeSeconds,
          autonomyIndex: best.autonomyIndex,
          peeksCount: 0,
          errorsCount: best.errorsCount || 0,
          seed: best.seed || 55555,
          verified: true,
          rank: 'Gran Maestro Puro',
          isCurrentPlayer: true,
          date: new Date(best.timestamp || Date.now()).toISOString().slice(0, 10)
        };
        list.push(playerMaster);
      }
    }

    return list;
  }

  /**
   * Determina el tramo generacional según la edad
   */
  getAgeGroup(age) {
    if (age < 18) return 'junior';
    if (age <= 49) return 'adult';
    if (age <= 64) return 'senior';
    return 'legend';
  }

  /**
   * Obtiene la lista filtrada de maestros según la pestaña activa y dificultad seleccionada
   */
  getFilteredMasters({ tab = 'all', diff = 'all', historyList = [] } = {}) {
    let list = this.getAllMasters(historyList);

    // Filtro por dificultad
    if (diff && diff !== 'all') {
      list = list.filter(m => m.difficulty === diff);
    }

    // Filtro / Ordenación por pestaña
    if (tab === 'nations') {
      // Ordenado por país y mejor puntuación
      list.sort((a, b) => a.country.localeCompare(b.country) || (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
    } else if (tab === 'cities') {
      // Ordenado por ciudad y mejor puntuación
      list.sort((a, b) => a.city.localeCompare(b.city) || (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
    } else if (tab === 'generations') {
      // Ordenado por tramos generacionales
      const groupOrder = { junior: 1, adult: 2, senior: 3, legend: 4 };
      list.sort((a, b) => (groupOrder[a.ageGroup] || 9) - (groupOrder[b.ageGroup] || 9) || (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
    } else {
      // Ranking general por puntuación y tiempo
      list.sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
    }

    return list;
  }
}

window.hallOfFameEngine = new HallOfFameEngine();
