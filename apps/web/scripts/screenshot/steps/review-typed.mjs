import { reachQuestion, typeTitle } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'Jak nazywa się to dzieło?');
	await typeTitle(page);
}
