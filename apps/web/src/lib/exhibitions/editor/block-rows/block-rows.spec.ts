import { describe, expect, it } from 'vitest';
import {
	blockOf,
	canJoin,
	canStep,
	documentOf,
	insert,
	move,
	remove,
	rowsOf,
	step,
	update,
	type Row
} from '#lib/exhibitions/editor/block-rows/block-rows.ts';
import {
	artwork,
	columns,
	divider,
	doc,
	heading,
	textBlock
} from '#lib/testing/exhibitions/exhibitions.ts';

function names(rows: readonly Row[]): string[][] {
	return rows.map((row) =>
		row.blocks.map((block) =>
			block.node.type === 'artwork'
				? String(block.node.attrs?.artworkId)
				: (block.node.content?.[0]?.content?.[0]?.text ?? block.node.content?.[0]?.text ?? '-')
		)
	);
}

function ids(rows: readonly Row[], name: string): string {
	const block = rows
		.flatMap((row) => row.blocks)
		.find((other) => JSON.stringify(other.node).includes(name));
	if (!block) throw new Error(`no ${name}`);
	return block.id;
}

const sample = (): Row[] =>
	rowsOf(doc(textBlock('Alpha'), columns(artwork('a1'), textBlock('Beta')), heading('Gamma')));

describe('rowsOf and documentOf', () => {
	it('turns every block into a row and a row of columns into one row of blocks', () => {
		expect(names(sample())).toEqual([['Alpha'], ['a1', 'Beta'], ['Gamma']]);
	});

	it('gives the same document back', () => {
		const document = doc(textBlock('Alpha'), columns(artwork('a1'), textBlock('Beta')));
		expect(documentOf(rowsOf(document))).toEqual(document);
	});

	it('leaves out blank texts, also inside rows', () => {
		const rows = rowsOf(
			doc(textBlock(''), columns(textBlock(''), artwork('a1')), columns(textBlock('')))
		);
		expect(names(rows)).toEqual([['a1']]);
		expect(documentOf(rows)).toEqual(doc(artwork('a1')));
	});

	it('reads an empty document', () => {
		expect(rowsOf({ type: 'doc' })).toEqual([]);
		expect(rowsOf({ type: 'doc', content: [{ type: 'columns' }] })).toEqual([]);
	});
});

describe('insert', () => {
	it('adds a block as a new row before a row or at the end', () => {
		const rows = sample();
		const block = blockOf(textBlock('New'));
		expect(names(insert(rows, block, { before: rows[1].id }))).toEqual([
			['Alpha'],
			['New'],
			['a1', 'Beta'],
			['Gamma']
		]);
		expect(names(insert(rows, block, { before: undefined })).at(-1)).toEqual(['New']);
		expect(names(insert(rows, block, { before: 'gone' })).at(-1)).toEqual(['New']);
	});

	it('adds a block beside others in a row', () => {
		const rows = sample();
		const block = blockOf(textBlock('New'));
		expect(names(insert(rows, block, { row: rows[1].id, at: 1 }))[1]).toEqual([
			'a1',
			'New',
			'Beta'
		]);
		expect(names(insert(rows, block, { row: rows[0].id, at: 9 }))[0]).toEqual(['Alpha', 'New']);
		expect(names(insert(rows, block, { row: rows[0].id, at: -1 }))[0]).toEqual(['New', 'Alpha']);
	});

	it('does not add a fourth block to a row or a block to a missing row', () => {
		const rows = insert(sample(), blockOf(textBlock('New')), { row: sample()[1].id, at: 0 });
		const full = insert(rows, blockOf(textBlock('Three')), { row: rows[1].id, at: 0 });
		expect(canJoin(full[1])).toBe(false);
		expect(names(insert(full, blockOf(textBlock('Four')), { row: full[1].id, at: 0 }))).toEqual(
			names(full)
		);
		expect(names(insert(full, blockOf(textBlock('Four')), { row: 'gone', at: 0 }))).toEqual(
			names(full)
		);
	});

	it('puts a divider beside other blocks and keeps it there', () => {
		const rows = rowsOf(doc(textBlock('Alpha'), divider()));
		const joined = insert(rows, blockOf(divider()), { row: rows[0].id, at: 1 });
		expect(names(joined)).toEqual([['Alpha', '-'], ['-']]);
		expect(rowsOf(documentOf(joined)).map((row) => row.blocks.length)).toEqual([2, 1]);
		expect(names(move(rows, rows[1].blocks[0].id, { row: rows[0].id, at: 0 }))).toEqual([
			['-', 'Alpha']
		]);
	});
});

