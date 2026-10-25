# Kickboxing GP

Juego de kickboxing en el navegador. No necesita instalar nada: abre `index.html`.

- **Camino al cinturón:** torneo de 16 luchadores (tú y 15 rivales) con cuadro de ramas: octavos, cuartos, semifinal y final. Los demás combates los juega el ordenador y el cuadro y la clasificación se actualizan solos.
- **Dinero en vez de puntos:** cada combate paga según el resultado (ganar, empatar o perder) y según si haces KO y cuántos derribos consigues. Con él compras mejoras en el entrenamiento y equipo en el vestuario.
- **Vestuario:** guantes, calzonas y bailes de victoria. Se pelea descalzo: sin botas, tibiales ni calcetines. El equipo es solo estético; la fuerza, la velocidad, la resistencia y la defensa se mejoran entrenando.
- **Fichas de luchador:** cada uno de los 15 rivales es de un país distinto (España, Brasil, Tailandia, Rumanía, Holanda, Cuba, México, Rusia, Francia, Nigeria, Japón, Marruecos, Suecia, Ghana y Turquía) y tiene su bandera, récord, peso y altura. Tu luchador no tiene país; su récord es el tuyo de verdad. La ficha sale en la presentación del combate, en el torneo (próximo rival y clasificación) y en la pantalla de 2 jugadores.
- **Rodilla en salto:** el golpe más fuerte y también el más lento. Avanza saltando, rompe la guardia y deja aturdido al rival, pero se puede esquivar o cortar mientras carga.
- Modo 2 jugadores en el mismo ordenador (con los 16 luchadores).
- 3 asaltos de 3 minutos de reloj (≈1 minuto real). Si te tumban, el público cuenta hasta 10 y tu aguante decide si te levantas. Si el combate acaba empatado, se repite.
- Idiomas: español, inglés, árabe (de derecha a izquierda) y chino. Se cambia desde la barra de arriba y se recuerda.
- Móvil y tablet: salen botones táctiles (mejor en horizontal).

## Estructura

Todo va en una sola carpeta, sin subcarpetas:

```
kickboxing-gp/
├── index.html          Pantallas del juego (menú, torneo, vestuario, 2 jugadores, combate, resultado, fotos)
├── style.css           Aspecto, menú compacto, marcador, cuadro del torneo, vestuario, botones táctiles y modo derecha-a-izquierda
├── fonts.css           Tipografías incluidas en el juego (no se pide nada a internet)
├── *.woff              Big Shoulders Display, Barlow, Noto Sans Arabic y Noto Sans SC, recortadas a los signos que usa el juego
├── OFL-*.txt           Licencias de las tipografías (SIL Open Font License)
└── *.js                Se cargan en este orden (cada archivo usa lo anterior):
    config.js           Constantes, utilidades, niveles de calidad y datos (luchadores, golpes, arenas, mejoras, premios y tienda)
    storage.js          Progreso, dinero, equipo, torneo y fotos guardados en el navegador
    i18n.js             Textos en los 4 idiomas y cambio de idioma
    profile.js          Fichas: banderas dibujadas, país, récord, peso y altura de cada luchador
    audio.js            Sonidos sintetizados
    poki.js             SDK de Poki: avisos de partida, anuncios entre combates y monedas por anuncios
    gear.js             Dibujo del equipo (guantes, calzonas, pies descalzos) y los pasos de los bailes
    art.js              Dibujo de luchadores (con caché), retratos y ring 2D
    input.js            Teclado y botones táctiles
    ai.js               Inteligencia de los rivales
    fight.js            Reglas: golpes, bloqueo, esquiva, rodilla, asaltos, KO, cuenta de 10 y bucle del juego
    render.js           Cámara, efectos y marcador del combate
    ui.js               Menús, 2 jugadores, editor de fotos y resultados
    tour.js             Torneo: sorteo, cuadro, clasificación, premios y entrenamiento
    locker.js           Vestuario: probar, comprar y equipar
    main.js             Arranque
```

## Poki

