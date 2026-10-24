<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Upload from '@lucide/svelte/icons/upload';
	import FieldMessage from '../FieldMessage/FieldMessage.svelte';
	import FilePicker from './FilePicker.svelte';

	const { Story } = defineMeta({
		title: 'Components/FilePicker',
		component: FilePicker,
		tags: ['autodocs'],
		args: { label: 'Choose a file', accept: 'image/*', icon: Upload, onpick: () => {} },
		argTypes: { icon: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="With hint">
	{#snippet template(args)}
		<div style="display: grid; gap: var(--spacing-2); justify-items: start">
			<FilePicker {...args} describedby="file-hint" />
			<FieldMessage id="file-hint" hint="JPG, PNG or WebP, up to 5 MB." />
		</div>
	{/snippet}
</Story>

<Story name="With error">
	{#snippet template(args)}
		<div style="display: grid; gap: var(--spacing-2); justify-items: start">
			<FilePicker {...args} describedby="file-error" />
			<FieldMessage
				id="file-error"
				error="This file type cannot be added."
				hint="JPG, PNG or WebP."
			/>
		</div>
	{/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }} />
