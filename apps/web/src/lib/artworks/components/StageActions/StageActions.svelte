<script lang="ts">
	import Blend from '@lucide/svelte/icons/blend';
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
		paletteOn: boolean;
		paletteUnreadable: boolean;
		onloupe: () => void;
	};

	let {
		mouse,
		loupeReady,
		loupeActive,
		tooLarge,
		pinCount,
		showPins = $bindable(),
		paletteOn = $bindable(),
		paletteUnreadable,
		onloupe
	}: Props = $props();
</script>

<div class="stage-actions">
	<StageButton
		active={paletteOn}
		aria-disabled={paletteUnreadable}
		aria-pressed={paletteUnreadable ? undefined : paletteOn}
		icon={Blend}
		label={m.palette.label}
		onclick={() => {
			if (!paletteUnreadable) paletteOn = !paletteOn;
		}}
		tooltip={paletteUnreadable
			? m.palette.unreadable
			: paletteOn
				? m.palette.hide
				: m.palette.label}
		unavailable={paletteUnreadable}
	/>
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
