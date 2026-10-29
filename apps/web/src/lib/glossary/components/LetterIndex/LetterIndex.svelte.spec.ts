import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import LetterIndex from './LetterIndex.svelte';

function sections(...letters: string[]): HTMLElement {
	const list = document.createElement('div');
	for (const letter of letters) {
		const section = document.createElement('section');
		section.style.height = '600px';
		const heading = document.createElement('h2');
		heading.id = `letter-${letter}`;
		heading.textContent = letter;
		section.appendChild(heading);
		list.appendChild(section);
	}
	document.body.appendChild(list);
	return list;
}

describe('LetterIndex', () => {
	let list: HTMLElement;

	afterEach(() => {
		list.remove();
		window.scrollTo({ top: 0, behavior: 'instant' });
	});

	it('names every letter and marks the first one as current at the top', async () => {
		list = sections('A', 'B', 'C');
		render(LetterIndex, { letters: ['A', 'B', 'C'] });

		const index = page.getByRole('navigation', { name: m.glossary.letters });
		expect(
			index
				.getByRole('button')
				.elements()
				.map((button) => button.textContent)
		).toEqual(['A', 'B', 'C']);
		await expect
			.element(index.getByRole('button', { name: 'A' }))
			.toHaveAttribute('aria-current', 'true');
	});

	it('scrolls to the section of a chosen letter', async () => {
		list = sections('A', 'B', 'C');
		render(LetterIndex, { letters: ['A', 'B', 'C'] });
		const section = document.getElementById('letter-C')?.parentElement as HTMLElement;
		const scroll = vi.spyOn(section, 'scrollIntoView');

		await page.getByRole('button', { name: 'C' }).click();

		expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ block: 'start' }));
	});

	it('moves the focus to the heading of a chosen letter', async () => {
		list = sections('A', 'B', 'C');
		render(LetterIndex, { letters: ['A', 'B', 'C'] });

		await page.getByRole('button', { name: 'C' }).click();

		expect(document.activeElement?.id).toBe('letter-C');
	});

	it('marks the letter whose section reached the top while scrolling', async () => {
		list = sections('A', 'B', 'C');
		render(LetterIndex, { letters: ['A', 'B', 'C'] });

		window.scrollTo({ top: 650, behavior: 'instant' });
		window.dispatchEvent(new Event('scroll'));

		await expect
			.element(page.getByRole('button', { name: 'B' }))
			.toHaveAttribute('aria-current', 'true');
	});

	it('marks the last letter when the page cannot scroll any further', async () => {
		list = sections('A', 'B', 'C');
		(list.children[1] as HTMLElement).style.height = '40px';
		(list.children[2] as HTMLElement).style.height = '40px';
		render(LetterIndex, { letters: ['A', 'B', 'C'] });

		window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
		window.dispatchEvent(new Event('scroll'));

		await expect
			.element(page.getByRole('button', { name: 'C' }))
			.toHaveAttribute('aria-current', 'true');
	});

	it('marks the chosen letter until the learner scrolls on their own', async () => {
		list = sections('A', 'B', 'C');
		(list.children[2] as HTMLElement).style.height = '40px';
		render(LetterIndex, { letters: ['A', 'B', 'C'] });

		await page.getByRole('button', { name: 'B' }).click();
		window.dispatchEvent(new Event('scroll'));
		await expect
			.element(page.getByRole('button', { name: 'B' }))
			.toHaveAttribute('aria-current', 'true');

		window.dispatchEvent(new WheelEvent('wheel'));
		window.scrollTo({ top: 0, behavior: 'instant' });
		window.dispatchEvent(new Event('scroll'));
		await expect
			.element(page.getByRole('button', { name: 'A' }))
			.toHaveAttribute('aria-current', 'true');
	});
});
