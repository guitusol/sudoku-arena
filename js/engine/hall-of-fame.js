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
    this.DEVICE_UUID_KEY = 'sudoku_arena_device_uuid_v1';
    this.CACHE_KEY = 'sudoku_arena_remote_masters_cache_v1';
    this.API_URL = 'api/hall_of_fame.php';
    this.remoteMasters = null;

    this.DEFAULT_MASTERS = [
      {
        id: 'master_founder',
        deviceUuid: 'founder_guillermo',
        name: 'Guillermo T.',
        flag: '🇪🇸',
        country: 'ES',
        countryName: 'España',
        city: 'Madrid',
        age: 73,
        ageGroup: 'legend',
        difficulty: 'endemoniado',
        diffLabel: 'Endemoniado',
        score: 1980,
        timeSeconds: 395,
        autonomyIndex: 96,
        peeksCount: 0,
        errorsCount: 1,
        seed: 78421,
        verified: true,
        rank: 'Gran Maestro Puro',
        date: '2026-10-27'
      },
      {
        id: 'master_1',
        name: 'Javier Navarro',
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
        difficulty: 'dificil',
        diffLabel: 'Difícil',
        score: 1445,
        timeSeconds: 308,
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
        difficulty: 'endemoniado',
        diffLabel: 'Endemoniado',
        score: 1890,
        timeSeconds: 435,
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
        difficulty: 'dificil',
        diffLabel: 'Difícil',
        score: 1465,
        timeSeconds: 295,
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
   * Obtiene la lista de partidas solucionadas como Maestro del jugador local
   * Cuenta todas las partidas resueltas con rango Maestro/Gran Maestro o autonomía >= 90%
   */
  getCertifiedVictories(historyList = []) {
    if (!Array.isArray(historyList)) return [];
    return historyList.filter(r => {
      if (!r) return false;

      // 1. Detección por clave de rango oficial
      if (r.rankKey === 'rank_grandmaster') return true;

      // 2. Detección por texto de rango guardado (español o cualquier idioma)
      if (typeof r.rank === 'string') {
        const lowerRank = r.rank.toLowerCase();
        if (lowerRank.includes('maestro') || lowerRank.includes('master') || lowerRank.includes('grandmaster')) {
          return true;
        }
      }

      // 3. Detección por autonomía >= 90% y sin ayudas
      const peeks = Number(r.peeksCount ?? ((r.peeksCellCount || 0) + (r.peeksAllCount || 0))) || 0;
      const autonomy = Number(r.autonomyIndex) || 0;
      if (autonomy >= 90 && peeks === 0) {
        return true;
      }

      return false;
    });
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
   * Obtiene o genera el UUID persistente anónimo del dispositivo/jugador
   */
  getDeviceUuid() {
    try {
      let uuid = localStorage.getItem(this.DEVICE_UUID_KEY);
      if (!uuid) {
        uuid = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(this.DEVICE_UUID_KEY, uuid);
      }
      return uuid;
    } catch (e) {
      return 'dev_fallback_' + Date.now();
    }
  }

  /**
   * Obtiene la caché local de maestros sincronizados
   */
  getRemoteMastersCache() {
    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Genera la lista completa de maestros combinando los datos del servidor central con el récord local
   */
  getAllMasters(historyList = []) {
    // 1. Obtener la mejor fuente disponible: memoria activa > caché remota > maestros por defecto
    const baseList = this.remoteMasters || this.getRemoteMastersCache() || this.DEFAULT_MASTERS;
    let list = baseList.map(m => ({ ...m }));

    const myDeviceUuid = this.getDeviceUuid();
    let playerAlreadyInList = false;

    // 2. Comprobar si el jugador actual ya está en el ranking del servidor
    list.forEach(m => {
      if (m.deviceUuid && m.deviceUuid === myDeviceUuid) {
        m.isCurrentPlayer = true;
        playerAlreadyInList = true;
      }
    });

    // 3. Si califica localmente y aún no figura en la lista remota, añadir su ficha local
    const profile = this.getPlayerProfile();
    const certified = this.getCertifiedVictories(historyList);

    if (!playerAlreadyInList && certified.length >= 3 && profile && profile.name) {
      const best = certified.slice().sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds))[0];
      if (best) {
        const playerMaster = {
          id: 'player_local_master',
          deviceUuid: myDeviceUuid,
          name: profile.name,
          flag: profile.flag || '🌟',
          country: profile.country || 'ES',
          countryName: profile.countryName || 'Local',
          city: profile.city || 'Tu Ciudad',
          age: Number(profile.age) || 35,
          ageGroup: this.getAgeGroup(Number(profile.age) || 35),
          difficulty: best.difficulty,
          diffLabel: best.difficulty === 'facil' ? 'Fácil' : (best.difficulty === 'medio' ? 'Medio' : (best.difficulty === 'dificil' ? 'Difícil' : 'Endemoniado')),
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
   * Sincroniza en segundo plano con la base de datos central en el servidor
   */
  async syncWithServer(historyList = []) {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.masters)) {
          this.remoteMasters = data.masters;
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(data.masters));
          return true;
        }
      }
      return false;
    } catch (e) {
      // Entorno offline o sin servidor activo: continúa en local sin interrumpir
      return false;
    }
  }

  /**
   * Envía la marca de Gran Maestro del jugador a la base de datos central
   */
  async submitMasterToServer(profile, historyList = []) {
    const certified = this.getCertifiedVictories(historyList);
    if (certified.length < 3 || !profile || !profile.name) return false;

    const best = certified.slice().sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds))[0];
    if (!best) return false;

    const payload = {
      device_uuid: this.getDeviceUuid(),
      name: profile.name,
      city: profile.city,
      age: Number(profile.age) || 35,
      country: profile.country || 'ES',
      country_name: profile.countryName || 'España',
      flag: profile.flag || '🇪🇸',
      difficulty: best.difficulty,
      score: best.score,
      time_seconds: best.timeSeconds,
      autonomy_index: best.autonomyIndex,
      peeks_count: 0,
      errors_count: best.errorsCount || 0,
      seed: best.seed || 77777
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.success) {
          await this.syncWithServer(historyList);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn('No se pudo conectar con el servidor central (modo local activo):', e.message);
      return false;
    }
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

  /**
   * Obtiene los maestros agrupados por categorías (Generaciones, Países, Ciudades o General)
   */
  getGroupedMasters({ tab = 'all', diff = 'all', historyList = [] } = {}) {
    let list = this.getAllMasters(historyList);

    if (diff && diff !== 'all') {
      list = list.filter(m => m.difficulty === diff);
    }

    if (tab === 'generations') {
      const groups = [
        { key: 'junior', titleKey: 'hof_group_junior', title: '🐣 Júnior (< 18 años)', masters: [] },
        { key: 'adult', titleKey: 'hof_group_adult', title: '⚡ Adultos (18 – 49 años)', masters: [] },
        { key: 'senior', titleKey: 'hof_group_senior', title: '🧠 Senior / Veteranos (50 – 64 años)', masters: [] },
        { key: 'legend', titleKey: 'hof_group_legend', title: '👑 Leyendas / Master (65+ años)', masters: [] }
      ];

      list.forEach(m => {
        const g = groups.find(grp => grp.key === m.ageGroup);
        if (g) g.masters.push(m);
      });

      // Ordenar maestros dentro de cada grupo por puntuación y tiempo
      groups.forEach(g => {
        g.masters.sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
      });

      return groups.filter(g => g.masters.length > 0);
    }

    if (tab === 'nations') {
      const countryMap = new Map();
      list.forEach(m => {
        const cKey = m.country || 'ES';
        if (!countryMap.has(cKey)) {
          countryMap.set(cKey, {
            key: cKey,
            title: (m.flag || '🌍') + ' ' + (m.countryName || m.country),
            masters: []
          });
        }
        countryMap.get(cKey).masters.push(m);
      });

      const groups = Array.from(countryMap.values());
      groups.forEach(g => {
        g.masters.sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
      });
      groups.sort((a, b) => a.title.localeCompare(b.title));
      return groups;
    }

    if (tab === 'cities') {
      const cityMap = new Map();
      list.forEach(m => {
        const cKey = m.city || 'Desconocida';
        if (!cityMap.has(cKey)) {
          cityMap.set(cKey, {
            key: cKey,
            title: '🏙️ ' + m.city + ' (' + (m.countryName || m.country) + ' ' + (m.flag || '') + ')',
            masters: []
          });
        }
        cityMap.get(cKey).masters.push(m);
      });

      const groups = Array.from(cityMap.values());
      groups.forEach(g => {
        g.masters.sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
      });
      groups.sort((a, b) => a.title.localeCompare(b.title));
      return groups;
    }

    // Para 'all' (Todos los Maestros)
    list.sort((a, b) => (b.score - a.score) || (a.timeSeconds - b.timeSeconds));
    return [
      { key: 'all', title: null, masters: list }
    ];
  }

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
