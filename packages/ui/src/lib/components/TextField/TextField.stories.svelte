<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from '../Button/Button.svelte';
	import TextField from './TextField.svelte';

	const { Story } = defineMeta({
		title: 'Components/TextField',
		component: TextField,
		tags: ['autodocs'],
		args: { label: 'Email', type: 'email', autocomplete: 'email' },
		argTypes: {
			type: {
				control: 'select',
				options: ['text', 'email', 'password', 'search', 'url', 'tel']
			}
		}
	});
</script>

<Story name="Default" args={{ placeholder: 'name@example.com' }} />

<Story
	name="With hint"
	args={{
		label: 'Password',
		type: 'password',
		hint: 'At least 8 characters.',
		autocomplete: 'new-password'
	}}
/>

<Story
	name="With error"
	args={{
		value: 'name@example',
		error: 'Enter a full email address, for example name@example.com.'
	}}
/>

<Story
	name="Password"
	args={{
		label: 'Password',
		type: 'password',
		value: 'vermeer1665',
		autocomplete: 'current-password'
	}}
/>

<Story
	name="Hidden label"
	args={{ label: 'From', hideLabel: true, type: 'text', placeholder: 'From' }}
/>

<Story name="Disabled" args={{ value: 'name@example.com', disabled: true }} />

<Story
	name="With action"
	args={{ label: 'Image address', type: 'url', placeholder: 'https://…', autocomplete: 'off' }}
>
	{#snippet template(args)}
		<TextField {...args}>
			{#snippet action()}
				<Button>Use</Button>
			{/snippet}
		</TextField>
	{/snippet}
</Story>

<Story
	name="With action and error"
	args={{
		label: 'Image address',
		type: 'url',
		value: 'http://example.com/painting.jpg',
		error: 'Paste a full image address that starts with https://.',
		autocomplete: 'off'
	}}
>
	{#snippet template(args)}
		<TextField {...args}>
			{#snippet action()}
				<Button>Use</Button>
			{/snippet}
		</TextField>
	{/snippet}
</Story>
