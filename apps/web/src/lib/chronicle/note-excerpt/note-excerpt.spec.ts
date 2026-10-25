import { describe, expect, it } from 'vitest';
import { noteExcerpt } from './note-excerpt.ts';

describe('noteExcerpt', () => {
	it('keeps the text of links and drops their addresses', () => {
		expect(
			noteExcerpt('Obok [#0025 The Dance Class](/atelier/25) i [Manet](/atelier/values/author/1).')
		).toBe('Obok #0025 The Dance Class i Manet.');
	});

	it('drops formatting, headings and list marks and joins the lines', () => {
		expect(noteExcerpt('## Trasa\n\n- **piąte** piętro\n1. _parter_\n> cytat')).toBe(
			'Trasa piąte piętro parter cytat'
		);
	});
});
