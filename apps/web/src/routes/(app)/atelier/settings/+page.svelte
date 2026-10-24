<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Alert, Tabs, Toast } from '@study-atelier/ui';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { EMAIL_CHANGED_PARAM } from '#lib/auth/account.ts';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { m } from '#lib/i18n/index.ts';
	import DataTab from '#lib/export/components/DataTab.svelte';
	import AccountTab from '#lib/profile/components/AccountTab.svelte';
	import PreferencesTab from '#lib/profile/components/PreferencesTab.svelte';
	import ProfileTab from '#lib/profile/components/ProfileTab.svelte';
	import { PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data.ts';
	import { PROFILE_DEPENDENCY } from '#lib/profile/profile-data.ts';
	import { SETTINGS_TABS, settingsTabOf } from '#lib/profile/settings-tab.ts';
	import type { Preferences, Profile } from '#lib/profile/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const settingsPath = resolve('/(app)/atelier/settings');
	const tabs = SETTINGS_TABS.map((value) => ({ value, label: m.settings.tabs[value] }));

	let toast: Toast;
	let profileTab = $state<ProfileTab>();
	let preferencesTab = $state<PreferencesTab>();
	let barHeight = $state(0);

	let email = $derived(data.session.user.email ?? '');
	let tab = $derived(settingsTabOf(page.url.searchParams.get('tab')));

	onMount(() => {
		if (!page.url.searchParams.has(EMAIL_CHANGED_PARAM)) return;
		const params = new SvelteURLSearchParams(page.url.searchParams.toString());
		params.delete(EMAIL_CHANGED_PARAM);
		void goto(`${settingsPath}?${params}` as ResolvedPathname, {
			replace: true,
			invalidateAll: true
		});
		if (!data.pendingEmail) toast.show(m.settings.account.emailChanged);
	});

	function chooseTab(next: string): void {
		if (next === tab) return;
		const target = `${settingsPath}?tab=${next}` as ResolvedPathname;
		void goto(target, { replace: true, reset: false });
	}

	async function preferencesSaved(_preferences: Preferences, message: string): Promise<void> {
		await invalidate(PREFERENCES_DEPENDENCY);
		toast.show(message);
	}

	async function dataImported(message: string): Promise<void> {
		await invalidateAll();
		toast.show(message);
	}

	async function profileSaved(_profile: Profile, message: string): Promise<void> {
		await invalidate(PROFILE_DEPENDENCY);
		toast.show(message);
	}
</script>

<AtelierLayout
	confirmLeave={() =>
		(tab === 'profile' ? profileTab : preferencesTab)?.confirmLeave() ?? Promise.resolve(true)}
	{email}
	title={m.settings.title}
>
	<div class="page" class:bar={tab !== 'account' && tab !== 'data'}>
		<header>
			<h1>{m.settings.title}</h1>
			<p class="lead">{m.settings.lead}</p>
		</header>

		{#if data.error}
			<Alert title={m.settings.loadErrorTitle} tone="danger">
				{data.error}
			</Alert>
		{:else}
			<Tabs label={m.settings.tabsLabel} {tabs} bind:value={() => tab, chooseTab}>
				<div class="panel">
					{#if tab === 'profile'}
						<ProfileTab
							bind:this={profileTab}
							{email}
							onsaved={profileSaved}
							profile={data.profile}
							bind:barHeight
						/>
					{:else if tab === 'account'}
						<AccountTab
							{email}
							onchanged={(message) => toast.show(message)}
							pendingEmail={data.pendingEmail}
						/>
					{:else if tab === 'data'}
						<DataTab
							atelierEmpty={data.atelierEmpty}
							onexported={(message) => toast.show(message)}
							onimported={dataImported}
						/>
					{:else}
						{#key tab}
							<PreferencesTab
								bind:this={preferencesTab}
								onsaved={preferencesSaved}
								part={tab}
								preferences={data.preferences}
								bind:barHeight
							/>
						{/key}
					{/if}
				</div>
			</Tabs>
		{/if}
	</div>
</AtelierLayout>

<Toast bind:this={toast} offset={tab === 'account' || tab === 'data' ? 0 : barHeight} />

<style>
	header {
		display: grid;
	}

	.page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
	}

	.page.bar {
		margin-bottom: calc(-1 * var(--spacing-12));
	}

	.page > :global(.tabs) {
		flex: 1;
		grid-template-rows: auto 1fr;
	}

	.panel {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		min-height: 100%;
		padding-top: var(--spacing-8);
	}
</style>
