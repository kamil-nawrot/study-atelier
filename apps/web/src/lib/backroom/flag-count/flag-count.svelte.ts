import { countFlags } from '#lib/backroom/backroom-data/backroom-data.ts';

export class FlagCount {
	value = $state(0);
	#owner: string | undefined;

	forLearner(ownerId: string | undefined): void {
		if (ownerId === this.#owner) return;
		this.#owner = ownerId;
		this.value = 0;
		if (ownerId) void this.refresh();
	}

	async refresh(): Promise<void> {
		const owner = this.#owner;
		const counted = await countFlags();
		if (counted !== undefined && owner === this.#owner) this.value = counted;
	}
}

export const flagCount = new FlagCount();
