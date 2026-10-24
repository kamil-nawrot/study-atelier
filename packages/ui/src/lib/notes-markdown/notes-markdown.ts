import type { NoteLinks } from '../types/note-links';
import type { NoteTerm } from '../types/note-term';
import DOMPurify from 'dompurify';
import { Marked, type Tokens } from 'marked';
import { isNoteLinkPath } from '../note-links/note-links';

const allowedTags = ['p', 'br', 'strong', 'em', 'h3', 'ul', 'ol', 'li', 'a', 'span'];
const allowedAttributes = ['href', 'data-note-link', 'data-missing', 'data-href'];

type TermMatch = { start: number; end: number; id: string };

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

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function termPattern(phrase: string): RegExp {
	return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(phrase.trim())}(?![\\p{L}\\p{N}])`, 'giu');
}

function matchesIn(text: string, terms: NoteTerm[]): TermMatch[] {
	const found = terms.flatMap(({ id, phrases }) =>
		phrases
			.filter((phrase) => phrase.trim() !== '')
			.flatMap((phrase) =>
				[...text.matchAll(termPattern(phrase))].map((match) => ({
					start: match.index,
					end: match.index + match[0].length,
					id
				}))
			)
	);
	const longestFirst = found.sort(
		(a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start
	);
	const kept: TermMatch[] = [];
	for (const candidate of longestFirst) {
		const overlaps = kept.some(
			(match) => candidate.start < match.end && match.start < candidate.end
		);
		if (!overlaps) kept.push(candidate);
	}
	return kept.sort((a, b) => a.start - b.start);
}

function textNodesOf(root: Node): Text[] {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) =>
			node.parentElement?.closest('a, [data-note-link]')
				? NodeFilter.FILTER_REJECT
				: NodeFilter.FILTER_ACCEPT
	});
	const nodes: Text[] = [];
	for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
	return nodes;
}

function markTerms(html: string, terms: NoteTerm[]): string {
	const template = document.createElement('template');
	template.innerHTML = html;
	const marked = new Set<string>();
	for (const node of textNodesOf(template.content)) {
		const text = node.data;
		const matches = matchesIn(text, terms).filter((match) => !marked.has(match.id));
		const unique = matches.filter(
			(match, index) => matches.findIndex((other) => other.id === match.id) === index
		);
		if (unique.length === 0) continue;
		const fragment = document.createDocumentFragment();
		let position = 0;
		for (const match of unique) {
			fragment.append(text.slice(position, match.start));
			const button = document.createElement('button');
			button.type = 'button';
			button.dataset.term = match.id;
			button.textContent = text.slice(match.start, match.end);
			fragment.append(button);
			marked.add(match.id);
			position = match.end;
		}
		fragment.append(text.slice(position));
		node.replaceWith(fragment);
	}
	return template.innerHTML;
}

export function renderNotes(source: string, links?: LinkResolver, terms: NoteTerm[] = []): string {
	resolver = links;
	try {
		const html = markdown.parse(source, { async: false });
		const clean = DOMPurify.sanitize(html, {
			ALLOWED_TAGS: allowedTags,
			ALLOWED_ATTR: allowedAttributes
		});
		return terms.length === 0 ? clean : markTerms(clean, terms);
	} finally {
		resolver = undefined;
	}
}

export function renderText(source: string, terms: NoteTerm[] = []): string {
	const html = escapeHtml(source);
	return terms.length === 0 ? html : markTerms(html, terms);
}

export function mentionsTerm(source: string, term: NoteTerm): boolean {
	return renderNotes(source, undefined, [term]).includes('<button');
}
