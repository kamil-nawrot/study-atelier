import Pencil from '@lucide/svelte/icons/pencil';
import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { controlHeight } from '../testing/control-height';
import Button from './Button.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Use</span>' }));

describe('Button', () => {
	it('is as high as every other control', async () => {
		render(Button, { children: label });

		const button = page.getByRole('button', { name: 'Use' }).element();
		expect(button.getBoundingClientRect().height).toBe(controlHeight());
	});

	it('keeps the control height as a link', async () => {
		render(Button, { children: label, href: '/atelier' });

		const link = page.getByRole('link', { name: 'Use' }).element();
		expect(link.getBoundingClientRect().height).toBe(controlHeight());
	});

	it('shows its icon before the label', async () => {
		render(Button, { children: label, icon: Pencil });

		const button = page.getByRole('button', { name: 'Use' }).element();
		expect(button.firstElementChild?.tagName.toLowerCase()).toBe('svg');
	});

	it('shows only its icon on a phone when compact, and the label on a computer', async () => {
		await page.viewport(390, 844);
		render(Button, { 'aria-label': 'Use', children: label, compact: true, icon: Pencil });

		const button = page.getByRole('button', { name: 'Use' });
		await expect.element(button.getByText('Use')).not.toBeVisible();
		await expect.element(button.element().querySelector('svg')).toBeVisible();

		await page.viewport(1280, 800);
		await expect.element(button.getByText('Use')).toBeVisible();
	});
});
