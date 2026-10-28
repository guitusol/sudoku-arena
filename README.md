# ⚡ SUDOKU ARENA — Competición Lógica & Auditoría Cognitiva

Aplicación interactiva y pedagógica de Sudoku táctico con clasificación de dificultad por técnicas lógicas humanas, motor de puntuación por coste de oportunidad y duelos multijugador sincronizados mediante semillas reproducibles.

Desarrollado para **Guillermo Tudela Soler / Conectividad y Comunicaciones, S.L.**

---

## 👨‍💻 ¡Hola! Instrucciones Rápidas para el Desarrollador (Publicación en Tiendas)

Si eres el hijo de Guillermo y vas a empaquetar y subir la app a **Google Play Store** y **Apple App Store**, todo el proyecto está preparado con **Capacitor 6/7** para que no tengas que configurar nada desde cero.

### 📚 Documentos Clave en este Repositorio:
1. **[GUIA_PUBLICACION_TIENDAS.md](./GUIA_PUBLICACION_TIENDAS.md)**: Manual técnico paso a paso con los comandos de terminal exactos, configuración de Android Studio, Xcode y los textos listos para copiar y pegar en la ficha de ambas tiendas.
2. **[MANUAL_DE_USUARIO.md](./MANUAL_DE_USUARIO.md)**: Manual oficial del juego con todas las reglas, puntuaciones, penalizaciones y el nuevo sistema de duelos.
3. **[privacidad.html](./privacidad.html)**: Política de privacidad obligatoria requerida por Google y Apple (100% conforme: 0 datos personales, sin anuncios, sin trackers).
4. **[ROADMAP_MONETIZACION_ETICA.md](./ROADMAP_MONETIZACION_ETICA.md)**: Especificación de la futura monetización ética no invasiva (Stripe Payment Links y micro-aportaciones voluntarias).

---

## ⚡ Comandos Rápidos de Publicación (Capacitor)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Para Android (Google Play)
```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```
- En **Android Studio**: `Build > Generate Signed Bundle / APK` y seleccionar **Android App Bundle (.aab)**.

### 3. Para iOS (Apple App Store)
*(Desde macOS)*
```bash
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```
- En **Xcode**: Seleccionar Team de Apple Developer, dispositivo `Any iOS Device (arm64)`, y pulsar `Product > Archive > Distribute App`.

---

## 📁 Estructura del Proyecto

```text
sudoku-arena/
├── index.html                   # Vista principal de la app y modales tácticos
├── manual.html                  # Manual del jugador interactivo integrado
├── privacidad.html              # Política de privacidad obligatoria para las tiendas
├── manifest.json                # Manifiesto PWA para Android
├── capacitor.config.json        # Configuración nativa de Capacitor (Bundle ID: com.sudokuarena.mobile)
├── package.json                 # Dependencias oficiales de Capacitor
├── GUIA_PUBLICACION_TIENDAS.md  # Instrucciones paso a paso para compilar en tiendas
├── MANUAL_DE_USUARIO.md         # Documentación de reglas y puntuación
├── icons/                       # Iconos vectoriales de alta resolución
│   ├── icon-192.svg
│   └── icon-512.svg
├── css/
│   └── style.css                # Estilos Dark Cyber-Tactical responsivos para móvil y PC
└── js/
    ├── engine/
    │   ├── sudoku.js            # Generador, solver backtracking y clasificador humano
    │   ├── scoring.js           # Motor de coste de oportunidad y libro mayor contable
    │   └── competition.js       # Generador y parser de códigos de duelo
    ├── ui/
    │   ├── audio.js             # Síntesis procedural de sonido (Web Audio API)
    │   └── board.js             # Renderizador 9x9 interactivo y animaciones
    └── app.js                   # Controlador principal y eventos táctiles/móviles
```
