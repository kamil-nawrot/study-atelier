<script lang="ts">
	import { Disclosure, Icon, Meter, TextButton } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { artworkTypeIcon } from '#lib/catalogue/artwork-types/artwork-types.ts';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { groupAuthorRelations } from '#lib/author-relations/author-relation-types/author-relation-types.ts';
	import TimeSpan from '#lib/relations/components/TimeSpan/TimeSpan.svelte';
	import type { Relations } from '#lib/relations/types/relations.ts';

	type Props = {
		relations: Relations;
	};

	let { relations }: Props = $props();

	const SHOWN_EVENTS = 8;

	let allEvents = $state(false);

	let timed = $derived(relations.years.length > 0 || relations.bounds !== undefined);
	let events = $derived(relations.events ?? []);
	let progress = $derived(relations.total > 0 && relations.mastered !== undefined);
	let authors = $derived(groupAuthorRelations(relations.authors ?? []));
	let shown = $derived(
		timed ||
			authors.length > 0 ||
			relations.groups.length > 0 ||
			relations.types.length > 0 ||
			events.length > 0
	);
</script>

{#if shown}
	<Disclosure room title={m.relations.title}>
		<div class="band">
			<div class="column wide">
				{#if timed}
					<TimeSpan
						bounds={relations.bounds}
						{events}
						kind={relations.kind}
						years={relations.years}
					/>
				{/if}
				{#if authors.length > 0}
					<section class="part" aria-labelledby="relations-authors">
						<h3 id="relations-authors" class="overline">{m.authorRelations.band}</h3>
						{#each authors as group (group.type)}
							<div class="group">
								<span class="caption">{group.label}</span>
								<ul class="authors">
									{#each group.authors as author (author.id)}
										<li>
											<a
												href={resolve('/(app)/atelier/values/[kind]/[id]', {
													kind: 'author',
													id: author.id
												})}>{author.name}</a
											>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</section>
				{/if}
				{#if relations.groups.length > 0}
					<section class="part" aria-labelledby="relations-together">
						<h3 id="relations-together" class="overline">
							{relations.kind === 'era' ? m.relations.hierarchy : m.relations.together}
						</h3>
						{#each relations.groups as group (group.label)}
							<div class="group">
								<span class="caption">{group.label}</span>
								<ul class="values">
									{#each group.values as value (value.id)}
										<li>
											<a class="value" href={value.href}
												>{value.name}<span class="count">{value.count}</span></a
											>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</section>
				{/if}
			</div>
			<div class="column">
				{#if progress}
					<section class="part" aria-labelledby="relations-progress">
						<h3 id="relations-progress" class="overline">{m.relations.progress}</h3>
						<p>{m.relations.mastered(relations.mastered ?? 0, relations.total)}</p>
						<Meter
							label={m.relations.progress}
							max={relations.total}
							track="dim"
							value={relations.mastered ?? 0}
						/>
					</section>
				{/if}
				{#if relations.types.length > 0}
					<section class="part" aria-labelledby="relations-types">
						<h3 id="relations-types" class="overline">{m.relations.types}</h3>
						<ul class="types">
							{#each relations.types as type (type.code)}
								<li>
									<Icon icon={artworkTypeIcon(type.code)} size="sm" />
									{m.artworkTypes[type.code]}
									<span class="count">{type.count}</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
				{#if events.length > 0}
					<section class="part" aria-labelledby="relations-events">
						<h3 id="relations-events" class="overline">
							{relations.kind === 'event' ? m.relations.otherEvents : m.relations.sameTime}
						</h3>
						<ul class="events">
							{#each allEvents ? events : events.slice(0, SHOWN_EVENTS) as event (event.id)}
								<li>
									<a href={resolve('/(app)/atelier/timeline/events/[id]', { id: event.id })}
										>{event.name}</a
									>
									<span class="count"
										>{formatDate(event.yearFrom, event.yearTo, event.yearApproximate)}</span
									>
								</li>
							{/each}
						</ul>
						{#if !allEvents && events.length > SHOWN_EVENTS}
							<TextButton inline onclick={() => (allEvents = true)}>
								{m.relations.allEvents(events.length)}
							</TextButton>
						{/if}
					</section>
				{/if}
			</div>
		</div>
	</Disclosure>
{/if}

<style>
	.band,
	.column,
	.part,
	.group {
		display: grid;
		align-content: start;
	}

	.band,
	.column {
		gap: var(--spacing-8);
	}

	.part {
		gap: var(--spacing-3);
	}

	.group {
		gap: var(--spacing-2);
	}

	.caption,
	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	ul {
		list-style: none;
	}

	.values {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.value {
		display: inline-flex;
		align-items: baseline;
		gap: var(--spacing-2);
		padding: var(--spacing-1) var(--spacing-3);
		background: var(--color-tag);
		color: var(--color-fg);
		text-decoration: none;
	}

	.value:hover {
		text-decoration: underline;
	}

	.authors {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1) var(--spacing-4);
	}

	.authors a {
		color: var(--color-fg);
	}

	.types {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-6);
	}

	.types li {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.events {
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.events li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-3);
		padding-block: var(--spacing-2);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.events a {
		color: var(--color-fg);
		text-decoration: none;
	}

	.events a:hover {
		text-decoration: underline;
	}

	.events .count {
		flex-shrink: 0;
	}

	@media (min-width: 768px) {
		.band {
			grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
			gap: var(--spacing-8) var(--spacing-12);
		}
	}
</style>
