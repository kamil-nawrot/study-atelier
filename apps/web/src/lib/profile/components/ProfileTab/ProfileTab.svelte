<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import ImageUp from '@lucide/svelte/icons/image-up';
	import Trash from '@lucide/svelte/icons/trash';
	import { Button, Icon, Select, Switch, TextField } from '@study-atelier/ui';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { SaveQueue } from '#lib/shared/forms/save-queue/save-queue.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { OWN_IMAGE_ACCEPT } from '#lib/images/bucket/bucket.ts';
	import { cropAvatar } from '#lib/profile/avatar/avatar.ts';
	import {
		DISPLAY_NAME_MAX_LENGTH,
		avatarInitial,
		normalizedName,
		profileDraftOf,
		rankFormOf,
		showsAvatar,
		validateDisplayName
	} from '#lib/profile/profile/profile.ts';
	import { saveProfile } from '#lib/profile/profile-data/profile-data.ts';
	import type { AvatarChange } from '#lib/profile/types/avatar-change.ts';
	import type { Profile } from '#lib/profile/types/profile.ts';
	import type { ProfileDraft } from '#lib/profile/types/profile-draft.ts';
	import Avatar from '#lib/profile/components/Avatar/Avatar.svelte';
	import SettingsCard from '#lib/profile/components/SettingsCard/SettingsCard.svelte';

	type Props = {
		profile: Profile;
		email: string;
		onsaved: (profile: Profile, message?: string) => void | Promise<void>;
	};

	type Change = { draft: Partial<ProfileDraft>; message?: string };

	let { profile, email, onsaved }: Props = $props();

	const formId = $props.id();
	const hintId = `${formId}-hint`;

	let saved = $state.raw(untrack(() => profile));
	let name = $state(untrack(() => profileDraftOf(profile).name));
	let avatar = $state.raw<AvatarChange>({ kind: 'keep' });
	let rankForm = $state<string>(untrack(() => profile.rankForm));
	let careerShown = $state(untrack(() => profile.careerShown));
	let previewUrl = $state<string>();
	let nameError = $state<string>();
	let photoError = $state<string>();
	let cropping = $state(false);
	let fileInput = $state<HTMLInputElement>();

	const changes = new UnsavedChanges<string>(
		() => name,
		() => profileDraftOf(saved).name,
		(current, reference) => normalizedName(current) !== normalizedName(reference)
	);

	const queue = new SaveQueue<Change>(async ({ draft, message }) => {
		const result = await saveProfile(
			{ ...profileDraftOf(saved), rankForm: rankFormOf(rankForm), careerShown, ...draft },
			saved
		);
		if (result.error !== undefined) {
			rankForm = saved.rankForm;
			careerShown = saved.careerShown;
			setAvatar({ kind: 'keep' });
			return result.error;
		}
		saved = result.profile;
		if (draft.name !== undefined) name = profileDraftOf(result.profile).name;
		if (draft.avatar) setAvatar({ kind: 'keep' });
		await onsaved(result.profile, message);
		return undefined;
	});

	let hasAvatar = $derived(showsAvatar(saved, avatar));
	let initial = $derived(avatarInitial({ displayName: name, avatarPath: null }, email));
	let nameChanged = $derived(normalizedName(name) !== normalizedName(profileDraftOf(saved).name));

	$effect(() => {
		const draft = { rankForm: rankFormOf(rankForm), careerShown };
		untrack(() => {
			if (draft.rankForm === saved.rankForm && draft.careerShown === saved.careerShown) return;
			queue.push({ draft });
		});
	});

	function setAvatar(next: AvatarChange): void {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = next.kind === 'replace' ? URL.createObjectURL(next.image) : undefined;
		avatar = next;
	}

	async function pick(event: Event & { currentTarget: HTMLInputElement }): Promise<void> {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		photoError = undefined;
		cropping = true;
		const result = await cropAvatar(file);
		cropping = false;
		if ('error' in result) {
			photoError = result.error;
			return;
		}
		const next: AvatarChange = { kind: 'replace', image: result.image };
		setAvatar(next);
		queue.push({ draft: { avatar: next }, message: m.settings.profile.photoSaved });
	}

	function removePhoto(): void {
		const next: AvatarChange = { kind: 'remove' };
		setAvatar(next);
		queue.push({ draft: { avatar: next }, message: m.settings.profile.photoRemoved });
	}

	function saveName(event: SubmitEvent): void {
		event.preventDefault();
		nameError = validateDisplayName(name);
		if (nameError || !nameChanged) return;
		queue.push({ draft: { name }, message: m.settings.profile.nameSaved });
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	onDestroy(() => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	});
</script>

