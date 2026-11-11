<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { eraIcon, eraTitle } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { Era } from '#lib/timeline/types/era.ts';

	type Props = {
		eras: readonly Era[];
		current: EraCode;
		onselect: (code: EraCode) => void;
	};

	let { eras, current, onselect }: Props = $props();

	const NAME_ROOM = 9;
	const ICON_ROOM = 40;

	let width = $state(0);

	let size = $derived(eras.length > 0 ? width / eras.length : 0);

	function showsName(code: EraCode): boolean {
		return size >= ICON_ROOM + eraTitle(code).length * NAME_ROOM;
	}
</script>

<nav
	style:--eras={eras.length}
	class="strip"
	aria-label={m.timeline.strip}
	bind:clientWidth={width}
>
	{#each eras as era (era.code)}
		<button
			class="segment"
			class:current={era.code === current}
			aria-current={era.code === current ? 'true' : undefined}
			aria-label={eraTitle(era.code)}
			onclick={() => onselect(era.code)}
			type="button"
		>
			<Icon icon={eraIcon(era.code)} size="sm" />
			{#if showsName(era.code)}
				<span class="name" aria-hidden="true">{eraTitle(era.code)}</span>
			{/if}
		</button>
	{/each}
</nav>

<style>
	.strip {
		display: grid;
		grid-template-columns: repeat(var(--eras), minmax(0, 1fr));
		height: var(--size-control);
	}

	.segment {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-2);
		overflow: hidden;
		padding-inline: var(--spacing-1);
		border: 0;
		border-right: var(--border-width-base) solid var(--color-bg);
		background: var(--color-tag);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		white-space: nowrap;
		cursor: pointer;
	}

	.segment:last-child {
		border-right: 0;
	}

	.segment:hover {
		color: var(--color-fg);
	}

	.segment.current {
		background: var(--color-fg-muted);
		color: var(--color-on-fg);
	}
</style>
