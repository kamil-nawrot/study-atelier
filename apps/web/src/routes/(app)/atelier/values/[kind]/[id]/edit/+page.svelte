<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import ValueForm from '#lib/collection/components/ValueForm.svelte';
	import { arrivedFromApp, goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { subjectName, subjectPath } from '#lib/collection/value-pages.ts';
	import { m } from '#lib/i18n/index.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
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
		cameFromApp = arrivedFromApp(from);
	});

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromApp);
	}

	async function showSaved(path: ResolvedPathname, message: string): Promise<void> {
		await goto(path, { replace: true, refreshAll: true, state: { valueMessage: message } });
	}
</script>

<AtelierLayout
	confirmLeave={() => form?.confirmLeave() ?? Promise.resolve(true)}
	email={data.session.user.email ?? ''}
	{title}
>
	{#snippet bar()}
		<BackLink
			fallbackHref={backPath}
			fallbackName={subject ? subjectName(subject) : m.valuePage.back}
		/>
		<h1 class="visually-hidden">{title}</h1>
	{/snippet}

	{#if subject}
		{#key backPath}
			<ValueForm
				bind:this={form}
				cancelHref={backPath}
				details={data.details}
				index={data.index}
				noteLinks={data.noteLinks}
				oncancel={goBack}
				onsaved={showSaved}
				{subject}
			/>
		{/key}
	{:else}
		<LoadFailure
			backHref={cardIndexPath}
			backLabel={m.valuePage.back}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>
