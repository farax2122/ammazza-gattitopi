# Ammazza Gattitopi

Gioco da browser ambientato a Paternò di notte: i gattitopi escono dai tombini e tu li prendi a pidate, col pede con due dita rotte, finché non arriva l'alba. Ispirato al servizio «Eroe ammazza gattitopi di Paternò» (Mpare Catania, https://www.youtube.com/watch?v=8BVv4spYvRM).

Niente build e niente dipendenze: HTML, CSS e JavaScript puro su canvas.

## Avvio

Le voci vengono caricate con `fetch`, quindi il gioco va servito da un server locale, non aperto con doppio clic:

```
python -m http.server 8000
```

Poi apri http://localhost:8000. Se apri `index.html` direttamente il gioco funziona lo stesso, ma al posto delle voci senti lo squittio.

## Struttura

```
index.html          markup: HUD, canvas, schermate di inizio e fine
css/style.css       stile (palette maiolica, rosario, classifica)
js/game.js          tutto il gioco: sfondo, sprite, logica, audio
assets/audio/       frasi campionate dal video, velocizzate 1.25x
tools/build_single.py  crea dist/ammazza-gattitopi.html, un unico file con tutto incorporato
```

Per la versione in un solo file (utile per condividerla o pubblicarla dove non si caricano più file): `python tools/build_single.py`.

## Regole in breve

- Rosario di Santa Barbara: 10 grani, uno per vita. Gattitopo che scappa = 1 grano, 'U Zù = 2, colpire 'a picciridda = 1. L'arancino ne ridà uno.
- Armi: pede, poi da 10 colpi di fila l'asse di legno (colpo doppio, prende i tombini vicini, non colpisce la bambina).
- Power-up: arancino (rallenta), Trinacria (3 scudi), fuochi di Santa Barbara (svuota la strada).
- Eventi ogni ora: ondata, blackout, festa di Santa Barbara. Parossismi dell'Etna ogni 20-30 secondi.
- La partita dura dalle 23:40 alle 06:00 (circa 3 minuti).

Il record si salva nel `localStorage` del browser. La classifica di fine partita per ora usa giocatori di prova (`FAKE_BOARD` in `js/game.js`).

## Account e classifica online (Supabase)

Registrazione, login e classifica usano [Supabase](https://supabase.com) (piano gratuito). Senza configurarlo il gioco funziona offline, da ospite.

1. Crea un progetto su supabase.com.
2. Dashboard > SQL Editor: incolla `supabase/schema.sql` ed eseguilo. Crea profili, punteggi, regole di sicurezza e la vista `leaderboard`.
3. Dashboard > Authentication > URL Configuration: in *Site URL* metti l'indirizzo del sito (es. `https://farax2122.github.io/ammazza-gattitopi/`), così il link di conferma email riporta al gioco.
4. Dashboard > Project Settings > API: copia *Project URL* e la chiave *anon public* in `js/config.js`.

La chiave anon è fatta per stare nel browser: i dati li proteggono le regole RLS dello schema (ognuno inserisce solo i propri punteggi, nessuno li modifica o cancella). Il punteggio però è calcolato nel browser, quindi chi sa usare la console può barare: se la classifica diventa seria, va aggiunta una verifica lato server.

## Pubblicazione

Il sito è statico: GitHub Pages serve direttamente il ramo `main`. Ogni push aggiorna il sito in un paio di minuti.

## Audio

Le clip in `assets/audio/` vengono dal video originale: la voce è di una persona reale e i diritti sono dell'autore del servizio. Prima di pubblicare il gioco, chiedi il permesso o sostituisci le clip.
