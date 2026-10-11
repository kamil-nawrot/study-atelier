import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AuthForm from './AuthForm.svelte';

const fields = createRawSnippet(() => ({
	render: () =>
		'<div><label>E-mail<input type="email" required /></label><button type="submit">Wyślij</button></div>'
}));

describe('AuthForm', () => {
	it('calls onsubmit without reloading the page', async () => {
		const onsubmit = vi.fn();
		const submitted = new Promise<Event>((resolve) =>
			document.addEventListener('submit', resolve, { once: true })
		);
		render(AuthForm, { onsubmit, children: fields });

		await page.getByRole('button', { name: 'Wyślij' }).click();

		expect(onsubmit).toHaveBeenCalledOnce();
		expect((await submitted).defaultPrevented).toBe(true);
	});

	it('leaves validation to the page instead of the browser', async () => {
		const onsubmit = vi.fn();
		render(AuthForm, { onsubmit, children: fields });

		await page.getByLabelText('E-mail').fill('nie-email');
		await userEvent.keyboard('{Enter}');

		expect(onsubmit).toHaveBeenCalledOnce();
	});
});
