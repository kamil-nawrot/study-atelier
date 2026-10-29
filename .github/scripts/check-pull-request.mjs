import { execFileSync } from 'node:child_process';

const types = 'feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert';
const subject = new RegExp(`^(${types})(\\([a-z0-9-]+\\))?!?: (ATL-\\d+ - )?[^A-Z].*[^.]$`);
const issueTitle = new RegExp(`^(${types})(\\([a-z0-9-]+\\))?!?: ATL-(\\d+) - [^A-Z].*[^.]$`);
const version = '\\d+\\.\\d+\\.\\d+';
const releaseBranch = new RegExp(
	`^(release|hotfix)/${version}$|^chore/merge-main-after-release-${version}$`
);
const releaseTitle = new RegExp(
	`^chore\\(repo\\): (release ${version}|merge main into develop after release ${version})$`
);
const issueBranch = /^(feature|bugfix)\/atl-(\d+)-[a-z0-9]+(-[a-z0-9]+)*$/;

const { PR_TITLE: title = '', HEAD_REF: head = '', BASE_REF: base = '' } = process.env;
const problems = [];

function commitMessages() {
	const log = execFileSync(
		'git',
		['log', '--no-merges', '--format=%B%x00', `origin/${base}..HEAD`],
		{
			encoding: 'utf8'
		}
	);
	return log
		.split('\0')
		.map((message) => message.trim())
		.filter(Boolean);
}

function checkCommits() {
	for (const message of commitMessages()) {
		const [first] = message.split('\n');
		if (!subject.test(first)) {
			problems.push(
				`Commit "${first}" does not follow Conventional Commits (type(scope): description)`
			);
		}
	}
}

if (head === 'design/tokens') {
	process.exit(0);
} else if (releaseBranch.test(head)) {
	if (!releaseTitle.test(title)) {
		problems.push(
			`A release or merge-back pull request is titled "chore(repo): release x.y.z" or "chore(repo): merge main into develop after release x.y.z"`
		);
	}
} else {
	const branch = issueBranch.exec(head);
	const titled = issueTitle.exec(title);
	if (!branch) {
		problems.push(`Branch "${head}" is not feature/atl-<n>-<slug> or bugfix/atl-<n>-<slug>`);
	}
	if (!titled) {
		problems.push(`Title "${title}" is not "<type>(<scope>): ATL-<n> - <short description>"`);
	}
	if (branch && titled && branch[2] !== titled[3]) {
		problems.push(`The branch names ATL-${branch[2]} but the title names ATL-${titled[3]}`);
	}
	checkCommits();
}

if (problems.length > 0) {
	console.error(problems.join('\n'));
	console.error('\nSee docs/guidelines/git-workflow.md');
	process.exitCode = 1;
}
