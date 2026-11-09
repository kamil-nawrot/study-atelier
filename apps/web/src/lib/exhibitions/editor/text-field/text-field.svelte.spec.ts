import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import { TextField } from './text-field.svelte.ts';

const ALLOWED: Record<string, string[]> = {
	textBlock: ['paragraph', 'heading', 'bulletList', 'orderedList'],
	bulletList: ['listItem'],
	orderedList: ['listItem'],
	listItem: ['paragraph', 'bulletList', 'orderedList'],
	paragraph: ['text'],
	heading: ['text'],
	text: []
};

function misplaced(node: ExhibitionDocument): string[] {
	const allowed = ALLOWED[node.type ?? ''] ?? [];
	return (node.content ?? []).flatMap((child) => [
		...(allowed.includes(child.type ?? '') ? [] : [`${child.type} in ${node.type}`]),
		...misplaced(child)
	]);
}

function paste(target: Element, html: string): void {
	const data = new DataTransfer();
	data.setData('text/html', html);
	target.dispatchEvent(
		new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
	);
}

let field: TextField | undefined;

afterEach(() => {
	field?.destroy();
	document.body.replaceChildren();
});

describe('TextField', () => {
	it('keeps a pasted heading out of a list item', async () => {
		const element = document.createElement('div');
		document.body.appendChild(element);
		const onchange = vi.fn<(node: ExhibitionDocument) => void>();
		field = new TextField({
			element,
			node: { type: 'textBlock', content: [{ type: 'paragraph' }] },
			label: 'Text',
			onchange
		});
		const editable = element.querySelector('.tiptap');
		if (!(editable instanceof HTMLElement)) throw new Error('no editor');
		editable.focus();

		paste(editable, '<ul><li><p>a</p><h3>b</h3></li></ul>');

		await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
		const node = onchange.mock.lastCall?.[0];
		expect(JSON.stringify(node)).toContain('"b"');
		expect(misplaced(node ?? {})).toEqual([]);
	});
});
