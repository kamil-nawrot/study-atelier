import { isBlankText } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
import { isSolo } from '#lib/exhibitions/editor/new-block/new-block.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export const MAX_COLUMNS = 3;

export type Block = {
	id: string;
	node: ExhibitionDocument;
};

export type Row = {
	id: string;
	blocks: Block[];
};

export type Target = { before: string | undefined } | { row: string; at: number };

let counter = 0;

export function newId(): string {
	counter += 1;
	return `b${counter}`;
}

export function blockOf(node: ExhibitionDocument): Block {
	return { id: newId(), node };
}

function rowOf(blocks: Block[]): Row {
	return { id: newId(), blocks };
}

export function rowsOf(document: ExhibitionDocument): Row[] {
	return (document.content ?? []).flatMap((node) => {
		if (node.type === 'columns') {
			const blocks = (node.content ?? []).flatMap((column) =>
				(column.content ?? []).filter((inner) => !isBlankText(inner)).map(blockOf)
			);
			return blocks.length > 0 ? [rowOf(blocks)] : [];
		}
		return isBlankText(node) ? [] : [rowOf([blockOf(node)])];
	});
}

export function documentOf(rows: readonly Row[]): ExhibitionDocument {
	return {
		type: 'doc',
		content: rows.map((row) =>
			row.blocks.length === 1
				? row.blocks[0].node
				: {
						type: 'columns',
						content: row.blocks.map((block) => ({ type: 'column', content: [block.node] }))
					}
		)
	};
}

export function findBlock(
	rows: readonly Row[],
	id: string
): { row: Row; rowIndex: number; index: number } | undefined {
	for (const [rowIndex, row] of rows.entries()) {
		const index = row.blocks.findIndex((block) => block.id === id);
		if (index >= 0) return { row, rowIndex, index };
	}
	return undefined;
}

export function canJoin(row: Row, moving?: string): boolean {
	return row.blocks.filter((block) => block.id !== moving).length < MAX_COLUMNS;
}

function canShare(row: Row, block: Block): boolean {
	return !isSolo(block.node) && !row.blocks.some((other) => isSolo(other.node));
}

function without(rows: readonly Row[], block: Block): Row[] {
	return rows.flatMap((row) => {
		if (!row.blocks.includes(block)) return [row];
		const blocks = row.blocks.filter((other) => other !== block);
		return blocks.length > 0 ? [{ ...row, blocks }] : [];
	});
}

export function insert(rows: readonly Row[], block: Block, target: Target): Row[] {
	if ('row' in target) {
		const row = rows.find((other) => other.id === target.row);
		if (!row || !canJoin(row, block.id) || !canShare(row, block)) return [...rows];
		return rows.map((other) => {
			if (other !== row) return other;
			const blocks = [...row.blocks];
			blocks.splice(Math.max(0, Math.min(target.at, blocks.length)), 0, block);
			return { ...row, blocks };
		});
	}
	const index = rows.findIndex((row) => row.id === target.before);
	const at = index < 0 ? rows.length : index;
	return [...rows.slice(0, at), rowOf([block]), ...rows.slice(at)];
}

export function move(rows: readonly Row[], id: string, target: Target): Row[] {
	const found = findBlock(rows, id);
	if (!found) return [...rows];
	const original = found.row.blocks[found.index];
	if ('row' in target && target.row === found.row.id && found.row.blocks.length === 1) {
		return [...rows];
	}
	if ('before' in target && found.row.blocks.length === 1) {
		const next = rows[found.rowIndex + 1];
		if (target.before === found.row.id || target.before === next?.id) return [...rows];
		if (target.before === undefined && next === undefined) return [...rows];
	}
	const placed = insert(rows, { ...original }, target);
	if (placed.every((row, index) => row === rows[index]) && placed.length === rows.length) {
		return placed;
	}
	return without(placed, original);
}

export function remove(rows: readonly Row[], id: string): Row[] {
	const found = findBlock(rows, id);
	return found ? without(rows, found.row.blocks[found.index]) : [...rows];
}

export function step(rows: readonly Row[], id: string, direction: -1 | 1): Row[] {
	const found = findBlock(rows, id);
	if (!found) return [...rows];
	if (found.row.blocks.length > 1) {
		const after = rows[found.rowIndex + 1]?.id;
		return move(rows, id, { before: direction < 0 ? found.row.id : after });
	}
	if (direction < 0) {
		const previous = rows[found.rowIndex - 1];
		return previous ? move(rows, id, { before: previous.id }) : [...rows];
	}
	const next = rows[found.rowIndex + 1];
	return next ? move(rows, id, { before: rows[found.rowIndex + 2]?.id }) : [...rows];
}

export function update(rows: readonly Row[], id: string, node: ExhibitionDocument): Row[] {
	return rows.map((row) =>
		row.blocks.some((block) => block.id === id)
			? {
					...row,
					blocks: row.blocks.map((block) => (block.id === id ? { ...block, node } : block))
				}
			: row
	);
}

export function canStep(rows: readonly Row[], id: string, direction: -1 | 1): boolean {
	const found = findBlock(rows, id);
	if (!found) return false;
	if (found.row.blocks.length > 1) return true;
	return direction < 0 ? found.rowIndex > 0 : found.rowIndex < rows.length - 1;
}
