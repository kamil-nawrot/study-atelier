export function fittingTags(sizes: readonly number[], room: number, gap: number): number {
	const count = sizes.length - 2;
	if (count <= 0 || room <= 0) return Math.max(count, 0);
	const more = sizes[count];
	const clear = sizes[count + 1];
	const widthOf = (shown: number, withMore: boolean): number =>
		sizes.slice(0, shown).reduce((sum, size) => sum + size, 0) +
		(withMore ? more : 0) +
		clear +
		gap * (shown + (withMore ? 1 : 0));
	if (widthOf(count, false) <= room) return count;
	let shown = count - 1;
	while (shown > 0 && widthOf(shown, true) > room) shown -= 1;
	return shown;
}
