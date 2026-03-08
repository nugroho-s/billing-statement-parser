import type { Parser, Transaction } from './types';

const MANDIRI_EMAIL = 'mandiricare@bankmandiri.co.id';

export const mandiriParser: Parser = {
	identifier: MANDIRI_EMAIL,
	name: 'Mandiri',

	parse(text: string): Transaction[] {
		const results: Transaction[] = [];
		const transactionRegex = /(\d{2}-[A-Za-z]{3}-\d{2})\s+(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+([\d,]+\.\d{2})\s*(CR)?/g;

		const skipKeywords = [
			'Transaction Date',
			'Posting Date',
			'Keterangan',
			'Description',
			'Card Type',
			'Card Number',
			'Product Name',
			'Payment Due Date',
			'Statement Date',
			'PAYMENT THANK YOU'
		];

		let match;
		while ((match = transactionRegex.exec(text)) !== null) {
			const description = match[3].trim();
			if (skipKeywords.some(keyword => description.includes(keyword))) {
				continue;
			}
			const isCredit = match[5] === 'CR';
			const amount = isCredit ? `-${match[4]}` : match[4];
			results.push({
				transactionDate: match[1],
				postingDate: match[2],
				description,
				amount
			});
		}

		return results;
	}
};
