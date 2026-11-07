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

function list(node: ExhibitionDocument, depth: number): string {
	const ordered = node.type === 'orderedList';
	return (node.content ?? [])
		.map((item, index) => {
			const marker = ordered ? `${index + 1}.` : '-';
			const indent = '  '.repeat(depth);
			const [first, ...rest] = item.content ?? [];
			const nested = rest
				.filter((child) => child.type === 'bulletList' || child.type === 'orderedList')
				.map((child) => list(child, depth + 1));
			return [`${indent}${marker} ${first ? paragraph(first) : ''}`, ...nested].join('\n');
		})
		.join('\n');
}

export function textBlockMarkdown(node: ExhibitionDocument): string {
	return (node.content ?? [])
		.map((child) => (child.type === 'paragraph' ? paragraph(child) : list(child, 0)))
		.join('\n\n');
}

export function plainText(node: ExhibitionDocument): string {
	if (node.type === 'text') return node.text ?? '';
	const separator = node.type === 'quote' ? '\n' : '';
	return (node.content ?? []).map(plainText).join(separator);
}
