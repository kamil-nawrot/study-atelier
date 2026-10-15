import DOMPurify from 'dompurify';
import { Marked, type Tokens } from 'marked';
import { isNoteLinkPath, type NoteLinks } from './note-links';

const allowedTags = ['p', 'br', 'strong', 'em', 'h3', 'ul', 'ol', 'li', 'a', 'span'];
const allowedAttributes = ['href', 'data-note-link', 'data-missing', 'data-href'];

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

type LinkResolver = Pick<NoteLinks, 'resolve'>;

let resolver: LinkResolver | undefined;

const markdown = new Marked({
	breaks: true,
	gfm: true,
	renderer: {
		html: asText,
		del: asText,
		checkbox: asText,
		link(
			this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } },
			token: Tokens.Link
		): string {
			if (!isNoteLinkPath(token.href)) return asText(token);
			const href = escapeHtml(token.href);
			const stored = this.parser.parseInline(token.tokens);
			if (!resolver) return `<a href="${href}" data-note-link>${stored}</a>`;
			const name = resolver.resolve(token.href);
			if (name === undefined) {
				return `<span data-note-link data-missing data-href="${href}">${stored}</span>`;
			}
			return `<a href="${href}" data-note-link>${escapeHtml(name)}</a>`;
		},
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

export function renderNotes(source: string, links?: LinkResolver): string {
	resolver = links;
	try {
		const html = markdown.parse(source, { async: false });
		return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttributes });
	} finally {
		resolver = undefined;
	}
}
