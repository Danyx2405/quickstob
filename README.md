# Quick Stop Online

Party game di parole multiplayer (2-7 giocatori), aperto a chiunque abbia il link: nessun account richiesto.

## Provarlo in locale
    npm install
    npm start        # http://localhost:3000

## Metterlo online gratis (esempio: Render.com)
1. Carica questa cartella su un repository GitHub.
2. Su render.com: New > Web Service > scegli il repo.
3. Build Command: `npm install`  ·  Start Command: `npm start`  ·  Piano Free.
4. Render ti dà un URL tipo https://quickstop-xxxx.onrender.com: è il link da condividere.
Funziona anche su Railway, Fly.io, Glitch o qualsiasi host Node.js con WebSocket.
(Sul piano gratuito di Render il server "dorme" dopo un po' di inattività: il primo caricamento può richiedere ~30 s.)

## Come si gioca
Crea una partita, copia il link (contiene il codice stanza) e mandalo agli amici.
Ognuno ha 5 lettere; esce un tema; scrivi una parola che inizia con una tua lettera.
Rispondono solo i primi 3 per round. Contesta le parole dubbie (maggioranza degli altri = lettera restituita).
Vince chi finisce per primo le carte.
