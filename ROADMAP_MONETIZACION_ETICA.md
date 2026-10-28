# 💡 Hoja de Ruta: Monetización Ética No Invasiva (Sudoku Arena)

Documento de especificación para la futura monetización voluntaria de **Sudoku Arena**, diseñado para mantener la aplicación 100% libre de anuncios comerciales molestos y respetar la concentración de los jugadores.

---

## 🎯 Principios Fundamentales

1. **Sin Publicidad Invasiva (Zero-Ads):**
   * El juego se mantiene de uso libre, ilimitado y sin vídeos ni banners que interrumpan la partida.
2. **Aportación Voluntaria y Única:**
   * No es una suscripción recurrente ni un muro de pago obligatorio (*paywall*).
   * Importe sugerido: micro-aportación única de **3 euros**.
3. **Máxima Transparencia y Honestidad:**
   * El usuario sabe con exactitud a qué se destina su ayuda (costes de supervisión, servidores, hosting y mantenimiento técnico continuo).

---

## 🛠️ Especificación de Implementación Futura

### 1. Menú de Opciones (Llamada Amable y No Intrusiva)
* **Texto del Botón / Enlace:**
  > *"¿Te gusta esta APP? Ayúdanos a mantenerla viva y sin anuncios"*
* **Mensaje del Modal / Ventana Emergente:**
  > *"Esta App es de uso libre, ilimitado y sin anuncios. Pero para mantener su puesta al día y supervisión agradeceríamos una pequeña y única aportación de 3 euros con lo cual nos ayudaréis a seguir creciendo y a mantenerla viva."*
* **Ubicación:**
  * Dentro del modal `[⚙️ Otras opciones]`, situado de forma visible pero discreta, sin entorpecer el flujo de juego ni las herramientas de resolución.

---

### 2. Pasarela de Pago para la Versión Web
* **Plataforma seleccionada:** **Stripe Payment Links** (o pasarela internacional equivalente).
* **Motivos de la elección:**
  * **Alcance Internacional:** Sudoku Arena está disponible en 9 idiomas; Stripe permite cobrar en múltiples divisas de forma instantánea.
  * **Métodos de Pago Universales:** Admite tarjetas de débito/crédito, **Apple Pay**, **Google Pay** y métodos locales europeos.
  * **Privacidad y Seguridad:** No expone números de teléfono privados (evitando los inconvenientes y límites de operaciones de Bizum entre particulares).
  * **Cero Mantenimiento de Backend:** Los enlaces de Stripe (*Payment Links*) no requieren programar un servidor propio para cobrar.

---

### 3. Consideraciones para las Tiendas Nativas (Google Play & App Store)
* Cuando la app se distribuya empaquetada con Capacitor en **Google Play** o **Apple App Store**:
  * Para cumplir con las políticas obligatorias de Google y Apple, la aportación en la app nativa se canalizará como **Compra Integrada (In-App Purchase / Propina Consumible)** de 2,99 € o 3,00 €, activable con la huella o Face ID del dispositivo.
