<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { Icon, Tag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ExhibitCase from '#lib/career/components/ExhibitCase/ExhibitCase.svelte';
	import {
		hasNewInRoom,
		isFinished,
		isShown,
		squareOf,
		type CaseFilters,
		type Room
	} from '#lib/career/rooms/rooms.ts';
	import { roman } from '#lib/timeline/labels/labels.ts';

	type Props = {
		room: Room;
		number: number;
		filters: CaseFilters;
		open: boolean;
		ontoggle: () => void;
	};

	let { room, number, filters, open, ontoggle }: Props = $props();

	let name = $derived((m.career.rooms as Record<string, string>)[room.code] ?? room.code);
	let shown = $derived(room.exhibits.filter((exhibit) => isShown(exhibit, filters)));
	let finished = $derived(room.exhibits.filter(isFinished).length);
	let listId = $derived(`room-${room.code}`);
</script>

<section class="room">
	<h2>
		<button aria-controls={listId} aria-expanded={open} onclick={ontoggle} type="button">
			<span class="title">
				<span class="overline">{m.career.roomNumber(roman(number))}</span>
				<span class="name">
					<cite class="artwork-title">{name}</cite>
					{#if hasNewInRoom(room)}
						<Tag>{m.career.new}</Tag>
					{/if}
				</span>
			</span>
			<span class="visually-hidden">{m.career.roomFinished(finished, room.exhibits.length)}</span>
			<span class="squares" aria-hidden="true">
				{#each room.exhibits as exhibit (exhibit.code)}
					<span class="square {squareOf(exhibit)}"></span>
				{/each}
			</span>
			<Icon icon={ChevronDown} size="sm" />
		</button>
	</h2>
	{#if open}
		<div id={listId}>
			{#if shown.length > 0}
				<ul class="exhibits">
					{#each shown as exhibit (exhibit.code)}
						<li><ExhibitCase {exhibit} /></li>
					{/each}
				</ul>
			{:else}
				<p class="empty">{m.career.roomEmpty}</p>
			{/if}
		</div>
	{/if}
</section>

<style>
	.room {
		display: grid;
		gap: var(--spacing-6);
		padding-block: var(--spacing-6);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	h2 {
		font: inherit;
	}

	button {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: var(--spacing-4);
		inline-size: 100%;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		text-align: start;
		cursor: pointer;
	}

	@media (prefers-reduced-motion: no-preference) {
		button > :global(svg) {
			transition: transform var(--duration-short) ease-out;
		}
	}

	button[aria-expanded='true'] > :global(svg) {
		transform: rotate(180deg);
	}

	.title {
		display: grid;
		gap: var(--spacing-1);
	}

	.name {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-3);
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-2xl);
	}

	.name .artwork-title {
		font-size: inherit;
		line-height: inherit;
	}

	.squares {
		display: flex;
		flex-wrap: wrap;
		justify-content: end;
		gap: var(--spacing-1);
		max-inline-size: calc(7 * var(--spacing-4));
	}

	.square {
		inline-size: var(--spacing-3);
		block-size: var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.square.bronze {
		border-color: var(--color-case-bronze);
		background: var(--color-case-bronze);
	}

	.square.silver {
		border-color: var(--color-case-silver);
		background: var(--color-case-silver);
	}

	.square.gold {
		border-color: var(--color-case-gold);
		background: var(--color-case-gold);
	}

	.square.platinum {
		border-color: var(--color-case-gold);
		background: var(--color-case-silver);
	}

	.exhibits {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: var(--spacing-6);
		list-style: none;
	}

	.exhibits > li {
		display: grid;
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
