// ═══ parser.js — SVG auto-discovery parser ═══

export function parseSVG(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const root = doc.documentElement;
    const cleanId = id => id ? id.replace(/_x5F_/g, '_') : '';

    const data = {
        viewBox: root.getAttribute('viewBox') || '0 0 400 800',
        mannequin: null,
        front: { torsos:{}, necks:{}, sleeves:{}, pockets:{} },
        back:  { torsos:{}, necks:{}, sleeves:{}, pockets:{} }
    };

    // Mannequin ghost — prefer body_front_grp (skip back body + construction points)
    const bodyFront = root.querySelector('[id="body_front_grp"]');
    const manGrp = root.querySelector('[id^="Mannequin_GRP"], [id^="Mannequin_x5F_GRP"], [id^="Mannequin_ISO"], [id^="Mannequin_STY"]');

    if (bodyFront || manGrp) {
        const src = bodyFront || manGrp;
        // Clone and remove construction_points before serializing
        const clone = src.cloneNode(true);
        const cp = clone.querySelector('[id^="construction_points"], [id*="construction_x5F_points"]');
        if (cp) cp.remove();
        data.mannequin = new XMLSerializer().serializeToString(clone);
    }

    // Back body ghost (for ISO dual canvas)
    const bodyBack = root.querySelector('[id="body_back_grp"]');
    if (bodyBack) {
        const clone = bodyBack.cloneNode(true);
        const cp = clone.querySelector('[id^="construction_points"], [id*="construction_x5F_points"]');
        if (cp) cp.remove();
        data.mannequinBack = new XMLSerializer().serializeToString(clone);
    }

    // Parse garments for both views
    parseView('f', root, data.front);
    parseView('b', root, data.back);

    // Legacy aliases so generator can use data.torsos etc (= front)
    data.torsos = data.front.torsos;
    data.necks = data.front.necks;
    data.sleeves = data.front.sleeves;
    data.pockets = data.front.pockets;

    return data;
}

function parseView(viewPrefix, root, store) {
    const cleanId = id => id ? id.replace(/_x5F_/g, '_') : '';

    // Find the garment group for this view
    const grpId = `${viewPrefix}_top_ts_GRP`;
    const topGrp = root.querySelector(`[id="${grpId}"], [id="${grpId.replace(/_/g, '_x5F_')}"]`);
    const searchRoot = topGrp || root;

    // Auto-discover _GRP components
    searchRoot.querySelectorAll('g[id]').forEach(g => {
        const rawId = g.getAttribute('id');
        const id = cleanId(rawId);
        if (!id.endsWith('_GRP') || id === grpId) return;

        const base = id.replace('_GRP', '');
        const parts = base.split('_');
        if (parts.length < 5) return;

        const [view, cat, type, component, variant] = parts;
        if (view !== viewPrefix) return;

        const extracted = extractFromGroup(g, cleanId);

        if (component === 'tor') store.torsos[variant] = extracted;
        else if (component === 'nck') store.necks[variant] = extracted;
        else if (component === 'slv') store.sleeves[variant] = extracted;
        else if (component === 'pkt') store.pockets[variant] = extracted;
    });

    // Fallback: discover sleeves without _GRP wrapper
    // Look for direct child groups like f_top_ts_slv_set_l / f_top_ts_slv_set_r
    if (Object.keys(store.sleeves).length === 0 && topGrp) {
        // Find sleeve groups by pattern: {view}_top_ts_slv_{variant}_{side}
        const slvGroups = {};
        topGrp.querySelectorAll('g[id]').forEach(g => {
            const id = cleanId(g.getAttribute('id'));
            // Match pattern like f_top_ts_slv_set_l or f_top_ts_slv_set_r
            const match = id.match(new RegExp(`^${viewPrefix}_top_ts_slv_(\\w+)_([lr])$`));
            if (!match) return;
            const variant = match[1];
            if (!slvGroups[variant]) {
                slvGroups[variant] = { main:null, main_l:null, main_r:null, seams:[], fills:[], borders:[], shapes:[] };
            }
            const side = match[2];
            // Extract paths from this side group
            g.querySelectorAll('path, polyline, line').forEach(el => {
                const childId = cleanId(el.getAttribute('id') || '');
                const pathD = getPathD(el);
                if (!pathD) return;

                if (childId.includes('_sem_')) {
                    slvGroups[variant].seams.push(pathD);
                } else if (childId.includes('_border_') || childId.includes('_border_')) {
                    slvGroups[variant].borders.push(pathD);
                } else if (childId.includes('_shape_')) {
                    if (side === 'l') slvGroups[variant].main_l = pathD;
                    else slvGroups[variant].main_r = pathD;
                } else if (pathD && !childId.includes('_sem_')) {
                    // Fallback: first non-seam path with _l/_r is the main shape
                    if (childId.endsWith('_l') || side === 'l') {
                        if (!slvGroups[variant].main_l) slvGroups[variant].main_l = pathD;
                    } else if (childId.endsWith('_r') || side === 'r') {
                        if (!slvGroups[variant].main_r) slvGroups[variant].main_r = pathD;
                    }
                }
            });
        });
        Object.assign(store.sleeves, slvGroups);
    }
}

function extractFromGroup(g, cleanId) {
    const extracted = { main:null, main_l:null, main_r:null, seams:[], fills:[], borders:[], shapes:[] };
 
    g.querySelectorAll('path, polyline, line').forEach(el => {
        const childId = cleanId(el.getAttribute('id') || '');
        const pathD = getPathD(el);
        if (!pathD) return;
 
        // If element has no ID, check if parent group ID contains _sem_
        if (!childId) {
            const parentId = cleanId(el.parentElement?.getAttribute('id') || el.parentElement?.parentElement?.getAttribute('id') || '');
            if (parentId.includes('_sem_')) {
                extracted.seams.push(pathD);
            }
            return;
        }
 
        if (childId.includes('_sem_') || childId.match(/_sem$/)) {
            extracted.seams.push(pathD);
        } else if (childId.includes('_fil') || childId.includes('_inside')) {
            extracted.fills.push(pathD);
        } else if (childId.includes('_border_')) {
            extracted.borders.push(pathD);
        } else if (childId.includes('_shape_')) {
            if (childId.endsWith('_l')) extracted.main_l = pathD;
            else if (childId.endsWith('_r')) extracted.main_r = pathD;
            else extracted.shapes.push(pathD);
        } else if (childId.includes('_inline') || childId.includes('_outline')) {
            if (childId.includes('_outline')) extracted.main = pathD;
            else extracted.seams.push(pathD);
        } else if (pathD) {
            if (childId.endsWith('_l')) extracted.main_l = pathD;
            else if (childId.endsWith('_r')) extracted.main_r = pathD;
            else if (!extracted.main) extracted.main = pathD;
            else extracted.shapes.push(pathD);
        }
    });
 
    return extracted;
}

function getPathD(el) {
    const d = el.getAttribute('d');
    if (d) return d;
    if (el.tagName === 'line') {
        const x1 = el.getAttribute('x1'), y1 = el.getAttribute('y1');
        const x2 = el.getAttribute('x2'), y2 = el.getAttribute('y2');
        if (x1 && y1 && x2 && y2) return `M${x1},${y1}L${x2},${y2}`;
    }
    if (el.tagName === 'polyline') {
        const pts = el.getAttribute('points');
        if (pts) return 'M' + pts.trim().replace(/\s+/g, 'L');
    }
    return null;
}
