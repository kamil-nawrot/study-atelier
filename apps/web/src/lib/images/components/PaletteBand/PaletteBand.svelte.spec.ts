import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import PaletteBand from './PaletteBand.svelte';

const colours = [
	{ color: '#aa8855', share: 0.55 },
	{ color: '#223344', share: 0.3 },
	{ color: '#ddeeff', share: 0.15 }
];

describe('PaletteBand', () => {
	it('shows a segment for each colour', async () => {
		const { container } = await render(PaletteBand, { colours, collecting: false });

		const segments = [...container.querySelectorAll('li')];
		expect(segments.map((segment) => segment.getAttribute('aria-label'))).toEqual([
			m.palette.colour('#aa8855', 55),
			m.palette.colour('#223344', 30),
			m.palette.colour('#ddeeff', 15)
		]);
	});

	it('widens a segment with its share', async () => {
		const { container } = await render(PaletteBand, { colours, collecting: false });

		const [first, second] = [...container.querySelectorAll('li')];
		expect(first.style.flexGrow).toBe('0.55');
		expect(second.style.flexGrow).toBe('0.3');
	});

	it('writes the hex code only under a colour over a fifth of the image', async () => {
		const { container } = await render(PaletteBand, { colours, collecting: false });

		const codes = [...container.querySelectorAll('.hex')].map((code) => code.textContent);
		expect(codes).toEqual(['#aa8855', '#223344', '']);
	});

	it('says that the colours are being collected', async () => {
		const { container } = await render(PaletteBand, { colours: [], collecting: true });

		expect(container.textContent).toContain(m.palette.collecting);
		expect(container.querySelector('li')).toBeNull();
	});
});
