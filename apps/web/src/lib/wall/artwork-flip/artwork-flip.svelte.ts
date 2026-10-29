import { goto, preloadData } from '$app/navigation';
import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { keyDirection } from '#lib/wall/flip/flip.ts';
import type { FlipDirection } from '#lib/wall/types/flip-direction.ts';
import { neighboursIn, rememberedWallSequence } from '#lib/wall/wall-sequence/wall-sequence.ts';

const ARTWORK_ROUTE = '/(app)/atelier/[number]';

function artworkHref(neighbour: number | null): ResolvedPathname | null {
	return neighbour === null ? null : resolve(ARTWORK_ROUTE, { number: String(neighbour) });
}

export class ArtworkFlip {
	readonly #sequence = rememberedWallSequence();
	readonly #number: () => number | null;
	readonly #blocked: () => boolean;

	constructor(number: () => number | null, blocked: () => boolean) {
		this.#number = number;
		this.#blocked = blocked;
	}

	#current(): number | null {
		return this.#number();
	}

	neighbours = $derived(neighboursIn(this.#sequence, this.#current()));
	links = $derived(
		this.neighbours && {
			previous: artworkHref(this.neighbours.previous),
			next: artworkHref(this.neighbours.next)
		}
	);
	wallPath = $derived<ResolvedPathname>(
		this.neighbours && this.#sequence?.query
			? (`${resolve('/(app)/atelier')}?${this.#sequence.query}` as ResolvedPathname)
			: resolve('/(app)/atelier')
	);

	follow(): void {
		$effect(() => {
			if (this.links?.next) void preloadData(this.links.next);
		});
	}

	flip(direction: FlipDirection): void {
		const neighbour = this.neighbours?.[direction];
		if (neighbour === null || neighbour === undefined || this.#blocked()) return;
		void goto(resolve(ARTWORK_ROUTE, { number: String(neighbour) }), {
			replace: true,
			reset: false
		});
	}

	flipWithKey(event: KeyboardEvent): void {
		const direction = keyDirection(event);
		if (!direction || !this.neighbours) return;
		event.preventDefault();
		this.flip(direction);
	}
}
