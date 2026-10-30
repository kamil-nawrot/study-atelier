<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import Search from '@lucide/svelte/icons/search';
	import { StageButton } from '@study-atelier/ui';
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
		<StageButton
			active={loupeActive}
			aria-disabled={!loupeReady}
			aria-pressed={loupeReady ? loupeActive : undefined}
			data-loupe-toggle
			icon={Search}
			label={m.loupe.label}
			onclick={onloupe}
			tooltip={loupeReady
				? loupeActive
					? m.loupe.leave
					: m.loupe.label
				: tooLarge
					? m.loupe.tooLarge
					: m.loupe.unavailable}
			unavailable={!loupeReady}
		/>
	{/if}
	{#if pinCount > 0}
		<StageButton
			active={showPins}
			aria-pressed={showPins}
			icon={Pin}
			label={m.pins.switchLabel(pinCount)}
			onclick={() => (showPins = !showPins)}
		>
			<span>{pinCount}</span>
		</StageButton>
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
</style>
