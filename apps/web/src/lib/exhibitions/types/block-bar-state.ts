import type { BlockKind } from '#lib/exhibitions/editor/block-commands/block-commands.ts';

export type BlockBarState = {
	kind: BlockKind;
	index: number;
	count: number;
	bold: boolean;
	italic: boolean;
	note: boolean;
	palette: boolean;
	paletteOnly: boolean;
	row: boolean;
	artworkId?: string;
	rect: { top: number; bottom: number; left: number; right: number };
};
