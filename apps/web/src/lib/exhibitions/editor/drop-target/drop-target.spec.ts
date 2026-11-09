import { describe, expect, it } from 'vitest';
import { dropAt, type RowBox } from '#lib/exhibitions/editor/drop-target/drop-target.ts';

const frame = { top: -40, left: 0, right: 900 };

const rows: RowBox[] = [
	{ id: 'r1', top: 0, bottom: 100, blocks: [{ id: 'a', left: 0, right: 900 }] },
	{
		id: 'r2',
		top: 140,
		bottom: 300,
		blocks: [
			{ id: 'b', left: 0, right: 430 },
			{ id: 'c', left: 470, right: 900 }
		]
	}
];

describe('dropAt', () => {
	it('shows a line in the gap between rows', () => {
		const drop = dropAt(rows, frame, 450, 120);
		expect(drop?.target).toEqual({ before: 'r2' });
		expect(drop?.mark).toEqual({
			top: 118,
			left: 0,
			width: 900,
			height: 4,
			side: false,
			slot: { top: 108, left: 0, width: 900, height: 24 }
		});
	});

	it('shows the line of an empty exhibition at the top of its list', () => {
		const drop = dropAt([], frame, 450, 300);

		expect(drop?.target).toEqual({ before: undefined });
		expect(drop?.mark.top).toBe(-50);
	});

	it('shows a line above or below a row by the half of it the pointer is in', () => {
		expect(dropAt(rows, frame, 450, 20)?.target).toEqual({ before: 'r1' });
		expect(dropAt(rows, frame, 450, 90)?.target).toEqual({ before: 'r2' });
		expect(dropAt(rows, frame, 215, 290)?.target).toEqual({ before: undefined });
		expect(dropAt(rows, frame, 450, 900)?.target).toEqual({ before: undefined });
		expect(dropAt(rows, frame, 450, -50)?.mark.top).toBe(-10);
		expect(dropAt(rows, frame, 450, 900)?.mark.top).toBe(306);
	});

	it('offers a column at the edge of a block', () => {
		const left = dropAt(rows, frame, 10, 50);
		expect(left?.target).toEqual({ row: 'r1', at: 0 });
		expect(left?.mark).toEqual({
			top: 0,
			left: -2,
			width: 4,
			height: 100,
			side: true,
			slot: { top: 0, left: 0, width: 450, height: 100 }
		});
		const right = dropAt(rows, frame, 890, 50);
		expect(right?.target).toEqual({ row: 'r1', at: 1 });
		expect(right?.mark.slot).toEqual({ top: 0, left: 450, width: 450, height: 100 });
		const middle = dropAt(rows, frame, 420, 200);
		expect(middle?.target).toEqual({ row: 'r2', at: 1 });
		expect(middle?.mark.slot).toEqual({ top: 140, left: 300, width: 300, height: 160 });
		expect(dropAt(rows, frame, 480, 200)?.target).toEqual({ row: 'r2', at: 1 });
	});

	it('offers no column beside the block that is moved alone or in a full row', () => {
		expect(dropAt(rows, frame, 10, 20, 'a')).toBeUndefined();
		const full: RowBox[] = [
			{
				id: 'r',
				top: 0,
				bottom: 100,
				blocks: ['x', 'y', 'z'].map((id, index) => ({
					id,
					left: index * 300,
					right: index * 300 + 280
				}))
			}
		];
		expect(dropAt(full, frame, 5, 20)?.target).toEqual({ before: 'r' });
		expect(dropAt(full, frame, 875, 20, 'x')?.target).toEqual({ row: 'r', at: 3 });
	});

	it('shows one line in the middle of the gap between two blocks', () => {
		const fromLeft = dropAt(rows, frame, 420, 200);
		const fromRight = dropAt(rows, frame, 480, 200);
		expect(fromLeft?.mark.left).toBe(448);
		expect(fromRight?.mark).toEqual(fromLeft?.mark);
	});

	it('offers nothing where the dragged block already stands', () => {
		expect(dropAt(rows, frame, 200, 200, 'b')).toBeUndefined();
		expect(dropAt(rows, frame, 450, 200, 'b')).toBeUndefined();
		expect(dropAt(rows, frame, 10, 200, 'b')).toBeUndefined();
		expect(dropAt(rows, frame, 890, 200, 'b')?.target).toEqual({ row: 'r2', at: 2 });
		expect(dropAt(rows, frame, 450, 120, 'a')).toBeUndefined();
		expect(dropAt(rows, frame, 450, 400, 'a')?.target).toEqual({ before: undefined });
		expect(dropAt(rows, frame, 450, 120, 'b')?.target).toEqual({ before: 'r2' });
	});

	it('drops nowhere outside the frame and on a line in an empty exhibition', () => {
		expect(dropAt(rows, frame, -5, 50)).toBeUndefined();
		expect(dropAt(rows, frame, 905, 50)).toBeUndefined();
		expect(dropAt([], frame, 450, 50)?.target).toEqual({ before: undefined });
	});
});
