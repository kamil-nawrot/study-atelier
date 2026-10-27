<script lang="ts">
	import { Notes, TextButton } from '@study-atelier/ui';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { arrivedFromApp } from '#lib/shared/navigation/history/history.ts';
	import { legalText } from '#lib/legal/documents/documents.ts';
	import LegalLinks from '#lib/legal/components/LegalLinks/LegalLinks.svelte';
	import type { LegalDocument } from '#lib/legal/types/legal-document.ts';
	import { LEGAL_VERSION, legalVersionDate } from '#lib/legal/version/version.ts';

	type Props = {
		document: LegalDocument;
	};

	let { document }: Props = $props();

	let title = $derived(document === 'terms' ? m.legal.terms : m.legal.privacy);
	let text = $derived(legalText(document));

	let cameFromApp = false;

	afterNavigate(({ from }) => {
		cameFromApp = arrivedFromApp(from);
	});

	function back(): void {
		if (cameFromApp) history.back();
		else void goto(resolve('/(auth)'));
	}
</script>

<svelte:head>
	<title>{title} · {m.app.name}</title>
</svelte:head>

<div class="page">
	<div class="back">
		<TextButton inline onclick={back}>{m.common.back}</TextButton>
	</div>
	<main>
		<h1>{title}</h1>
		<p class="version">{m.legal.version(legalVersionDate(LEGAL_VERSION))}</p>
		<Notes value={text} />
	</main>
	<footer>
		<LegalLinks />
	</footer>
</div>

<style>
	.page {
		display: grid;
		gap: var(--spacing-8);
		box-sizing: border-box;
		width: 100%;
		max-width: var(--size-content-default);
		margin: 0 auto;
		padding: var(--spacing-8) var(--spacing-4) var(--spacing-12);
	}

	main {
		display: grid;
		gap: var(--spacing-4);
	}

	.version {
		color: var(--color-fg-muted);
	}
</style>
