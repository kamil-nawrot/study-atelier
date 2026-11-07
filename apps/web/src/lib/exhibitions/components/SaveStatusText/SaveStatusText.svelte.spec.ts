import { describe, it } from 'vitest';
import { page } from 'vitest/browser';
import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import SaveStatusText from './SaveStatusText.svelte';

describe('SaveStatusText', () => {
	it.each([
		['saving', m.exhibitions.save.saving],
		['saved', m.exhibitions.save.saved],
		['failed', m.exhibitions.save.failed],
		['conflict', m.exhibitions.save.conflictTitle]
	] as const)('says what happens with the changes when they are %s', async (status, text) => {
		render(SaveStatusText, { status });

		await expect.element(page.getByText(text)).toBeInTheDocument();
	});
});
