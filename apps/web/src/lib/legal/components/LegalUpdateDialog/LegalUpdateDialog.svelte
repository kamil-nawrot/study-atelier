<script lang="ts">
	import { Alert, Button, Dialog } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import LegalLinks from '#lib/legal/components/LegalLinks/LegalLinks.svelte';
	import { acceptedNow } from '#lib/legal/accepted/accepted.svelte.ts';
	import { acceptLegal } from '#lib/legal/legal-data/legal-data.ts';
	import {
		isCurrentLegalVersion,
		LEGAL_VERSION,
		legalVersionDate
	} from '#lib/legal/version/version.ts';

	type Props = {
		accepted?: Promise<string | null | undefined>;
	};

	let { accepted }: Props = $props();

	const settingsPath = resolve('/(app)/atelier/settings');

	let open = $state(false);
	let accepting = $state(false);
	let error = $state<string>();

	$effect(() => {
		if (!accepted || page.url.pathname.startsWith(settingsPath)) return;
		if (isCurrentLegalVersion(acceptedNow.version)) return;
		let active = true;
		void accepted.then((version) => {
			if (active && version !== undefined && !isCurrentLegalVersion(version)) open = true;
		});
		return () => {
			active = false;
		};
	});

	async function accept(): Promise<void> {
		if (accepting) return;
		accepting = true;
		error = await acceptLegal();
		accepting = false;
		if (error) return;
		acceptedNow.version = LEGAL_VERSION;
		open = false;
	}

	function toSettings(): void {
		open = false;
		void goto(`${settingsPath}?tab=account` as ResolvedPathname);
	}
</script>

<Dialog
	description={m.legal.updateDescription(legalVersionDate(LEGAL_VERSION))}
	size="small"
	title={m.legal.updateTitle}
	bind:open
>
	{#if error}
		<Alert tone="danger">{error}</Alert>
	{/if}
	<LegalLinks />
	{#snippet footer()}
		<Button onclick={toSettings}>{m.legal.updateSettings}</Button>
		<Button disabled={accepting} onclick={accept} variant="primary">{m.legal.updateAccept}</Button>
	{/snippet}
</Dialog>
