# Billing Statement Parser

A web application to parse credit card billing statements from PDF files and export transactions to CSV format.

## Features

- PDF text extraction with password support
- Multiple bank template support (extensible)
- Manual template selection
- Transaction parsing with regex patterns
- CSV export with auto-generated filename
- Raw text viewer for debugging
- Total amount calculation with copy function

## Supported Banks

| Bank | Identifier | Statement Date Format |
|------|------------|----------------------|
| Mandiri | `mandiricare@bankmandiri.co.id` | `YYYY-MM` |
| BRI | `PAYMENT_AJIN` | `YYYY-MM` |

## Usage

1. Upload PDF billing statement
2. Select the appropriate bank template
3. Click "Parse" to extract transactions
4. Review parsed transactions and total amount
5. Download as CSV or copy total amount

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Adding New Parsers

1. Create a new file in `src/lib/parsers/` (e.g., `newbank.ts`)
2. Implement the `Parser` interface:

```typescript
import type { Parser, Transaction } from './types';

export const newbankParser: Parser = {
  identifier: 'UNIQUE_IDENTIFIER_IN_PDF',
  name: 'BankName',

  parse(text: string): Transaction[] {
    // Parse transactions using regex
    return [];
  },

  getStatementDate(text: string): string {
    // Extract statement date as YYYY-MM
    return '';
  }
};
```

3. Register in `src/lib/parsers/index.ts`:

```typescript
import { newbankParser } from './newbank';
export const parsers: Parser[] = [mandiriParser, briParser, newbankParser];
```

## Tech Stack

- SvelteKit
- pdfjs-dist (PDF parsing)
- TypeScript

---

# Billing Statement Parser

Aplikasi web untuk mengurai laporan tagihan kartu kredit dari file PDF dan mengekspor transaksi ke format CSV.

## Fitur

- Ekstraksi teks PDF dengan dukungan password
- Dukungan template bank ganda (dapat diperluas)
- Pemilihan template manual
- Parsing transaksi dengan pola regex
- Ekspor CSV dengan nama file otomatis
- Penampil teks mentah untuk debugging
- Perhitungan total jumlah dengan fungsi salin

## Bank yang Didukung

| Bank | Pengenal | Format Tanggal Laporan |
|------|----------|----------------------|
| Mandiri | `mandiricare@bankmandiri.co.id` | `YYYY-MM` |
| BRI | `PAYMENT_AJIN` | `YYYY-MM` |

## Cara Penggunaan

1. Unggah laporan tagihan PDF
2. Pilih template bank yang sesuai
3. Klik "Parse" untuk mengekstrak transaksi
4. Tinjau transaksi yang diparsing dan total jumlah
5. Unduh sebagai CSV atau salin total jumlah

## Pengembangan

```bash
# Install dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Build untuk produksi
npm run build
```

## Menambahkan Parser Baru

1. Buat file baru di `src/lib/parsers/` (misalnya, `bankbaru.ts`)
2. Implementasikan interface `Parser`:

```typescript
import type { Parser, Transaction } from './types';

export const bankbaruParser: Parser = {
  identifier: 'PENANDA_UNIK_DALAM_PDF',
  name: 'NamaBank',

  parse(text: string): Transaction[] {
    // Parsing transaksi menggunakan regex
    return [];
  },

  getStatementDate(text: string): string {
    // Ekstrak tanggal laporan sebagai YYYY-MM
    return '';
  }
};
```

3. Daftarkan di `src/lib/parsers/index.ts`:

```typescript
import { bankbaruParser } from './bankbaru';
export const parsers: Parser[] = [mandiriParser, briParser, bankbaruParser];
```

## Teknologi

- SvelteKit
- pdfjs-dist (parsing PDF)
- TypeScript
