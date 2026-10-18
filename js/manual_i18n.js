
const MANUAL_FULL_CONTENT = {
  es: {
    back: '← Volver al Juego',
    title: 'Manual Oficial del Jugador',
    subtitle: 'Sudoku Arena • Competición Lógica, Coste de Oportunidad y Auditoría de Puntos',
    nav_intro: 'Guía oficial para aprender a resolver sudokus con lógica pura, dominar el motor de puntuación por coste de oportunidad y competir en igualdad de condiciones en duelos y retos semanales.',
    sec1_title: '1. Niveles de Dificultad y Técnicas Humanas',
    sec1_p1: 'A diferencia de los sudokus convencionales que se basan únicamente en cuántos números faltan, en <strong>Sudoku Arena</strong> los tableros se clasifican según las técnicas lógicas humanas requeridas para resolverlos sin adivinar:',
    th_diff: 'Dificultad',
    th_clues: 'Pistas Iniciales',
    th_value: 'Valor por Casilla',
    th_tech: 'Técnicas Lógicas Requeridas',
    sec2_title: '2. Controles en Móvil y Ordenador',
    sec2_sub1: '📱 En Smartphone o Tablet',
    sec2_m1: '<strong>Seleccionar celda:</strong> Toca cualquier casilla del tablero para activarla.',
    sec2_m2: '<strong>Teclado de pulgar (1 al 9):</strong> Introduce el número con un toque.',
    sec2_m3: '<strong>Barra táctica inferior:</strong> Botones rápidos para Borrar (⌫), Lupa (🔍), Rayos X (⚡), Resolver (🏳️) y Retar (⚔️).',
    sec2_sub2: '💻 En Ordenador (PC o Portátil)',
    sec2_pc1: '<strong>Teclas 1 al 9:</strong> Introducir número en la celda activa.',
    sec2_pc2: '<strong>Flechas del teclado:</strong> Desplazarse por el tablero rápidamente.',
    sec2_pc3: '<strong>Atajos rápidos:</strong> Espacio/P (Lupa), X (Rayos X), L (Libro mayor de auditoría).',
    sec3_title: '3. Motor de Puntuación por Coste de Oportunidad',
    sec3_p1: 'Cada partida comienza con un <strong>Techo Teórico Máximo</strong> calculado sumando el valor de todas las casillas vacías según la dificultad.',
    sec3_p2: 'Cada casilla correcta suma su valor a tu saldo. Las consultas quirúrgicas y los errores descuentan puntos directamente de tu techo máximo.',
    sec4_title: '4. Las Ayudas Tácticas y sus Penalizaciones',
    sec4_sub1: '🔍 Inspección Quirúrgica (Modo Lupa)',
    sec4_lupa_p: 'Revela los candidatos legales de una casilla seleccionada. El coste de oportunidad descontará el 100% del valor de esa celda de tu techo de puntos.',
    sec4_sub2: '⚡ Rayos X Globales (Todas las Posibilidades)',
    sec4_rayos_p: 'Muestra simultáneamente todos los candidatos del tablero. Descuenta puntos según las deducciones asistidas por la máquina.',
    sec4_sub3: '🏳️ Resolución por Sistema (Rendición)',
    sec4_solve_p: 'La máquina completa el sudoku de forma automática. Las casillas resueltas no otorgan ningún punto.',
    sec5_title: '5. Índice de Autonomía Mental y Rangos',
    sec5_p1: 'El <strong>Índice de Autonomía</strong> mide qué porcentaje de puntos has ganado por tu propia mente sin ayudas de la máquina:',
    rank1: '🏅 <strong>Gran Maestro Puro (100% Autonomía):</strong> Tablero completado sin una sola ayuda ni penalización.',
    rank2: '🎖️ <strong>Maestro Táctico (80% - 99%):</strong> Resolución sólida con máxima autonomía.',
    rank3: '🎗️ <strong>Estratega Asistido (50% - 79%):</strong> Buen dominio con consultas puntuales de candidatos.',
    rank4: '🎮 <strong>Jugador Casual (&lt; 50%):</strong> Partida con uso intensivo de ayudas.',
    sec6_title: '6. Modo Duelo: Cómo Crear un Nuevo Planteamiento y Competir',
    sec6_p1: 'El botón <strong>⚔️ Nuevo Duelo</strong> permite generar un tablero nuevo con la dificultad elegida y compartirlo con amigos mediante enlace o código de partida.',
    sec6_sub1: '👥 Cómo se Conecta tu Rival',
    sec6_rival_p: 'Tu rival solo tiene que entrar en el enlace compartido o pulsar en "⚔️ Duelo" e introducir el código (ej: <code>ARENA-MEDI-83920</code>). Ambos jugarán el mismo sudoku exacto.',
    sec7_title: '7. Consejos para Lograr el Rango de Gran Maestro',
    tip1: 'Comienza siempre por los <strong>números únicos ocultos</strong> en filas, columnas y regiones 3x3.',
    tip2: 'Evita adivinar: cada error descuenta 15 puntos directos de tu puntuación.',
    tip3: 'Usa la Lupa solo en situaciones de bloqueo extremo para no perder puntos de tu techo.',
    sec8_title: '8. Reto Semanal Oficial y Posicionamiento de Puntos',
    sec8_p1: 'Cada lunes a las 00:00 UTC, el motor algorítmico genera una <strong>plantilla oficial única por nivel</strong> (Fácil, Medio, Difícil y Endemoniado) exactamente idéntica para todos los jugadores del planeta.',
    sec8_p2: 'Tu porcentaje de puntos obtenidos sobre el techo total determina tu posición en la escala competitiva: 💎 Diamante (95-100%, Top 5%), 🥇 Oro (85-94%, Top 15%), 🥈 Plata (70-84%, Top 35%), 🥉 Bronce (50-69%, Top 60%).'
  },
  va: {
    back: '← Tornar al Joc',
    title: 'Manual Oficial del Jugador',
    subtitle: 'Sudoku Arena • Competició Lògica, Cost d'Oportunitat & Auditoria de Punts',
    nav_intro: 'Guia oficial per a aprendre a resoldre sudokus amb lògica pura, dominar el motor de puntuació per cost d'oportunitat i competir en igualtat de condicions en duels i reptes setmanals.',
    sec1_title: '1. Nivells de Dificultat i Tècniques Humanes',
    sec1_p1: 'A diferència dels sudokus convencionals basats només en quantes xifres falten, en <strong>Sudoku Arena</strong> els taulers es classifiquen segons les tècniques lògiques humanes necessàries sense endevinar:',
    th_diff: 'Dificultat',
    th_clues: 'Pistes Inicials',
    th_value: 'Valor per Casella',
    th_tech: 'Tècniques Lògiques Requerides',
    sec2_title: '2. Controls en Mòbil i Ordinador',
    sec2_sub1: '📱 En Smartphone o Tauleta',
    sec2_m1: '<strong>Seleccionar cel·la:</strong> Toca qualsevol casella del tauler per a activar-la.',
    sec2_m2: '<strong>Teclat de polze (1 al 9):</strong> Introduïx el número amb un toc ràpid.',
    sec2_m3: '<strong>Barra tàctica inferior:</strong> Botons ràpids per a Borrar (⌫), Lupa (🔍), Raigs X (⚡), Resoldre (🏳️) i Reptar (⚔️).',
    sec2_sub2: '💻 En Ordinador (PC o Portàtil)',
    sec2_pc1: '<strong>Tecles 1 al 9:</strong> Introduir número en la cel·la activa.',
    sec2_pc2: '<strong>Fletxes del teclat:</strong> Desplaçar-se pel tauler ràpidament.',
    sec2_pc3: '<strong>Dreceres de teclat:</strong> Espai/P (Lupa), X (Raigs X), L (Llibre major d'auditoria).',
    sec3_title: '3. Motor de Puntuació per Cost d'Oportunitat',
    sec3_p1: 'Cada partida comença amb un <strong>Sostre Teòric Màxim</strong> calculat sumant el valor de totes les caselles buides segons la dificultat.',
    sec3_p2: 'Cada encert suma el seu valor al teu saldo. Les consultes i els errors resten punts directament del teu sostre màxim.',
    sec4_title: '4. Les Ajudes Tàctiques i les seues Penalitzacions',
    sec4_sub1: '🔍 Inspecció Quirúrgica (Mode Lupa)',
    sec4_lupa_p: 'Revetla els candidats legals de la casella seleccionada. El cost d'oportunitat descomptarà el 100% del valor d'eixa cel·la del teu sostre de punts.',
    sec4_sub2: '⚡ Raigs X Globals (Totes les Possibilitats)',
    sec4_rayos_p: 'Mostra simultàniament tots els candidats del tauler. Descompta punts segons les deduccions assistides per la màquina.',
    sec4_sub3: '🏳️ Resolució per Sistema (Rendició)',
    sec4_solve_p: 'La màquina completa el sudoku de forma automàtica. Les caselles resoltes no atorguen cap punt.',
    sec5_title: '5. Índex d'Autonomia Mental i Rangs',
    sec5_p1: 'L'<strong>Índex d'Autonomia</strong> mesura quin percentatge de punts has guanyat per la teua pròpia ment sense ajudes de la màquina:',
    rank1: '🏅 <strong>Gran Mestre Pur (100% Autonomia):</strong> Tauler completat sense cap ajuda ni penalització.',
    rank2: '🎖️ <strong>Mestre Tàctic (80% - 99%):</strong> Resolució sòlida amb màxima autonomia.',
    rank3: '🎗️ <strong>Estrateg Assistit (50% - 79%):</strong> Bon domini amb consultes puntuals de candidats.',
    rank4: '🎮 <strong>Jugador Casual (&lt; 50%):</strong> Partida amb ús intensiu d'ajudes.',
    sec6_title: '6. Mode Duel: Com Crear un Nou Plantejament i Competir',
    sec6_p1: 'El botó <strong>⚔️ Nou Duel</strong> permet generar un tauler nou amb la dificultat triada i compartir-lo amb amics mitjançant enllaç o codi de partida.',
    sec6_sub1: '👥 Com es Connecta el teu Rival',
    sec6_rival_p: 'El teu rival només ha d'entrar en l'enllaç compartit o prémer en "⚔️ Duel" i introduir el codi (ex: <code>ARENA-MEDI-83920</code>). Ambdós jugaran el mateix sudoku exacte.',
    sec7_title: '7. Consells per Assolir el Rang de Gran Mestre',
    tip1: 'Comença sempre pels <strong>números únics ocults</strong> en files, columnes i regions 3x3.',
    tip2: 'Evita endevinar: cada error descompta 15 punts directes de la teua puntuació.',
    tip3: 'Usa la Lupa només en situacions de bloqueig extrem per a no perdre punts del teu sostre.',
    sec8_title: '8. Repte Setmanal Oficial i Posicionament de Punts',
    sec8_p1: 'Cada dilluns a les 00:00 UTC, el motor algorítmic genera una <strong>plantilla oficial única per nivell</strong> (Fàcil, Mig, Difícil i Endimoniat) exactament idèntica per a tots els jugadors del planeta.',
    sec8_p2: 'El teu percentatge de punts obtinguts sobre el sostre total determina la teua posició en l'escala competitiva: 💎 Diamant (95-100%, Top 5%), 🥇 Or (85-94%, Top 15%), 🥈 Plata (70-84%, Top 35%), 🥉 Bronze (50-69%, Top 60%).'
  },
  en: {
    back: '← Back to Game',
    title: 'Official Player Manual',
    subtitle: 'Sudoku Arena • Logical Competition, Opportunity Cost & Score Audit',
    nav_intro: 'Official guide to mastering logical sudoku solving, understanding the opportunity cost scoring engine, and competing fairly in duels and weekly challenges.',
    sec1_title: '1. Difficulty Levels and Human Logic Techniques',
    sec1_p1: 'Unlike standard sudokus that just count missing numbers, in <strong>Sudoku Arena</strong> boards are classified by the human logical techniques required to solve them without guessing:',
    th_diff: 'Difficulty',
    th_clues: 'Starting Clues',
    th_value: 'Value per Cell',
    th_tech: 'Required Logic Techniques',
    sec2_title: '2. Mobile and Desktop Controls',
    sec2_sub1: '📱 On Smartphone or Tablet',
    sec2_m1: '<strong>Select cell:</strong> Tap any board cell to activate it.',
    sec2_m2: '<strong>Thumb keypad (1 to 9):</strong> Enter numbers with a quick tap.',
    sec2_m3: '<strong>Bottom tactical bar:</strong> Quick buttons for Erase (⌫), Magnifier (🔍), X-Ray (⚡), Solve (🏳️) and Duel (⚔️).',
    sec2_sub2: '💻 On Desktop (PC or Laptop)',
    sec2_pc1: '<strong>Keys 1 to 9:</strong> Enter number into the active cell.',
    sec2_pc2: '<strong>Arrow keys:</strong> Move across the grid swiftly.',
    sec2_pc3: '<strong>Shortcuts:</strong> Space/P (Magnifier), X (X-Ray), L (Score audit ledger).',
    sec3_title: '3. Opportunity Cost Scoring Engine',
    sec3_p1: 'Every match starts with a <strong>Theoretical Maximum Ceiling</strong> calculated by summing the value of all empty cells according to difficulty.',
    sec3_p2: 'Every correct cell adds points to your balance. Surgical peeks and errors deduct points directly from your maximum score ceiling.',
    sec4_title: '4. Tactical Assists and Penalties',
    sec4_sub1: '🔍 Surgical Inspection (Magnifier Mode)',
    sec4_lupa_p: 'Reveals legal candidates for the selected cell. Opportunity cost deducts 100% of that cell's value from your ceiling.',
    sec4_sub2: '⚡ Global X-Ray (All Possibilities)',
    sec4_rayos_p: 'Shows all board candidates at once. Deducts points based on machine deductions.',
    sec4_sub3: '🏳️ System Auto-Solve (Surrender)',
    sec4_solve_p: 'The engine completes the grid automatically. Solved cells award 0 points.',
    sec5_title: '5. Mental Autonomy Index and Ranks',
    sec5_p1: 'The <strong>Autonomy Index</strong> measures what percentage of score you earned with your own pure mind without system assists:',
    rank1: '🏅 <strong>Pure Grandmaster (100% Autonomy):</strong> Grid finished with zero assists and zero penalties.',
    rank2: '🎖️ <strong>Tactical Master (80% - 99%):</strong> Strong performance with top autonomy.',
    rank3: '🎗️ <strong>Assisted Strategist (50% - 79%):</strong> Solid play with occasional candidate inspection.',
    rank4: '🎮 <strong>Casual Player (&lt; 50%):</strong> Match completed with extensive assist usage.',
    sec6_title: '6. Duel Mode: How to Create a New Match and Compete',
    sec6_p1: 'The <strong>⚔️ New Duel</strong> button allows creating a fresh board with your chosen difficulty to share with friends via link or match code.',
    sec6_sub1: '👥 How Your Rival Connects',
    sec6_rival_p: 'Your rival simply opens the shared link or clicks on "⚔️ Duel" and enters the code (e.g. <code>ARENA-MEDI-83920</code>). Both will solve the exact same board.',
    sec7_title: '7. Tips to Achieve Pure Grandmaster Rank',
    tip1: 'Always look for <strong>hidden singles</strong> across rows, columns, and 3x3 boxes.',
    tip2: 'Never guess: each mistake immediately docks 15 points from your score.',
    tip3: 'Use the Magnifier only when completely stuck to preserve your ceiling points.',
    sec8_title: '8. Official Weekly Challenge and Score Positioning',
    sec8_p1: 'Every Monday at 00:00 UTC, the algorithm generates an <strong>official unique board per level</strong> (Easy, Medium, Hard, Evil) identical for all players globally.',
    sec8_p2: 'Your percentage of points scored against the ceiling determines your global competitive tier: 💎 Diamond (95-100%, Top 5%), 🥇 Gold (85-94%, Top 15%), 🥈 Silver (70-84%, Top 35%), 🥉 Bronze (50-69%, Top 60%).'
  }
};

function applyManualLanguage(lang) {
  if (!MANUAL_FULL_CONTENT[lang]) lang = 'es';
  localStorage.setItem('sudoku_arena_lang', lang);
  document.documentElement.lang = lang;

  const data = MANUAL_FULL_CONTENT[lang] || MANUAL_FULL_CONTENT.es;

  document.querySelectorAll('[data-m-i18n]').forEach(el => {
    const key = el.getAttribute('data-m-i18n');
    if (data[key]) el.innerHTML = data[key];
  });

  const codeEl = document.getElementById('manual-active-lang');
  if (codeEl) codeEl.textContent = lang.toUpperCase();

  document.querySelectorAll('.manual-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('sudoku_arena_lang') || 'es';
  applyManualLanguage(saved);

  document.querySelectorAll('.manual-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyManualLanguage(btn.dataset.lang);
    });
  });
});
