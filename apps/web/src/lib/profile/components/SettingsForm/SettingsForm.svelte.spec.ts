import { describe, expect, it, vi, type Mock } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import SettingsForm from './SettingsForm.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Treść zakładki</p>' }));

function renderForm(props: { busy?: boolean; error?: string } = {}): {
	onsubmit: Mock;
	oncancel: Mock;
} {
	const onsubmit = vi.fn();
	const oncancel = vi.fn();
	render(SettingsForm, {
		busy: false,
		errorTitle: 'Nie udało się zapisać',
		saveLabel: 'Zapisz ustawienia',
		onsubmit,
		oncancel,
		children,
		...props
	});
	return { onsubmit, oncancel };
}

describe('SettingsForm', () => {
	it('saves and cancels from its bar', async () => {
		const { onsubmit, oncancel } = renderForm();

		await userEvent.click(page.getByRole('button', { name: 'Zapisz ustawienia' }));
		await userEvent.click(page.getByRole('button', { name: 'Anuluj' }));

		expect(onsubmit).toHaveBeenCalledOnce();
		expect(oncancel).toHaveBeenCalledOnce();
	});

	it('disables the bar while it saves', async () => {
		renderForm({ busy: true });

		await expect.element(page.getByRole('button', { name: 'Zapisywanie…' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Anuluj' })).toBeDisabled();
	});

	it('ends the card under its content, above the bar', async () => {
		await page.viewport(1280, 800);
		renderForm({ error: 'Brak połączenia' });

		const content = page.getByText('Treść zakładki').element();
		const alert = page.getByRole('alert').element();
		const form = content.closest('form') as HTMLFormElement;
		const frame = getComputedStyle(form, '::before');
		const bar = form.querySelector('[data-action-bar]') as HTMLElement;
		const body = content.parentElement as HTMLElement;

		expect(frame.borderBottomStyle).toBe('solid');
		expect(frame.borderTopStyle).toBe('none');
		expect([frame.gridRowStart, frame.gridRowEnd]).toEqual(['1', '5']);
		expect(getComputedStyle(bar).gridRowStart).toBe('6');
		expect(alert.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			body.getBoundingClientRect().top + 1
		);
		expect(body.getBoundingClientRect().bottom).toBeLessThan(bar.getBoundingClientRect().top);
	});
});
