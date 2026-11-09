import { Editor, Node } from '@tiptap/core';
import { ListItem } from '@tiptap/extension-list';
import StarterKit from '@tiptap/starter-kit';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export type TextMark = 'bold' | 'italic';

export type TextList = 'bulletList' | 'orderedList';

type Options = {
	element: HTMLElement;
	node: ExhibitionDocument;
	label: string;
	onchange: (node: ExhibitionDocument) => void;
};

const TextDoc = Node.create({
	name: 'doc',
	topNode: true,
	content: '(paragraph | heading | bulletList | orderedList)+'
});

const TextListItem = ListItem.extend({
	content: 'paragraph (paragraph | bulletList | orderedList)*'
});

export class TextField {
	bold = $state(false);
	italic = $state(false);
	heading = $state(false);
	bulletList = $state(false);
	orderedList = $state(false);
	empty = $state(true);
	#editor: Editor;

	constructor({ element, node, label, onchange }: Options) {
		this.#editor = new Editor({
			element,
			content: {
				type: 'doc',
				content: node.content?.length ? node.content : [{ type: 'paragraph' }]
			},
			extensions: [
				StarterKit.configure({
					document: false,
					heading: { levels: [3] },
					blockquote: false,
					code: false,
					codeBlock: false,
					hardBreak: false,
					horizontalRule: false,
					link: false,
					strike: false,
					underline: false,
					dropcursor: false,
					gapcursor: false,
					trailingNode: false,
					listItem: false
				}),
				TextDoc,
				TextListItem
			],
			editorProps: {
				attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': label },
				handleDrop: () => true
			},
			onUpdate: ({ editor }) => {
				onchange({ type: 'textBlock', content: editor.getJSON().content ?? [] });
			},
			onTransaction: () => this.#read()
		});
		this.#read();
	}

	toggle(mark: TextMark): void {
		const chain = this.#editor.chain().focus();
		(mark === 'bold' ? chain.toggleBold() : chain.toggleItalic()).run();
	}

	list(kind: TextList): void {
		const chain = this.#editor.chain().focus();
		(kind === 'bulletList' ? chain.toggleBulletList() : chain.toggleOrderedList()).run();
	}

	toggleHeading(): void {
		this.#editor.chain().focus().toggleHeading({ level: 3 }).run();
	}

	focus(): void {
		this.#editor.commands.focus('end');
	}

	destroy(): void {
		this.#editor.destroy();
	}

	#read(): void {
		const editor = this.#editor;
		if (!editor || editor.isDestroyed) return;
		this.bold = editor.isActive('bold');
		this.italic = editor.isActive('italic');
		this.heading = editor.isActive('heading');
		this.bulletList = editor.isActive('bulletList');
		this.orderedList = editor.isActive('orderedList');
		this.empty = editor.isEmpty;
	}
}
