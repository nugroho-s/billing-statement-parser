import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) {
		return json({ error: 'No file provided' }, { status: 400 });
	}

	if (file.type !== 'application/pdf') {
		return json({ error: 'File must be a PDF' }, { status: 400 });
	}

	try {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const { PDFParse } = await import('pdf-parse');
		const parser = new PDFParse({ data: buffer });
		const textResult = await parser.getText();
		const infoResult = await parser.getInfo();

		return json({
			success: true,
			text: textResult.text,
			pages: infoResult.total,
			info: infoResult.info
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
			return json({ error: 'PDF is encrypted and cannot be parsed' }, { status: 400 });
		}
		return json({ error: `Failed to parse PDF: ${errorMessage}` }, { status: 500 });
	}
};
