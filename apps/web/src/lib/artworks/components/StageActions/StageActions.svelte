<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import Search from '@lucide/svelte/icons/search';
	import { Icon, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		mouse: boolean;
		loupeReady: boolean;
		loupeActive: boolean;
		tooLarge: boolean;
		pinCount: number;
		showPins: boolean;
		onloupe: () => void;
	};

	let {
		mouse,
		loupeReady,
		loupeActive,
		tooLarge,
		pinCount,
		showPins = $bindable(),
		onloupe
	}: Props = $props();
</script>

<div class="stage-actions">
	{#if mouse}
		<Tooltip
			align="end"
			placement="bottom"
			text={loupeReady
				? loupeActive
					? m.loupe.leave
					: m.loupe.label
				: tooLarge
					? m.loupe.tooLarge
					: m.loupe.unavailable}
		>
			{#snippet children(id)}
				<button
					class="stage-action"
					class:active={loupeActive}
					class:unavailable={!loupeReady}
					aria-describedby={id}
					aria-disabled={!loupeReady}
					aria-label={m.loupe.label}
					aria-pressed={loupeReady ? loupeActive : undefined}
					data-loupe-toggle
					onclick={onloupe}
					type="button"
				>
					<Icon icon={Search} size="sm" />
				</button>
			{/snippet}
		</Tooltip>
	{/if}
	{#if pinCount > 0}
		<Tooltip align="end" placement="bottom" text={m.pins.switchLabel(pinCount)}>
			{#snippet children(id)}
				<button
					class="stage-action"
					class:active={showPins}
					aria-describedby={id}
					aria-label={m.pins.switchLabel(pinCount)}
					aria-pressed={showPins}
					onclick={() => (showPins = !showPins)}
					type="button"
				>
					<Icon icon={Pin} size="sm" />
					<span>{pinCount}</span>
				</button>
			{/snippet}
		</Tooltip>
	{/if}
</div>

<style>
	.stage-actions {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		z-index: 3;
		display: flex;
		align-items: center;
	}

	.stage-action {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-stage-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		cursor: pointer;
		opacity: 0.6;
	}

	.stage-action:hover,
	.stage-action:focus-visible,
	.stage-action.active {
		opacity: 1;
	}

	.stage-action.unavailable {
		cursor: default;
		opacity: 0.2;
	}
</style>
