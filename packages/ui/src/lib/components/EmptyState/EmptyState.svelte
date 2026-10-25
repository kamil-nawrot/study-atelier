<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		icon: LucideIcon;
		text: string;
		title?: string;
		children?: Snippet;
	};

	let { icon: Glyph, text, title, children }: Props = $props();
</script>

<div class="empty" class:whole={title}>
	<span class="icon">
		<Glyph
			aria-hidden="true"
			size={title ? 40 : 28}
			stroke-linecap="square"
			stroke-linejoin="miter"
			strokeWidth={1.25}
		/>
	</span>
	{#if title}
		<h2 class="title">{title}</h2>
	{/if}
	<p class="text">{text}</p>
	{#if children}
		<div class="action">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.empty {
		display: grid;
		justify-items: center;
		gap: var(--spacing-4);
		padding-block: var(--spacing-12);
		color: var(--color-fg-muted);
		text-align: center;
	}

	.whole {
		padding-block: var(--spacing-24);
	}

	.icon {
		display: flex;
		padding-block-end: var(--spacing-2);
	}

	.title {
		color: var(--color-fg);
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-2xl);
	}

	.text {
		max-inline-size: calc(var(--size-content-narrow) * 1.25);
	}

	.whole .text {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
	}

	.action {
		padding-block-start: var(--spacing-4);
	}
</style>
