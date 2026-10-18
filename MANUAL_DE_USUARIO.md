# ⚡ Manual del Jugador — Sudoku Arena
### Motor de Puntuación Cognitiva, Auditoría y Competición Multijugador

Bienvenido a **Sudoku Arena**. Este manual describe detalladamente el funcionamiento de la aplicación, las reglas del juego, el sistema de puntuación por coste de oportunidad y cómo competir contra otros jugadores en igualdad de condiciones.

---

## 📑 Índice de Contenidos
1. [¿Qué hace único a Sudoku Arena?](#1-qué-hace-único-a-sudoku-arena)
2. [Los 4 Niveles de Dificultad y Técnicas Lógicas](#2-los-4-niveles-de-dificultad-y-técnicas-lógicas)
3. [Cómo Jugar: Controles en Móvil y Ordenador](#3-cómo-jugar-controles-en-móvil-y-ordenador)
4. [El Motor de Puntuación (Opportunity Cost Engine)](#4-el-motor-de-puntuación-opportunity-cost-engine)
5. [Las Ayudas Tácticas y sus Penalizaciones](#5-las-ayudas-tácticas-y-sus-penalizaciones)
   - [A. Inspección Quirúrgica (Modo Lupa)](#a-inspección-quirúrgica-modo-lupa)
   - [B. Rayos X Globales (Todas las Posibilidades)](#b-rayos-x-globales-todas-las-posibilidades)
   - [C. Resolución por el Sistema (Rendición)](#c-resolución-por-el-sistema-rendición)
6. [Índice de Autonomía Mental y Rangos Cognitivos](#6-índice-de-autonomía-mental-y-rangos-cognitivos)
7. [El Libro Mayor de Auditoría de Puntos](#7-el-libro-mayor-de-auditoría-de-puntos)
8. [Modo Duelo: Cómo Competir con Amigos](#8-modo-duelo-cómo-competir-con-amigos)
9. [Consejos Tácticos para Convertirte en Gran Maestro](#9-consejos-tácticos-para-convertirte-en-gran-maestro)

---

## 1. ¿Qué hace único a Sudoku Arena?

En la mayoría de aplicaciones de sudoku tradicionales:
- Todos los sudokus otorgan una puntuación arbitraria basada solo en el tiempo.
- Se fomenta adivinar números (*tanteo a ciegas* o *fuerza bruta*).
- Los botones de pista te dan la solución gratis o te revelan números sin consecuencias.

**Sudoku Arena cambia completamente las reglas:**
1. **Solución Única Garantizada**: Todos los tableros se generan mediante algoritmos deterministas con solución única matemática.
2. **Cada Casilla Tiene un Valor Real**: Una casilla fácil suma pocos puntos; una casilla que requiere deducciones avanzadas suma muchos más puntos.
3. **Ayudas con Coste de Oportunidad**: Puedes pedir ayuda en cualquier momento, pero la máquina deducirá puntos de tu techo máximo según la ventaja que obtengas.
4. **Auditoría Transparente**: Cada jugada, fallo o ayuda queda registrada cronológicamente en un libro mayor contable.
5. **Duelos Idénticos**: Dos jugadores pueden enfrentarse exactamente al mismo tablero compartiendo un código de desafío.

---

## 2. Los 4 Niveles de Dificultad y Técnicas Lógicas

La dificultad no se mide por la cantidad de casillas vacías, sino por la **técnica deductiva humana** necesaria para resolverlas:

| Nivel | Nombre | Pistas Iniciales | Técnicas Requeridas | Puntos Base por Casilla |
| :---: | :--- | :---: | :--- | :---: |
| 🟢 | **Fácil** | 42 pistas | Candidatos Únicos Desnudos (*Naked Singles*) | 10 pts |
| 🟡 | **Medio** | 34 pistas | Candidatos Únicos Ocultos (*Hidden Singles*) en fila/col/caja | 15 pts |
| 🔴 | **Difícil** | 28 pistas | Pares Desnudos/Ocultos, Bloqueo de Líneas (*Pointing Pairs*) | 25 - 30 pts |
| 🟣 | **Endemoniado** | 22 pistas | X-Wing, Pez Espada (*Swordfish*), Cadenas Forzadas (*XY-Wing*) | 50 - 100 pts |

---

## 3. Cómo Jugar: Controles en Móvil y Ordenador

### 📱 En Pantalla Móvil / Smartphone (Zona de Pulgar)
La interfaz móvil está optimizada para jugar con una o dos manos:
- **Seleccionar casilla**: Toca cualquier casilla del tablero 9x9. Se iluminará en azul y se resaltará su fila, columna y cuadrante 3x3.
- **Introducir número**: Pulsa los botones del **1 al 9** en el teclado táctil inferior. Sentirás una vibración háptica de confirmación.
- **Borrar**: Pulsa el botón **⌫ Borrar** en la barra táctil inferior.
- **Usar ayudas tácticas**: Pulsa los botones **🔍 Lupa**, **⚡ Rayos X**, **🏳️ Resolver** o **⚔️ Retar** ubicados en la barra inferior.
- **Ver Auditoría**: Toca el botón **📋 Auditoría** en el marcador superior para abrir el historial completo.

### 💻 En Ordenador (Teclado y Ratón)
- **Navegación**: Utiliza las **Flechas de Dirección** (← ↑ ↓ →) o haz clic con el ratón.
- **Colocar Números**: Pulsa las teclas numéricas del **1 al 9**.
- **Borrar**: Tecla **Supr**, **Retroceso** o **0**.
- **Atajos Rápidos de Teclado**:
  - Tecla **P** o **Barra Espaciadora**: Abrir Inspección Quirúrgica (Lupa).
  - Tecla **X**: Abrir Rayos X Globales.
  - Tecla **L**: Abrir Libro Mayor de Auditoría.
  - Tecla **Escape**: Cerrar cualquier ventana emergente.

---

## 4. El Motor de Puntuación (Opportunity Cost Engine)

Al comenzar una partida, el sistema evalúa cada casilla vacía y calcula el **Techo Inicial de Puntos**:
La suma del valor lógico de todas las casillas vacías al inicio.

- **Acierto**: Sumas los puntos asignados a esa casilla a tu marcador neto.
- **Fallo / Error**: Introducir un número incorrecto penaliza **-15 puntos** directos de tu marcador neto y cuenta como falta.
- **Techo Máximo Alcanzable**: Disminuye cada vez que cometes errores o utilizas ayudas del sistema.

---

## 5. Las Ayudas Tácticas y sus Penalizaciones

Sudoku Arena permite solicitar ayuda pedagógica, pero penaliza el techo de puntos proporcionalmente a la información revelada:

### A. Inspección Quirúrgica (Modo Lupa 🔍)
- **¿Qué hace?**: Revela los números matemáticamente posibles (*candidatos*) **únicamente para la casilla que tienes seleccionada**, sin revelar nada del resto del tablero.
- **Coste de Oportunidad**: Se anulan los puntos potenciales de esa casilla en el techo final (pierdes el derecho a puntuar esa celda por haber necesitado la ayuda de la máquina).

### B. Rayos X Globales (Modo Escáner ⚡)
- **¿Qué hace?**: Muestra de golpe todos los candidatos posibles en **todas las casillas vacías del tablero**.
- **Penalización Matemática Escalonada**: Como ver todas las posibilidades facilita enormemente la resolución, la máquina aplica un descuento severo:
  - Casillas con **1 sola posibilidad directa**: Penalización del **100%** de sus puntos (la máquina te lo ha regalado).
  - Casillas con **2 posibilidades**: Penalización del **50%** de sus puntos.
  - Casillas con **3 posibilidades**: Penalización del **25%** de sus puntos.
  - Casillas con **4 o más posibilidades**: Penalización del **10%**.

### C. Resolución por el Sistema (Rendición 🏳️)
- **¿Qué hace?**: La máquina completa instantáneamente todas las casillas vacías pendientes.
- **Consecuencia**: Todas las casillas autocompletadas por el motor reciben **0 puntos**. Solo conservarás los puntos netos de las casillas que colocaste tú mismo correctamente.

---

## 6. Índice de Autonomía Mental y Rangos Cognitivos

Al finalizar la partida (o en tiempo real durante la misma), el sistema evalúa tu grado de independencia cognitiva con la siguiente fórmula:

Autonomía Mental (%) = (Puntos Netos Obtenidos / Techo Teórico Inicial) * 100

Según tu porcentaje de autonomía, obtendrás uno de los 4 rangos de honor:

| Rango | Medalla | Autonomía | Descripción |
| :--- | :---: | :---: | :--- |
| **Gran Maestro Puro** | 🥇 | **100%** | Resolución impecable sin un solo fallo, sin consultar la lupa y sin activar rayos X. Máxima maestría lógica. |
| **Lógico Quirúrgico** | 🥈 | **80% – 99%** | Resolución brillante con mínimas consultas puntuales de lupa o fallos aislados rápidamente corregidos. |
| **Resolutor Pragmático**| 🥉 | **50% – 79%** | Juego con uso moderado de asistencias o activación de rayos X para desatascar fases complejas. |
| **Con Ruedines** | 🚸 | **< 50%** | Partida con alta dependencia de la máquina o resolución automática asistida. ¡Toca seguir entrenando! |

---

## 7. El Libro Mayor de Auditoría de Puntos

Pulsando el botón **📋 Auditoría** (o la tecla **L**), accedes al registro contable de la partida. Cada fila muestra:
- **Hora**: Minuto y segundo exacto de la acción.
- **Acción**: INIT, HIT (acierto), ERROR (fallo), PEEK_CELL (lupa), PEEK_ALL (rayos X) o AUTO_SOLVE (resolución máquina).
- **Delta**: Variación puntual de puntos (+25, -15, -50).
- **Saldo**: Puntuación neta acumulada en ese instante.
- **Techo**: Límite máximo de puntos que aún puedes alcanzar.
- **Detalle Operativo**: Explicación técnica (fila, columna, números candidatos detectados, etc.).

---

## 8. Modo Duelo: Cómo Crear un Nuevo Planteamiento y Competir

Sudoku Arena permite celebrar **competiciones justas en igualdad matemática de condiciones**. A diferencia de los sudokus habituales donde cada jugador tiene un tablero distinto, aquí ambos contrincantes resuelven exactamente la misma matriz, con el mismo orden de casillas y el mismo techo inicial de puntos.

---

### ⚔️ Paso a Paso: Crear un Nuevo Duelo por Dificultad

1. **Pulsar el botón `⚔️ Nuevo Duelo`**:
   - En la cabecera superior (o en la barra táctil del móvil), pulsa el botón destacado **`⚔️ Nuevo Duelo`**.
   - Se abrirá la ventana de configuración del enfrentamiento.

2. **Seleccionar la Dificultad del Duelo**:
   Elige el nivel de exigencia lógica para el duelo:
   - 🟢 **Fácil**: 42 pistas iniciales • 10 pts/celda (ideal para principiantes y partidas rápidas de agilidad visual).
   - 🟡 **Medio**: 34 pistas iniciales • 15 pts/celda (equilibrio táctico recomendado).
   - 🔴 **Difícil**: 28 pistas iniciales • 30 pts/celda (bloqueos de línea, pares y tríos ocultos).
   - 🟣 **Endemoniado**: 22 pistas iniciales • 100 pts/celda (deducciones avanzadas con cadenas forzadas, X-Wing y Pez Espada).

3. **Generación de Semilla Matemática en Tiempo Real**:
   - Al pulsar cualquier dificultad, el sistema genera de inmediato un código de partida único (por ejemplo: `ARENA-DIFI-44026`).
   - Si deseas otro planteamiento diferente dentro del mismo nivel, pulsa el botón **`🎲 Cambiar Semilla`** tantas veces como quieras.

4. **Invitar a tu Rival y Empezar a Jugar**:
   Tienes dos botones a tu disposición:
   - **`📋 Copiar Enlace para Rivales`**: Copia al portapapeles una invitación formal lista para pegar en WhatsApp, Telegram o correo:
     ```text
     ⚔️ ¡Te reto en Sudoku Arena!
     Nivel: DIFÍCIL
     Código: ARENA-DIFI-44026
     Entra a competir directamente con este enlace:
     http://localhost/sudoku-arena/?desafio=ARENA-DIFI-44026
     ```
   - **`🎮 Jugar Este Duelo Ahora`**: Cierra el panel, carga el nuevo sudoku generado en tu pantalla, reinicia el cronómetro y fija el código de desafío en la cabecera.

---

### 👥 Cómo se Une tu Rival al Duelo

Tu contrincante tiene dos formas sencillas de conectarse al mismo duelo:
- **Opción A (Enlace Directo)**: Solo tiene que abrir el enlace que le enviaste por el móvil o el navegador. La aplicación se abrirá cargando directamente el mismo tablero exacto.
- **Opción B (Pegar el Código)**: Si tu rival ya tiene la app abierta, puede pulsar el botón **`⚔️ Nuevo Duelo`**, bajar a la casilla *"¿Te han retado a ti?"*, pegar el código (ej: `ARENA-DIFI-44026`) y pulsar **`Cargar Duelo`**.

---

### 🏆 Criterio de Victoria del Duelo

Al finalizar el tablero, el sistema muestra la tarjeta oficial de auditoría:
1. **1º Criterio (Puntuación Neta)**: Gana quien consiga el mayor número de puntos netos.
2. **2º Criterio (Índice de Autonomía Mental %)**: Quien haya resuelto con mayor autonomía (menos ayudas o consultas de lupa/rayos X).
3. **3º Criterio (Tiempo de Cronómetro)**: En caso de empate a puntos y autonomía, el tiempo más rápido desempata la partida.

## 9. Consejos Tácticos para Convertirte en Gran Maestro

1. **Aprovecha el Descarte Sistemático**: Busca primero filas, columnas o cajas 3x3 que tengan ya 6 o 7 números colocados; en ellas es mucho más fácil deducir los números restantes.
2. **No Adivines**: Cada fallo cuesta **-15 puntos** y reduce tu índice de autonomía. Si dudas entre dos casillas, busca otra zona del tablero antes de arriesgarte.
3. **Usa la Lupa con Cabeza**: Si estás totalmente bloqueado, usar la **Lupa en una sola casilla estratégica** solo te resta los puntos de esa celda (ej. 15 o 25 pts), mientras que activar **Rayos X** deducirá puntos de decenas de casillas a la vez.
4. **Vigila el Techo de Puntos**: Tu objetivo no es solo resolver el sudoku, sino mantener la barra de Autonomía lo más cerca posible del **100%**.
