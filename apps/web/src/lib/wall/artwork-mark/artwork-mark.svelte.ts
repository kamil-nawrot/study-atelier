type SaveMark = (id: string, on: boolean) => Promise<{ error?: string }>;

export class ArtworkMark {
	error = $state<string>();
	#overrides = $state<Record<string, boolean>>({});
	#save: SaveMark;

	constructor(save: SaveMark) {
		this.#save = save;
	}

	value(id: string, stored: boolean): boolean {
		return this.#overrides[id] ?? stored;
	}

	async toggle(id: string, stored: boolean): Promise<boolean | undefined> {
		const next = !this.value(id, stored);
		this.error = undefined;
		this.#overrides[id] = next;
		const { error } = await this.#save(id, next);
		if (!error) return next;
		this.#overrides[id] = !next;
		this.error = error;
		return undefined;
	}
}
