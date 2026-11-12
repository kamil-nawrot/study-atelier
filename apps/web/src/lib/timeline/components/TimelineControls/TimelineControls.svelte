<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { MediaQuery } from 'svelte/reactivity';
	import { Icon, ToggleTag } from '@study-atelier/ui';
	import { ERA_CODES, eraTitle } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { StepKey } from '#lib/timeline/types/step-key.ts';

	type Props = {
		code: EraCode;
		step: StepKey;
		steps: StepKey[];
		onera: (code: EraCode) => void;
		onstep: (key: StepKey) => void;
		onmove: (direction: 1 | -1) => void;
	};

	let { code, step, steps, onera, onstep, onmove }: Props = $props();

	const phone = new MediaQuery('max-width: 767.98px');

	let at = $derived(steps.indexOf(step));
	let shown = $derived(phone.current ? steps.slice(Math.max(0, at - 1), at + 2) : steps);
	let index = $derived(ERA_CODES.indexOf(code));
	let previous = $derived(index > 0 ? ERA_CODES[index - 1] : undefined);
	let next = $derived(index < ERA_CODES.length - 1 ? ERA_CODES[index + 1] : undefined);
</script>

<div class="controls">
	<div class="move">
		{#if previous}
			<button
				class="quiet"
				aria-label={m.timeline.previous(eraTitle(previous))}
				onclick={() => onera(previous)}
				type="button"
			>
				<Icon icon={ArrowLeft} size="sm" />
				{eraTitle(previous)}
			</button>
		{/if}
	</div>
	<div class="steps" aria-label={m.timeline.steps.label} role="group">
		<button
			class="quiet zoom"
			aria-label={m.timeline.zoomOut}
			disabled={at <= 0}
			onclick={() => onmove(-1)}
			type="button"
		>
			<Icon icon={Minus} size="sm" />
		</button>
		{#each shown as key (key)}
			<ToggleTag bind:pressed={() => key === step, (pressed) => pressed && onstep(key)}>
				{m.timeline.steps[key]}
			</ToggleTag>
		{/each}
		<button
			class="quiet zoom"
			aria-label={m.timeline.zoomIn}
			disabled={at >= steps.length - 1}
			onclick={() => onmove(1)}
			type="button"
		>
			<Icon icon={Plus} size="sm" />
		</button>
	</div>
	<div class="move next">
		{#if next}
			<button
				class="quiet"
				aria-label={m.timeline.next(eraTitle(next))}
				onclick={() => onera(next)}
				type="button"
			>
				{eraTitle(next)}
				<Icon icon={ArrowRight} size="sm" />
			</button>
		{/if}
	</div>
</div>

<style>
	.controls {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: var(--spacing-2);
	}

	.steps {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-2);
	}

	.move {
		display: flex;
	}

	.move.next {
		justify-content: flex-end;
	}

	@media (max-width: 767.98px) {
		.controls {
			grid-template-columns: 1fr;
		}

		.move {
			display: none;
		}

		.steps {
			flex-wrap: nowrap;
		}
	}

	.quiet {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-1);
		border: 0;
		background: none;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		cursor: pointer;
	}

	.quiet:hover:not(:disabled) {
		color: var(--color-fg);
	}

	.quiet:disabled {
		opacity: 0.4;
		cursor: default;
	}

	@media (max-width: 767.98px) {
		.controls {
			grid-template-columns: 1fr 1fr;
		}

		.steps {
			grid-row: 2;
			grid-column: 1 / -1;
		}
	}
</style>
