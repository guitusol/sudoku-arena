# 🏛️ API y Base de Datos Central — Salón de la Fama
## Sudoku Arena & Club del Ingenio

Este directorio contiene la arquitectura del backend para compartir el **Salón de la Fama Global** entre todos los dispositivos y jugadores en tiempo real (móvil, PC, web).

---

### 📁 Estructura de Ficheros

1. **`schema.sql`**: Script SQL para crear la base de datos `sudoku_arena` y la tabla `sudoku_hall_of_fame` con índices optimizados y datos iniciales (incluyendo a Guillermo Tudela como Gran Maestro Fundador).
2. **`db.php`**: Conexión segura PDO a MariaDB / MySQL con soporte para UTF-8 y variables de entorno.
3. **`hall_of_fame.php`**: Endpoint REST que atiende peticiones:
   * **`GET`**: Devuelve la lista oficial de Maestros clasificados por puntos y tiempo.
   * **`POST`**: Valida y guarda (o actualiza) la marca del jugador identificado por su `device_uuid`.

---

### 🚀 Cómo activarlo en Local (Laragon) en 1 minuto

1. Abre Laragon y asegúrate de que **MySQL** está iniciado (botón verde *"Start All"*).
2. Abre tu gestor de base de datos preferido (botón **"Database"** de Laragon, que abre **HeidiSQL**, o entra a `http://localhost/phpmyadmin/`).
3. Abre una pestaña de consulta SQL, copia el contenido de **`schema.sql`** y ejecútalo (F9 en HeidiSQL o pulsar *"Continuar"* en phpMyAdmin).
4. **¡Listo!** Ya tienes la base de datos `sudoku_arena` creada con los maestros iniciales.

Para verificar que funciona, abre esta URL en tu navegador:
👉 `http://localhost/sudoku-arena/api/hall_of_fame.php`
Te devolverá un JSON limpio con todos los Maestros.

---

### 🌐 Cómo desplegarlo en Producción (Plesk / clubdelingenio.es)

Cuando conectes el dominio `clubdelingenio.es` en tu VPS Plesk:
1. En Plesk, ve a **Bases de Datos** y crea una base de datos MariaDB (ej: `club_sudoku`).
2. Importa el archivo `schema.sql` desde phpMyAdmin en Plesk.
3. Copia la carpeta `api/` a la raíz de tu dominio en Plesk (`/httpdocs/api/`).
4. Si tu usuario y contraseña de MariaDB en Plesk son distintos a los de Laragon, crea un archivo `config.local.php` dentro de `api/`:
   ```php
   <?php
   $dbHost = 'localhost';
   $dbName = 'tu_nombre_de_bd_en_plesk';
   $dbUser = 'tu_usuario_plesk';
   $dbPass = 'tu_contraseña_segura';
   ```

---

### 🛡️ Blindaje y Resiliencia (*Zero-Server Fallback*)
La aplicación está programada con **modo tolerante a fallos**:
* Si la base de datos no está creada todavía o el jugador está sin internet en el móvil, Sudoku Arena sigue funcionando perfectamente en local con su caché, sin bloquearse ni mostrar errores al usuario.
* En cuanto detecta conexión y base de datos, sincroniza y actualiza la lista automáticamente.
