<script lang="ts">
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { dropIndex, moved, orderPlaces } from '#lib/review/order-guess/order-guess.ts';
	import OrderTile from '#lib/review/components/OrderTile/OrderTile.svelte';

	type Props = {
		artworks: WallArtwork[];
		answered?: boolean;
		onchange: (artworks: WallArtwork[]) => void;
	};

	let { artworks, answered = false, onchange }: Props = $props();

	const wide = new MediaQuery('min-width: 768px');
	const KEY_STEPS: Record<string, number> = {
		ArrowLeft: -1,
		ArrowUp: -1,
		ArrowRight: 1,
		ArrowDown: 1
	};

	let tiles = $state<HTMLElement[]>([]);
	let lifted = $state<number>();
	let liftedFrom = 0;
	let dragging = $state<number>();
	let announcement = $state('');

	let places = $derived(answered ? orderPlaces(artworks) : undefined);
	let count = $derived(artworks.length);

	async function moveTo(from: number, to: number): Promise<void> {
		onchange(moved(artworks, from, to));
		await tick();
		tiles[to]?.focus();
	}

	async function keydown(event: KeyboardEvent, index: number): Promise<void> {
		if (answered) return;
		if (event.key === ' ') {
			event.preventDefault();
			if (lifted === undefined) {
				lifted = index;
				liftedFrom = index;
				announcement = m.review.order.lifted;
			} else {
				lifted = undefined;
				announcement = m.review.order.dropped(index + 1);
			}
			return;
		}
		if (lifted === undefined) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			const back = liftedFrom;
			lifted = undefined;
			announcement = m.review.order.dropped(back + 1);
			await moveTo(index, back);
			return;
		}
		const step = KEY_STEPS[event.key];
		if (step === undefined) return;
		event.preventDefault();
		const to = Math.min(count - 1, Math.max(0, index + step));
		if (to === index) return;
		lifted = to;
		announcement = m.review.order.moved(to + 1, count);
		await moveTo(index, to);
	}

	function pointerdown(event: PointerEvent, index: number): void {
		if (answered || event.button !== 0) return;
		const onGrip = event.target instanceof Element && event.target.closest('[data-grip]');
		if (!wide.current && !onGrip) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		dragging = index;
	}

	function pointermove(event: PointerEvent): void {
		if (dragging === undefined) return;
		const centres = tiles.map((tile) => {
			const box = tile.getBoundingClientRect();
			return wide.current ? box.left + box.width / 2 : box.top + box.height / 2;
		});
		const to = dropIndex(wide.current ? event.clientX : event.clientY, centres, dragging);
		if (to === dragging) return;
		onchange(moved(artworks, dragging, to));
		dragging = to;
	}

	function pointerup(): void {
		if (dragging === undefined) return;
		announcement = m.review.order.dropped(dragging + 1);
		dragging = undefined;
	}
</script>

<div class="board">
	<p class="end oldest" aria-hidden="true">{m.review.order.oldest}</p>
	<p class="end newest" aria-hidden="true">{m.review.order.newest}</p>
	<ol class="tiles">
		{#each artworks as artwork, index (artwork.id)}
			<li class:dragging={dragging === index} class:lifted={lifted === index}>
				<div
					bind:this={tiles[index]}
					class="handle"
					aria-disabled={answered}
					aria-label={m.review.order.place(index + 1, count)}
					aria-pressed={lifted === index}
					onkeydown={(event) => keydown(event, index)}
					onlostpointercapture={pointerup}
					onpointercancel={pointerup}
					onpointerdown={(event) => pointerdown(event, index)}
					onpointermove={pointermove}
					onpointerup={pointerup}
					role="button"
					tabindex={answered ? -1 : 0}
				>
					<OrderTile {artwork} {index} place={places?.[index]} />
				</div>
			</li>
		{/each}
	</ol>
	<p class="visually-hidden" aria-live="assertive">{announcement}</p>
</div>

<style>
	.board {
		display: grid;
		gap: var(--spacing-3);
		width: 100%;
		height: 100%;
		align-content: center;
	}

	.end {
		color: var(--color-stage-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.newest {
		order: 1;
	}

	.tiles {
		display: grid;
		gap: var(--spacing-3);
		list-style: none;
	}

	.handle {
		outline-offset: var(--border-width-base);
	}

	.handle:focus-visible {
		outline: var(--border-width-base) solid var(--color-stage-fg);
	}

	.lifted,
	.dragging {
		outline: var(--border-width-heavy) solid var(--color-highlight);
	}

	@media (min-width: 768px) {
		.board {
			grid-template-columns: 1fr 1fr;
			column-gap: 0;
		}

		.end {
			padding-bottom: var(--spacing-1);
			border-bottom: var(--border-width-hairline) solid var(--color-stage-fg-muted);
		}

		.newest {
			order: 0;
			text-align: right;
		}

		.tiles {
			grid-column: 1 / -1;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			align-items: center;
		}

		.handle {
			user-select: none;
			touch-action: none;
		}
	}
</style>
