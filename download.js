// ═══ parser.js — SVG auto-discovery parser ═══

export function parseSVG(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const root = doc.documentElement;
    const cleanId = id => id ? id.replace(/_x5F_/g, '_') : '';

    const data = {
        viewBox: root.getAttribute('viewBox') || '0 0 400 800',
        mannequin: null,
        anchors: null,
        torsos: {},
        necks: {},
        sleeves: {},
        pockets: {}
    };

    // Mannequin ghost — prefer body_front_grp for ISO (skip back body)
    const bodyFront = root.querySelector('[id="body_front_grp"]');
    const manGrp = root.querySelector('[id^="Mannequin_GRP"], [id^="Mannequin_x5F_GRP"], [id^="Mannequin_ISO"], [id^="Mannequin_STY"]');
    if (bodyFront) data.mannequin = new XMLSerializer().serializeToString(bodyFront);
    else if (manGrp) data.mannequin = new XMLSerializer().serializeToString(manGrp);

    // Construction points
    const cpGrp = root.querySelector('[id^="construction_points"], [id*="construction_x5F_points"]');
    if (cpGrp) data.anchors = new XMLSerializer().serializeToString(cpGrp);

    // Find the top garment group (f_top_ts_GRP)
    const topGrp = root.querySelector('[id="f_top_ts_GRP"], [id="f_x5F_top_x5F_ts_x5F_GRP"]');
    const searchRoot = topGrp || root;

    // Auto-discover all _GRP components
    searchRoot.querySelectorAll('g[id]').forEach(g => {
        const rawId = g.getAttribute('id');
        const id = cleanId(rawId);
        if (!id.endsWith('_GRP') || id === 'f_top_ts_GRP') return;

        const base = id.replace('_GRP', '');
        const parts = base.split('_');
        if (parts.length < 5) return;

        const [view, cat, type, component, variant] = parts;
        if (view !== 'f') return; // front only for now

        // Extract all shapes
        const extracted = { main: null, main_l: null, main_r: null, seams: [], fills: [], borders: [], shapes: [] };

        g.querySelectorAll('path, polyline, line').forEach(el => {
            const childRawId = el.getAttribute('id') || '';
            const childId = cleanId(childRawId);
            const d = el.getAttribute('d');

            let pathD = d;
            if (!pathD && el.tagName === 'line') {
                const x1 = el.getAttribute('x1'), y1 = el.getAttribute('y1');
                const x2 = el.getAttribute('x2'), y2 = el.getAttribute('y2');
                if (x1 && y1 && x2 && y2) pathD = `M${x1},${y1}L${x2},${y2}`;
            }
            if (!pathD && el.tagName === 'polyline') {
                const pts = el.getAttribute('points');
                if (pts) pathD = 'M' + pts.trim().replace(/\s+/g, 'L');
            }
            if (!pathD) return;

            // Classify by ID
            if (childId.includes('_sem_')) {
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

        // Store by component type
        if (component === 'tor') { data.torsos[variant] = extracted; }
        else if (component === 'nck') { data.necks[variant] = extracted; }
        else if (component === 'slv') { data.sleeves[variant] = extracted; }
        else if (component === 'pkt') { data.pockets[variant] = extracted; }
    });

    return data;
}
