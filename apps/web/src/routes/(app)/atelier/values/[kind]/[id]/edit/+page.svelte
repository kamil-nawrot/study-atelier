<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Alert, Button, Icon, Section } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import ValueForm from '#lib/collection/components/ValueForm.svelte';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import { subjectName, subjectPath } from '#lib/collection/value-pages.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');

	let form = $state<ValueForm>();
	let cameFromApp = false;

	let subject = $derived(data.subject);
	let backPath = $derived(subject ? subjectPath(subject) : cardIndexPath);
	let title = $derived(
		subject
			? m.valueForm.editTitle(
					subject.kind === 'era'
						? m.valueForm.eraAccusative
						: m.cardIndex.kinds[subject.kind].accusative,
					subjectName(subject)
				)
			: data.notFound
				? m.valuePage.notFoundTitle
				: m.valuePage.loadErrorTitle
	);

	afterNavigate(({ from }) => {
		cameFromApp = from !== null;
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(path: ResolvedPathname, message: string): Promise<void> {
		await goto(path, { replace: true, state: { valueMessage: message } });
	}

	async function showDeleted(message: string): Promise<void> {
		await goto(cardIndexPath, { replace: true, state: { valueMessage: message } });
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	{title}
>
	{#snippet bar()}
		<div class="heading">
			<a class="back" aria-label={m.valueForm.goBack} href={backPath} onclick={goBack}>
				<Icon icon={ArrowLeft} />
			</a>
			<h1>{title}</h1>
		</div>
	{/snippet}

	{#if subject}
		{#key backPath}
			<ValueForm
				bind:this={form}
				cancelHref={backPath}
				details={data.details}
				index={data.index}
				oncancel={goBack}
				ondeleted={showDeleted}
				onsaved={showSaved}
				{subject}
			/>
		{/key}
	{:else}
		<Section>
			{#if data.notFound}
				<p class="lead">{data.error}</p>
			{:else}
				<Alert tone="danger">
					{data.error}
				</Alert>
			{/if}
		</Section>
		<div>
			<Button href={cardIndexPath}>
				{m.valuePage.back}
			</Button>
		</div>
	{/if}
</AtelierLayout>

<style>
	.heading {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.back {
		display: grid;
		place-items: center;
		flex: none;
		padding-block: var(--spacing-2);
		color: var(--color-fg);
	}

	h1 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}
</style>
