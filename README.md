# Raquel Sans — joc de ritme

Joc isomètric de vòxels al ritme de «Raquel Sans» (Miki Núñez & The Tyets). Corres pel món de la tele; quan l'anell es tanca, **toques** (pantalla o espai): a les cantonades per **girar** i als cartells per **saltar**. 210 accions en total: 109 girs, 87 salts curts, 14 salts llargs (i 23 girs «visuals» que no demanen res, només perquè el camí no s'allunyi).

## Posar-lo en marxa
Puja la carpeta tal qual al repositori (p. ex. `raquel-sans/`) i obre `index.html` amb GitHub Pages. Cal servir-lo per http(s); obrint `index.html` directament des del disc no carrega els fitxers.
Fitxers: `index.html`, `joc.js`, `data.js` (disseny: temps, esdeveniments, camins), `sprites.webp`, `intro.webp`, `z1.bin`…`z8.bin` (món de cada zona), `raquel.mp3`. Total ≈ 15 MB; el més gran és l'MP3 (8,4 MB, per sota del límit de 25 MB de la pujada web de GitHub).

## Ritme (la part crítica)
- Tempo constant mesurat sobre l'àudio: **150,000 BPM** (beat = 0,400 s), primer beat a **0,285 s**; ajust a la graella de ±5 ms al llarg de tota la cançó.
- Tots els girs i salts cauen **exactament** a la graella; el món (camí, càmera, personatges) va lligat al rellotge de l'àudio, i els tocs només validen.
- El rellotge fa servir `AudioContext` (no `<audio>`), compensa la latència de sortida del navegador i mesura on comença el primer so del MP3 descodificat per corregir el retard que alguns navegadors afegeixen (~25 ms).
- **Calibra el ritme** (pantalla d'inici): 16 cops, toques quan els sents, i es desa l'ajust en aquest aparell.
- `?dt=1` a l'adreça (p. ex. `index.html?dt=1`) mostra a cada toc l'error en ms («Perfecte! +12 ms»): una manera ràpida de veure si el mòbil va endarrerit o avançat.
- Finestres: gir −0,22/+0,18 s; salt −0,18/+0,14 s; «Perfecte» ≤ 0,07 s. Si caus 3 vegades a la mateixa zona, s'activa una **ajuda** (finestres ×1,2; a les 6, ×1,4), amb un avís a pantalla.
- Mode **Passeig**: el joc toca per tu (per mirar-ho tot sense perdre).
- En caure, la zona es reinicia amb compte enrere (la música torna 2,4 s abans de la zona). «Pausa» també reprèn des de l'inici de la zona.

## Zones (temps = estimació, vegeu avís)
| Zona | Inici | Escena |
|---|---|---|
| 0 Sala | 0:00,0 | Introducció (imatge fixa) |
| 1 Dins la tele | 0:06,7 | Tutorial: només girs |
| 2 De les 9 a les 10 | 0:16,3 | Poble de nit |
| 3 Wall Street | 0:40,3 | Borsa |
| 4 Telenotícies | 0:59,5 | Plató de TV |
| 5 La tertúlia | 1:17,1 | Plató de tertúlia (JABATA tatxat) |
| 6 Zapping | 1:39,5 | Pantalles, soroll i barres de colors |
| 7 Quin horror | 2:01,9 | Luxe (els dos Tyets, molts salts) |
| 8 Raquel Sans | 2:19,5 | Escenari i públic; Miki + Tyets; Raquel apareix al final |
| Final | 2:51,5 | Pose final, confeti i pantalla amb enllaços a YouTube i Spotify |

**Avís:** els **temps de les escenes són una estimació meva** (no he pogut alinear-los amb la lletra); els girs i salts, en canvi, sí que cauen a la graella real de beats. Si algun canvi d'escena no coincideix amb la part de la cançó que vols, es pot moure fàcilment (cal tornar a generar els mons de les zones afectades).
Ni la lletra ni cap logotip real hi són; els textos dels cartells són genèrics.

## Proves fetes
Navegador Chromium sense pantalla (no he provat Safari, Firefox ni cap mòbil real):
- La descodificació de l'MP3 al navegador coincideix amb la referència a 0 ms (mateix primer so, 0,0397 s, i mateixa durada, 179,0955 s).
- Partida completa en temps virtual amb tocs perfectes: 210/210 encertats, 0 caigudes, arriba a la pantalla final.
- Prova en temps real amb l'àudio: tocs amb 120 ms de retard → tots encertats; 170 ms → caiguda al primer salt (finestra de 140 ms), com cal.
- Mode Passeig d'inici a final, pausa, calibratge, caigudes i reinici, pantalla final.

L'àudio és el que vas passar; els drets són dels seus titulars (tingues-ho present si el repositori és públic).
