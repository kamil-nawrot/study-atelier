type Edges = { top: number; bottom: number; left: number; right: number };

type Size = { width: number; height: number };

export type BarTrack = { top: number; left: number; height: number };

export const BAR_GAP = 8;

export function barTrack(block: Edges, bar: Size, frameWidth: number): BarTrack {
	const top = block.top - bar.height - BAR_GAP;
	const rightmost = Math.max(0, frameWidth - bar.width);
	const left = Math.max(0, Math.min(block.left, rightmost));
	return { top, left, height: block.bottom - top };
}
