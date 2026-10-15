import { Extension, Node, type Editor, type Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { exitSuggestion, Suggestion } from '@tiptap/suggestion';
import { noteLinkMarkdown, type NoteLinkOption, type NoteLinkTrigger } from './note-links';

export const NoteLink = Node.create({
	name: 'noteLink',
	group: 'inline',
	inline: true,
	atom: true,
	selectable: true,

	addAttributes() {
		return {
			href: { default: '' },
			label: { default: '' },
			missing: { default: false }
		};
	},

	parseHTML() {
		return [
			{
				tag: 'a[data-note-link]',
				getAttrs: (element) => ({
					href: element.getAttribute('href') ?? '',
					label: element.textContent ?? '',
					missing: false
				})
			},
			{
				tag: 'span[data-note-link]',
				getAttrs: (element) => ({
					href: element.getAttribute('data-href') ?? '',
					label: element.textContent ?? '',
					missing: element.hasAttribute('data-missing')
				})
			}
		];
	},

	renderHTML({ node }) {
		const attributes: Record<string, string> = {
			'data-note-link': '',
			'data-href': node.attrs.href
		};
		if (node.attrs.missing) attributes['data-missing'] = '';
		return ['span', attributes, node.attrs.label];
	},

	renderText({ node }) {
		return node.attrs.label;
	},

	renderMarkdown(node) {
		return noteLinkMarkdown(node.attrs?.label ?? '', node.attrs?.href ?? '');
	}
});

export type SuggestionState = {
	trigger: NoteLinkTrigger;
	query: string;
	items: NoteLinkOption[];
	loading: boolean;
	choose: (option: NoteLinkOption) => void;
};

export type NoteLinkSuggestionOptions = {
	items: (trigger: NoteLinkTrigger, query: string) => NoteLinkOption[];
	onChange: (trigger: NoteLinkTrigger, state: SuggestionState | null) => void;
	onKeyDown: (event: KeyboardEvent) => boolean;
};

const triggers: Record<NoteLinkTrigger, PluginKey> = {
	'@': new PluginKey('noteLinkValue'),
	'#': new PluginKey('noteLinkArtwork')
};

function insertLink(editor: Editor, range: Range, option: NoteLinkOption): void {
	editor
		.chain()
		.focus()
		.insertContentAt(range, [
			{ type: 'noteLink', attrs: { href: option.href, label: option.name } },
			{ type: 'text', text: ' ' }
		])
		.run();
}

function leavesOpen(query: string, items: readonly NoteLinkOption[]): boolean {
	return !/^\s/.test(query) && (items.length > 0 || !/\s/.test(query));
}

export const NoteLinkSuggestion = Extension.create<NoteLinkSuggestionOptions>({
	name: 'noteLinkSuggestion',

	addProseMirrorPlugins() {
		const { editor, options } = this;
		return (Object.keys(triggers) as NoteLinkTrigger[]).map((trigger) => {
			const pluginKey = triggers[trigger];
			return Suggestion<NoteLinkOption, NoteLinkOption>({
				editor,
				pluginKey,
				char: trigger,
				allowSpaces: true,
				items: ({ query }) => options.items(trigger, query),
				command: ({ editor: target, range, props }) => insertLink(target, range, props),
				render: () => {
					const show = (
						query: string,
						items: NoteLinkOption[],
						loading: boolean,
						view: EditorView,
						choose: (option: NoteLinkOption) => void
					): void => {
						if (!loading && !leavesOpen(query, items)) {
							exitSuggestion(view, pluginKey);
							return;
						}
						options.onChange(trigger, { trigger, query, items, loading, choose });
					};
					return {
						onStart: (props) =>
							show(
								props.query,
								props.items,
								props.loading ?? false,
								props.editor.view,
								props.command
							),
						onUpdate: (props) =>
							show(
								props.query,
								props.items,
								props.loading ?? false,
								props.editor.view,
								props.command
							),
						onExit: () => options.onChange(trigger, null),
						onKeyDown: ({ event }) => options.onKeyDown(event)
					};
				}
			});
		});
	}
});
