<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Alert, PageHeader, Tabs, Toast } from '@study-atelier/ui';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { EMAIL_CHANGED_PARAM } from '#lib/auth/account/account.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import DataTab from '#lib/data-transfer/components/DataTab/DataTab.svelte';
	import AccountTab from '#lib/profile/components/AccountTab/AccountTab.svelte';
	import PreferencesTab from '#lib/profile/components/PreferencesTab/PreferencesTab.svelte';
	import ProfileTab from '#lib/profile/components/ProfileTab/ProfileTab.svelte';
	import { PREFERENCES_DEPENDENCY } from '#lib/profile/preferences-data/preferences-data.ts';
	import { PROFILE_DEPENDENCY } from '#lib/profile/profile-data/profile-data.ts';
	import { SETTINGS_TABS, settingsTabOf } from '#lib/profile/settings-tab/settings-tab.ts';
	import type { Profile } from '#lib/profile/types/profile.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const settingsPath = resolve('/(app)/atelier/settings');
	const atelierPath = resolve('/(app)/atelier');
	const tabs = SETTINGS_TABS.map((value) => ({ value, label: m.settings.tabs[value] }));

	let toast: Toast;
	let profileTab = $state<ProfileTab>();

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

	async function preferencesSaved(): Promise<void> {
		await invalidate(PREFERENCES_DEPENDENCY);
	}

	async function dataImported(message: string): Promise<void> {
		await invalidateAll();
		toast.show(message);
	}

	async function profileSaved(_profile: Profile, message?: string): Promise<void> {
		await invalidate(PROFILE_DEPENDENCY);
		if (message) toast.show(message);
	}
</script>

<AtelierLayout
	confirmLeave={() =>
		(tab === 'profile' ? profileTab?.confirmLeave() : undefined) ?? Promise.resolve(true)}
	{email}
	heading
	title={m.settings.title}
>
	{#snippet back()}
		<BackLink arrowOnly fallbackHref={atelierPath} fallbackName={m.settings.back} />
	{/snippet}

	<div class="page">
		<PageHeader lead={m.settings.lead} />

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
						/>
					{:else if tab === 'account'}
						<AccountTab
							acceptedLegalVersion={data.acceptedLegalVersion}
							{email}
							onchanged={(message) => toast.show(message)}
							pendingEmail={data.pendingEmail}
						/>
					{:else if tab === 'data'}
						<DataTab
							atelierEmpty={data.atelierEmpty}
							onexported={(message) => toast.show(message)}
							onimported={dataImported}
							storageUsage={data.storageUsage}
						/>
					{:else}
						{#key tab}
							<PreferencesTab
								onsaved={preferencesSaved}
								part={tab}
								preferences={data.preferences}
							/>
						{/key}
					{/if}
				</div>
			</Tabs>
		{/if}
	</div>
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	.panel {
		container-type: inline-size;
		display: flex;
		flex-direction: column;
	}
</style>
