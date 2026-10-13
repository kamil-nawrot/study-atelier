<script lang="ts">
	import ImageOff from '@lucide/svelte/icons/image-off';
	import { uiMessages } from '../messages';
	import Icon from './Icon.svelte';

	type Props = {
		label?: string;
		unavailable?: boolean;
	};

	let { label = uiMessages().noImage, unavailable = false }: Props = $props();
</script>

<div class="window" aria-label={label} role="img">
	{#if unavailable}
		<div class="unavailable">
			<Icon icon={ImageOff} />
			<span>{label}</span>
		</div>
	{:else}
		<div class="frame">
			<svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
				<line vector-effect="non-scaling-stroke" x1="0" x2="100" y1="0" y2="100" />
				<line vector-effect="non-scaling-stroke" x1="100" x2="0" y1="0" y2="100" />
			</svg>
		</div>
	{/if}
</div>

<style>
	.window {
		box-sizing: border-box;
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 5;
		background: var(--color-mat-window);
		color: var(--color-mat-fg-muted);
	}

	.frame {
		position: absolute;
		inset: var(--spacing-6);
		border: var(--border-width-hairline) solid currentColor;
		opacity: 0.6;
	}

	.unavailable {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-3);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		text-align: center;
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	line {
		stroke: currentColor;
		stroke-width: var(--border-width-hairline);
	}
</style>
