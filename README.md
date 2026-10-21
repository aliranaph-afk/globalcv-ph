# GlobalCV PH

A client-side resume compliance and international CV preview for Filipino overseas applicants. Run locally with:

```sh
npm install
npm run dev
npm run build
npm run lint
```

## GlobalCV PH (Path A)

- Resume text and preview preferences are saved in browser `localStorage`; resume files are not uploaded to an application server.
- PDF extraction runs locally through `pdfjs-dist`, using Vite's bundled worker asset. The parser preserves text lines, counts embedded image paint operations, and flags image-only/scanned PDFs; OCR is not performed.
- Country profile switching and red-flag fixes affect preview visibility only. The source text, detected biodata, hidden-field toggles, translations, and rule-based bullet rewrites remain reversible.
- Credential descriptions and the readiness score are deterministic local rules, not formal credential recognition or immigration/legal advice.
- `gemini-2.5-flash` rewriting is optional BYOK. The key is stored in this browser's localStorage; when used, the selected bullet and target region are sent directly to Google's API. The offline enhancer and copy-prompt flow do not require an API key.
- "Export Clean ATS PDF" uses browser printing and prints only the international preview; select A4 or Letter in the print dialog.

The one-click stress-test sample is fictional demonstration content. Replace it before producing a real application.

## AbroadReady (Path B scaffold)

Path B currently contains its module navigation and typed reference-data placeholders. Placement-fee, tax, currency, and direct-hire results remain disabled until current rules are verified against official sources.

## Tooling

Built with Vite, React, TypeScript, Tailwind CSS, and `lucide-react`.
