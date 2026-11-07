import { Node, type NodeViewRenderer } from '@tiptap/core';

type CloseUpNodeOptions = {
	nodeView: NodeViewRenderer | undefined;
};

function number(name: string): {
	default: number;
	parseHTML: (element: HTMLElement) => number;
	renderHTML: (attributes: Record<string, unknown>) => Record<string, string>;
} {
	return {
		default: 0.5,
		parseHTML: (element) => Number(element.getAttribute(`data-${name}`)),
		renderHTML: (attributes) => ({ [`data-${name}`]: String(attributes[name]) })
	};
}

export const CloseUpNode = Node.create<CloseUpNodeOptions>({
	name: 'closeUp',
	atom: true,
	selectable: true,
	isolating: true,
	defining: true,
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
		x: number('x'),
		y: number('y'),
		viewWidth: number('viewWidth')
	}),
	parseHTML: () => [{ tag: 'figure[data-block="closeUp"]' }],
	renderHTML: ({ HTMLAttributes }) => ['figure', { ...HTMLAttributes, 'data-block': 'closeUp' }],
	addNodeView() {
		return this.options.nodeView ?? null;
	}
});
