import { Node, type NodeViewRenderer } from '@tiptap/core';

type ArtworkNodeOptions = {
	nodeView: NodeViewRenderer | undefined;
};

function flag(name: string): {
	default: boolean;
	parseHTML: (element: HTMLElement) => boolean;
	renderHTML: (attributes: Record<string, unknown>) => Record<string, string>;
} {
	return {
		default: false,
		parseHTML: (element) => element.getAttribute(`data-${name}`) === 'true',
		renderHTML: (attributes) => (attributes[name] ? { [`data-${name}`]: 'true' } : {})
	};
}

export const ArtworkNode = Node.create<ArtworkNodeOptions>({
	name: 'artwork',
	content: 'text*',
	marks: '',
	isolating: true,
	defining: true,
	selectable: true,
	addOptions: () => ({ nodeView: undefined }),
	addAttributes: () => ({
		artworkId: {
			default: null,
			parseHTML: (element) => element.getAttribute('data-artwork-id'),
			renderHTML: (attributes) => ({ 'data-artwork-id': String(attributes.artworkId) })
		},
		imageId: {
			default: null,
			parseHTML: (element) => element.getAttribute('data-image-id'),
			renderHTML: (attributes) =>
				attributes.imageId ? { 'data-image-id': String(attributes.imageId) } : {}
		},
		palette: flag('palette'),
		paletteOnly: flag('paletteOnly'),
		note: flag('note')
	}),
	parseHTML: () => [{ tag: 'figure[data-block="artwork"]', contentElement: 'figcaption' }],
	renderHTML: ({ HTMLAttributes }) => [
		'figure',
		{ ...HTMLAttributes, 'data-block': 'artwork' },
		['figcaption', 0]
	],
	addNodeView() {
		return this.options.nodeView ?? null;
	}
});
