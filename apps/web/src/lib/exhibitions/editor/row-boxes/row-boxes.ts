import type { RowBox } from '#lib/exhibitions/editor/drop-target/drop-target.ts';

export function measureRows(list: HTMLElement): RowBox[] {
	return [...list.querySelectorAll<HTMLElement>('[data-row-id]')].map((row) => {
		const box = row.getBoundingClientRect();
		return {
			id: row.dataset.rowId ?? '',
			top: box.top,
			bottom: box.bottom,
			blocks: [...row.querySelectorAll<HTMLElement>(':scope > [data-block-id]')].map((block) => {
				const rect = block.getBoundingClientRect();
				return { id: block.dataset.blockId ?? '', left: rect.left, right: rect.right };
			})
		};
	});
}
