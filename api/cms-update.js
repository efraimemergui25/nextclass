import { Octokit } from '@octokit/rest';

const OWNER  = 'efraimemergui25';
const REPO   = 'nextclass';
const PATH   = 'src/data/cms-settings.json';
const BRANCH = 'main';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = req.headers['x-cms-secret'] || req.body?._secret;
    if (secret !== process.env.CMS_SECRET) return res.status(401).json({ error: 'Unauthorized' });

    const updates = { ...req.body };
    delete updates._secret;

    if (!updates || !Object.keys(updates).length) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        // Get current file + SHA
        const { data: file } = await octokit.repos.getContent({
            owner: OWNER, repo: REPO, path: PATH, ref: BRANCH,
        });

        const current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
        const merged  = { ...current, ...updates };

        await octokit.repos.createOrUpdateFileContents({
            owner: OWNER, repo: REPO, path: PATH, branch: BRANCH,
            message: `cms: update ${Object.keys(updates).slice(0, 5).join(', ')}`,
            content: Buffer.from(JSON.stringify(merged, null, 2) + '\n').toString('base64'),
            sha: file.sha,
        });

        res.status(200).json({ ok: true, updated: Object.keys(updates), deploying: true });
    } catch (err) {
        console.error('[cms-update]', err.message);
        res.status(500).json({ error: err.message });
    }
}
