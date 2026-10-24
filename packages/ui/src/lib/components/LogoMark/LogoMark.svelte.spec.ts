import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../styles/index.css';
import LogoMark from './LogoMark.svelte';

const stroke = createRawSnippet(() => ({
	render: () => '<rect data-testid="stroke" width="4" height="4" />'
}));

describe('LogoMark', () => {
	it('is decorative without a label', async () => {
		render(LogoMark);

		expect(page.getByRole('img').elements()).toHaveLength(0);
		expect(document.querySelector('svg.mark')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('is an image named by its label', async () => {
		render(LogoMark, { label: 'Study Atelier' });

		await expect.element(page.getByRole('img', { name: 'Study Atelier' })).toBeVisible();
	});

	it('draws what it is given inside the frame', async () => {
		render(LogoMark, { children: stroke });

		await expect.element(page.getByTestId('stroke')).toBeInTheDocument();
	});

	it('has nothing inside the frame by default', async () => {
		render(LogoMark);

		expect(document.querySelectorAll('svg.mark svg')).toHaveLength(0);
	});

	it('grows from the small to the extra large size', async () => {
		const sizes = ['sm', 'md', 'lg', 'xl'] as const;
		sizes.forEach((size) => render(LogoMark, { size, label: size }));

		const widths = sizes.map(
			(size) => page.getByRole('img', { name: size }).element().getBoundingClientRect().width
		);
		expect(widths).toEqual([...widths].sort((a, b) => a - b));
		expect(new Set(widths).size).toBe(sizes.length);
	});
});
