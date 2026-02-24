# Currency Converter

A real-time currency converter built with **React + Vite**, powered by the [Frankfurter API](https://www.frankfurter.app) (European Central Bank data).

## Features

- Live exchange rates updated daily via the ECB
- Real-time ticker bar showing all USD cross-rates
- Debounced amount input (300 ms) with in-flight request cancellation
- Swap button to instantly reverse the currency pair
- Error banner for network failures
- Fully responsive — works on mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 |
| Build | Vite 5 |
| Styles | Plain CSS (custom properties, glassmorphism) |
| API | [Frankfurter.app](https://www.frankfurter.app) |

## Getting Started

```bash
npm install
npm run dev       # development server with HMR → http://localhost:5173
```

## Build & Deploy

```bash
npm run build     # production bundle → dist/
npm run preview   # local preview of the built bundle
```

The `dist/` folder is a self-contained static site. Deploy it to any static host:

- **Vercel / Netlify** — point build output to `dist/`
- **Nginx** — serve `dist/` as document root; add `try_files $uri /index.html`
- **AWS S3 + CloudFront** — upload `dist/` contents, set `index.html` as the default document

## Project Structure

```
currency-converter/
├── index.html              # Vite root shell
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main converter (state, API logic, JSX)
    ├── App.css             # All styles
    ├── constants.js        # FLAGS emoji map + API_BASE
    └── components/
        └── Ticker.jsx      # Live rates ticker (self-contained)
```

## API

All data comes from the free [Frankfurter API](https://www.frankfurter.app) — no API key required.

| Endpoint | Usage |
|----------|-------|
| `GET /currencies` | Populate the from/to dropdowns |
| `GET /latest?amount=N&from=X&to=Y` | Convert amount |
| `GET /latest?from=USD` | Ticker rates |