<SettingsCard error={queue.error} errorTitle={m.settings.profile.errorTitle}>
	<div class="fields">
		<div class="photo">
			<div class="mat">
				<Avatar {initial} large path={hasAvatar ? saved.avatarPath : null} {previewUrl} />
			</div>
			<div class="buttons">
				<Button disabled={queue.busy || cropping} onclick={() => fileInput?.click()}>
					<Icon icon={ImageUp} size="sm" />
					{hasAvatar ? m.settings.profile.changePhoto : m.settings.profile.addPhoto}
				</Button>
				{#if hasAvatar}
					<Button disabled={queue.busy} onclick={removePhoto} variant="danger">
						<Icon icon={Trash} size="sm" />
						{m.settings.profile.removePhoto}
					</Button>
				{/if}
			</div>
			{#if photoError}
				<span id={hintId} class="error" role="alert">{photoError}</span>
			{/if}
			<input
				bind:this={fileInput}
				accept={OWN_IMAGE_ACCEPT}
				aria-describedby={photoError ? hintId : undefined}
				hidden
				onchange={pick}
				type="file"
			/>
		</div>
		<div class="inputs">
			<form class="name" onsubmit={saveName}>
				<TextField
					autocomplete="given-name"
					error={nameError}
					label={m.settings.profile.name}
					maxlength={DISPLAY_NAME_MAX_LENGTH * 2}
					bind:value={name}
				/>
				{#if nameChanged}
					<Button disabled={queue.busy} type="submit">
						{queue.busy ? m.common.saving : m.common.save}
					</Button>
				{/if}
			</form>
			<div class="described">
				<Switch
					aria-describedby="{formId}-career-hint"
					label={m.settings.profile.careerShown}
					bind:checked={careerShown}
				/>
				<p id="{formId}-career-hint" class="hint">{m.settings.profile.careerShownHint}</p>
			</div>
			<Select
				disabled={!careerShown}
				label={m.settings.profile.rankForm}
				options={[
					{ value: 'masculine', label: m.settings.profile.rankFormMasculine },
					{ value: 'feminine', label: m.settings.profile.rankFormFeminine }
				]}
				bind:value={rankForm}
			/>
		</div>
	</div>
</SettingsCard>

<DiscardDialog {changes} description={m.common.discardDescription} />

<style>
	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}

	.name {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		gap: var(--spacing-2);
	}

	.inputs {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	@media (min-width: 768px) {
		.fields {
			grid-template-columns: repeat(2, minmax(0, var(--size-content-narrow)));
			justify-content: start;
			column-gap: var(--spacing-12);
			max-width: none;
			width: auto;
		}
	}

	.photo {
		display: grid;
		gap: var(--spacing-3);
	}

	.mat {
		min-width: 0;
		padding: var(--spacing-4);
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-surface);
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.buttons > :global(*) {
		flex: 1 1 auto;
	}

	@media (min-width: 768px) {
		.buttons > :global(*) {
			flex: none;
		}
	}

	.described {
		display: grid;
		gap: var(--spacing-1);
	}

	.described > :global(.switch) {
		display: flex;
		justify-content: space-between;
	}

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.error {
		color: var(--color-danger);
		font-size: var(--font-size-sm);
	}
</style>
