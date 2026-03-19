// ═══ generator.js — SVG garment renderer (front + back) ═══

import { DICT, MANNEQUIN_CFG } from './config.js';
import { merge2 } from './pathUtils.js';

const NS = 'http://www.w3.org/2000/svg';

function mkEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
    return el;
}

function renderGarment(svgEl, components, selections, cfg, log, ghostMarkup) {
    const fill = document.getElementById('cFill').value;
    const showSeams = document.getElementById('togSeams').classList.contains('on');

    const sw = cfg.strokeWidth;
    const seamSw = cfg.seamStrokeWidth;
    const gA = { fill, stroke:'#1a1a1a', 'stroke-width':sw, 'stroke-linejoin':'round', 'stroke-linecap':'round' };
    const seamA = { fill:'none', stroke:'#1a1a1a', 'stroke-width':seamSw, 'stroke-linecap':'round' };

    // Ghost mannequin
    if (ghostMarkup) {
        const tmp = new DOMParser().parseFromString(
            '<svg xmlns="http://www.w3.org/2000/svg">' + ghostMarkup + '</svg>', 'image/svg+xml'
        );
        const ghost = mkEl('g', { opacity:'0.12', id:'layer-body' });
        Array.from(tmp.documentElement.childNodes).forEach(n => {
            ghost.appendChild(document.importNode(n, true));
        });
        svgEl.appendChild(ghost);
    }

    // Get components
    const torso = components.torsos[selections.torso || Object.keys(components.torsos)[0]];
    const neck = selections.neck && selections.neck !== 'none' ? components.necks[selections.neck] : null;
    const sleeve = selections.sleeve && selections.sleeve !== 'none' ? components.sleeves[selections.sleeve] : null;

    // MERGE torso + neck
    let merged = null;
    if (torso && torso.main && neck && neck.main) {
        log('Merging torso + neck...', 'info');
        merged = merge2(torso.main, neck.main, log);
    }

    if (merged) {
        svgEl.appendChild(mkEl('path', { d:merged, ...gA }));
        log('Merge OK', 'ok');
    } else if (torso && torso.main) {
        svgEl.appendChild(mkEl('path', { d:torso.main, ...gA }));
        if (neck && neck.main) svgEl.appendChild(mkEl('path', { d:neck.main, ...gA }));
        log('Rendered separate', 'warn');
    }

    // Neck fills
    if (neck && neck.fills) {
        neck.fills.forEach(d => {
            svgEl.appendChild(mkEl('path', { d, fill:'#939598', stroke:'#1a1a1a', 'stroke-width': String(parseFloat(sw)*0.3), 'stroke-linejoin':'bevel' }));
        });
    }

    // Sleeves (OVERLAY)
    if (sleeve) {
        log('Adding sleeves...', 'info');
        if (sleeve.main_l) svgEl.appendChild(mkEl('path', { d:sleeve.main_l, ...gA }));
        if (sleeve.main_r) svgEl.appendChild(mkEl('path', { d:sleeve.main_r, ...gA }));
        if (sleeve.borders) {
            sleeve.borders.forEach(d => {
                svgEl.appendChild(mkEl('path', { d, fill:'none', stroke:'#1a1a1a', 'stroke-width':sw, 'stroke-linecap':'round', 'stroke-linejoin':'round' }));
            });
        }
    }

    // Seams
    if (showSeams) {
        const allSeams = [...(torso?.seams||[]), ...(neck?.seams||[]), ...(sleeve?.seams||[])];
        allSeams.forEach(d => {
            svgEl.appendChild(mkEl('path', { d, ...seamA, 'stroke-dasharray': cfg.seamDash }));
        });
        if (allSeams.length) log('Seams: ' + allSeams.length, 'ok');
    }

    // Pockets (only if toggle exists and is on)
    const togPocket = document.getElementById('togPocket');
    if (togPocket && togPocket.classList.contains('on') && Object.keys(components.pockets).length) {
        const pkt = components.pockets[Object.keys(components.pockets)[0]];
        if (pkt && pkt.main) {
            svgEl.appendChild(mkEl('path', { d:pkt.main, fill:'none', stroke:'#1a1a1a', 'stroke-width':sw, 'stroke-linejoin':'round', 'stroke-linecap':'round' }));
            log('Pocket added', 'ok');
        }
    }
}

function addWatermark(svgEl, viewBox) {
    const vb = viewBox.split(' ').map(Number);
    const cx = vb[0] + vb[2]/2, cy = vb[1] + vb[3]/2;
    const wm = mkEl('g', { opacity:'0.12', 'pointer-events':'none', id:'layer-watermark' });
    for (let i = -2; i <= 2; i++) {
        const yOff = cy + i * (vb[3]*0.12);
        const t = mkEl('text', {
            x: String(cx), y: String(yOff),
            'text-anchor':'middle', 'font-size': String(vb[2]*0.09),
            'font-family':'-apple-system,sans-serif', 'font-weight':'800',
            fill:'#007AFF', transform: `rotate(-35 ${cx} ${yOff})`,
            'letter-spacing':'8'
        });
        t.textContent = 'FLATLABS PRO';
        wm.appendChild(t);
    }
    svgEl.appendChild(wm);
}

export function generate(state, log) {
    const { svgData, selections, currentMannequin } = state;
    const cfg = MANNEQUIN_CFG[currentMannequin];

    log('Generating...', 'info');

    const previewFront = document.getElementById('svg-preview');
    const previewBack = document.getElementById('svg-preview-back');
    previewFront.innerHTML = '';
    if (previewBack) previewBack.innerHTML = '';

    // Show/hide back canvas
    const backCard = document.getElementById('canvas-card-back');
    if (backCard) backCard.style.display = cfg.hasBack ? '' : 'none';

    // === FRONT ===
    const svgFront = document.createElementNS(NS, 'svg');
    svgFront.setAttribute('xmlns', NS);
    svgFront.setAttribute('viewBox', cfg.previewViewBox);
    svgFront.setAttribute('width', '100%');
    svgFront.setAttribute('height', '100%');

    renderGarment(svgFront, svgData.front, selections, cfg, log, svgData.mannequin);
    if (!cfg.free) addWatermark(svgFront, cfg.previewViewBox);

    previewFront.appendChild(svgFront);

    // === BACK (ISO only) ===
    if (cfg.hasBack && previewBack && svgData.back) {
        const hasBackComponents = Object.keys(svgData.back.torsos).length > 0;
        if (hasBackComponents) {
            const svgBack = document.createElementNS(NS, 'svg');
            svgBack.setAttribute('xmlns', NS);
            svgBack.setAttribute('viewBox', cfg.backViewBox);
            svgBack.setAttribute('width', '100%');
            svgBack.setAttribute('height', '100%');

            renderGarment(svgBack, svgData.back, selections, cfg, log, svgData.mannequinBack);
            if (!cfg.free) addWatermark(svgBack, cfg.backViewBox);

            previewBack.appendChild(svgBack);
            log('Back view rendered', 'ok');
        }
    }

    // Download buttons
    const canDownload = cfg.free;
    document.getElementById('btnDownload').style.display = canDownload ? '' : 'none';
    if (window.innerWidth <= 800) {
        const mDl = document.getElementById('mobileDownload');
        if (canDownload) mDl.classList.add('show');
        else mDl.classList.remove('show');
    }

    document.getElementById('topbarTitle').textContent = (DICT[selections.torso]||'T-Shirt') + ' \u2014 Generated';
    log('Done!', 'ok');
}
