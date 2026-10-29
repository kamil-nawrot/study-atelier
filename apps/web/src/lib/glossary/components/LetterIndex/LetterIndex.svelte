<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		letters: string[];
	};

	let { letters }: Props = $props();

	const REACH = 32;

	let nav = $state<HTMLElement>();
	let current = $state<string>();
	let chosen: string | undefined;

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
		const line = (parseFloat(getComputedStyle(nav).getPropertyValue('--bar-height')) || 0) + REACH;
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

	function jump(letter: string): void {
		chosen = letter;
		current = letter;
		const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		section(letter)?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'instant' });
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

<nav bind:this={nav} class="index" aria-label={m.glossary.letters}>
	<ol>
		{#each letters as letter (letter)}
			<li>
				<button
					class:current={letter === current}
					aria-current={letter === current ? 'true' : undefined}
					onclick={() => jump(letter)}
					type="button">{letter}</button
				>
			</li>
		{/each}
	</ol>
</nav>

<style>
	.index {
		position: fixed;
		top: var(--bar-height);
		right: 0;
		bottom: 0;
		z-index: 1;
		display: flex;
		align-items: center;
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

	button:focus-visible {
		outline: var(--border-width-base) solid var(--color-highlight);
		outline-offset: calc(-1 * var(--border-width-base));
	}
</style>
