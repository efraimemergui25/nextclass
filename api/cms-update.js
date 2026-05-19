import { Octokit } from '@octokit/rest';

const OWNER  = 'efraimemergui25';
const REPO   = 'nextclass';
const PATH   = 'src/data/cms-settings.json';
const BRANCH = 'main';

async function commitWithRetry(octokit, merged, message, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const { data: file } = await octokit.repos.getContent({
            owner: OWNER, repo: REPO, path: PATH, ref: BRANCH,
        });

        const current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
        const content = Buffer.from(
            JSON.stringify({ ...current, ...merged }, null, 2) + '\n'
        ).toString('base64');

        try {
            await octokit.repos.createOrUpdateFileContents({
                owner: OWNER, repo: REPO, path: PATH, branch: BRANCH,
                message, content, sha: file.sha,
            });
            return; // success
        } catch (err) {
            // 422 = SHA conflict (concurrent commit) — re-fetch SHA and retry
            if (attempt < retries && err.status === 422) continue;
            throw err;
        }
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = req.headers['x-cms-secret'] || req.body?._secret;
    if (!process.env.CMS_SECRET || secret !== process.env.CMS_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const updates = { ...req.body };
    delete updates._secret;

    if (!updates || !Object.keys(updates).length) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const keys = Object.keys(updates).slice(0, 5).join(', ');
        await commitWithRetry(octokit, updates, `cms: update ${keys}`);
        res.status(200).json({ ok: true, updated: Object.keys(updates) });
    } catch (err) {
        console.error('[cms-update]', err.status, err.message);
        res.status(500).json({ error: err.message });
    }
}
