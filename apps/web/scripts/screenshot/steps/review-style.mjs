import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'W jakim stylu powstało to dzieło?');
}
