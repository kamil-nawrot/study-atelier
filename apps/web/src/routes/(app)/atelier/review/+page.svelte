<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Dialog } from '@study-atelier/ui';
	import { invalidate } from '$app/navigation';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import ReviewPage from '#lib/review/components/ReviewPage/ReviewPage.svelte';
	import ReviewSessionBar from '#lib/review/components/ReviewSessionBar/ReviewSessionBar.svelte';
	import { REVIEW_COUNTS_DEPENDENCY } from '#lib/review/review-data/review-data.ts';
	import { ReviewFlow } from '#lib/review/review-flow/review-flow.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { shownMenuProfile } from '#lib/profile/menu-profile/menu-profile.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const flow = new ReviewFlow(() => data);
	flow.follow();

	onMount(() => {
		void refreshMenuCount();
	});

	async function refreshMenuCount(): Promise<void> {
		const fresh = data.waiting;
		if (data.reviewWaiting === undefined || fresh === undefined) return;
		if ((await data.reviewWaiting) !== fresh) void invalidate(REVIEW_COUNTS_DEPENDENCY);
	}
</script>

<AtelierLayout
	email={data.session.user.email ?? ''}
	fill={flow.phase === 'session'}
	title={m.review.title}
>
	{#snippet bar()}
		{#if flow.phase === 'session' && flow.session}
			<ReviewSessionBar onstop={() => flow.askToStop()} session={flow.session} />
		{/if}
	{/snippet}

	<ReviewPage
		error={data.error}
		{flow}
		glossary={data.glossary}
		rankForm={data.careerShown === false
			? undefined
			: (shownMenuProfile(data.session.user.id)?.rankForm ?? 'masculine')}
		streak={data.streak}
	/>
</AtelierLayout>

<Dialog
	description={flow.session?.free ? m.review.freeStopDescription : m.review.stopDescription}
	onclose={() => (flow.stopOpen = false)}
	size="small"
	title={m.review.stopTitle}
	bind:open={flow.stopOpen}
>
	{#snippet footer()}
		<Button onclick={() => (flow.stopOpen = false)}>{m.review.keepGoing}</Button>
		<Button onclick={() => flow.stop()} variant="primary">{m.review.stop}</Button>
	{/snippet}
</Dialog>
