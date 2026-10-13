import { collectionErrorMessage } from './errors.ts';

export const PAGE_SIZE = 1000;

type RowsPage = {
	data: unknown;
	error: { code?: string; message?: string } | null;
};

export async function fetchAllRows<Row>(
	page: (from: number, to: number) => PromiseLike<RowsPage>
): Promise<{ rows: Row[]; error?: string }> {
	const rows: Row[] = [];
	for (let from = 0; ; from += PAGE_SIZE) {
		const { data, error } = await page(from, from + PAGE_SIZE - 1);
		if (error) return { rows: [], error: collectionErrorMessage(error) };
		const received = (data ?? []) as Row[];
		rows.push(...received);
		if (received.length < PAGE_SIZE) return { rows };
	}
}
