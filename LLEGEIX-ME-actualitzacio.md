# Raquel Sans — versió isomètrica: actualització (lletra + «RA-QUEL SANS»)

Aquesta carpeta només té els **4 fitxers que canvien**. Pugeu-los al repositori de la versió isomètrica, substituint els que ja hi són: `index.html`, `joc.js`, `data.js` i el nou `lletra.js`. La resta (`z1.bin…z8.bin`, `sprites.webp`, `intro.webp`, `raquel.mp3`…) no canvia.

## Lletra (`lletra.txt`)

El joc **no porta cap lletra incorporada**: la llegeix de `lletra.txt`, que ha d'estar al costat d'`index.html` (com al joc de la Ludwig). Si no hi és, el joc va igual, sense lletra (a la pantalla d'inici diu «sense lletra (falta lletra.txt)»; amb ella, «lletra carregada (N versos)»).

- Un vers per línia (UTF-8, també accepta Windows-1252). S'ignoren les línies buides i les marques entre claudàtors sense temps (`[Tornada]`).
- Sincronització **automàtica** (aproximada): cada vers es casa amb el tros de veu que correspon comptant síl·labes.
- Sincronització **manual** (opcional): una línia que comença amb un temps surt just aleshores: `1:23 text` o `[1:23.5] text`.
- `index.html?lletra` mostra a la pantalla d'inici la llista de versos amb el temps assignat, per revisar-los.
- Surt a baix de la pantalla; «Raquel» i «Sans» es ressalten en rosa.

## «RA-QUEL SANS» a la tornada

A cada tornada (0:46,1 i 0:52,5 · 1:37,3 i 1:43,7 · 2:41,3 i 2:47,7): **tres tocs seguits, un per síl·laba**, i el personatge salta amb cadascuna (RA i QUEL curts, SANS més alt). Són les posicions 1, 2 i 5 de les 8 corxeres del compàs. Marques rosa a terra amb la síl·laba.

- Finestra ±95 ms (més justa que la resta). **Fallar una síl·laba no fa caure**: només trenca la ratxa.
- Les tres → «RAQUEL SANS! +200»; la pantalla final diu quantes en tens de perfectes (de 6). A «Passeig» les fa soles.
- En aquests compassos les cantonades passen a ser **automàtiques** (no cal tocar-hi: el camí és el mateix) i s'han tret els salts que hi queien, perquè només toquis a la veu. Els mons no s'han tornat a generar.

## Comprovat / no comprovat

Comprovat (Chromium sense pantalla, temps virtual): partida completa perfecta, a ±60 ms i irregular: tots els tocs, 18/18 síl·labes, 0 caigudes, sense errors de consola; captures de les marques i de la lletra.
**No comprovat:** que els sis «Raquel Sans» caiguin exactament on cal (és una estimació feta aïllant la veu de l'àudio, sense poder escoltar-ho); l'alineació automàtica de la lletra; cap aparell real. Les posicions es corregeixen a `data.js` (esdeveniments `"k":"H"`, camp `b` = beat; 1 beat = 0,4 s).
**Trio:** a aquesta versió van junts amb en Miki davant i els dos Tyets darrere, de costat: no he canviat l'ordre (el canvi del Tyet «del darrere al davant» només s'ha fet a la versió scroll).
