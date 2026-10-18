# 🚀 Guía de Publicación en Google Play y Apple App Store
## Proyecto: Sudoku Arena (Capacitor)

Esta guía contiene todas las instrucciones técnicas y metadatos para que el desarrollador (tu hijo) pueda empaquetar, compilar y publicar **Sudoku Arena** en **Google Play Store** (Android) y **Apple App Store** (iOS) usando **Capacitor**.

---

### 📦 1. Estructura de Ficheros Preparada en el Proyecto

El proyecto ya incluye todo lo necesario para la compilación nativa:
- `manifest.json`: Web App Manifest con orientación vertical, colores de tema y metadatos PWA.
- `capacitor.config.json`: Configuración del Bundle ID (`com.toppharma.sudokuarena`), nombre de app y pantallas de inicio (*Splash Screen*).
- `package.json`: Dependencias de Capacitor 6/7 listas.
- `icons/`: Iconos vectoriales de alta resolución (`icon-192.svg` e `icon-512.svg`).
- `privacidad.html`: Política de privacidad obligatoria que exige Google Play y Apple para la ficha de la tienda.

---

### 🛠️ 2. Pasos para Compilar en Android (Google Play)

**Requisitos**: Ordenador con Node.js y [Android Studio](https://developer.android.com/studio) instalado.

1. Abrir la terminal en la carpeta del proyecto:
   ```bash
   cd C:\laragon\www\sudoku-arena
   ```

2. Instalar dependencias de Capacitor:
   ```bash
   npm install
   ```

3. Generar el proyecto nativo de Android:
   ```bash
   npx cap add android
   npx cap sync
   ```

4. Abrir el proyecto en Android Studio:
   ```bash
   npx cap open android
   ```

5. En Android Studio:
   - Ir al menú: **Build > Generate Signed Bundle / APK**.
   - Elegir **Android App Bundle (.aab)** (el formato obligatorio de Google Play).
   - Seleccionar o crear la clave de firma (*keystore*).
   - Generar el archivo `.aab` listo para subir a **Google Play Console**.

---

### 🍏 3. Pasos para Compilar en iOS (Apple App Store)

**Requisitos**: Un Mac con [Xcode](https://developer.apple.com/xcode/) instalado y cuenta de Apple Developer.

1. En el Mac, situarse en la carpeta del proyecto o clonarlo:
   ```bash
   npm install
   ```

2. Añadir la plataforma iOS:
   ```bash
   npx cap add ios
   npx cap sync
   ```

3. Abrir el proyecto en Xcode:
   ```bash
   npx cap open ios
   ```

4. En Xcode:
   - En la pestaña **Signing & Capabilities**, seleccionar tu cuenta de desarrollador de Apple (*Team*).
   - Conectar un iPhone o seleccionar un simulador para probarlo.
   - Para enviar a App Store: Seleccionar dispositivo **Any iOS Device (arm64)** y pulsar **Product > Archive**.
   - Al finalizar, pulsar **Distribute App** para subirlo automáticamente a **App Store Connect / TestFlight**.

---

### 📋 4. Ficha y Textos para las Tiendas (Copiar y Pegar)

#### Datos Básicos
- **Nombre de la App**: Sudoku Arena — Reto Lógico
- **Nombre Corto**: Sudoku Arena
- **Bundle ID / Package Name**: `com.toppharma.sudokuarena`
- **Categoría**: Juegos / Puzles / Lógica / Juegos de Mesa
- **Precio**: Gratis (Sin anuncios ni compras integradas)
- **Clasificación por edades**: PEGI 3 / 4+ (Apto para todos los públicos)

#### Descripción Breve (80 caracteres)
> Sudoku táctico con clasificación lógica de dificultad y duelos multijugador.

#### Descripción Completa (Google Play y App Store)
```text
¿Cansado de los sudokus que se resuelven adivinando? Bienvenido a Sudoku Arena.

Sudoku Arena es un juego de sudoku táctico diseñado para desafiar tu agilidad deductiva real sin tanteo a ciegas. Cada casilla tiene un valor en puntos según la técnica lógica humana necesaria para resolverla (candidatos únicos, números ocultos, pares y cadenas).

CARACTERÍSTICAS PRINCIPALES:
⚡ 4 Niveles de Dificultad Real: Fácil, Medio, Difícil y Endemoniado, con soluciones únicas garantizadas por algoritmo.
🎯 Motor de Puntuación Cognitiva: Cada acierto suma según su complejidad lógica.
🔍 Inspección Quirúrgica (Lupa): Consulta las posibilidades de una casilla activa con coste de oportunidad en tu techo de puntos.
⚡ Rayos X Globales: Escanea todos los candidatos del tablero con penalización matemática escalonada.
🧠 Índice de Autonomía Mental: Descubre tu rango real (Gran Maestro Puro, Lógico Quirúrgico, Resolutor Pragmático o Con Ruedines).
📋 Libro Mayor de Auditoría: Revisa la trazabilidad de cada acierto, fallo y deducción.
⚔️ Modo Duelo / Códigos Compartibles: Reta a tus amigos a resolver exactamente el mismo tablero con un código de partida único.

100% PRIVADO Y SIN PUBLICIDAD:
• Sin anuncios molestos ni interrupciones.
• No requiere conexión a internet para jugar (offline-first).
• 0 datos personales recopilados.
```

#### Palabras Clave / Keywords (App Store)
`sudoku, puzzle, logica, duelos, entrenamiento cerebral, solver, rompecabezas, matematicas, mente`

#### URL de Política de Privacidad (Requerida por Google y Apple)
`https://guitusol.github.io/sudoku-arena/privacidad.html` *(o la URL donde se publique)*
