<script lang="ts">
	import { onMount } from 'svelte';

	interface Transaction {
		transactionDate: string;
		postingDate: string;
		description: string;
		amount: string;
	}

	let pdfjsLib: typeof import('pdfjs-dist');
	let showPasswordPrompt = $state(false);
	let password = $state('');
	let pendingFileData: Uint8Array | null = $state(null);
	let transactions = $state<Transaction[]>([]);
	let csvOutput = $state('');

	onMount(async () => {
		pdfjsLib = await import('pdfjs-dist');
		const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
		pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href;
	});

	async function extractTextFromPdf(data: Uint8Array, password?: string) {
		if (!pdfjsLib) {
			throw new Error('PDF library not loaded');
		}

		const dataCopy = new Uint8Array(data);
		const pdf = await pdfjsLib.getDocument({ data: dataCopy, password: password || '' }).promise;
		const numPages = pdf.numPages;
		let fullText = '';

		for (let i = 1; i <= numPages; i++) {
			const page = await pdf.getPage(i);
			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.map(item => ('str' in item ? item.str : ''))
				.join(' ');
			fullText += pageText + '\n';
		}

		return { text: fullText, pages: numPages };
	}

	function parseTransactions(text: string): Transaction[] {
		const results: Transaction[] = [];
		const transactionRegex = /(\d{2}-[A-Za-z]{3}-\d{2})\s+(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+([\d,]+\.\d{2})\s*(CR)?/g;

		let match;
		while ((match = transactionRegex.exec(text)) !== null) {
			const description = match[3].trim();
			if (description.includes('Transaction Date') || 
				description.includes('Posting Date') || 
				description.includes('Keterangan') ||
				description.includes('Description') ||
				description.includes('Card Type') ||
				description.includes('Card Number') ||
				description.includes('Product Name') ||
				description.includes('Payment Due Date') ||
				description.includes('Statement Date') ||
				description.includes('PAYMENT THANK YOU')) {
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

	function convertToCsv(transactions: Transaction[]): string {
		const header = 'Transaction Date,Posting Date,Description,Amount';
		const rows = transactions.map(t => 
			`${t.transactionDate},${t.postingDate},"${t.description.replace(/"/g, '""')}","${t.amount}"`
		);
		return [header, ...rows].join('\n');
	}

	function downloadCsv() {
		const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'transactions.csv';
		link.click();
		URL.revokeObjectURL(url);
	}

	async function handleUpload() {
		const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
		const file = fileInput.files?.[0];

		if (!file) {
			alert('Please select a PDF file to upload.');
			return;
		}

		console.log('File selected:', file.name);

		try {
			const arrayBuffer = await file.arrayBuffer();
			const data = new Uint8Array(arrayBuffer);
			console.log('File data loaded, size:', data.length);
			await parsePdf(data);
		} catch (error) {
			console.error('Upload error:', error);
			handleError(error);
		}
	}

	async function parsePdf(data: Uint8Array, password?: string) {
		console.log('parsePdf called, data size:', data.length);
		try {
			const result = await extractTextFromPdf(data, password);
			console.log('Extracted text length:', result.text.length);
			console.log('Full extracted text:', result.text);
			transactions = parseTransactions(result.text);
			console.log('Parsed transactions count:', transactions.length);
			csvOutput = convertToCsv(transactions);
			showPasswordPrompt = false;
			password = '';
			pendingFileData = null;
		} catch (error) {
			console.error('parsePdf error:', error);
			if (isPasswordException(error)) {
				showPasswordPrompt = true;
				pendingFileData = data;
			} else {
				throw error;
			}
		}
	}

	async function submitPassword() {
		if (!pendingFileData) return;

		try {
			await parsePdf(pendingFileData, password);
		} catch (error) {
			if (isPasswordException(error)) {
				alert('Incorrect password. Please try again.');
			} else {
				handleError(error);
			}
		}
	}

	function isPasswordException(error: unknown): boolean {
		return error !== null && typeof error === 'object' && 'name' in error && error.name === 'PasswordException';
	}

	function handleError(error: unknown) {
		console.error('Error parsing PDF:', error);
		alert('Failed to parse PDF. Please try again.');
	}

	function resetState() {
		showPasswordPrompt = false;
		password = '';
		pendingFileData = null;
	}

	function cancelPassword() {
		resetState();
	}
</script>

<div class="upload-container">
	{#if showPasswordPrompt}
		<div class="password-prompt">
			<p>This PDF is password protected. Enter the password to decrypt:</p>
			<input type="password" bind:value={password} placeholder="Enter password" />
			<div class="button-group">
				<button type="button" onclick={submitPassword}>Decrypt</button>
				<button type="button" onclick={cancelPassword}>Cancel</button>
			</div>
		</div>
	{:else if transactions.length === 0}
		<form class="upload-form">
			<label for="pdfFile">Upload PDF:</label>
			<input type="file" id="pdfFile" accept="application/pdf" />
			<button type="button" onclick={handleUpload}>Upload</button>
		</form>
	{:else}
		<div class="results">
			<h2>Parsed Transactions ({transactions.length})</h2>
			<button type="button" onclick={downloadCsv}>Download CSV</button>
			<table>
				<thead>
					<tr>
						<th>Transaction Date</th>
						<th>Posting Date</th>
						<th>Description</th>
						<th>Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each transactions as t}
						<tr>
							<td>{t.transactionDate}</td>
							<td>{t.postingDate}</td>
							<td>{t.description}</td>
							<td>{t.amount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<h3>CSV Output</h3>
			<textarea readonly value={csvOutput} rows="10"></textarea>
			<button type="button" onclick={() => { transactions = []; csvOutput = ''; }}>Upload Another</button>
		</div>
	{/if}
</div>

<style>
	.upload-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		padding: 20px;
		box-sizing: border-box;
	}
	.upload-form, .password-prompt, .results {
		text-align: center;
	}
	.password-prompt input {
		display: block;
		margin: 10px auto;
		padding: 8px;
		width: 200px;
	}
	.button-group {
		margin-top: 10px;
	}
	.button-group button {
		margin: 0 5px;
	}
	.results {
		max-width: 900px;
		width: 100%;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 20px 0;
	}
	th, td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}
	th {
		background-color: #f2f2f2;
	}
	textarea {
		width: 100%;
		font-family: monospace;
	}
	button {
		margin: 10px 5px;
		padding: 8px 16px;
		cursor: pointer;
	}
</style>
