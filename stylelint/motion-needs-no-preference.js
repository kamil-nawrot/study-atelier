import stylelint from 'stylelint';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions }
} = stylelint;

const ruleName = 'study-atelier/motion-needs-no-preference';

const messages = ruleMessages(ruleName, {
	rejected: (property) => `Put "${property}" inside @media (prefers-reduced-motion: no-preference)`
});

const motionProperty = /^(transition|animation)(-|$)/i;
const noPreference = /prefers-reduced-motion\s*:\s*no-preference/i;

const time = /^-?(\d*\.)?\d+m?s$/i;

function splitTopLevel(value) {
	const parts = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < value.length; i++) {
		if (value[i] === '(') depth++;
		else if (value[i] === ')') depth--;
		else if (value[i] === ',' && depth === 0) {
			parts.push(value.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(value.slice(start));
	return parts;
}

function movesNothing(value) {
	if (value.trim().toLowerCase() === 'none') return true;
	return splitTopLevel(value).every((part) => {
		const duration = part
			.trim()
			.split(/\s+/)
			.find((word) => time.test(word));
		return duration !== undefined && parseFloat(duration) === 0;
	});
}

function insideNoPreference(node) {
	for (let parent = node.parent; parent; parent = parent.parent) {
		if (parent.type === 'atrule' && parent.name.toLowerCase() === 'media') {
			if (noPreference.test(parent.params)) return true;
		}
	}
	return false;
}

const rule = (primary) => (root, result) => {
	if (!validateOptions(result, ruleName, { actual: primary })) return;

	root.walkDecls((decl) => {
		if (!motionProperty.test(decl.prop)) return;
		if (movesNothing(decl.value)) return;
		if (insideNoPreference(decl)) return;

		report({
			ruleName,
			result,
			node: decl,
			message: messages.rejected(decl.prop),
			word: decl.prop
		});
	});
};

rule.ruleName = ruleName;
rule.messages = messages;

export default createPlugin(ruleName, rule);
