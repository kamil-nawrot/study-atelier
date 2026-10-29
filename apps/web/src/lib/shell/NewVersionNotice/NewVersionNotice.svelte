<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { actionBarHeight } from '#lib/shell/new-version/new-version.ts';

	type Props = {
		updated: boolean;
		onreload?: () => void;
	};

	let { updated, onreload = () => location.reload() }: Props = $props();

	let offset = $state(0);

	function measure(): void {
		offset = actionBarHeight();
	}

	$effect(() => {
		if (updated) measure();
	});
</script>

<svelte:window onresize={measure} />

{#if updated}
	<div style:--notice-offset="{offset}px" class="region" role="status">
		<div class="notice">
			<p>{m.newVersion.message}</p>
			<button class="reload" onclick={onreload} type="button">{m.newVersion.reload}</button>
		</div>
	</div>
{/if}

<style>
	.region {
		position: fixed;
		right: var(--spacing-4);
		bottom: calc(var(--notice-offset) + var(--spacing-4));
		left: var(--spacing-4);
		z-index: 2;
		display: grid;
		justify-items: center;
		pointer-events: none;
	}

	.notice {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-4);
		align-items: baseline;
		justify-content: space-between;
		width: 100%;
		padding: var(--spacing-3) var(--spacing-4);
		border-bottom: var(--border-width-button) solid var(--color-fg-muted);
		background: var(--color-fg);
		color: var(--color-on-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		pointer-events: auto;
	}

	.reload {
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		font-weight: var(--font-weight-medium);
		text-decoration: underline;
		text-underline-offset: var(--spacing-1);
		white-space: nowrap;
		cursor: pointer;
	}

	@media (min-width: 768px) {
		.notice {
			flex-wrap: nowrap;
			width: auto;
			max-width: var(--size-content-narrow);
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.notice {
			animation: enter var(--duration-short) ease-out;
		}
	}

	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(var(--spacing-2));
		}
	}
</style>
