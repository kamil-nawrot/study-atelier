import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import LoupeLens from './LoupeLens.svelte';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"/>')}`;
const MISSING = 'http://localhost:1/missing.jpg';

const PROPS = { size: 220, width: 400, height: 300, x: 0, y: 0 };

describe('LoupeLens', () => {
	it('is primed while its image loads and shows the image afterwards', async () => {
		const { container } = await render(LoupeLens, { ...PROPS, image: IMAGE });

		const glass = container.querySelector('.glass') as HTMLElement;
		await expect.poll(() => glass.getAttribute('aria-busy')).toBe('false');
		expect(glass.style.backgroundImage).toContain('data:image/svg+xml');
		expect(glass.querySelector('.primer')).toBeNull();
	});

	it('stays primed while its image has not loaded', async () => {
		const { container } = await render(LoupeLens, { ...PROPS, image: MISSING });

		const glass = container.querySelector('.glass') as HTMLElement;
		expect(glass.getAttribute('aria-busy')).toBe('true');
		expect(glass.querySelector('.primer')).not.toBeNull();
		expect(glass.style.backgroundImage).toBe('');
	});
});
