<script lang="ts">
	import { onMount } from 'svelte';

	let pdfjsLib: typeof import('pdfjs-dist');
	let showPasswordPrompt = $state(false);
	let password = $state('');
	let pendingFileData: Uint8Array | null = $state(null);

	onMount(async () => {
		pdfjsLib = await import('pdfjs-dist');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs') as any;
		pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker.default();
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

	async function handleUpload() {
		const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
		const file = fileInput.files?.[0];

		if (!file) {
			alert('Please select a PDF file to upload.');
			return;
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const data = new Uint8Array(arrayBuffer);
			await parsePdf(data);
		} catch (error) {
			handleError(error);
		}
	}

	async function parsePdf(data: Uint8Array, password?: string) {
		try {
			const result = await extractTextFromPdf(data, password);
			console.log('Extracted text:', result.text);
			console.log('Pages:', result.pages);
			alert('PDF parsed successfully! Check console for extracted text.');
			resetState();
		} catch (error) {
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
	{:else}
		<form class="upload-form">
			<label for="pdfFile">Upload PDF:</label>
			<input type="file" id="pdfFile" accept="application/pdf" />
			<button type="button" onclick={handleUpload}>Upload</button>
		</form>
	{/if}
</div>

<style>
	.upload-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}
	.upload-form, .password-prompt {
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
</style>
