# FiabeMVP
Prodotto completo: Next.js + Tailwind con wizard per generare storie illustrate.
- Storyboard: generato localmente (no chiavi necessarie).
- Immagini: generate via OpenAI Images API (serve OPENAI_API_KEY).

## Avvio
```bash
npm install
echo 'OPENAI_API_KEY=sk-...' > .env.local
npm run dev
```

Apri http://localhost:3000 e crea una storia. Clicca “Genera illustrazioni” per ottenere immagini AI.

## Deploy
- Vercel: aggiungi OPENAI_API_KEY tra le Environment Variables.
