This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Parser ofert

Parser pobiera oferty z `justjoin.it` i używa OpenAI do zwrócenia danych w formacie JSON. Dodaj klucz API do `.env.local`:

```bash
OPENAI_API_KEY=your-openai-api-key
# Opcjonalnie:
OPENAI_MODEL=gpt-4o-mini
```

Klucz jest używany wyłącznie po stronie serwera przez endpointy analizy.

## CV i dopasowanie

Upload obsługuje tekstowe pliki PDF i DOCX do 8 MB. Skanowane PDF-y bez warstwy tekstowej są odrzucane; OCR nie jest jeszcze używany. Model klasyfikuje wymagania jako `matched`, `partial` lub `missing`, a aplikacja liczy score z wagami: wymagane umiejętności 35%, doświadczenie 25%, wymagania 20%, obowiązki 15% i dodatkowe atuty 5%. Puste kategorie są pomijane, a pozostałe wagi normalizowane. Feedback jest generowany dopiero po obliczeniu wyniku.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
