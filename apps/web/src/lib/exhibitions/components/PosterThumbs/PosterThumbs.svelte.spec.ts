import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PosterThumbs from './PosterThumbs.svelte';

describe('PosterThumbs', () => {
	it('marks the chosen thumbnail and reports another choice', async () => {
		const onchoose = vi.fn();
		render(PosterThumbs, {
			items: [
				{ id: 'a', label: 'Judith', src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' },
				{ id: 'b', label: 'Olympia' }
			],
			chosen: 'a',
			onchoose
		});

		await expect
			.element(page.getByRole('button', { name: 'Judith' }))
			.toHaveAttribute('aria-pressed', 'true');
		(page.getByRole('button', { name: 'Olympia' }).element() as HTMLButtonElement).click();

		expect(onchoose).toHaveBeenCalledWith('b');
	});
});