- `index.html` carga el SDK de Poki (`https://game-cdn.poki.com/scripts/v2/poki-sdk.js`). Es lo único que se pide fuera del juego. Si no carga (sin conexión o con un bloqueador de anuncios), el juego funciona igual.
- **Avisos de partida:** `gameLoadingFinished` al arrancar, `gameplayStart` al empezar un combate o quitar la pausa, y `gameplayStop` al pausar, salir o acabar el combate.
- **Anuncios entre combates:** antes de cada combate se pide un `commercialBreak` (Poki decide si sale). Mientras dura, el juego está en silencio y no responde a teclas ni toques.
- **Monedas por anuncios:** el botón **+** junto al dinero (torneo y vestuario) avisa antes y, si el anuncio se ve entero (`rewardedBreak`), da 100 monedas (`AD_COINS` en `poki.js`). Fuera de Poki avisa de que no está disponible.
- El espacio y las flechas no mueven la página, y en el combate tampoco la rueda del ratón. El guardado aguanta el modo incógnito.
- Los botones táctiles salen según el tipo de dispositivo (pantalla táctil o sin ratón), no según el tamaño. Así, en el marco de Poki en el ordenador el ring ocupa casi todo.
- Para subirlo: comprime el contenido de esta carpeta (con `index.html` en la raíz del zip) y súbelo en Poki for Developers.

## Controles

| Acción            | Jugador 1          | Jugador 2          |
|-------------------|--------------------|--------------------|
| Moverse           | A D                | ← →                |
| Jab               | F                  | J                  |
| Directo           | G                  | K                  |
| Rodilla en salto  | H                  | L                  |
| Patada baja       | V                  | N                  |
| Patada alta       | B                  | M                  |
| Defender (mantén) | S                  | ↓                  |
| Esquivar          | W                  | ↑                  |
| Levantarte del KO | Espacio (machacar) | Intro (machacar)   |

Pausa: `P` o `Esc`, o el botón «Pausa». En pausa aparece el botón **Ver controles**, que abre esta misma tabla de teclas y los consejos; `Esc` o `P` la cierran. En una pantalla de presentación o fin de asalto, cualquier tecla o toque la salta.
En la parte de arriba del torneo y del vestuario, el **+** junto al dinero da monedas a cambio de ver un anuncio (solo en Poki).
Las teclas se leen por su posición física, así que funcionan igual con teclado árabe, chino o cualquier otro.

## El torneo

- El sorteo es aleatorio, pero siempre te toca un rival más fuerte en cada ronda: primero uno flojo, luego uno medio y, en la final, el mejor de la otra mitad del cuadro.
- Ganas el torneo con 4 victorias. Si pierdes, quedas eliminado, el resto del torneo se juega solo y puedes empezar uno nuevo (conservas el dinero, las mejoras y el equipo).
- Un empate no cambia el cuadro: el combate se repite (el premio de empate se cobra igual).
- La primera ronda se llama *octavos de final* (16 luchadores). Los dieciseisavos de verdad pedirían 32 luchadores.

### Premios (en `PRIZE`, `config.js`)

| Fase          | Ganar | Empatar | Perder |
|---------------|-------|---------|--------|
| Octavos       | 300   | 150     | 75     |
| Cuartos       | 450   | 225     | 115    |
| Semifinal     | 700   | 350     | 175    |
| Final         | 1100  | 550     | 275    |

Además: +50 % del premio base si ganas por KO, +30 por cada derribo y +1.500 por ganar el torneo.
Las mejoras del entrenamiento cuestan 150, 300, 500, 800 y 1.200 (`UPCOST`). Los guardados antiguos se convierten: cada punto de entrenamiento pasa a valer 100 de dinero.

## Fluidez y calidad gráfica

El botón **Calidad** (arriba a la izquierda) tiene tres opciones:

- **Auto** (por defecto): al arrancar mide el equipo y, si en pleno combate va justo, baja sola un nivel.
- **Alta**: gráficos vectoriales a toda resolución.
- **Baja**: lienzo más pequeño, luchadores precalculados y menos partículas. Pensado para móviles y equipos antiguos.

Cómo se consigue que vaya suave:

