<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert } from '@study-atelier/ui';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import DisplayCase from '#lib/career/components/DisplayCase/DisplayCase.svelte';
	import EngravingCredits from '#lib/career/components/EngravingCredits/EngravingCredits.svelte';
	import RankProgress from '#lib/career/components/RankProgress/RankProgress.svelte';
	import { isHidden } from '#lib/career/exhibits/exhibits.ts';
	import { career } from '#lib/career/career-state/career-state.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { shownMenuProfile } from '#lib/profile/menu-profile/menu-profile.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	onMount(() => {
		if (!data.error) void career.markSeen();
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.career.title}>
	<header>
		<h1>{m.career.title}</h1>
		<div class="intro">
			<p class="lead">{m.career.lead}</p>
			{#if !data.error && career.standing}
				<RankProgress
					form={shownMenuProfile(data.session.user.id)?.rankForm ?? 'masculine'}
					points={career.standing.points}
				/>
			{/if}
		</div>
	</header>

	{#if data.error}
		<Alert title={m.career.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<DisplayCase exhibits={data.exhibits} />
		<EngravingCredits
			codes={data.exhibits.filter((exhibit) => !isHidden(exhibit)).map((exhibit) => exhibit.code)}
		/>
	{/if}
</AtelierLayout>

<style>
	header,
	.intro {
		display: grid;
		gap: var(--spacing-4);
	}

	@media (min-width: 768px) {
		.intro {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
			gap: var(--spacing-12);
		}
	}
</style>
