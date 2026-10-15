import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { NoteLinks } from '../note-links';
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
});
