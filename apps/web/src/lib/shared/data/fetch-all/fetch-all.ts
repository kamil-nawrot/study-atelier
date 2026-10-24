import type { ServiceError } from '#lib/shared/types/service-error.ts';

const PAGE_SIZE = 1000;

type Page = PromiseLike<{ data: unknown; error: ServiceError | null }>;

export async function fetchAll<T>(
	page: (from: number, to: number) => Page
): Promise<{ rows: T[]; error?: ServiceError }> {
	const rows: T[] = [];
	for (let from = 0; ; from += PAGE_SIZE) {
		const { data, error } = await page(from, from + PAGE_SIZE - 1);
		if (error) return { rows: [], error };
		const received = (data ?? []) as T[];
		rows.push(...received);
		if (received.length < PAGE_SIZE) return { rows };
	}
}
