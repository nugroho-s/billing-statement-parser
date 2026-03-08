<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let pdfjsLib: typeof import('pdfjs-dist');

	onMount(async () => {
		pdfjsLib = await import('pdfjs-dist');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs') as any;
		pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker.default();
	});

	async function isPdfEncrypted(file: File) {
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 1024));
		return pdfHeader.includes('/Encrypt');
	}

	async function extractTextFromPdf(arrayBuffer: ArrayBuffer) {
		if (!pdfjsLib) {
			throw new Error('PDF library not loaded');
		}
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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

		if (await isPdfEncrypted(file)) {
			alert('The uploaded PDF is encrypted. Please upload an unencrypted PDF.');
			return;
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const result = await extractTextFromPdf(arrayBuffer);

			console.log('Extracted text:', result.text);
			console.log('Pages:', result.pages);
			alert('PDF parsed successfully! Check console for extracted text.');
		} catch (error) {
			console.error('Error parsing PDF:', error);
			alert('Failed to parse PDF. Please try again.');
		}
	}
</script>

<div class="upload-container">
	<form class="upload-form">
		<label for="pdfFile">Upload PDF:</label>
		<input type="file" id="pdfFile" accept="application/pdf" />
		<button type="button" onclick={handleUpload}>Upload</button>
	</form>
</div>

<style>
	.upload-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}
	.upload-form {
		text-align: center;
	}
</style>
