import { describe, expect, it } from 'vitest';
import { noteText } from './notes-markdown';

describe('noteText', () => {
	it('reads a note as plain text, keeping the labels of links and items', () => {
		expect(noteText('- **Tympanon** z [Chrystusem](/atelier/12) w *mandorli*')).toBe(
			'Tympanon z Chrystusem w mandorli'
		);
	});

	it('joins the lines of a paragraph with single spaces', () => {
		expect(noteText('Portal zachodni.\nW tympanonie Chrystus.')).toBe(
			'Portal zachodni. W tympanonie Chrystus.'
		);
	});
});
