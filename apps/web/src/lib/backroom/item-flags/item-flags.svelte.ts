import { loadItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import type { FlagTarget } from '#lib/backroom/types/flag-target.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';

export class ItemFlags {
	list = $state<StoredFlag[]>([]);
	#target: FlagTarget | undefined;
	#loads = 0;

	constructor(target?: FlagTarget) {
		this.#target = target;
	}

	async load(target: FlagTarget | undefined = this.#target): Promise<void> {
		this.#target = target;
		const load = ++this.#loads;
		const flags = await loadItemFlags(target).catch(() => []);
		if (load === this.#loads) this.list = flags;
	}
}
