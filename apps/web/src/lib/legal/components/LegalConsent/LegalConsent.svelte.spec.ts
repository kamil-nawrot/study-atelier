import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import LegalConsent from './LegalConsent.svelte';

describe('LegalConsent', () => {
	it('opens both documents in a new tab so the form keeps its input', async () => {
		render(LegalConsent, { checked: false });

		const terms = page.getByRole('link', { name: m.legal.consentTerms });
		await expect.element(terms).toHaveAttribute('href', '/terms');
		await expect.element(terms).toHaveAttribute('target', '_blank');
		await expect
			.element(page.getByRole('link', { name: m.legal.consentPrivacy }))
			.toHaveAttribute('href', '/privacy');
	});

	it('names the checkbox by the whole statement and shows why it is needed', async () => {
		render(LegalConsent, { checked: false, error: m.legal.consentRequired });

		const box = page.getByRole('checkbox', { name: m.legal.consentDeclare });
		await expect.element(box).not.toBeChecked();
		await expect.element(box).toHaveAttribute('aria-invalid', 'true');
		await expect.element(box).toHaveAccessibleDescription(m.legal.consentRequired);
	});
});
