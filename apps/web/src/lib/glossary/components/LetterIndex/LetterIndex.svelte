<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		letters: string[];
	};

	let { letters }: Props = $props();

	const REACH = 32;

	let nav = $state<HTMLElement>();
	let current = $state<string>();
	let top = $state<number>();
	let chosen: string | undefined;
	let scrubbed = $state<{ letter: string; y: number }>();

	function section(letter: string): HTMLElement | null {
		return document.getElementById(`letter-${letter}`)?.parentElement ?? null;
	}

	function atBottom(): boolean {
		const page = document.documentElement;
		return window.scrollY > 0 && window.scrollY + window.innerHeight >= page.scrollHeight - 1;
	}

	function follow(): void {
		if (!nav) return;
		if (chosen !== undefined && letters.includes(chosen)) {
			current = chosen;
			return;
		}
		const bar = parseFloat(getComputedStyle(nav).getPropertyValue('--bar-height')) || 0;
		const line = bar + REACH;
		const start = section(letters[0])?.getBoundingClientRect().top;
		top = start === undefined ? undefined : Math.max(bar, start);
		let reached = letters[0];
		for (const letter of letters) {
			const top = section(letter)?.getBoundingClientRect().top;
			if (top !== undefined && top <= line) reached = letter;
		}
		current = atBottom() ? letters.at(-1) : reached;
	}

	function release(): void {
		chosen = undefined;
	}

	function jump(letter: string, instant = false): void {
		chosen = letter;
		current = letter;
		const smooth = !instant && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		section(letter)?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'instant' });
		const heading = document.getElementById(`letter-${letter}`);
		heading?.setAttribute('tabindex', '-1');
		heading?.focus({ preventScroll: true });
	}

	function scrub(event: PointerEvent): void {
		const button = document
			.elementFromPoint(event.clientX, event.clientY)
			?.closest<HTMLButtonElement>('.index button');
		const letter = button?.dataset.letter;
		if (!letter) return;
		if (scrubbed?.letter !== letter) jump(letter, true);
		scrubbed = { letter, y: event.clientY };
	}

	function startScrub(event: PointerEvent): void {
		if (event.pointerType === 'touch') scrub(event);
	}

	function moveScrub(event: PointerEvent): void {
		if (scrubbed) scrub(event);
	}

	function endScrub(): void {
		scrubbed = undefined;
	}

	$effect(() => {
		void letters;
		void nav;
		follow();
	});
</script>

<svelte:window
	onkeydown={release}
	onresize={follow}
	onscroll={follow}
	ontouchstart={release}
	onwheel={release}
/>

<nav
	bind:this={nav}
	style:--start={top === undefined ? undefined : `${top}px`}
	class="index"
	aria-label={m.glossary.letters}
>
	<ol
		onpointercancel={endScrub}
		onpointerdown={startScrub}
		onpointermove={moveScrub}
		onpointerup={endScrub}
	>
		{#each letters as letter (letter)}
			<li>
				<button
					class:current={letter === current}
					aria-current={letter === current ? 'true' : undefined}
					data-letter={letter}
					onclick={() => jump(letter)}
					type="button">{letter}</button
				>
			</li>
		{/each}
	</ol>
	{#if scrubbed}
		<span style:top="{scrubbed.y}px" class="bubble" aria-hidden="true">{scrubbed.letter}</span>
	{/if}
</nav>

<style>
	.index {
		position: fixed;
		top: var(--start, var(--bar-height));
		right: 0;
		bottom: var(--bottom-inset, 0px);
		z-index: 1;
		display: flex;
		align-items: flex-start;
	}

	@media (min-width: 768px) {
		.index {
			top: var(--bar-height);
			align-items: center;
		}
	}

	ol {
		display: flex;
		flex-direction: column;
		max-height: 100%;
		margin: 0;
		padding: var(--spacing-2) 0;
		list-style: none;
	}

	li {
		display: flex;
		flex: 0 1 var(--spacing-6);
		min-height: 0;
	}

	button {
		width: var(--spacing-8);
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		cursor: pointer;
	}

	button:hover,
	button.current {
		color: var(--color-fg);
		font-weight: var(--font-weight-bold);
	}

	.bubble {
		position: fixed;
		right: calc(var(--spacing-8) + var(--spacing-4));
		display: grid;
		place-items: center;
		width: var(--spacing-16);
		height: var(--spacing-16);
		background: var(--color-fg);
		color: var(--color-on-fg);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		pointer-events: none;
		translate: 0 -50%;
	}

	@media (max-width: 767.98px) {
		ol {
			touch-action: none;
		}
	}

	button:focus-visible {
		outline: var(--border-width-base) solid var(--color-highlight);
		outline-offset: calc(-1 * var(--border-width-base));
	}
</style>
