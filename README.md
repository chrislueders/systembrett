# Systembrett - Kollaborative 3D-Familienaufstellung

Ein interaktives 3D-Systembrett fuer die therapeutische Arbeit. Therapeut und Klient koennen gemeinsam in Echtzeit Figuren auf dem Brett platzieren und verschieben.

## Features

- **3D-Brett** mit zwei trennbaren Haelften (animiertes Auseinanderziehen)
- **Verschiedene Figurentypen**: Grosse/mittlere/kleine Peg-Figuren, farbige Kegel, Zylinder, Staebe
- **Click-to-Move**: Figur anklicken, Zielposition anklicken
- **Echtzeit-Zusammenarbeit**: Per Link teilen, beide sehen Aenderungen sofort
- **Kamera-Widget**: Brett drehen ohne Figuren zu verschieben
- **Export/Import**: Aufstellungen als JSON-Datei speichern und laden

## Starten

### Server

```bash
cd server
npm install
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

Die App ist dann unter `http://localhost:5173` erreichbar.

## Zusammenarbeit

Beim Oeffnen der App wird automatisch ein Raum erstellt. Die URL enthaelt die Raum-ID (z.B. `?room=abc123`). Diesen Link an den Klienten senden - beide arbeiten dann auf dem gleichen Brett.

## Tech-Stack

- **Frontend**: React + TypeScript + React Three Fiber + Drei + Zustand + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Build**: Vite

## Deployment

- **Frontend**: Vercel (`cd client && npm run build`)
- **Backend**: Railway/Render (Socket.IO Server)
- Umgebungsvariable `VITE_SERVER_URL` auf die URL des WebSocket-Servers setzen
