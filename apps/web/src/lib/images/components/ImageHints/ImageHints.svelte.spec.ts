import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import ImageHints from './ImageHints.svelte';

describe('ImageHints', () => {
	it('joins the hints of the image into one line with the paste hint', async () => {
		render(ImageHints, { hints: ['Wskaż miejsce na obrazie', 'Wpisz tytuł'] });

		const line = page.getByRole('paragraph');
		await expect.element(line).toHaveTextContent('Wskaż miejsce na obrazie');
		await expect.element(line).toHaveTextContent('Wpisz tytuł');
		await expect.element(line).toHaveTextContent(m.artworkForm.pasteHintForm);
	});
});
