import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FillingLines from './FillingLines.svelte';

describe('FillingLines', () => {
	it('draws one short line for a one-line field', async () => {
		await render(FillingLines);

		expect(document.querySelectorAll('.line')).toHaveLength(1);
		expect(document.querySelector('.filling-lines')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('draws the asked number of lines, the last one short like the end of a paragraph', async () => {
		await render(FillingLines, { lines: 4 });

		const lines = [...document.querySelectorAll<HTMLElement>('.line')];
		expect(lines).toHaveLength(4);
		expect(lines.at(-1)?.style.width).toBe('55%');
		expect(lines[0].style.width).not.toBe('55%');
	});
});
