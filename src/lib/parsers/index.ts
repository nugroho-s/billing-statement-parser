import type { Parser, Transaction } from './types';
import { mandiriParser } from './mandiri';
import { briParser } from './bri';

export const parsers: Parser[] = [mandiriParser, briParser];

export function identifyParser(text: string): Parser | null {
	for (const parser of parsers) {
		if (text.includes(parser.identifier)) {
			return parser;
		}
	}
	return null;
}

export function parseTransactions(text: string): { parser: Parser | null; transactions: Transaction[] } {
	const parser = identifyParser(text);
	
	if (!parser) {
		return { parser: null, transactions: [] };
	}

	const transactions = parser.parse(text);
	return { parser, transactions };
}

export { mandiriParser, briParser };
export type { Transaction, Parser } from './types';
