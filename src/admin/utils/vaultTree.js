// ─────────────────────────────────────────────────────────────────────────────
// Vault folder-tree helpers — unlimited nesting via a `parentId` field.
// System folders are roots (parentId == null). Custom folders may nest under
// any folder (system or custom). Pure functions, no Firestore here.
// ─────────────────────────────────────────────────────────────────────────────

// Build a nested tree (roots with .children[]) from a flat folder list.
// `orderMap` (folderId → index) overrides the default order for reordered folders.
export function buildFolderTree(folders, orderMap = {}) {
    const byId = new Map(folders.map(f => [f.id, { ...f, children: [] }]));
    const roots = [];
    for (const node of byId.values()) {
        const pid = node.parentId || null;
        if (pid && byId.has(pid)) byId.get(pid).children.push(node);
        else roots.push(node);
    }
    // default: system folders (order 0-4) first, custom (order = big timestamp) after
    const eff = (f) => (orderMap[f.id] ?? (f.order ?? 0));
    const sortRec = (nodes) => {
        nodes.sort((a, b) => eff(a) - eff(b) || String(a.name).localeCompare(String(b.name), 'he'));
        nodes.forEach(n => sortRec(n.children));
        return nodes;
    };
    return sortRec(roots);
}

// Breadcrumb path (root → … → folder) for a given id.
export function getFolderPath(folders, id) {
    const byId = new Map(folders.map(f => [f.id, f]));
    const path = [];
    let cur = byId.get(id);
    let guard = 0;
    while (cur && guard++ < 100) {
        path.unshift(cur);
        cur = cur.parentId ? byId.get(cur.parentId) : null;
    }
    return path;
}

// All descendant folder ids of `id` (not including `id`).
export function getDescendantIds(folders, id) {
    const childrenOf = new Map();
    for (const f of folders) {
        const pid = f.parentId || null;
        if (!childrenOf.has(pid)) childrenOf.set(pid, []);
        childrenOf.get(pid).push(f.id);
    }
    const out = [];
    const stack = [...(childrenOf.get(id) || [])];
    let guard = 0;
    while (stack.length && guard++ < 10000) {
        const cur = stack.pop();
        out.push(cur);
        stack.push(...(childrenOf.get(cur) || []));
    }
    return out;
}

// Direct children of a folder id (id=null → roots).
export function getChildFolders(folders, id) {
    return folders.filter(f => (f.parentId || null) === (id || null));
}

// Would moving `folderId` under `targetId` create a cycle (or be a no-op)?
export function isInvalidMove(folders, folderId, targetId) {
    if (!folderId || folderId === targetId) return true;
    if (!targetId) return false; // moving to root is always fine
    if (getDescendantIds(folders, folderId).includes(targetId)) return true; // into own descendant
    const target = folders.find(f => f.id === targetId);
    if (target && (target.parentId || null) === folderId) { /* already child—still allow re-affirm */ }
    return false;
}
