import DOMPurify from 'dompurify';
import { Marked, type Tokens } from 'marked';

const allowedTags = ['p', 'br', 'strong', 'em', 'h3', 'ul', 'ol', 'li'];

function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function asText(token: { raw: string }): string {
	return escapeHtml(token.raw);
}

function asParagraph(token: { raw: string }): string {
	return `<p>${escapeHtml(token.raw.trim())}</p>\n`;
}

const markdown = new Marked({
	breaks: true,
	gfm: true,
	renderer: {
		html: asText,
		del: asText,
		checkbox: asText,
		link: asText,
		image: asText,
		codespan: asText,
		code: asParagraph,
		blockquote: asParagraph,
		table: asParagraph,
		hr: asParagraph,
		heading({ tokens, depth, raw }: Tokens.Heading): string {
			if (depth !== 3) return asParagraph({ raw });
			return `<h3>${this.parser.parseInline(tokens)}</h3>\n`;
		}
	}
});

export function renderNotes(source: string): string {
	const html = markdown.parse(source, { async: false });
	return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: [] });
}
