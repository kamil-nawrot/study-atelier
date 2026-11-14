import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TickTile from './TickTile.svelte';

const picture = createRawSnippet(() => ({ render: () => '<span class="shot">picture</span>' }));
const children = createRawSnippet(() => ({ render: () => '<span>Vanitas</span>' }));

describe('TickTile', () => {
	it('is a checkbox named by its text that toggles on a click anywhere on the tile', async () => {
		const ontoggle = vi.fn();
		render(TickTile, { checked: true, ontoggle, picture, children });

		const box = page.getByRole('checkbox', { name: 'Vanitas' });
		await expect.element(box).toBeChecked();
		expect(document.querySelector('.mark svg')).not.toBeNull();
		await page.getByText('picture').click();

		expect(ontoggle).toHaveBeenCalledOnce();
	});

	it('dims an unticked tile and leaves its mark empty', async () => {
		render(TickTile, { checked: false, ontoggle: vi.fn(), picture, children });

		await expect.element(page.getByRole('checkbox', { name: 'Vanitas' })).not.toBeChecked();
		expect(document.querySelector('.tick.off')).not.toBeNull();
		expect(document.querySelector('.mark svg')).toBeNull();
	});

	it('frames the picture by default and leaves it unframed on request', async () => {
		const framed = await render(TickTile, { checked: true, ontoggle: vi.fn(), picture, children });
		expect(document.querySelector('.window.framed')).not.toBeNull();
		framed.unmount();

		render(TickTile, { checked: true, framed: false, ontoggle: vi.fn(), picture, children });
		expect(document.querySelector('.window.framed')).toBeNull();
	});
});
