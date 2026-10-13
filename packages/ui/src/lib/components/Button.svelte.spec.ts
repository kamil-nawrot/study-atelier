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
});
