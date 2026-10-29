import { fontLoads } from '#lib/timeline/font-load/font-load.svelte.ts';

export const NAME_MAX_WIDTH = 200;

const LABEL_FONT = 14;
const FALLBACK_CHAR = 8;

let widths: Record<string, number> = {};
let measure: CanvasRenderingContext2D | null | undefined;
let measuredAfter = 0;

function context(): CanvasRenderingContext2D | null {
	if (measure === undefined) {
		measure = document.createElement('canvas').getContext('2d');
		if (measure) measure.font = `500 ${LABEL_FONT}px ${getComputedStyle(document.body).fontFamily}`;
	}
	return measure;
}

function measured(name: string): number {
	if (measuredAfter !== fontLoads()) {
		measuredAfter = fontLoads();
		widths = {};
		measure = undefined;
	}
	const known = widths[name];
	if (known !== undefined) return known;
	const canvas = context();
	const width = canvas ? canvas.measureText(name).width + LABEL_FONT : name.length * FALLBACK_CHAR;
	widths[name] = width;
	return width;
}

export function labelWidth(name: string): number {
	return Math.min(measured(name), NAME_MAX_WIDTH + LABEL_FONT);
}

export function labelCut(name: string): boolean {
	return measured(name) > NAME_MAX_WIDTH + LABEL_FONT;
}