describe('move', () => {
	it('moves a block to another place between rows', () => {
		const rows = sample();
		expect(names(move(rows, ids(rows, 'Alpha'), { before: undefined }))).toEqual([
			['a1', 'Beta'],
			['Gamma'],
			['Alpha']
		]);
		expect(names(move(rows, ids(rows, 'Beta'), { before: rows[0].id }))).toEqual([
			['Beta'],
			['Alpha'],
			['a1'],
			['Gamma']
		]);
	});

	it('puts a block beside another and keeps the order inside a row', () => {
		const rows = sample();
		expect(names(move(rows, ids(rows, 'Gamma'), { row: rows[0].id, at: 0 }))).toEqual([
			['Gamma', 'Alpha'],
			['a1', 'Beta']
		]);
		expect(names(move(rows, ids(rows, 'a1'), { row: rows[1].id, at: 2 }))[1]).toEqual([
			'Beta',
			'a1'
		]);
	});

	it('changes nothing when a block lands where it already is', () => {
		const rows = sample();
		const alpha = ids(rows, 'Alpha');
		const gamma = ids(rows, 'Gamma');
		expect(move(rows, alpha, { before: rows[0].id })).toEqual(rows);
		expect(move(rows, alpha, { before: rows[1].id })).toEqual(rows);
		expect(move(rows, gamma, { before: undefined })).toEqual(rows);
		expect(move(rows, alpha, { row: rows[0].id, at: 1 })).toEqual(rows);
		expect(move(rows, 'gone', { before: undefined })).toEqual(rows);
	});

	it('does not move a block into a full row', () => {
		const rows = rowsOf(
			doc(textBlock('Alpha'), columns(artwork('a1'), artwork('a2'), artwork('a3')))
		);
		expect(names(move(rows, ids(rows, 'Alpha'), { row: rows[1].id, at: 0 }))).toEqual(names(rows));
	});
});

describe('remove, update and step', () => {
	it('removes a block and an emptied row', () => {
		const rows = sample();
		expect(names(remove(rows, ids(rows, 'Alpha')))).toEqual([['a1', 'Beta'], ['Gamma']]);
		expect(names(remove(rows, ids(rows, 'Beta')))).toEqual([['Alpha'], ['a1'], ['Gamma']]);
		expect(names(remove(rows, 'gone'))).toEqual(names(rows));
	});

	it('replaces the content of one block', () => {
		const rows = sample();
		expect(names(update(rows, ids(rows, 'Beta'), textBlock('Delta')))[1]).toEqual(['a1', 'Delta']);
	});

	it('steps a block over the next row or out of its row', () => {
		const rows = sample();
		expect(names(step(rows, ids(rows, 'Alpha'), 1))).toEqual([
			['a1', 'Beta'],
			['Alpha'],
			['Gamma']
		]);
		expect(names(step(rows, ids(rows, 'Gamma'), -1))).toEqual([
			['Alpha'],
			['Gamma'],
			['a1', 'Beta']
		]);
		expect(names(step(rows, ids(rows, 'Beta'), -1))).toEqual([
			['Alpha'],
			['Beta'],
			['a1'],
			['Gamma']
		]);
		expect(names(step(rows, ids(rows, 'a1'), 1))).toEqual([['Alpha'], ['Beta'], ['a1'], ['Gamma']]);
		expect(names(step(rows, ids(rows, 'Alpha'), -1))).toEqual(names(rows));
		expect(names(step(rows, ids(rows, 'Gamma'), 1))).toEqual(names(rows));
		expect(names(step(rows, 'gone', 1))).toEqual(names(rows));
	});

	it('keeps the row of a block that moves alone, so its card stays as it is', () => {
		const rows = sample();
		const alpha = rows[0].id;
		expect(step(rows, ids(rows, 'Alpha'), 1)[1].id).toBe(alpha);
		expect(move(rows, ids(rows, 'Alpha'), { before: undefined }).at(-1)?.id).toBe(alpha);
		const out = step(rows, ids(rows, 'Beta'), 1).find(
			(row) => row.blocks[0]?.id === ids(rows, 'Beta')
		);
		expect(rows.map((row) => row.id)).not.toContain(out?.id);
	});

	it('tells which steps a block can take', () => {
		const rows = sample();
		expect(canStep(rows, ids(rows, 'Alpha'), -1)).toBe(false);
		expect(canStep(rows, ids(rows, 'Alpha'), 1)).toBe(true);
		expect(canStep(rows, ids(rows, 'Beta'), -1)).toBe(true);
		expect(canStep(rows, ids(rows, 'Gamma'), 1)).toBe(false);
		expect(canStep(rows, 'gone', 1)).toBe(false);
	});
});
