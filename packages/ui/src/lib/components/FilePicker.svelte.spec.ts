import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import FilePicker from './FilePicker.svelte';

function input(): HTMLInputElement {
	const element = document.querySelector<HTMLInputElement>('input[type="file"]');
	if (!element) throw new Error('The file input is missing');
	return element;
}

function select(file: File): void {
	const transfer = new DataTransfer();
	transfer.items.add(file);
	input().files = transfer.files;
	input().dispatchEvent(new Event('change', { bubbles: true }));
}

describe('FilePicker', () => {
	it('is a button that opens the native file input with the accepted types', async () => {
		render(FilePicker, { label: 'Choose a file', accept: 'image/png', onpick: vi.fn() });
		const click = vi.spyOn(input(), 'click');

		await page.getByRole('button', { name: 'Choose a file' }).click();

		expect(click).toHaveBeenCalledOnce();
		expect(input().accept).toBe('image/png');
		expect(input().hidden).toBe(true);
	});

	it('hands over the picked file and clears the input, so the same file can be picked again', async () => {
		const onpick = vi.fn();
		render(FilePicker, { label: 'Choose a file', onpick });
		const file = new File(['image'], 'photo.png', { type: 'image/png' });

		select(file);

		expect(onpick).toHaveBeenCalledWith(file);
		expect(input().value).toBe('');
	});

	it('is described by a message outside it and can be disabled', async () => {
		render(FilePicker, {
			label: 'Choose a file',
			describedby: 'hint',
			disabled: true,
			onpick: vi.fn()
		});

		const button = page.getByRole('button', { name: 'Choose a file' });
		await expect.element(button).toBeDisabled();
		await expect.element(button).toHaveAttribute('aria-describedby', 'hint');
		expect(input().disabled).toBe(true);
	});
});
