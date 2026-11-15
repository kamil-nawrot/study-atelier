import { reachQuestion } from './review-until.mjs';

const QUESTIONS = /^(Do jakiego dzieła|Które dzieło|Kopią|Częścią|Kto był)/;

export default async function (page) {
	await reachQuestion(page, QUESTIONS);
}
