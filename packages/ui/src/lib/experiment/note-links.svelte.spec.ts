import { Editor } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import Mention from '@tiptap/extension-mention';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { renderNotes } from '../notes-markdown';

const pattern = /^\[([^\]\n]+)\]\(\/atelier\/((?:values\/(?:era|period|style|material|author|location)\/[\w-]+)|\d+)\)/;

const NoteLink = Mention.extend({
	name: 'mention',
	addAttributes() {
		return { id: { default: null }, label: { default: null } };
	},
	renderHTML({ node }) {
		return ['a', { href: `/atelier/${node.attrs.id}`, 'data-note-link': '' }, node.attrs.label];
	},
	parseHTML() {
		return [
			{
				tag: 'a[href^="/atelier/"]',
				getAttrs: (element) => ({
					id: (element as HTMLElement).getAttribute('href')!.slice('/atelier/'.length),
					label: (element as HTMLElement).textContent
				})
			}
		];
	},
	renderText({ node }) {
		return node.attrs.label;
	},
	markdownTokenName: 'noteLink',
	markdownTokenizer: {
		name: 'noteLink',
		level: 'inline',
		start: (src: string) => src.indexOf('['),
		tokenize(src: string) {
			const match = src.match(pattern);
			if (!match) return undefined;
			return { type: 'noteLink', raw: match[0], label: match[1], target: match[2] };
		}
	},
	parseMarkdown(token, helpers) {
		return helpers.createNode('mention', { id: token.target, label: token.label });
	},
	renderMarkdown(node) {
		return `[${node.attrs?.label}](/atelier/${node.attrs?.id})`;
	}
});

function editorWith(content: string, contentType: 'markdown' | 'html') {
	return new Editor({
		element: document.createElement('div'),
		extensions: [StarterKit.configure({ link: false }), Markdown, NoteLink],
		content,
		contentType
	});
}

describe('note links experiment', () => {
	it('default Mention markdown is a shortcode', () => {
		const editor = new Editor({
			element: document.createElement('div'),
			extensions: [StarterKit, Markdown, Mention],
			content: {
				type: 'doc',
				content: [
					{
						type: 'paragraph',
						content: [
							{ type: 'text', text: 'See ' },
							{ type: 'mention', attrs: { id: 'abc', label: 'Caravaggio' } }
						]
					}
				]
			}
		});
		expect(editor.getMarkdown()).toBe('See [@ id="abc" label="Caravaggio"]');
	});

	const source =
		'### Światło\n\nJak u [Caravaggio](/atelier/values/author/8f1c2a10-1111-4222-8333-444455556666), zob. [#0012 Powołanie św. Mateusza](/atelier/12) i **[nowożytność](/atelier/values/era/early_modern)**.\n\n- [Rzym](/atelier/values/location/0b5e1d2c-1111-4222-8333-444455556666)';

	it('round-trips markdown links as atomic nodes', () => {
		const editor = editorWith(source, 'markdown');
		expect(editor.getMarkdown()).toBe(source.replace('**[nowożytność](/atelier/values/era/early_modern)**', '[nowożytność](/atelier/values/era/early_modern)'));
		expect(JSON.stringify(editor.getJSON())).toContain('"id":"12","label":"#0012 Powołanie św. Mateusza"');
	});

	it('loads through the current renderNotes html path', () => {
		expect(renderNotes(source)).toContain('[Caravaggio](/atelier/values/author/');
	});
});
