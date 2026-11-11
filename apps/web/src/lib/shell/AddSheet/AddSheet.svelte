<script lang="ts">
	import BookA from '@lucide/svelte/icons/book-a';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Footprints from '@lucide/svelte/icons/footprints';
	import ImagesIcon from '@lucide/svelte/icons/images';
	import { Icon } from '@study-atelier/ui';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import BottomSheet from '#lib/shell/BottomSheet/BottomSheet.svelte';

	let sheet: ReturnType<typeof BottomSheet>;

	export function open(): void {
		sheet.open();
	}

	const kinds = [
		{
			key: 'artwork',
			icon: ImagesIcon,
			label: m.addSheet.artwork,
			name: m.atelier.add,
			href: resolve('/(app)/atelier/new')
		},
		{
			key: 'term',
			icon: BookA,
			label: m.addSheet.term,
			name: m.glossary.add,
			href: resolve('/(app)/atelier/glossary/new')
		},
		{
			key: 'visit',
			icon: Footprints,
			label: m.addSheet.visit,
			name: m.chronicle.add,
			href: resolve('/(app)/atelier/chronicle/new')
		},
		{
			key: 'event',
			icon: CalendarRange,
			label: m.addSheet.event,
			name: m.timeline.add,
			href: resolve('/(app)/atelier/timeline/events/new')
		}
	] as const;

	const here = $derived(
		page.url.pathname.startsWith(resolve('/(app)/atelier/glossary'))
			? 'term'
			: page.url.pathname.startsWith(resolve('/(app)/atelier/chronicle'))
				? 'visit'
				: page.url.pathname.startsWith(resolve('/(app)/atelier/timeline'))
					? 'event'
					: 'artwork'
	);
</script>

<BottomSheet bind:this={sheet} closeLabel={m.addSheet.close} label={m.addSheet.title}>
	{#snippet top()}
		<h2 class="title">{m.addSheet.title}</h2>
	{/snippet}
	<ul class="kinds">
		{#each kinds as kind (kind.key)}
			<li>
				<a class="kind" class:here={kind.key === here} aria-label={kind.name} href={kind.href}>
					<Icon icon={kind.icon} />
					<span aria-hidden="true">{kind.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</BottomSheet>

<style>
	.title {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
	}

	.kinds {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-2);
		margin: 0;
		list-style: none;
	}

	.kind {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
		min-height: 88px;
		border: var(--border-width-base) solid var(--color-tag);
		color: var(--color-fg);
		text-decoration: none;
	}

	.kind.here {
		border-color: var(--color-fg);
		background: var(--color-tag);
	}

	.kind:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}
</style>
