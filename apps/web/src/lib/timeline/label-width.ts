const LABEL_FONT = 14;
const FALLBACK_CHAR = 8;

const widths = new Map<string, number>();
let measure: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
	if (measure === undefined) {
		measure = document.createElement('canvas').getContext('2d');
		if (measure) measure.font = `500 ${LABEL_FONT}px ${getComputedStyle(document.body).fontFamily}`;
	}
	return measure;
}

export function labelWidth(name: string): number {
	const known = widths.get(name);
	if (known !== undefined) return known;
	const canvas = context();
	const width = canvas ? canvas.measureText(name).width + LABEL_FONT : name.length * FALLBACK_CHAR;
	widths.set(name, width);
	return width;
}
