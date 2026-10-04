# Ammazza Gattitopi

**Gioca qui: https://farax2122.github.io/ammazza-gattitopi/**

Gioco da browser ambientato a Paternò di notte: i gattitopi escono dai tombini e tu li prendi a pidate, col pede con due dita rotte, finché non arriva l'alba. Ispirato al servizio «Eroe ammazza gattitopi di Paternò» (Mpare Catania, https://www.youtube.com/watch?v=8BVv4spYvRM).

Il sito è statico su GitHub Pages: ogni push sul ramo `main` lo aggiorna in un paio di minuti. Account, classifica e verifica dei punteggi stanno su Supabase.

## Struttura

```
index.html                         pagina: HUD, canvas, schermate di inizio/fine, login
css/style.css                      stile
js/game.js                         disegno, effetti, suoni, input
js/online.js                       login, registrazione, classifica
js/config.js                       URL e chiave pubblica di Supabase
supabase/functions/_shared/sim.js  motore di gioco deterministico (browser e server)
supabase/functions/submit-score/   Edge Function che rigioca la partita e salva il punteggio
supabase/schema.sql                tabelle, regole di sicurezza, classifica
assets/audio/                      frasi campionate dal video, velocizzate 1.25x
tools/sim_test.js                  verifica che server e browser diano lo stesso punteggio
tools/build_single.py              versione in un unico file (senza parte online)
```

## Come funziona l'anti-trucchi

Il browser non può scrivere punteggi. Quando un giocatore registrato inizia, il database sceglie il seed della partita (`start_game`). A fine partita il browser manda solo l'elenco dei clic alla Edge Function `submit-score`, che rigioca la partita con lo stesso motore (`sim.js`) e salva il punteggio che ottiene lei.

Il server rifiuta:

- clic su bersagli che in quel momento non esistono o non si possono colpire;
- clic più ravvicinati di 83 ms;
- colpi a meno di 150 ms dalla comparsa del bersaglio;
- partite consegnate due volte;
- partite che durano meno del tempo realmente passato.

Il limite che resta è un programma che gioca al posto tuo con riflessi umani: quello nessun gioco da browser lo può escludere del tutto.

`node tools/sim_test.js` rigioca 300 partite e controlla che browser e server diano lo stesso punteggio e che i trucchi vengano rifiutati.

## Configurare Supabase

1. Crea un progetto su supabase.com.
2. SQL Editor: incolla `supabase/schema.sql` ed eseguilo.
3. Authentication > URL Configuration: *Site URL* = `https://farax2122.github.io/ammazza-gattitopi/`.
4. Pubblica la funzione: `npx supabase functions deploy submit-score --project-ref <ref> --use-api`.
5. Metti *Project URL* e chiave *anon public* in `js/config.js`. La chiave anon è pubblica per progetto: i dati li proteggono le regole dello schema.

Senza configurazione il gioco funziona lo stesso, da ospite e senza classifica.

La conferma via email è disattivata (Authentication > Sign In / Providers > Email > *Confirm email*): il servizio email gratuito di Supabase manda poche email l'ora e bloccherebbe le registrazioni. Per riattivarla serve un SMTP proprio (Authentication > Emails > SMTP Settings).

## Sviluppo in locale

Solo per lavorare sul codice: `python -m http.server 8000` dalla cartella e apri http://localhost:8000.

GitHub Pages fa tenere i file in cache 10 minuti. Per far arrivare subito una nuova versione, `index.html` carica CSS e JS con `?v=<commit>`: prima di ogni rilascio aggiornalo con

```
sed -i -E 's#((css|js)/[a-z]+\.(css|js)|_shared/sim\.js)(\?v=[^"]*)?"#?v='$(git rev-parse --short HEAD)'"#g' index.html
```

## Audio

Le clip in `assets/audio/` vengono dal video originale: la voce è di una persona reale e i diritti sono dell'autore del servizio, a cui va chiesto il permesso per l'uso pubblico.
