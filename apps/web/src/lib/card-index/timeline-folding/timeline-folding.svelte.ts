import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import { readStoredStrings, writeStored } from '#lib/shared/utils/storage/storage.ts';

export const FOLDED_ERAS_KEY = 'study-atelier:card-index-folded-eras';
export const OPEN_PERIODS_KEY = 'study-atelier:card-index-open-periods';

type Search = { query: string; matched: readonly string[]; periods: readonly string[] };

function toggled(list: readonly string[], item: string): string[] {
	return list.includes(item) ? list.filter((other) => other !== item) : [...list, item];
}

export class TimelineFolding {
	#foldedEras = $state(readStoredStrings('local', FOLDED_ERAS_KEY));
	#openPeriods = $state(readStoredStrings('local', OPEN_PERIODS_KEY));
	#flips = $state<{ term: string; keys: string[] }>({ term: '', keys: [] });
	#search: () => Search;

	constructor(search: () => Search) {
		this.#search = search;
	}

	isEraOpen(code: string): boolean {
		const open = this.#term() !== '' || !this.#foldedEras.includes(code);
		return this.#isFlipped(`era:${code}`) ? !open : open;
	}

	isPeriodOpen(id: string): boolean {
		const open =
			this.#openPeriods.includes(id) ||
			(this.#term() !== '' && this.#search().matched.includes(id));
		return this.#isFlipped(`period:${id}`) ? !open : open;
	}

	toggleEra(code: string): void {
		if (this.#term()) {
			this.#flip(`era:${code}`);
			return;
		}
		this.#foldedEras = toggled(this.#foldedEras, code);
		writeStored('local', FOLDED_ERAS_KEY, JSON.stringify(this.#foldedEras));
	}

	togglePeriod(id: string): void {
		if (this.#term()) {
			this.#flip(`period:${id}`);
			return;
		}
		const present = this.#search().periods;
		this.#openPeriods = toggled(
			this.#openPeriods.filter((open) => open === id || present.includes(open)),
			id
		);
		writeStored('local', OPEN_PERIODS_KEY, JSON.stringify(this.#openPeriods));
	}

	#term(): string {
		return normalizeForSearch(this.#search().query);
	}

	#isFlipped(key: string): boolean {
		return this.#flips.term === this.#term() && this.#flips.keys.includes(key);
	}

	#flip(key: string): void {
		const term = this.#term();
		const keys = this.#flips.term === term ? this.#flips.keys : [];
		this.#flips = { term, keys: toggled(keys, key) };
	}
}
