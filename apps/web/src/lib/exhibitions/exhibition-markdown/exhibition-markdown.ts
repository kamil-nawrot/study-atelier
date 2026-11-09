import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

const SPECIAL = /[\\*_[\]`<>~|]/g;
const LINE_START = /^(#|-|\+|\d+[.)])/;

function escaped(text: string): string {
	return text.replace(SPECIAL, '\\$&').replace(LINE_START, '\\$1');
}

function inline(node: ExhibitionDocument): string {
	const text = escaped(node.text ?? '');
	if (text === '') return '';
	const marks = (node.marks ?? []).map((mark) => mark.type);
	const bold = marks.includes('bold');
	const italic = marks.includes('italic');
	const wrapper = `${bold ? '**' : ''}${italic ? '*' : ''}`;
	const lead = text.length - text.trimStart().length;
	const trail = text.length - text.trimEnd().length;
	if (wrapper === '' || lead === text.length) return text;
	const reversed = wrapper.split('').reverse().join('');
	return `${text.slice(0, lead)}${wrapper}${text.trim()}${reversed}${text.slice(text.length - trail)}`;
}

function paragraph(node: ExhibitionDocument): string {
	return (node.content ?? []).map(inline).join('');
}

function blockMarkdown(node: ExhibitionDocument): string {
	if (node.type === 'paragraph') return paragraph(node);
	if (node.type === 'heading') return `### ${paragraph(node)}`;
	return list(node);
}

function itemMarkdown(item: ExhibitionDocument, marker: string): string {
	const pad = ' '.repeat(marker.length + 1);
	const body = (item.content ?? [])
		.map((child, index) => {
			const gap = index === 0 ? '' : child.type === 'paragraph' ? '\n\n' : '\n';
			return `${gap}${blockMarkdown(child)}`;
		})
		.join('');
	const lines = body
		.split('\n')
		.map((line, index) => (index === 0 || line === '' ? line : pad + line));
	return `${marker} ${lines.join('\n')}`;
}

function list(node: ExhibitionDocument): string {
	const ordered = node.type === 'orderedList';
	return (node.content ?? [])
		.map((item, index) => itemMarkdown(item, ordered ? `${index + 1}.` : '-'))
		.join('\n');
}

export function textBlockMarkdown(node: ExhibitionDocument): string {
	return (node.content ?? []).map(blockMarkdown).join('\n\n');
}

export function plainText(node: ExhibitionDocument): string {
	if (node.type === 'text') return node.text ?? '';
	const separator = node.type === 'quote' ? '\n' : '';
	return (node.content ?? []).map(plainText).join(separator);
}
