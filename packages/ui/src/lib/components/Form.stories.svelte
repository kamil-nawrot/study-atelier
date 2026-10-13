<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from './Button.svelte';
	import Form from './Form.svelte';
	import TextField from './TextField.svelte';

	const { Story } = defineMeta({
		title: 'Components/Form',
		component: Form,
		tags: ['autodocs'],
		argTypes: { children: { control: false } }
	});
</script>

<script lang="ts">
	let email = $state('');
	let error = $state<string>();

	function submit(): void {
		error = email.includes('@') ? undefined : 'Enter a full email address.';
	}
</script>

<Story name="Focus on the first invalid field">
	{#snippet template()}
		<Form onsubmit={submit}>
			<TextField autocomplete="email" {error} label="Email" type="email" bind:value={email} />
			<Button type="submit" variant="primary">Send link</Button>
		</Form>
	{/snippet}
</Story>
