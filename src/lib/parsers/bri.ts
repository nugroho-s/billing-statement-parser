import type { Parser, Transaction } from './types';

const BRI_IDENTIFIER = 'PAYMENT_AJIN';

export const briParser: Parser = {
	identifier: BRI_IDENTIFIER,
	name: 'BRI',

	parse(text: string): Transaction[] {
		const results: Transaction[] = [];
		const transactionRegex = /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(Retail\s+\w{3}\s+.+?)\s+(USD|IDR|JPY)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{3})(CR)?/g;

		let match;
		while ((match = transactionRegex.exec(text)) !== null) {
			const description = match[3].trim();
			
			if (description.includes('PAYMENT_AJIN')) {
				continue;
			}

			const isCredit = match[8] === 'CR';
			const amount = isCredit ? `-${match[7]}` : match[7];
			results.push({
				transactionDate: match[1],
				postingDate: match[2],
				description,
				amount
			});
		}

		const otherRegex = /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(E-STATEMENT FEE)\s+(IDR)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{3})(CR)?/g;
		
		while ((match = otherRegex.exec(text)) !== null) {
			const description = match[3].trim();
			const isCredit = match[8] === 'CR';
			const amount = isCredit ? `-${match[7]}` : match[7];
			results.push({
				transactionDate: match[1],
				postingDate: match[2],
				description,
				amount
			});
		}

		return results;
	},

	getStatementDate(text: string): string {
		const match = text.match(/\d{4}-\d{2}XX-XXXX-\d{4}\s+\d{2}-\d{2}-(\d{4})\s+[\d.,]+\s+[\d.,]+\s+(\d{2})-(\d{2})-(\d{4})/);
		if (match) {
			const year = match[4];
			const month = match[3];
			return `${year}-${month}`;
		}
		return '';
	}
};
