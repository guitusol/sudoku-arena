/**
 * Legacy Migration Notice & Data Portability Bridge
 * Club del Ingenio — Top-Sudoku & Sudoku Arena
 * 
 * Detecta si el usuario está accediendo desde el dominio antiguo en GitHub Pages (guitusol.github.io)
 * y muestra una notificación elegante informando de la próxima extinción de la web legacy,
 * ofreciendo traslado automático en 1 clic de partidas, récords y configuración a clubdelingenio.com.
 * 
 * Si el usuario ya está en clubdelingenio.com, procesa automáticamente cualquier traspaso entrante (?traspaso=...).
 */
(function() {
  'use strict';

  const isLegacyHost = window.location.hostname.includes('github.io') || 
                       window.location.search.includes('aviso_traslado=1');
  const isTopSudoku = window.location.pathname.includes('top-sudoku');
  
  // 1. Textos multilingües en los 9 idiomas oficiales
  const I18N = {
    es: {
      badge: "⚠️ AVISO DE TRASLADO OFICIAL",
      title: "Nos hemos trasladado a clubdelingenio.com",
      sub: "Esta web en GitHub Pages está próxima a extinguirse",
      desc: "Top-Sudoku y Sudoku Arena se han integrado de forma permanente en la nueva sede oficial de <strong>Club del Ingenio</strong> (<strong>clubdelingenio.com</strong>).",
      guarantee: "🛡️ <strong>¡No perderás nada!</strong> Tus partidas, récords, trofeos y configuración se transferirán automáticamente a la nueva sede en 1 solo clic.",
      btn_migrate: "🚀 Ir a Club del Ingenio (Transferir mis datos)",
      btn_stay: "Seguir jugando aquí por ahora",
      banner_msg: "⚠️ Esta web en GitHub Pages cerrará próximamente. Se ha integrado en la sede oficial de clubdelingenio.com.",
      banner_btn: "🚀 Trasladarme ahora",
      welcome_toast: "🎉 ¡Bienvenido a Club del Ingenio! Tus partidas y configuración se han transferido con éxito.",
      packaging: "Empaquetando datos y conectando..."
    },
    en: {
      badge: "⚠️ OFFICIAL MIGRATION NOTICE",
      title: "We have moved to clubdelingenio.com",
      sub: "This website on GitHub Pages will soon be decommissioned",
      desc: "Top-Sudoku and Sudoku Arena are now permanently integrated into the official <strong>Club del Ingenio</strong> headquarters (<strong>clubdelingenio.com</strong>).",
      guarantee: "🛡️ <strong>Keep your progress!</strong> All your matches, records, trophies, and settings will be transferred 100% automatically and safely with 1 click.",
      btn_migrate: "🚀 Go to Club del Ingenio (Transfer my data)",
      btn_stay: "Continue playing here for now",
      banner_msg: "⚠️ This GitHub Pages site will close soon. Integrated into official clubdelingenio.com.",
      banner_btn: "🚀 Move now",
      welcome_toast: "🎉 Welcome to Club del Ingenio! Your games and settings were transferred successfully.",
      packaging: "Packaging data and redirecting..."
    },
    ja: {
      badge: "⚠️ 公式移転のお知らせ",
      title: "clubdelingenio.com へ完全移転しました",
      sub: "このGitHub Pages版はまもなく提供終了（閉鎖）予定です",
      desc: "Top-SudokuおよびSudoku Arenaは、公式プラットフォーム<strong>Club del Ingenio</strong>（<strong>clubdelingenio.com</strong>）へ完全統合されました。",
      guarantee: "🛡️ <strong>データは安全に引き継がれます！</strong> プレイ履歴、保存したパズル、設定データはワンクリックで100%自動的・安全に移行できます。",
      btn_migrate: "🚀 Club del Ingenioへ移動する（データを引き継ぐ）",
      btn_stay: "今回はこのままプレイする",
      banner_msg: "⚠️ 本GitHub Pages版はまもなく終了します。公式clubdelingenio.comへ移転してください。",
      banner_btn: "🚀 今すぐデータ移行",
      welcome_toast: "🎉 Club del Ingenioへようこそ！ゲームデータと設定が正常に引き継がれました。",
      packaging: "データを暗号化して転送中..."
    },
    fr: {
      badge: "⚠️ AVIS OFFICIEL DE MIGRATION",
      title: "Nous avons déménagé sur clubdelingenio.com",
      sub: "Ce site sur GitHub Pages sera bientôt fermé définitivement",
      desc: "Top-Sudoku et Sudoku Arena sont désormais intégrés de façon permanente sur le portail officiel <strong>Club del Ingenio</strong> (<strong>clubdelingenio.com</strong>).",
      guarantee: "🛡️ <strong>Conservez vos progrès !</strong> Vos parties, records et paramètres seront transférés automatiquement et en toute sécurité en un seul clic.",
      btn_migrate: "🚀 Aller sur Club del Ingenio (Transférer mes données)",
      btn_stay: "Continuer à jouer ici pour le moment",
      banner_msg: "⚠️ Ce site GitHub Pages fermera prochainement. Rendez-vous sur clubdelingenio.com.",
      banner_btn: "🚀 Migrer maintenant",
      welcome_toast: "🎉 Bienvenue sur Club del Ingenio ! Vos données ont été transférées avec succès.",
      packaging: "Préparation des données..."
    },
    de: {
      badge: "⚠️ OFFIZIELLER UMZUGSHINWEIS",
      title: "Wir sind umgezogen nach clubdelingenio.com",
      sub: "Diese GitHub Pages-Website wird in Kürze eingestellt",
      desc: "Top-Sudoku und Sudoku Arena wurden dauerhaft in die offizielle Plattform <strong>Club del Ingenio</strong> (<strong>clubdelingenio.com</strong>) integriert.",
      guarantee: "🛡️ <strong>Keine Daten gehen verloren!</strong> Alle Ihre Spiele, Rekorde und Einstellungen werden mit 1 Klick automatisch und sicher übertragen.",
      btn_migrate: "🚀 Zu Club del Ingenio wechseln (Daten mitnehmen)",
      btn_stay: "Vorerst hier weiterspielen",
      banner_msg: "⚠️ Diese GitHub Pages-Seite wird bald geschlossen. Bitte wechseln Sie zu clubdelingenio.com.",
      banner_btn: "🚀 Jetzt umziehen",
      welcome_toast: "🎉 Willkommen im Club del Ingenio! Ihre Daten wurden erfolgreich übertragen.",
      packaging: "Daten werden übertragen..."
    },
    ca: {
      badge: "⚠️ AVÍS DE TRASLLAT OFICIAL",
      title: "Ens traslladem a clubdelingenio.com",
      sub: "Aquest web a GitHub Pages està proper a extingir-se",
      desc: "Top-Sudoku i Sudoku Arena s'han integrat de manera permanent a la nova seu oficial de <strong>Club del Ingenio</strong> (<strong>clubdelingenio.com</strong>).",
      guarantee: "🛡️ <strong>No perdràs res!</strong> Totes les teves partides, rècords i configuració es transferiran de forma 100% automàtica i segura en un sol clic.",
      btn_migrate: "🚀 Anar a Club del Ingenio (Transferir les meves dades)",
      btn_stay: "Continuar jugant aquí per ara",
      banner_msg: "⚠️ Aquest web a GitHub Pages tancarà properament. S'ha integrat a clubdelingenio.com.",
      banner_btn: "🚀 Traslladar-me ara",
      welcome_toast: "🎉 Benvingut a Club del Ingenio! Les teves dades s'han transferit amb èxit.",
      packaging: "Empaquetant dades i connectant..."
    },
    va: {
      badge: "⚠️ AVÍS DE TRASLLAT OFICIAL",
      title: "Ens traslladem a clubdelingenio.com",
      sub: "Este web en GitHub Pages està pròxim a extingir-se",
      desc: "Top-Sudoku i Sudoku Arena s'han integrat de manera permanent en la nova seu oficial de <strong>Club del Ingenio</strong> (<strong>clubdelingenio.com</strong>).",
      guarantee: "🛡️ <strong>No perdràs res!</strong> Totes les teues partides, rècords i configuració es transferiran de forma 100% automàtica i segura en un sol clic.",
      btn_migrate: "🚀 Anar a Club del Ingenio (Transferir les meues dades)",
      btn_stay: "Continuar jugant ací per ara",
      banner_msg: "⚠️ Este web en GitHub Pages tancarà pròximament. S'ha integrat en clubdelingenio.com.",
      banner_btn: "🚀 Traslladar-me ara",
      welcome_toast: "🎉 Benvingut a Club del Ingenio! Les teues dades s'han transferit amb èxit.",
      packaging: "Empaquetant dades i connectant..."
    },
    eu: {
      badge: "⚠️ LEKUALDATZE OFIZIALAREN OHARRA",
      title: "clubdelingenio.com-era lekualdatu gara",
      sub: "GitHub Pages-eko webgune hau laster itxiko da",
      desc: "Top-Sudoku eta Sudoku Arena betiko integratu dira <strong>Club del Ingenio</strong>-ren egoitza ofizialean (<strong>clubdelingenio.com</strong>).",
      guarantee: "🛡️ <strong>Ez duzu ezer galduko!</strong> Zure partida, errekor eta konfigurazio guztiak %100 automatikoki eta segurtasunez transferituko dira klik bakarrean.",
      btn_migrate: "🚀 Club del Ingenio-ra joan (Nire datuak transferitu)",
      btn_stay: "Hemen jarraitu oraingoz jolasten",
      banner_msg: "⚠️ GitHub Pages-eko webgune hau laster itxiko da. clubdelingenio.com-era lekualdatu da.",
      banner_btn: "🚀 Lekualdatu orain",
      welcome_toast: "🎉 Ongi etorri Club del Ingenio-ra! Zure datuak behar bezala transferitu dira.",
      packaging: "Datuak prestatzen..."
    },
    gl: {
      badge: "⚠️ AVISO DE TRASLADO OFICIAL",
      title: "Trasladámonos a clubdelingenio.com",
      sub: "Esta web en GitHub Pages está próxima a extinguirse",
      desc: "Top-Sudoku e Sudoku Arena integráronse de forma permanente na nova sede oficial de <strong>Club del Ingenio</strong> (<strong>clubdelingenio.com</strong>).",
      guarantee: "🛡️ <strong>Non perderás nada!</strong> Todas as túas partidas, marcas e axustes transferiranse de xeito 100% automático e seguro nun só clic.",
      btn_migrate: "🚀 Ir a Club del Ingenio (Transferir os meus datos)",
      btn_stay: "Continuar xogando aquí polo de agora",
      banner_msg: "⚠️ Esta web en GitHub Pages pechará proximamente. Trasladouse a clubdelingenio.com.",
      banner_btn: "🚀 Trasladarme agora",
      welcome_toast: "🎉 Benvido a Club del Ingenio! Os teus datos transferíronse con éxito.",
      packaging: "Empaquetando datos e conectando..."
    }
  };

  // Detección del idioma activo
  function getLang() {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && I18N[urlLang]) return urlLang;

    const stored = localStorage.getItem('top_sudoku_lang') || 
                   localStorage.getItem('sudoku_arena_lang') || 
                   localStorage.getItem('club_lang');
    if (stored && I18N[stored]) return stored;

    const nav = (navigator.language || '').toLowerCase().split('-')[0];
    if (I18N[nav]) return nav;

    return 'es';
  }

  const currentLang = getLang();
  const t = I18N[currentLang] || I18N.es;

  // 2. Si estamos en clubdelingenio.com (Host Oficial): Procesar traspaso entrante
  if (!isLegacyHost) {
    handleIncomingTraspaso();
    return;
  }

  // 3. Estamos en GitHub Pages (Host Legacy): Mostrar notificación y banner
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    injectStickyBanner();

    const isDismissed = sessionStorage.getItem('club_migration_modal_dismissed') === '1';
    if (!isDismissed) {
      setTimeout(() => {
        injectModal();
      }, 700);
    }
  });

  // Empaquetar LocalStorage en Base64
  function packageData() {
    try {
      if (isTopSudoku) {
        const topData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('top_sudoku') || key.startsWith('sudoku_puzzle_'))) {
            topData[key] = localStorage.getItem(key);
          }
        }
        return btoa(encodeURIComponent(JSON.stringify(topData)));
      } else {
        const arenaData = {
          history: JSON.parse(localStorage.getItem('sudoku_arena_player_history_v1') || 'null'),
          vault: JSON.parse(localStorage.getItem('sudoku_arena_vault_v1') || 'null'),
          profile: JSON.parse(localStorage.getItem('sudoku_arena_player_master_profile_v1') || 'null'),
          weekly: JSON.parse(localStorage.getItem('sudoku_arena_weekly_history_v1') || 'null'),
          activeGame: localStorage.getItem('sudoku_arena_active_game_v1') || null,
          lang: currentLang
        };
        return btoa(encodeURIComponent(JSON.stringify(arenaData)));
      }
    } catch (e) {
      console.warn('Error empaquetando datos locales:', e);
      return '';
    }
  }

  // Ejecutar migración y redirección a clubdelingenio.com
  function doMigration() {
    const btn = document.getElementById('btn-do-migration') || document.getElementById('btn-banner-migration');
    if (btn) {
      btn.innerHTML = `<span>⏳</span> ${t.packaging}`;
      btn.style.opacity = '0.85';
      btn.disabled = true;
    }

    const payload = packageData();
    const basePath = isTopSudoku ? 'top-sudoku/' : 'sudoku-arena/';
    const targetUrl = payload 
      ? `https://clubdelingenio.com/${basePath}?traspaso=${payload}&lang=${currentLang}`
      : `https://clubdelingenio.com/${basePath}?lang=${currentLang}`;

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 400);
  }

  // Descartar modal para la sesión
  function dismissModal() {
    sessionStorage.setItem('club_migration_modal_dismissed', '1');
    const modal = document.getElementById('club-migration-modal-overlay');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s ease';
      setTimeout(() => modal.remove(), 300);
    }
  }

  // Procesar datos al llegar a clubdelingenio.com
  function handleIncomingTraspaso() {
    try {
      const params = new URLSearchParams(window.location.search);
      const traspaso = params.get('traspaso');
      if (!traspaso) return;

      const decoded = decodeURIComponent(atob(traspaso));
      const data = JSON.parse(decoded);

      if (data && typeof data === 'object') {
        if (isTopSudoku) {
          Object.keys(data).forEach(k => {
            if (k.startsWith('top_sudoku') || k.startsWith('sudoku_puzzle_')) {
              localStorage.setItem(k, data[k]);
            }
          });
        } else {
          if (data.history) localStorage.setItem('sudoku_arena_player_history_v1', JSON.stringify(data.history));
          if (data.vault) localStorage.setItem('sudoku_arena_vault_v1', JSON.stringify(data.vault));
          if (data.profile) localStorage.setItem('sudoku_arena_player_master_profile_v1', JSON.stringify(data.profile));
          if (data.weekly) localStorage.setItem('sudoku_arena_weekly_history_v1', JSON.stringify(data.weekly));
          if (data.activeGame) localStorage.setItem('sudoku_arena_active_game_v1', data.activeGame);
        }

        // Limpiar URL sin recargar
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Mostrar notificación de éxito
        document.addEventListener('DOMContentLoaded', () => {
          showToast(t.welcome_toast);
        });
      }
    } catch (e) {
      console.warn('Error al procesar traspaso:', e);
    }
  }

  // Toast flotante de bienvenida
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'club-mig-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 6000);
  }

  // Inyección de banner superior fijo
  function injectStickyBanner() {
    if (document.getElementById('club-migration-top-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'club-migration-top-banner';
    banner.className = 'club-mig-banner';
    banner.innerHTML = `
      <div class="club-mig-banner-inner">
        <span class="club-mig-banner-text">${t.banner_msg}</span>
        <button type="button" id="btn-banner-migration" class="club-mig-banner-btn">${t.banner_btn}</button>
      </div>
    `;
    document.body.prepend(banner);

    document.getElementById('btn-banner-migration')?.addEventListener('click', doMigration);
  }

  // Inyección del modal interactivo
  function injectModal() {
    if (document.getElementById('club-migration-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'club-migration-modal-overlay';
    overlay.className = 'club-mig-overlay';
    overlay.innerHTML = `
      <div class="club-mig-card">
        <div class="club-mig-emblem">🏛️</div>
        <div class="club-mig-badge">${t.badge}</div>
        <h2 class="club-mig-title">${t.title}</h2>
        <div class="club-mig-sub">${t.sub}</div>
        <p class="club-mig-desc">${t.desc}</p>

        <div class="club-mig-guarantee">
          <p>${t.guarantee}</p>
        </div>

        <div class="club-mig-actions">
          <button type="button" id="btn-do-migration" class="club-mig-btn-primary">
            ${t.btn_migrate}
          </button>
          <button type="button" id="btn-stay-legacy" class="club-mig-btn-secondary">
            ${t.btn_stay}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-do-migration')?.addEventListener('click', doMigration);
    document.getElementById('btn-stay-legacy')?.addEventListener('click', dismissModal);
  }

  // Inyección de estilos CSS encapsulados
  function injectStyles() {
    if (document.getElementById('club-migration-styles')) return;
    const style = document.createElement('style');
    style.id = 'club-migration-styles';
    style.textContent = `
      .club-mig-banner {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99998;
        background: linear-gradient(90deg, #b45309, #d97706, #0284c7);
        color: #ffffff;
        padding: 0.6rem 1rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 0.88rem;
        font-weight: 600;
      }
      .club-mig-banner-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .club-mig-banner-text {
        flex: 1;
        min-width: 260px;
      }
      .club-mig-banner-btn {
        background: #0f172a;
        color: #fde68a;
        border: 1px solid #f59e0b;
        padding: 0.4rem 0.9rem;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.82rem;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .club-mig-banner-btn:hover {
        background: #0284c7;
        color: #ffffff;
        border-color: #38bdf8;
        transform: translateY(-1px);
      }
      .club-mig-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(4, 7, 18, 0.85);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        animation: clubMigFadeIn 0.3s ease-out;
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      @keyframes clubMigFadeIn {
        from { opacity: 0; transform: scale(0.97); }
        to { opacity: 1; transform: scale(1); }
      }
      .club-mig-card {
        background: radial-gradient(circle at 50% 10%, #1e1b4b 0%, #090d1a 80%);
        border: 2px solid rgba(245, 158, 11, 0.6);
        border-radius: 20px;
        max-width: 520px;
        width: 100%;
        padding: 2.2rem 1.8rem;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(245, 158, 11, 0.25);
        color: #f8fafc;
        position: relative;
      }
      .club-mig-emblem {
        font-size: 3rem;
        margin-bottom: 0.6rem;
        filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.6));
      }
      .club-mig-badge {
        display: inline-block;
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.5);
        font-size: 0.72rem;
        font-weight: 800;
        padding: 0.3rem 0.8rem;
        border-radius: 999px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 0.9rem;
      }
      .club-mig-title {
        font-size: 1.5rem;
        font-weight: 900;
        color: #ffffff;
        margin-bottom: 0.35rem;
        line-height: 1.25;
      }
      .club-mig-sub {
        font-size: 0.92rem;
        font-weight: 700;
        color: #f87171;
        margin-bottom: 1.1rem;
      }
      .club-mig-desc {
        font-size: 0.92rem;
        color: #cbd5e1;
        line-height: 1.55;
        margin-bottom: 1.2rem;
      }
      .club-mig-desc strong {
        color: #38bdf8;
      }
      .club-mig-guarantee {
        background: rgba(15, 23, 42, 0.75);
        border: 1px dashed rgba(56, 189, 248, 0.45);
        border-radius: 12px;
        padding: 0.9rem 1.1rem;
        margin-bottom: 1.5rem;
        font-size: 0.86rem;
        color: #e2e8f0;
        line-height: 1.45;
        text-align: left;
      }
      .club-mig-guarantee strong {
        color: #fbbf24;
      }
      .club-mig-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .club-mig-btn-primary {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #0f172a;
        font-weight: 800;
        font-size: 1rem;
        padding: 0.85rem 1.2rem;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
        transition: all 0.2s ease;
      }
      .club-mig-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 25px rgba(245, 158, 11, 0.6);
        filter: brightness(1.05);
      }
      .club-mig-btn-secondary {
        background: transparent;
        color: #94a3b8;
        font-weight: 600;
        font-size: 0.85rem;
        padding: 0.5rem;
        border: none;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.2s ease;
      }
      .club-mig-btn-secondary:hover {
        color: #ffffff;
      }
      .club-mig-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 99999;
        background: #0f172a;
        color: #38bdf8;
        border: 1px solid #38bdf8;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        font-size: 0.95rem;
        font-weight: 600;
        max-width: 400px;
        animation: clubMigFadeIn 0.3s ease;
        transition: opacity 0.5s ease;
        font-family: 'Outfit', sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

})();
