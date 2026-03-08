export interface Transaction {
	transactionDate: string;
	postingDate: string;
	description: string;
	amount: string;
}

export interface Parser {
	identifier: string;
	name: string;
	parse(text: string): Transaction[];
}
