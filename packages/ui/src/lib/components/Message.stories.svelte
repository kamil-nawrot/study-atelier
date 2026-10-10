<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Message from './Message.svelte';
	import { text } from '../../stories/snippets';

	const { Story } = defineMeta({
		title: 'Components/Message',
		component: Message,
		tags: ['autodocs'],
		argTypes: {
			tone: { control: 'select', options: ['danger', 'success', 'warning'] }
		}
	});
</script>

<Story
	name="Danger"
	args={{
		tone: 'danger',
		title: 'Could not sign in',
		children: text('Wrong email or password. Check both fields or reset your password.')
	}}
/>

<Story
	name="Success"
	args={{
		tone: 'success',
		title: 'Link sent',
		children: text('Open the link in the email to confirm your account.')
	}}
/>

<Story
	name="Warning"
	args={{
		tone: 'warning',
		children: text('The link has expired. Ask for a new one.')
	}}
/>
