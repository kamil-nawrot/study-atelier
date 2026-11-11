import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'Jakie pojęcie opisuje ta definicja?');
}
