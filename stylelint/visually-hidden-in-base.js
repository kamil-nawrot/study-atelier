import stylelint from 'stylelint';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions }
} = stylelint;

const ruleName = 'study-atelier/visually-hidden-in-base';

const messages = ruleMessages(ruleName, {
	rejected: (property) =>
		`"${property}" hides text for screen readers; use the visually-hidden class from base.css`
});

function hidesVisually(decl) {
	const property = decl.prop.toLowerCase();
	if (property === 'clip') return true;
	return property === 'clip-path' && /inset\(\s*50%\s*\)/i.test(decl.value);
}

const rule = (primary) => (root, result) => {
	if (!validateOptions(result, ruleName, { actual: primary })) return;

	root.walkDecls((decl) => {
		if (!hidesVisually(decl)) return;
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
