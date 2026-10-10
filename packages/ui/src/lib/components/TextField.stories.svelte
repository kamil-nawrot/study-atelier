<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
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

<Story name="Disabled" args={{ value: 'name@example.com', disabled: true }} />
