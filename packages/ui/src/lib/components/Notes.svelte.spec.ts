import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Notes from './Notes.svelte';

function renderedHtml(value: string): string {
	render(Notes, { value });
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
});
