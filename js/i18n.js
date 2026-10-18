/**
 * Sudoku Arena - Sistema Internacional de Idiomas (i18n)
 * Soporta 7 idiomas: Español, English, Français, Deutsch, Català, Euskara, Galego
 */

const I18N_LANGUAGES = {
  es: { code: 'es', name: 'Español', flag: '🇪🇸', native: 'Español' },
  en: { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪', native: 'Deutsch' },
  ca: { code: 'ca', name: 'Català', flag: '🟡', native: 'Català' },
  eu: { code: 'eu', name: 'Euskara', flag: '🟢', native: 'Euskara' },
  gl: { code: 'gl', name: 'Galego', flag: '🔵', native: 'Galego' }
};

const I18N_TRANSLATIONS = {
  es: {
    brand_tag: 'Táctico & Auditoría',
    btn_new_duel: 'Nuevo Duelo',
    btn_duel: 'Duelo',
    btn_manual: 'Manual',
    btn_new_game: '➕ Nuevo',
    title_restart: 'Reiniciar tablero actual',
    title_sound: 'Activar/Silenciar sonido',
    title_manual: 'Manual del Jugador y Reglas',
    title_lang: 'Seleccionar idioma',

    diff_facil: 'Fácil',
    diff_medio: 'Medio',
    diff_dificil: 'Difícil',
    diff_endemoniado: 'Endemoniado',

    hud_points: 'Puntos:',
    hud_autonomy: 'Autonomía:',
    hud_ceiling: 'Techo:',
    hud_ledger: 'Auditoría',

    rank_grandmaster: 'Gran Maestro Puro',
    rank_tactical_master: 'Maestro Táctico',
    rank_assisted_strategist: 'Estratega Asistido',
    rank_casual: 'Jugador Casual',

    action_erase: 'Borrar',
    action_peek: 'Lupa',
    action_rayosx: 'Rayos X',
    action_autosolve: 'Resolver',
    action_duel: 'Retar',

    sidebar_tools: 'Operaciones Tácticas',
    sidebar_cell_inspect: 'Inspección Quirúrgica (Lupa)',
    sidebar_cell_desc: 'Muestra candidatos legales de la casilla seleccionada restando su valor del techo.',
    sidebar_rayosx_title: 'Rayos X Globales',
    sidebar_rayosx_desc: 'Revela posibilidades en todo el tablero reduciendo el potencial de puntuación.',
    sidebar_autosolve_title: 'Rendirse y Auto-Resolver',
    sidebar_autosolve_desc: 'El sistema completa el tablero sin otorgar puntos.',
    sidebar_ledger_title: 'Libro Mayor de Auditoría',
    sidebar_ledger_desc: 'Auditoría financiera de cada acierto, consulta y penalización.',

    modal_peek_title: '🔍 Inspección Quirúrgica (Lupa)',
    modal_peek_desc: 'Revelarás las posibilidades exactas de esta casilla. El coste de oportunidad descontará su valor del techo máximo de puntos.',
    modal_peek_confirm: 'Confirmar Inspección',
    modal_peek_cancel: 'Cancelar',
    modal_peek_coord: 'Casilla:',
    modal_peek_cost: 'Coste:',
    modal_peek_already: '0 pts (ya consultada)',
    modal_peek_pts_lost: '-{pts} pts del techo',
    modal_peek_preview: 'Candidatos posibles:',

    modal_rayosx_title: '⚡ Rayos X Globales',
    modal_rayosx_desc: 'Activarás la visión simultánea de candidatos en todo el tablero. Descontará puntos de tu techo según las deducciones realizadas por la máquina.',
    modal_rayosx_singles: 'Casillas únicas (-100% valor):',
    modal_rayosx_doubles: 'Casillas dobles (-50% valor):',
    modal_rayosx_total: 'Deducción total del techo:',
    modal_rayosx_confirm: 'Activar Rayos X',

    modal_autosolve_title: '🏳️ Rendirse y Resolver por Máquina',
    modal_autosolve_desc: 'La máquina resolverá el sudoku automáticamente. Las casillas resueltas por el sistema no sumarán puntos a tu saldo.',
    modal_autosolve_remaining: 'Casillas pendientes por resolver:',
    modal_autosolve_lost: 'Puntos que dejarás de ganar:',
    modal_autosolve_confirm: 'Confirmar y Resolver Tablero',

    modal_ledger_title: '📋 Libro Mayor de Auditoría de Puntos',
    modal_ledger_score: 'Puntos Acumulados:',
    modal_ledger_max: 'Techo Teórico Máximo:',
    modal_ledger_penalties: 'Total Penalizaciones:',
    modal_ledger_autonomy: 'Índice de Autonomía:',
    modal_ledger_th_time: 'Hora',
    modal_ledger_th_type: 'Tipo',
    modal_ledger_th_action: 'Acción',
    modal_ledger_th_delta: 'Delta',
    modal_ledger_th_balance: 'Saldo',
    modal_ledger_th_ceiling: 'Techo',
    modal_ledger_th_detail: 'Detalle Operativo',
    modal_ledger_return: 'Volver al tablero',

    verdict_title: '¡Sudoku Completado!',
    verdict_score: 'Puntos Obtenidos:',
    verdict_max: 'Techo Teórico Máximo:',
    verdict_autonomy: 'Índice de Autonomía:',
    verdict_time: 'Tiempo Empleado:',
    verdict_penalties: 'Penalizaciones:',
    verdict_peeks: 'Consultas / Errores:',
    verdict_share: '📋 Copiar Resultado y Código de Desafío para Retar',
    verdict_close: 'Cerrar y Ver Tablero',

    duel_modal_title: '⚔️ Nuevo Planteamiento para Duelo',
    duel_modal_desc: 'Genera un nuevo tablero eligiendo la dificultad deseada. Ambos jugadores se enfrentarán al <strong>mismo sudoku exacto</strong> con idéntico techo inicial de puntos y penalizaciones.',
    duel_step1: '1. Selecciona la Dificultad del Duelo:',
    duel_step2: '2. Código de Partida y Desafío:',
    duel_seed_title: 'Semilla Matemática Reproducible',
    duel_reroll: '🎲 Cambiar Semilla',
    duel_play_now: '🎮 Jugar Este Duelo Ahora',
    duel_copy_link: '📋 Copiar Enlace para Rivales',
    duel_rival_section: '¿Te han retado a ti? Introduce el código de tu rival:',
    duel_rival_placeholder: 'Ej: ARENA-DIFI-84210',
    duel_rival_btn: 'Cargar Duelo',
    duel_card_easy_sub: '42 pistas • 10 pts',
    duel_card_med_sub: '34 pistas • 15 pts',
    duel_card_hard_sub: '28 pistas • 30 pts',
    duel_card_evil_sub: '22 pistas • 100 pts',

    modal_lang_title: '🌐 Selecciona tu Idioma',
    modal_lang_desc: 'Elige tu idioma preferido para la interfaz y el manual de juego.',

    toast_challenge_loaded: '¡Desafío cargado! Código: {code}',
    toast_error_num: '¡Error! El {num} no va en esa casilla (-15 pts)',
    toast_select_empty: 'Selecciona primero una casilla vacía',
    toast_cell_filled: 'Esta casilla ya está rellena',
    toast_peek_revealed: 'Posibilidades reveladas en Fila {r}, Col {c}',
    toast_rayosx_already: 'Los Rayos X globales ya están activos',
    toast_rayosx_active: '¡Rayos X activados! (-{pts} pts deducidos del techo)',
    toast_sudoku_done: 'El sudoku ya está completado',
    toast_autosolve_done: 'El sistema ha resuelto las casillas pendientes (0 puntos otorgados)',
    toast_duel_started: '¡Nuevo duelo iniciado! Código: {code}',
    toast_duel_copied: '¡Enlace de duelo copiado al portapapeles!',
    toast_sound_on: 'Sonido activado',
    toast_sound_off: 'Sonido silenciado',
    toast_lang_changed: 'Idioma cambiado a Español',
    duel_share_msg: '⚔️ ¡Te reto en Sudoku Arena!\nNivel: {diff}\nCódigo: {code}\nEntra a competir directamente con este enlace:\n{url}',
    confirm_restart: '¿Reiniciar el tablero actual con el mismo código de partida?'
  },

  en: {
    brand_tag: 'Tactical & Audit',
    btn_new_duel: 'New Duel',
    btn_duel: 'Duel',
    btn_manual: 'Manual',
    btn_new_game: '➕ New',
    title_restart: 'Restart current board',
    title_sound: 'Toggle sound',
    title_manual: 'Player Manual & Rules',
    title_lang: 'Select language',

    diff_facil: 'Easy',
    diff_medio: 'Medium',
    diff_dificil: 'Hard',
    diff_endemoniado: 'Evil',

    hud_points: 'Points:',
    hud_autonomy: 'Autonomy:',
    hud_ceiling: 'Ceiling:',
    hud_ledger: 'Audit',

    rank_grandmaster: 'Pure Grandmaster',
    rank_tactical_master: 'Tactical Master',
    rank_assisted_strategist: 'Assisted Strategist',
    rank_casual: 'Casual Player',

    action_erase: 'Erase',
    action_peek: 'Magnifier',
    action_rayosx: 'X-Ray',
    action_autosolve: 'Solve',
    action_duel: 'Challenge',

    sidebar_tools: 'Tactical Operations',
    sidebar_cell_inspect: 'Surgical Inspection (Magnifier)',
    sidebar_cell_desc: 'Reveals legal candidates for the selected cell deducting its value from the score ceiling.',
    sidebar_rayosx_title: 'Global X-Ray',
    sidebar_rayosx_desc: 'Reveals possibilities across the entire grid reducing overall score potential.',
    sidebar_autosolve_title: 'Surrender & Solve',
    sidebar_autosolve_desc: 'The engine completes the grid without awarding points.',
    sidebar_ledger_title: 'Score Audit Ledger',
    sidebar_ledger_desc: 'Financial audit of each deduction, inspection, and penalty.',

    modal_peek_title: '🔍 Surgical Inspection (Magnifier)',
    modal_peek_desc: 'Reveals exact candidates for this cell. Opportunity cost will deduct its value from the maximum score ceiling.',
    modal_peek_confirm: 'Confirm Inspection',
    modal_peek_cancel: 'Cancel',
    modal_peek_coord: 'Cell:',
    modal_peek_cost: 'Cost:',
    modal_peek_already: '0 pts (already inspected)',
    modal_peek_pts_lost: '-{pts} pts from ceiling',
    modal_peek_preview: 'Possible candidates:',

    modal_rayosx_title: '⚡ Global X-Ray',
    modal_rayosx_desc: 'Activates candidate visibility across the entire board. Deducts points from your ceiling based on deductions made by the engine.',
    modal_rayosx_singles: 'Single candidates (-100% value):',
    modal_rayosx_doubles: 'Double candidates (-50% value):',
    modal_rayosx_total: 'Total ceiling deduction:',
    modal_rayosx_confirm: 'Activate X-Ray',

    modal_autosolve_title: '🏳️ Surrender & Solve by Engine',
    modal_autosolve_desc: 'The engine will solve the sudoku automatically. Solved cells will not award points to your balance.',
    modal_autosolve_remaining: 'Remaining unsolved cells:',
    modal_autosolve_lost: 'Points forfeited:',
    modal_autosolve_confirm: 'Confirm & Solve Board',

    modal_ledger_title: '📋 Score Audit Ledger',
    modal_ledger_score: 'Accumulated Score:',
    modal_ledger_max: 'Theoretical Max Ceiling:',
    modal_ledger_penalties: 'Total Penalties:',
    modal_ledger_autonomy: 'Autonomy Index:',
    modal_ledger_th_time: 'Time',
    modal_ledger_th_type: 'Type',
    modal_ledger_th_action: 'Action',
    modal_ledger_th_delta: 'Delta',
    modal_ledger_th_balance: 'Balance',
    modal_ledger_th_ceiling: 'Ceiling',
    modal_ledger_th_detail: 'Operational Detail',
    modal_ledger_return: 'Return to board',

    verdict_title: 'Sudoku Completed!',
    verdict_score: 'Points Scored:',
    verdict_max: 'Theoretical Max Ceiling:',
    verdict_autonomy: 'Autonomy Index:',
    verdict_time: 'Time Elapsed:',
    verdict_penalties: 'Penalties:',
    verdict_peeks: 'Assists / Errors:',
    verdict_share: '📋 Copy Result & Challenge Code for Rivals',
    verdict_close: 'Close and View Board',

    duel_modal_title: '⚔️ New Duel Setup',
    duel_modal_desc: 'Generate a new board selecting your desired difficulty. Both players will compete on the <strong>exact same sudoku</strong> with identical starting ceiling and penalties.',
    duel_step1: '1. Select Duel Difficulty:',
    duel_step2: '2. Match & Challenge Code:',
    duel_seed_title: 'Reproducible Mathematical Seed',
    duel_reroll: '🎲 Reroll Seed',
    duel_play_now: '🎮 Play This Duel Now',
    duel_copy_link: '📋 Copy Link for Rivals',
    duel_rival_section: 'Were you challenged? Enter your rival\'s code:',
    duel_rival_placeholder: 'Ex: ARENA-HARD-84210',
    duel_rival_btn: 'Load Duel',
    duel_card_easy_sub: '42 clues • 10 pts',
    duel_card_med_sub: '34 clues • 15 pts',
    duel_card_hard_sub: '28 clues • 30 pts',
    duel_card_evil_sub: '22 clues • 100 pts',

    modal_lang_title: '🌐 Select Your Language',
    modal_lang_desc: 'Choose your preferred language for the game interface and user manual.',

    toast_challenge_loaded: 'Challenge loaded! Code: {code}',
    toast_error_num: 'Error! {num} does not belong in this cell (-15 pts)',
    toast_select_empty: 'Please select an empty cell first',
    toast_cell_filled: 'This cell is already filled',
    toast_peek_revealed: 'Candidates revealed at Row {r}, Col {c}',
    toast_rayosx_already: 'Global X-Ray is already active',
    toast_rayosx_active: 'X-Ray activated! (-{pts} pts deducted from ceiling)',
    toast_sudoku_done: 'The sudoku is already completed',
    toast_autosolve_done: 'The system has solved remaining cells (0 points awarded)',
    toast_duel_started: 'New duel started! Code: {code}',
    toast_duel_copied: 'Duel link copied to clipboard!',
    toast_sound_on: 'Sound unmuted',
    toast_sound_off: 'Sound muted',
    toast_lang_changed: 'Language set to English',
    duel_share_msg: '⚔️ I challenge you in Sudoku Arena!\nDifficulty: {diff}\nCode: {code}\nJoin and play directly here:\n{url}',
    confirm_restart: 'Restart current board with the same match code?'
  },

  fr: {
    brand_tag: 'Tactique & Audit',
    btn_new_duel: 'Nouveau Duel',
    btn_duel: 'Duel',
    btn_manual: 'Manuel',
    btn_new_game: '➕ Nouveau',
    title_restart: 'Recommencer la grille actuelle',
    title_sound: 'Activer/Couper le son',
    title_manual: 'Manuel du Joueur et Règles',
    title_lang: 'Sélectionner la langue',

    diff_facil: 'Facile',
    diff_medio: 'Moyen',
    diff_dificil: 'Difficile',
    diff_endemoniado: 'Diabolique',

    hud_points: 'Points:',
    hud_autonomy: 'Autonomie:',
    hud_ceiling: 'Plafond:',
    hud_ledger: 'Audit',

    rank_grandmaster: 'Grand Maître Pur',
    rank_tactical_master: 'Maître Tactique',
    rank_assisted_strategist: 'Stratège Assisté',
    rank_casual: 'Joueur Occasionnel',

    action_erase: 'Effacer',
    action_peek: 'Loupe',
    action_rayosx: 'Rayons X',
    action_autosolve: 'Résoudre',
    action_duel: 'Défier',

    sidebar_tools: 'Opérations Tactiques',
    sidebar_cell_inspect: 'Inspection Chirurgicale (Loupe)',
    sidebar_cell_desc: 'Révèle les candidats légaux de la case sélectionnée en déduisant sa valeur du plafond.',
    sidebar_rayosx_title: 'Rayons X Globaux',
    sidebar_rayosx_desc: 'Affiche les possibilités sur toute la grille réduisant le plafond global.',
    sidebar_autosolve_title: 'Abandonner & Résoudre',
    sidebar_autosolve_desc: 'Le système résout la grille sans attribuer de points.',
    sidebar_ledger_title: 'Grand Livre d\'Audit',
    sidebar_ledger_desc: 'Audit financier de chaque déduction, aide et pénalité.',

    modal_peek_title: '🔍 Inspection Chirurgicale (Loupe)',
    modal_peek_desc: 'Révèle les candidats exacts de cette case. Le coût d\'opportunité déduira sa valeur du plafond de score.',
    modal_peek_confirm: 'Confirmer l\'Inspection',
    modal_peek_cancel: 'Annuler',
    modal_peek_coord: 'Case:',
    modal_peek_cost: 'Coût:',
    modal_peek_already: '0 pts (déjà consultée)',
    modal_peek_pts_lost: '-{pts} pts du plafond',
    modal_peek_preview: 'Candidats possibles:',

    modal_rayosx_title: '⚡ Rayons X Globaux',
    modal_rayosx_desc: 'Active la vue des candidats sur toute la grille. Déduit des points de votre plafond selon les aides apportées par la machine.',
    modal_rayosx_singles: 'Cases uniques (-100% valeur):',
    modal_rayosx_doubles: 'Cases doubles (-50% valeur):',
    modal_rayosx_total: 'Déduction totale du plafond:',
    modal_rayosx_confirm: 'Activer les Rayons X',

    modal_autosolve_title: '🏳️ Abandonner et Résoudre par Machine',
    modal_autosolve_desc: 'La machine résoudra automatiquement le sudoku. Les cases résolues n\'attribueront aucun point.',
    modal_autosolve_remaining: 'Cases restantes à résoudre:',
    modal_autosolve_lost: 'Points perdus:',
    modal_autosolve_confirm: 'Confirmer et Résoudre la Grille',

    modal_ledger_title: '📋 Grand Livre d\'Audit des Points',
    modal_ledger_score: 'Points Cumulés:',
    modal_ledger_max: 'Plafond Théorique Max:',
    modal_ledger_penalties: 'Total Pénalités:',
    modal_ledger_autonomy: 'Indice d\'Autonomie:',
    modal_ledger_th_time: 'Heure',
    modal_ledger_th_type: 'Type',
    modal_ledger_th_action: 'Action',
    modal_ledger_th_delta: 'Delta',
    modal_ledger_th_balance: 'Solde',
    modal_ledger_th_ceiling: 'Plafond',
    modal_ledger_th_detail: 'Détail Opérationnel',
    modal_ledger_return: 'Retour à la grille',

    verdict_title: 'Sudoku Terminé !',
    verdict_score: 'Points Obtenus:',
    verdict_max: 'Plafond Théorique Max:',
    verdict_autonomy: 'Indice d\'Autonomie:',
    verdict_time: 'Temps Écoulé:',
    verdict_penalties: 'Pénalités:',
    verdict_peeks: 'Aides / Erreurs:',
    verdict_share: '📋 Copier Résultat et Code de Défi pour Défier',
    verdict_close: 'Fermer et Voir la Grille',

    duel_modal_title: '⚔️ Nouveau Défi pour Duel',
    duel_modal_desc: 'Générez une nouvelle grille en choisissant la difficulté. Les deux joueurs s\'affronteront sur le <strong>même sudoku exact</strong> avec un plafond initial identique.',
    duel_step1: '1. Choisissez la Difficulté du Duel:',
    duel_step2: '2. Code de Match et Défi:',
    duel_seed_title: 'Graine Mathématique Reproductible',
    duel_reroll: '🎲 Changer Graine',
    duel_play_now: '🎮 Jouer Ce Duel Maintenant',
    duel_copy_link: '📋 Copier Lien pour Rivaux',
    duel_rival_section: 'Avez-vous été défié ? Entrez le code de votre rival :',
    duel_rival_placeholder: 'Ex: ARENA-DIFF-84210',
    duel_rival_btn: 'Charger Duel',
    duel_card_easy_sub: '42 indices • 10 pts',
    duel_card_med_sub: '34 indices • 15 pts',
    duel_card_hard_sub: '28 indices • 30 pts',
    duel_card_evil_sub: '22 indices • 100 pts',

    modal_lang_title: '🌐 Choisissez votre Langue',
    modal_lang_desc: 'Choisissez votre langue préférée pour l\'interface et le manuel de jeu.',

    toast_challenge_loaded: 'Défi chargé ! Code: {code}',
    toast_error_num: 'Erreur ! Le {num} ne va pas dans cette case (-15 pts)',
    toast_select_empty: 'Veuillez d\'abord sélectionner une case vide',
    toast_cell_filled: 'Cette case est déjà remplie',
    toast_peek_revealed: 'Candidats révélés à Ligne {r}, Col {c}',
    toast_rayosx_already: 'Les Rayons X globaux sont déjà actifs',
    toast_rayosx_active: 'Rayons X activés ! (-{pts} pts déduits du plafond)',
    toast_sudoku_done: 'Le sudoku est déjà terminé',
    toast_autosolve_done: 'Le système a résolu les cases restantes (0 point attribué)',
    toast_duel_started: 'Nouveau duel lancé ! Code: {code}',
    toast_duel_copied: 'Lien du duel copié dans le presse-papiers !',
    toast_sound_on: 'Son activé',
    toast_sound_off: 'Son coupé',
    toast_lang_changed: 'Langue changée en Français',
    duel_share_msg: '⚔️ Je te défie sur Sudoku Arena !\nDifficulté: {diff}\nCode: {code}\nRejoins la partie ici:\n{url}',
    confirm_restart: 'Recommencer la grille avec le même code de partie ?'
  },

  de: {
    brand_tag: 'Taktik & Audit',
    btn_new_duel: 'Neues Duell',
    btn_duel: 'Duell',
    btn_manual: 'Handbuch',
    btn_new_game: '➕ Neu',
    title_restart: 'Aktuelles Brett neu starten',
    title_sound: 'Ton ein/aus',
    title_manual: 'Spielerhandbuch & Regeln',
    title_lang: 'Sprache wählen',

    diff_facil: 'Leicht',
    diff_medio: 'Mittel',
    diff_dificil: 'Schwer',
    diff_endemoniado: 'Teuflisch',

    hud_points: 'Punkte:',
    hud_autonomy: 'Autonomie:',
    hud_ceiling: 'Limit:',
    hud_ledger: 'Audit',

    rank_grandmaster: 'Reiner Großmeister',
    rank_tactical_master: 'Taktischer Meister',
    rank_assisted_strategist: 'Assistierter Stratege',
    rank_casual: 'Gelegenheitsspieler',

    action_erase: 'Löschen',
    action_peek: 'Lupe',
    action_rayosx: 'Röntgen',
    action_autosolve: 'Lösen',
    action_duel: 'Duell',

    sidebar_tools: 'Taktische Operationen',
    sidebar_cell_inspect: 'Chirurgische Inspektion (Lupe)',
    sidebar_cell_desc: 'Zeigt legale Kandidaten für die Zelle an und zieht deren Wert vom Limit ab.',
    sidebar_rayosx_title: 'Globales Röntgen',
    sidebar_rayosx_desc: 'Zeigt Möglichkeiten auf dem gesamten Brett und verringert das Gesamtpunktlimit.',
    sidebar_autosolve_title: 'Aufgeben & Lösen',
    sidebar_autosolve_desc: 'Die Maschine löst das Brett ohne Punkte zu vergeben.',
    sidebar_ledger_title: 'Punkte-Audit Hauptbuch',
    sidebar_ledger_desc: 'Finanzielle Prüfung aller Züge, Hilfen und Strafen.',

    modal_peek_title: '🔍 Chirurgische Inspektion (Lupe)',
    modal_peek_desc: 'Zeigt die exakten Kandidaten dieser Zelle an. Die Opportunitätskosten ziehen den Wert von Ihrer Punkte-Obergrenze ab.',
    modal_peek_confirm: 'Inspektion Bestätigen',
    modal_peek_cancel: 'Abbrechen',
    modal_peek_coord: 'Zelle:',
    modal_peek_cost: 'Kosten:',
    modal_peek_already: '0 Pkt (bereits abgefragt)',
    modal_peek_pts_lost: '-{pts} Pkt vom Limit',
    modal_peek_preview: 'Mögliche Kandidaten:',

    modal_rayosx_title: '⚡ Globales Röntgen',
    modal_rayosx_desc: 'Aktiviert Kandidatenansicht auf dem gesamten Spielfeld. Zieht Punkte von Ihrem Limit basierend auf Maschinenhilfen ab.',
    modal_rayosx_singles: 'Eindeutige Zellen (-100% Wert):',
    modal_rayosx_doubles: 'Doppelte Zellen (-50% Wert):',
    modal_rayosx_total: 'Gesamtabzug vom Limit:',
    modal_rayosx_confirm: 'Röntgen Aktivieren',

    modal_autosolve_title: '🏳️ Aufgeben und Automatisch Lösen',
    modal_autosolve_desc: 'Die Maschine löst das Sudoku automatisch. Gelöste Zellen geben keine Punkte.',
    modal_autosolve_remaining: 'Verbleibende ungelöste Zellen:',
    modal_autosolve_lost: 'Verlorene Punkte:',
    modal_autosolve_confirm: 'Bestätigen und Lösen',

    modal_ledger_title: '📋 Punkte-Audit Hauptbuch',
    modal_ledger_score: 'Gesammelte Punkte:',
    modal_ledger_max: 'Theoretische Obergrenze:',
    modal_ledger_penalties: 'Gesamtstrafen:',
    modal_ledger_autonomy: 'Autonomie-Index:',
    modal_ledger_th_time: 'Uhrzeit',
    modal_ledger_th_type: 'Typ',
    modal_ledger_th_action: 'Aktion',
    modal_ledger_th_delta: 'Delta',
    modal_ledger_th_balance: 'Saldo',
    modal_ledger_th_ceiling: 'Limit',
    modal_ledger_th_detail: 'Operatives Detail',
    modal_ledger_return: 'Zurück zum Spielbrett',

    verdict_title: 'Sudoku Gelöst!',
    verdict_score: 'Erzielte Punkte:',
    verdict_max: 'Theoretische Obergrenze:',
    verdict_autonomy: 'Autonomie-Index:',
    verdict_time: 'Benötigte Zeit:',
    verdict_penalties: 'Strafen:',
    verdict_peeks: 'Hilfen / Fehler:',
    verdict_share: '📋 Ergebnis & Duell-Code kopieren',
    verdict_close: 'Schließen und Spielbrett ansehen',

    duel_modal_title: '⚔️ Neues Duell-Setup',
    duel_modal_desc: 'Generiere ein neues Brett mit dem gewünschten Schwierigkeitsgrad. Beide Spieler treten auf dem <strong>exakt gleichen Sudoku</strong> an.',
    duel_step1: '1. Duell-Schwierigkeitsgrad wählen:',
    duel_step2: '2. Spiel- und Herausforderungscode:',
    duel_seed_title: 'Reproduzierbarer Mathematischer Seed',
    duel_reroll: '🎲 Neuer Seed',
    duel_play_now: '🎮 Dieses Duell Jetzt Spielen',
    duel_copy_link: '📋 Link für Rivalen kopieren',
    duel_rival_section: 'Wurdest du herausgefordert? Code deines Rivalen eingeben:',
    duel_rival_placeholder: 'Z.B.: ARENA-SCHW-84210',
    duel_rival_btn: 'Duell Laden',
    duel_card_easy_sub: '42 Hinweise • 10 Pkt',
    duel_card_med_sub: '34 Hinweise • 15 Pkt',
    duel_card_hard_sub: '28 Hinweise • 30 Pkt',
    duel_card_evil_sub: '22 Hinweise • 100 Pkt',

    modal_lang_title: '🌐 Sprache Auswählen',
    modal_lang_desc: 'Wähle deine bevorzugte Sprache für Oberfläche und Handbuch.',

    toast_challenge_loaded: 'Duell geladen! Code: {code}',
    toast_error_num: 'Fehler! Die {num} gehört nicht in diese Zelle (-15 Pkt)',
    toast_select_empty: 'Wähle zuerst eine leere Zelle aus',
    toast_cell_filled: 'Diese Zelle ist bereits ausgefüllt',
    toast_peek_revealed: 'Kandidaten aufgedeckt in Zeile {r}, Spalte {c}',
    toast_rayosx_already: 'Globales Röntgen ist bereits aktiv',
    toast_rayosx_active: 'Röntgen aktiviert! (-{pts} Pkt vom Limit abgezogen)',
    toast_sudoku_done: 'Das Sudoku ist bereits gelöst',
    toast_autosolve_done: 'Das System hat die restlichen Zellen gelöst (0 Punkte erhalten)',
    toast_duel_started: 'Neues Duell gestartet! Code: {code}',
    toast_duel_copied: 'Duell-Link in die Zwischenablage kopiert!',
    toast_sound_on: 'Ton eingeschaltet',
    toast_sound_off: 'Ton stummgeschaltet',
    toast_lang_changed: 'Sprache auf Deutsch geändert',
    duel_share_msg: '⚔️ Ich fordere dich in Sudoku Arena heraus!\nSchwierigkeit: {diff}\nCode: {code}\nDirekt hier antreten:\n{url}',
    confirm_restart: 'Aktuelles Brett mit demselben Spielcode neu starten?'
  },

  ca: {
    brand_tag: 'Tàctic & Auditoria',
    btn_new_duel: 'Nou Duel',
    btn_duel: 'Duel',
    btn_manual: 'Manual',
    btn_new_game: '➕ Nou',
    title_restart: 'Reiniciar tauler actual',
    title_sound: 'Activar/Silenciar so',
    title_manual: 'Manual del Jugador i Regles',
    title_lang: 'Seleccionar idioma',

    diff_facil: 'Fàcil',
    diff_medio: 'Mitjà',
    diff_dificil: 'Difícil',
    diff_endemoniado: 'Endimoniat',

    hud_points: 'Punts:',
    hud_autonomy: 'Autonomia:',
    hud_ceiling: 'Sostre:',
    hud_ledger: 'Auditoria',

    rank_grandmaster: 'Gran Mestre Pur',
    rank_tactical_master: 'Mestre Tàctic',
    rank_assisted_strategist: 'Estrateg Assistit',
    rank_casual: 'Jugador Casual',

    action_erase: 'Esborrar',
    action_peek: 'Lupa',
    action_rayosx: 'Raigs X',
    action_autosolve: 'Resoldre',
    action_duel: 'Reptar',

    sidebar_tools: 'Operacions Tàctiques',
    sidebar_cell_inspect: 'Inspecció Quirúrgica (Lupa)',
    sidebar_cell_desc: 'Mostra candidats legals de la casella seleccionada restant el seu valor del sostre.',
    sidebar_rayosx_title: 'Raigs X Globals',
    sidebar_rayosx_desc: 'Revela possibilitats a tot el tauler reduint el potencial de puntuació.',
    sidebar_autosolve_title: 'Rendir-se i Auto-Resoldre',
    sidebar_autosolve_desc: 'El sistema completa el tauler sense atorgar punts.',
    sidebar_ledger_title: 'Llibre Major d\'Auditoria',
    sidebar_ledger_desc: 'Auditoria financera de cada encert, consulta i penalització.',

    modal_peek_title: '🔍 Inspecció Quirúrgica (Lupa)',
    modal_peek_desc: 'Revetllaràs les possibilitats exactes d\'aquesta casella. El cost d\'oportunitat descomptarà el seu valor del sostre de punts.',
    modal_peek_confirm: 'Confirmar Inspecció',
    modal_peek_cancel: 'Cancel·lar',
    modal_peek_coord: 'Casella:',
    modal_peek_cost: 'Cost:',
    modal_peek_already: '0 pts (ja consultada)',
    modal_peek_pts_lost: '-{pts} pts del sostre',
    modal_peek_preview: 'Candidats possibles:',

    modal_rayosx_title: '⚡ Raigs X Globals',
    modal_rayosx_desc: 'Activaràs la visió de candidats a tot el tauler. Descomptarà punts del teu sostre segons les ajudes resoltes per la màquina.',
    modal_rayosx_singles: 'Caselles úniques (-100% valor):',
    modal_rayosx_doubles: 'Caselles dobles (-50% valor):',
    modal_rayosx_total: 'Deducció total del sostre:',
    modal_rayosx_confirm: 'Activar Raigs X',

    modal_autosolve_title: '🏳️ Rendir-se i Resoldre per Màquina',
    modal_autosolve_desc: 'La màquina resoldrà el sudoku automàticament. Les caselles resoltes no sumaran punts.',
    modal_autosolve_remaining: 'Caselles pendents de resoldre:',
    modal_autosolve_lost: 'Punts que deixaràs de guanyar:',
    modal_autosolve_confirm: 'Confirmar i Resoldre Tauler',

    modal_ledger_title: '📋 Llibre Major d\'Auditoria de Punts',
    modal_ledger_score: 'Punts Acumulats:',
    modal_ledger_max: 'Sostre Teòric Màxim:',
    modal_ledger_penalties: 'Total Penalitzacions:',
    modal_ledger_autonomy: 'Índex d\'Autonomia:',
    modal_ledger_th_time: 'Hora',
    modal_ledger_th_type: 'Tipus',
    modal_ledger_th_action: 'Acció',
    modal_ledger_th_delta: 'Delta',
    modal_ledger_th_balance: 'Saldo',
    modal_ledger_th_ceiling: 'Sostre',
    modal_ledger_th_detail: 'Detall Operatiu',
    modal_ledger_return: 'Tornar al tauler',

    verdict_title: 'Sudoku Completat!',
    verdict_score: 'Punts Obtinguts:',
    verdict_max: 'Sostre Teòric Màxim:',
    verdict_autonomy: 'Índex d\'Autonomia:',
    verdict_time: 'Temps Emprat:',
    verdict_penalties: 'Penalitzacions:',
    verdict_peeks: 'Consultes / Errors:',
    verdict_share: '📋 Copiar Resultat i Codi de Desafiament per a Reptar',
    verdict_close: 'Tancar i Veure Tauler',

    duel_modal_title: '⚔️ Nou Plantejament per a Duel',
    duel_modal_desc: 'Genera un nou tauler triant la dificultat desitjada. Ambdós jugadors s\'enfrontaran al <strong>mateix sudoku exacte</strong> amb idèntic sostre de punts.',
    duel_step1: '1. Selecciona la Dificultat del Duel:',
    duel_step2: '2. Codi de Partida i Desafiament:',
    duel_seed_title: 'Llavor Matemàtica Reproductible',
    duel_reroll: '🎲 Canviar Llavor',
    duel_play_now: '🎮 Jugar Aquest Duel Ara',
    duel_copy_link: '📋 Copiar Enllaç per a Rivals',
    duel_rival_section: 'T\'han reptat a tu? Introdueix el codi del teu rival:',
    duel_rival_placeholder: 'Ex: ARENA-DIFI-84210',
    duel_rival_btn: 'Carregar Duel',
    duel_card_easy_sub: '42 pistes • 10 pts',
    duel_card_med_sub: '34 pistes • 15 pts',
    duel_card_hard_sub: '28 pistes • 30 pts',
    duel_card_evil_sub: '22 pistes • 100 pts',

    modal_lang_title: '🌐 Selecciona el teu Idioma',
    modal_lang_desc: 'Tria el teu idioma preferit per a la interfície i el manual de joc.',

    toast_challenge_loaded: 'Desafiament carregat! Codi: {code}',
    toast_error_num: 'Error! El {num} no va en aquesta casella (-15 pts)',
    toast_select_empty: 'Selecciona primer una casella buida',
    toast_cell_filled: 'Aquesta casella ja està plena',
    toast_peek_revealed: 'Possibilitats revelades a Fila {r}, Col {c}',
    toast_rayosx_already: 'Els Raigs X globals ja estan actius',
    toast_rayosx_active: 'Raigs X activats! (-{pts} pts deduïts del sostre)',
    toast_sudoku_done: 'El sudoku ja està completat',
    toast_autosolve_done: 'El sistema ha resolt les caselles pendents (0 punts atorgats)',
    toast_duel_started: 'Nou duel iniciat! Codi: {code}',
    toast_duel_copied: 'Enllaç de duel copiat al porta-retalls!',
    toast_sound_on: 'So activat',
    toast_sound_off: 'So silenciat',
    toast_lang_changed: 'Idioma canviat a Català',
    duel_share_msg: '⚔️ Et repto a Sudoku Arena!\nNivell: {diff}\nCodi: {code}\nEntra a competir directament aquí:\n{url}',
    confirm_restart: 'Reiniciar el tauler actual amb el mateix codi de partida?'
  },

  eu: {
    brand_tag: 'Taktikoa & Ikuskaritza',
    btn_new_duel: 'Erronka Berria',
    btn_duel: 'Duelua',
    btn_manual: 'Eskuliburua',
    btn_new_game: '➕ Berria',
    title_restart: 'Uneko taula berrabiarazi',
    title_sound: 'Soinua aktibatu/isilarazi',
    title_manual: 'Jokalariaren Eskuliburua eta Arauak',
    title_lang: 'Hizkuntza aukeratu',

    diff_facil: 'Erraza',
    diff_medio: 'Ertaina',
    diff_dificil: 'Zaila',
    diff_endemoniado: 'Deabruzkoa',

    hud_points: 'Puntuak:',
    hud_autonomy: 'Autonomia:',
    hud_ceiling: 'Sabaia:',
    hud_ledger: 'Ikuskaritza',

    rank_grandmaster: 'Maisu Handi Hutsa',
    rank_tactical_master: 'Maisu Taktikoa',
    rank_assisted_strategist: 'Estratega Lagundua',
    rank_casual: 'Jokalari Arrunta',

    action_erase: 'Ezabatu',
    action_peek: 'Lupa',
    action_rayosx: 'X Izpiak',
    action_autosolve: 'Ebatzi',
    action_duel: 'Erronka',

    sidebar_tools: 'Eragiketa Taktikoak',
    sidebar_cell_inspect: 'Ikuskaritza Kirurgikoa (Lupa)',
    sidebar_cell_desc: 'Hautatutako laukiko hautagai legalak erakusten ditu bere balioa sabaitik kenduz.',
    sidebar_rayosx_title: 'X Izpi Globalak',
    sidebar_rayosx_desc: 'Aukerak taula osoan erakusten ditu puntuazio ahalmena murriztuz.',
    sidebar_autosolve_title: 'Errenditu eta Auto-Ebatzi',
    sidebar_autosolve_desc: 'Sistemak taula osatzen du punturik eman gabe.',
    sidebar_ledger_title: 'Puntu Ikuskaritzaren Liburua',
    sidebar_ledger_desc: 'Asmatze, laguntza eta zigor bakoitzaren finantza-ikuskaritza.',

    modal_peek_title: '🔍 Ikuskaritza Kirurgikoa (Lupa)',
    modal_peek_desc: 'Lauki honen aukera zehatzak agertuko dira. Aukera-kostuak bere balioa gehienezko puntuen sabaitik kenduko du.',
    modal_peek_confirm: 'Ikuskaritza Berretsi',
    modal_peek_cancel: 'Utzi',
    modal_peek_coord: 'Laukia:',
    modal_peek_cost: 'Kostua:',
    modal_peek_already: '0 ptu (kontsultatua dagoeneko)',
    modal_peek_pts_lost: '-{pts} ptu sabaitik',
    modal_peek_preview: 'Aukera posibleak:',

    modal_rayosx_title: '⚡ X Izpi Globalak',
    modal_rayosx_desc: 'Hautagaien ikuspegia taula osoan aktibatuko duzu. Makinak ebatzitako laguntzen arabera puntuak kenduko ditu zure sabaitik.',
    modal_rayosx_singles: 'Lauki bakarrak (-%100 balioa):',
    modal_rayosx_doubles: 'Lauki bikoitzak (-%50 balioa):',
    modal_rayosx_total: 'Sabaitik guztira kendutakoa:',
    modal_rayosx_confirm: 'X Izpiak Aktibatu',

    modal_autosolve_title: '🏳️ Errenditu eta Makinaz Ebatzi',
    modal_autosolve_desc: 'Makinak sudokua automatikoki ebatziko du. Ebatzitako laukiek ez dute punturik emango.',
    modal_autosolve_remaining: 'Ebatzigabeko laukiak:',
    modal_autosolve_lost: 'Galdutako puntuak:',
    modal_autosolve_confirm: 'Berretsi eta Taula Ebatzi',

    modal_ledger_title: '📋 Puntu Ikuskaritzaren Liburu Nagusia',
    modal_ledger_score: 'Metatutako Puntuak:',
    modal_ledger_max: 'Gehienezko Sabai Teorikoa:',
    modal_ledger_penalties: 'Zigorrak Guztira:',
    modal_ledger_autonomy: 'Autonomia Indizea:',
    modal_ledger_th_time: 'Ordua',
    modal_ledger_th_type: 'Mota',
    modal_ledger_th_action: 'Ekintza',
    modal_ledger_th_delta: 'Delta',
    modal_ledger_th_balance: 'Saldoa',
    modal_ledger_th_ceiling: 'Sabaia',
    modal_ledger_th_detail: 'Xehetasuna',
    modal_ledger_return: 'Taulara Itzuli',

    verdict_title: 'Sudokua Osatuta!',
    verdict_score: 'Lortutako Puntuak:',
    verdict_max: 'Gehienezko Sabai Teorikoa:',
    verdict_autonomy: 'Autonomia Indizea:',
    verdict_time: 'Emandako Denbora:',
    verdict_penalties: 'Zigorrak:',
    verdict_peeks: 'Laguntzak / Akatsak:',
    verdict_share: '📋 Emaitza eta Erronka Kodea Kopiatu',
    verdict_close: 'Itxi eta Taula Ikusi',

    duel_modal_title: '⚔️ Duelurako Erronka Berria',
    duel_modal_desc: 'Sortu taula berria nahi duzun zailtasuna hautatuz. Bi jokalariak <strong>sudoku zehatz beraren aurka</strong> arituko dira hasierako sabai berarekin.',
    duel_step1: '1. Hautatu Dueluaren Zailtasuna:',
    duel_step2: '2. Partida eta Erronka Kodea:',
    duel_seed_title: 'Hazi Matematiko Erreproduzigarria',
    duel_reroll: '🎲 Hazia Aldatu',
    duel_play_now: '🎮 Jokatu Duelu Hau Orain',
    duel_copy_link: '📋 Etsaientzako Esteka Kopiatu',
    duel_rival_section: 'Erronka bota dizute? Sartu zure etsaiaren kodea:',
    duel_rival_placeholder: 'Adib: ARENA-ZAIL-84210',
    duel_rival_btn: 'Duelua Kargatu',
    duel_card_easy_sub: '42 pista • 10 ptu',
    duel_card_med_sub: '34 pista • 15 ptu',
    duel_card_hard_sub: '28 pista • 30 ptu',
    duel_card_evil_sub: '22 pista • 100 ptu',

    modal_lang_title: '🌐 Hautatu Zure Hizkuntza',
    modal_lang_desc: 'Aukeratu zure hizkuntza gogokoena interfazerako eta eskulibururako.',

    toast_challenge_loaded: 'Erronka kargatuta! Kodea: {code}',
    toast_error_num: 'Akatsa! {num} ez doa lauki honetan (-15 ptu)',
    toast_select_empty: 'Aukeratu lehenik lauki huts bat',
    toast_cell_filled: 'Lauki hau beteta dago jada',
    toast_peek_revealed: 'Aukerak agerian {r}. Errenkada, {c}. Zutabean',
    toast_rayosx_already: 'X Izpi globalak aktibo daude dagoeneko',
    toast_rayosx_active: 'X Izpiak aktibatuta! (-{pts} ptu kendu dira sabaitik)',
    toast_sudoku_done: 'Sudokua osatuta dago dagoeneko',
    toast_autosolve_done: 'Sistemak falta ziren laukiak ebatzi ditu (0 puntu emanda)',
    toast_duel_started: 'Duelu berria hasi da! Kodea: {code}',
    toast_duel_copied: 'Dueluaren esteka arbelean kopiatuta!',
    toast_sound_on: 'Soinua aktibatuta',
    toast_sound_off: 'Soinua isilarazita',
    toast_lang_changed: 'Hizkuntza Euskarara aldatu da',
    duel_share_msg: '⚔️ Sudoku Arenan erronka botatzen dizut!\nZailtasuna: {diff}\nKodea: {code}\nSartu zuzenean hemen lehiatzera:\n{url}',
    confirm_restart: 'Uneko taula berrabiarazi partida kode berarekin?'
  },

  gl: {
    brand_tag: 'Táctico & Auditoría',
    btn_new_duel: 'Novo Duelo',
    btn_duel: 'Duelo',
    btn_manual: 'Manual',
    btn_new_game: '➕ Novo',
    title_restart: 'Reiniciar taboleiro actual',
    title_sound: 'Activar/Silenciar son',
    title_manual: 'Manual do Xogador e Regras',
    title_lang: 'Seleccionar idioma',

    diff_facil: 'Fácil',
    diff_medio: 'Medio',
    diff_dificil: 'Difícil',
    diff_endemoniado: 'Endiañado',

    hud_points: 'Puntos:',
    hud_autonomy: 'Autonomía:',
    hud_ceiling: 'Teito:',
    hud_ledger: 'Auditoría',

    rank_grandmaster: 'Gran Mestre Puro',
    rank_tactical_master: 'Mestre Táctico',
    rank_assisted_strategist: 'Estratega Asistido',
    rank_casual: 'Xogador Casual',

    action_erase: 'Borrar',
    action_peek: 'Lupa',
    action_rayosx: 'Raios X',
    action_autosolve: 'Resolver',
    action_duel: 'Retar',

    sidebar_tools: 'Operacións Tácticas',
    sidebar_cell_inspect: 'Inspección Cirúrxica (Lupa)',
    sidebar_cell_desc: 'Mostra candidatos legais da casa seleccionada restando o seu valor do teito.',
    sidebar_rayosx_title: 'Raios X Globais',
    sidebar_rayosx_desc: 'Revela posibilidades en todo o taboleiro reducindo o potencial de puntuación.',
    sidebar_autosolve_title: 'Renderse e Auto-Resolver',
    sidebar_autosolve_desc: 'O sistema completa o taboleiro sen outorgar puntos.',
    sidebar_ledger_title: 'Libro Maior de Auditoría',
    sidebar_ledger_desc: 'Auditoría financeira de cada acerto, consulta e penalización.',

    modal_peek_title: '🔍 Inspección Cirúrxica (Lupa)',
    modal_peek_desc: 'Revelarás as posibilidades exactas desta casa. O custo de oportunidade descontará o seu valor do teito máximo de puntos.',
    modal_peek_confirm: 'Confirmar Inspección',
    modal_peek_cancel: 'Cancelar',
    modal_peek_coord: 'Casa:',
    modal_peek_cost: 'Custo:',
    modal_peek_already: '0 pts (xa consultada)',
    modal_peek_pts_lost: '-{pts} pts do teito',
    modal_peek_preview: 'Candidatos posibles:',

    modal_rayosx_title: '⚡ Raios X Globais',
    modal_rayosx_desc: 'Activarás a visión de candidatos en todo o taboleiro. Descontará puntos do teu teito segundo as axudas resoltas pola máquina.',
    modal_rayosx_singles: 'Casas únicas (-100% valor):',
    modal_rayosx_doubles: 'Casas dobres (-50% valor):',
    modal_rayosx_total: 'Dedución total do teito:',
    modal_rayosx_confirm: 'Activar Raios X',

    modal_autosolve_title: '🏳️ Renderse e Resolver por Máquina',
    modal_autosolve_desc: 'A máquina resolverá o sudoku automaticamente. As casas resoltas non sumarán puntos.',
    modal_autosolve_remaining: 'Casas pendentes de resolver:',
    modal_autosolve_lost: 'Puntos que deixarás de gañar:',
    modal_autosolve_confirm: 'Confirmar e Resolver Taboleiro',

    modal_ledger_title: '📋 Libro Maior de Auditoría de Puntos',
    modal_ledger_score: 'Puntos Acumulados:',
    modal_ledger_max: 'Teito Teórico Máximo:',
    modal_ledger_penalties: 'Total Penalizacións:',
    modal_ledger_autonomy: 'Índice de Autonomía:',
    modal_ledger_th_time: 'Hora',
    modal_ledger_th_type: 'Tipo',
    modal_ledger_th_action: 'Acción',
    modal_ledger_th_delta: 'Delta',
    modal_ledger_th_balance: 'Saldo',
    modal_ledger_th_ceiling: 'Teito',
    modal_ledger_th_detail: 'Detalle Operativo',
    modal_ledger_return: 'Volver ao taboleiro',

    verdict_title: 'Sudoku Completado!',
    verdict_score: 'Puntos Obtidos:',
    verdict_max: 'Teito Teórico Máximo:',
    verdict_autonomy: 'Índice de Autonomía:',
    verdict_time: 'Tempo Empregado:',
    verdict_penalties: 'Penalizacións:',
    verdict_peeks: 'Consultas / Erros:',
    verdict_share: '📋 Copiar Resultado e Código de Desafío para Retar',
    verdict_close: 'Pechar e Ver Taboleiro',

    duel_modal_title: '⚔️ Novo Planteamento para Duelo',
    duel_modal_desc: 'Xera un novo taboleiro escollendo a dificultade desexada. Ámbolos xogadores enfrontaranse ao <strong>mesmo sudoku exacto</strong> con idéntico teito de puntos.',
    duel_step1: '1. Selecciona a Dificultade do Duelo:',
    duel_step2: '2. Código de Partida e Desafío:',
    duel_seed_title: 'Semente Matemática Reprodutible',
    duel_reroll: '🎲 Cambiar Semente',
    duel_play_now: '🎮 Xogar Este Duelo Agora',
    duel_copy_link: '📋 Copiar Ligazón para Rivais',
    duel_rival_section: 'Retáronte a ti? Introduce o código do teu rival:',
    duel_rival_placeholder: 'Ex: ARENA-DIFI-84210',
    duel_rival_btn: 'Cargar Duelo',
    duel_card_easy_sub: '42 pistas • 10 pts',
    duel_card_med_sub: '34 pistas • 15 pts',
    duel_card_hard_sub: '28 pistas • 30 pts',
    duel_card_evil_sub: '22 pistas • 100 pts',

    modal_lang_title: '🌐 Selecciona o teu Idioma',
    modal_lang_desc: 'Elixe o teu idioma preferido para a interface e o manual de xogo.',

    toast_challenge_loaded: 'Desafío cargado! Código: {code}',
    toast_error_num: 'Erro! O {num} non vai nesta casa (-15 pts)',
    toast_select_empty: 'Selecciona primeiro unha casa baleira',
    toast_cell_filled: 'Esta casa xa está cuberta',
    toast_peek_revealed: 'Posibilidades reveladas na Fila {r}, Col {c}',
    toast_rayosx_already: 'Os Raios X globais xa están activos',
    toast_rayosx_active: 'Raios X activados! (-{pts} pts deducidos do teito)',
    toast_sudoku_done: 'O sudoku xa está completado',
    toast_autosolve_done: 'O sistema resolveu as casas pendentes (0 puntos outorgados)',
    toast_duel_started: 'Novo duelo iniciado! Código: {code}',
    toast_duel_copied: 'Ligazón do duelo copiada ao portapapeis!',
    toast_sound_on: 'Son activado',
    toast_sound_off: 'Son silenciado',
    toast_lang_changed: 'Idioma cambiado a Galego',
    duel_share_msg: '⚔️ Réto-te en Sudoku Arena!\nNivel: {diff}\nCódigo: {code}\nEntra a competir directamente aquí:\n{url}',
    confirm_restart: 'Reiniciar o taboleiro actual co mesmo código de partida?'
  }
};

class I18nManager {
  constructor() {
    this.currentLang = this.detectLanguage();
  }

  detectLanguage() {
    const saved = localStorage.getItem('sudoku_arena_lang');
    if (saved && I18N_TRANSLATIONS[saved]) {
      return saved;
    }

    if (typeof navigator !== 'undefined') {
      const browserLang = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
      if (browserLang.startsWith('ca')) return 'ca';
      if (browserLang.startsWith('eu')) return 'eu';
      if (browserLang.startsWith('gl')) return 'gl';
      if (browserLang.startsWith('fr')) return 'fr';
      if (browserLang.startsWith('de')) return 'de';
      if (browserLang.startsWith('en')) return 'en';
    }

    return 'es';
  }

  getLang() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (!I18N_TRANSLATIONS[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('sudoku_arena_lang', lang);
    document.documentElement.lang = lang;
    this.applyTranslations();
  }

  t(key, params = {}) {
    const dict = I18N_TRANSLATIONS[this.currentLang] || I18N_TRANSLATIONS.es;
    let text = dict[key] || I18N_TRANSLATIONS.es[key] || key;

    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.split('{' + pKey + '}').join(pVal);
    }
    return text;
  }

  applyTranslations() {
    // 1. Textos data-i18n
    document.querySelectorAll('[data-i18n]').forEach(elem => {
      const key = elem.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) {
        elem.innerHTML = val;
      }
    });

    // 2. Títulos data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(elem => {
      const key = elem.getAttribute('data-i18n-title');
      const val = this.t(key);
      if (val) {
        elem.setAttribute('title', val);
      }
    });

    // 3. Placeholders data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
      const key = elem.getAttribute('data-i18n-placeholder');
      const val = this.t(key);
      if (val) {
        elem.setAttribute('placeholder', val);
      }
    });

    // 4. Actualizar badge visible en header
    const langBadge = document.getElementById('current-lang-code');
    if (langBadge) {
      const current = I18N_LANGUAGES[this.currentLang];
      langBadge.textContent = current.code.toUpperCase();
    }

    // 5. Marcar tarjeta activa en modal de idioma
    document.querySelectorAll('.lang-card').forEach(card => {
      card.classList.toggle('active', card.dataset.lang === this.currentLang);
    });

    // 6. Notificar a la app activa si existe
    if (window.sudokuApp && typeof window.sudokuApp.onLanguageChanged === 'function') {
      window.sudokuApp.onLanguageChanged(this.currentLang);
    }
  }
}

// Singleton global
window.i18n = new I18nManager();
