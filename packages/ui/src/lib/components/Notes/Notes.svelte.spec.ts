import type { NoteLinks } from '../../types/note-links';
import type { NoteTerm } from '../../types/note-term';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Notes from './Notes.svelte';

function renderedHtml(value: string, links?: Pick<NoteLinks, 'resolve'>): string {
	render(Notes, { value, links });
	return (document.querySelector('.notes') as HTMLElement).innerHTML;
}

describe('Notes', () => {
	it('renders paragraphs and keeps single line breaks', () => {
		expect(renderedHtml('First line\nSecond line\n\nNext paragraph')).toBe(
			'<p>First line<br>Second line</p>\n<p>Next paragraph</p>\n'
		);
	});

	it('renders bold, italic, the third-level heading and both list kinds', () => {
		const html = renderedHtml(
			'### Light\n\n**Bold** and *italic*\n\n- one\n- two\n\n1. first\n2. second'
		);

		expect(html).toContain('<h3>Light</h3>');
		expect(html).toContain('<strong>Bold</strong> and <em>italic</em>');
		expect(html).toContain('<ul>');
		expect(html).toContain('<ol>');
		expect(html).toContain('<li>first</li>');
	});

	it('shows raw HTML as text instead of injecting it', () => {
		const html = renderedHtml('<img src=x onerror="alert(1)"> <script>alert(1)</script>');

		expect(html).not.toContain('<img');
		expect(html).not.toContain('<script');
		expect(html).toContain('&lt;img');
	});

	it('shows unsupported Markdown as plain text', () => {
		expect(renderedHtml('[a link](https://example.com)')).not.toContain('<a');
		expect(renderedHtml('![alt](https://example.com/a.png)')).not.toContain('<img');
		expect(renderedHtml('> quoted')).not.toContain('<blockquote');
		expect(renderedHtml('`code`')).not.toContain('<code');
		expect(renderedHtml('# Big')).not.toContain('<h1');
		expect(renderedHtml('[a link](https://example.com)')).toContain(
			'[a link](https://example.com)'
		);
	});

	it('renders nothing for an empty note', () => {
		expect(renderedHtml('')).toBe('');
	});

	describe('links to values and artworks', () => {
		const baroque = '/atelier/values/period/9b2f6c1e-0000-4000-8000-000000000001';
		const known: Pick<NoteLinks, 'resolve'> = {
			resolve: (href) =>
				href === baroque ? 'barok' : href === '/atelier/7' ? '#0007 Lady' : undefined
		};

		it('shows the current name in a link to a known page', () => {
			const html = renderedHtml(`See [old name](${baroque}) and [x](/atelier/7).`, known);

			expect(html).toContain(`<a href="${baroque}" data-note-link="">barok</a>`);
			expect(html).toContain('<a href="/atelier/7" data-note-link="">#0007 Lady</a>');
		});

		it('shows a missing target as plain text with the stored name and keeps its address', () => {
			const html = renderedHtml('Gone: [Lost name](/atelier/values/style/zzz).', known);

			expect(html).not.toContain('<a');
			expect(html).toContain(
				'<span data-note-link="" data-missing="" data-href="/atelier/values/style/zzz">Lost name</span>'
			);
		});

		it('shows the stored name in a link when nothing resolves names', () => {
			expect(renderedHtml('[Fallback](/atelier/12)')).toContain(
				'<a href="/atelier/12" data-note-link="">Fallback</a>'
			);
		});

		it('keeps links to other pages and addresses of another shape as text', () => {
			for (const link of [
				'[a](https://example.com)',
				'[a](/atelier)',
				'[a](/atelier/trash)',
				'[a](/atelier/values/author)',
				'[a](/atelier/values/unknown/x)',
				'[a](javascript:alert(1))'
			]) {
				const html = renderedHtml(link, known);
				expect(html).not.toContain('<a');
				expect(html).toContain('[a](');
			}
		});

		it('escapes the name and does not let a typed span or anchor through', () => {
			const html = renderedHtml('<a href="/atelier/7" data-note-link>x</a> [<b>](/atelier/7)', {
				resolve: () => '<img src=x onerror=1>'
			});

			expect(html).not.toContain('<img');
			expect(html).toContain('&lt;a href=');
			expect(html).toContain('&lt;img src=x onerror=1&gt;');
		});
	});
	describe('glossary terms', () => {
		const terms: NoteTerm[] = [
			{ id: 'sfumato', phrases: ['sfumato'] },
			{ id: 'tympanum', phrases: ['tympanum', 'tympana'] },
			{ id: 'lorenzo', phrases: ['Lorenzo de Medici'] },
			{ id: 'medici', phrases: ['Medici'] }
		];
		const termCard = createRawSnippet((id: () => string) => ({
			render: () => `<span>card of ${id()}</span>`
		}));

		function renderTerms(value: string, links?: Pick<NoteLinks, 'resolve'>): HTMLElement {
			render(Notes, { value, links, terms, termCard });
			return document.querySelector('.notes') as HTMLElement;
		}

		function marked(root: HTMLElement): string[] {
			return [...root.querySelectorAll('button[data-term]')].map(
				(button) => button.textContent ?? ''
			);
		}

		it('marks the first occurrence of a term, ignoring letter case', () => {
			const root = renderTerms('Sfumato here and sfumato there');

			expect(marked(root)).toEqual(['Sfumato']);
		});

		it('marks a term written in one of its other forms', () => {
			expect(marked(renderTerms('Two tympana were carved'))).toEqual(['tympana']);
		});

		it('marks whole words only', () => {
			expect(marked(renderTerms('A sfumatos effect'))).toEqual([]);
		});

		it('lets the longer phrase win when two terms overlap', () => {
			expect(marked(renderTerms('Lorenzo de Medici ruled'))).toEqual(['Lorenzo de Medici']);
		});

		it('marks inside bold text but not inside links', () => {
			const root = renderTerms('**sfumato** and [sfumato](/atelier/1) and tympanum', {
				resolve: () => 'sfumato'
			});

			expect(marked(root)).toEqual(['sfumato', 'tympanum']);
		});

		it('marks nothing without a card to show', () => {
			render(Notes, { value: 'sfumato', terms });

			expect(document.querySelector('button[data-term]')).toBeNull();
		});

		it('opens the card of the term on a click and closes it on Escape', async () => {
			renderTerms('The sfumato technique');

			const button = page.getByRole('button', { name: 'sfumato' });
			await button.click();
			await expect.element(page.getByRole('tooltip')).toHaveTextContent('card of sfumato');
			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Escape}');

			await expect.element(button).toHaveAttribute('aria-expanded', 'false');
		});

		it('marks terms in plain text without reading it as Markdown', () => {
			render(Notes, { value: '**sfumato**\n1. tympanum', terms, termCard, plain: true });
			const root = document.querySelector('.notes') as HTMLElement;

			expect(marked(root)).toEqual(['sfumato', 'tympanum']);
			expect(root.querySelector('strong, ol')).toBeNull();
			expect(root.textContent).toBe('**sfumato**\n1. tympanum');
		});

		describe('with a card to click', () => {
			const linkCard = createRawSnippet((id: () => string) => ({
				render: () => `<a href="#page-of-${id()}">open ${id()}</a>`
			}));

			function renderInteractive(value: string): void {
				render(Notes, { value, terms, termCard: linkCard, interactive: true });
			}

			afterEach(() => {
				vi.useRealTimers();
				history.replaceState(null, '', location.pathname + location.search);
			});

			it('keeps the card open while the pointer moves onto it and closes after it leaves both', async () => {
				vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
				renderInteractive('The sfumato technique');
				const button = page.getByRole('button', { name: 'sfumato' });
				const card = page.getByRole('dialog', { name: 'sfumato' });

				await userEvent.hover(button);
				await expect.element(card).toHaveTextContent('open sfumato');
				await userEvent.unhover(button);
				await userEvent.hover(page.getByRole('link', { name: 'open sfumato' }));
				vi.advanceTimersByTime(1000);
				await expect.element(button).toHaveAttribute('aria-expanded', 'true');
				await userEvent.unhover(card);
				vi.advanceTimersByTime(1000);

				await expect.element(button).toHaveAttribute('aria-expanded', 'false');
			});

			it('lets a tap on the link in the card follow it', async () => {
				renderInteractive('The sfumato technique');

				await page.getByRole('button', { name: 'sfumato' }).click();
				await page.getByRole('link', { name: 'open sfumato' }).click();

				expect(location.hash).toBe('#page-of-sfumato');
			});

			it('moves the keyboard from the term into its card and on to the next term', async () => {
				renderInteractive('The sfumato technique of Medici');
				const sfumato = page.getByRole('button', { name: 'sfumato' });
				document.body.focus();

				await userEvent.tab();
				await expect.element(sfumato).toHaveFocus();
				await userEvent.tab();
				await expect.element(page.getByRole('link', { name: 'open sfumato' })).toHaveFocus();
				await userEvent.tab({ shift: true });
				await expect.element(sfumato).toHaveFocus();
				await userEvent.tab();
				await userEvent.tab();
				const medici = page.getByRole('button', { name: 'Medici' });
				await expect.element(medici).toHaveFocus();
				await expect.element(medici).toHaveAttribute('aria-expanded', 'true');
				await userEvent.tab();
				await expect.element(page.getByRole('dialog', { name: 'Medici' })).toBeVisible();
				await userEvent.keyboard('{Escape}');

				await expect.element(medici).toHaveFocus();
				await expect.element(medici).toHaveAttribute('aria-expanded', 'false');
			});
		});
	});
});