- La resolución interna del lienzo se adapta al tamaño real en pantalla.
- El fondo del ring es una capa aparte que mueve la tarjeta gráfica; el lienzo solo dibuja luchadores y efectos.
- Marcador, mensajes y cuenta de 10 son HTML/CSS, no se redibujan en cada fotograma.
- Los luchadores se guardan como imágenes precalculadas en calidad media y baja (con su equipo puesto).
- El tiempo del juego sigue al reloj real: si el equipo va lento, no se ve en cámara lenta.
- El juego se pausa solo al cambiar de pestaña.

## Idiomas

Todos los textos están en `i18n.js`, dentro de `I18N.es`, `I18N.en`, `I18N.ar` y `I18N.zh`.

- Para añadir un texto, ponlo con la misma clave en los cuatro idiomas. En JavaScript se usa `t('clave')` o `t('clave',{n:3})`; en el HTML, `data-i18n="clave"`.
- Los nombres, apodos y categorías de los luchadores son las claves `name.N`, `nick.N` y `cls.N` (N = 0 a 14); las arenas, `arena.N` (N = 0 a 7); los artículos del vestuario, `it.g0`…`it.g8` (guantes), `it.t0`…`it.t8` (calzonas) e `it.d0`…`it.d6` (bailes); los países, `cn.es`, `cn.br`…`cn.tr`, el botón y la ventana de controles, `ctrl.btn`, `ctrl.title` y `ctrl.close`, y las etiquetas de la ficha, `fi.rec`, `fi.wt`, `fi.ht`, `u.kg` y `u.cm`.
- El árabe pone la página de derecha a izquierda (`dir="rtl"`); el combate se queda de izquierda a derecha para que el jugador 1 siempre esté a la izquierda.
- Las tipografías van dentro del juego (`fonts.css` y los `.woff`). Las de árabe y chino solo se cargan si eliges ese idioma, y si escribes un nombre con signos que no traen se usa una del sistema.
- Para añadir un idioma nuevo: añade su diccionario, una entrada en `LANGS` y, si hace falta, su tipografía en `FONT_CSS`.

## Personalizar

- **Luchadores y dificultad:** `config.js` (`FIGHTERS`: nivel `rk` de 1 a 15, vida, fuerza, velocidad, agresividad, bloqueo, reacción y su equipo; `CHIN`: aguante ante el KO). El nivel `rk` decide quién te toca en cada ronda del torneo.
- **Aspecto de los luchadores:** todos son chicos. Los peinados (`style`) son `short`, `buzz`, `bald`, `curly`, `quiff`, `mohawk`, `topknot`, `afro` y `spiky`; además se puede poner `beard` y `scar`. Se dibujan en `drawHead` (`art.js`).
- **Golpes:** `ATK` en `config.js` (daño, alcance, tiempos). La rodilla en salto es `ATK.knee` (`lunge` es lo que avanza saltando y `gb` la parte del golpe que pasa aunque te defiendas) y la altura del salto es `KNEE_JUMP`.
- **Tienda:** `SHOP` en `config.js` (precio `p`, colores y estilo de cada artículo). Los estilos de guantes y calzonas se dibujan en `gear.js`; los bailes, en `DANCES` del mismo archivo. Los pies descalzos se dibujan con `bareFoot` y `ankle` (`gear.js`), del color de la piel.
- **Fichas:** en `FIGHTERS` (`config.js`) cada rival tiene `cc` (país, de dos letras), `kg` (peso), `cm` (altura) y `rec` (récord de antes del torneo: `[victorias, derrotas, empates, KO]`). Si cambias el país de alguien, añade su bandera en `FLAGS` (`profile.js`) y su nombre en `cn.XX` en los 4 idiomas. Tus datos (`kg`, `cm`) están en `PLAYER`; tu luchador no tiene país.
- **Premios y mejoras:** `PRIZE` y `UPCOST` en `config.js`.
- **Duración del asalto:** `ROUND_TIME` en `config.js` (segundos reales; el reloj muestra 3:00).
- **Arenas:** `ARENAS` y `ARENA_FOR_STAGE` en `config.js` y `makeRing` en `art.js`.
- **Tus fotos y tu fondo:** desde el propio juego, en "Fotos".
