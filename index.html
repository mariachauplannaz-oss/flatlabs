// ═══ download.js — Download, lead capture, watermark removal ═══

import { MANNEQUIN_CFG } from './config.js';

export function downloadSVG(state, log) {
    if (!MANNEQUIN_CFG[state.currentMannequin].free) {
        document.getElementById('proModal').classList.add('show');
        return;
    }
    if (!state.emailCaptured) {
        document.getElementById('emailModal').classList.add('show');
        return;
    }
    triggerDownload(state, log);
}

export function triggerDownload(state, log) {
    const svg = document.querySelector('#svg-preview svg');
    if (!svg) return;
    const clone = svg.cloneNode(true);

    // Remove ghost body from export
    const bodyLayer = clone.querySelector('#layer-body');
    if (bodyLayer) bodyLayer.remove();

    // Remove watermark from export
    const wmLayer = clone.querySelector('#layer-watermark');
    if (wmLayer) wmLayer.remove();

    // Use export viewBox (cropped to garment)
    const cfg = MANNEQUIN_CFG[state.currentMannequin];
    clone.setAttribute('viewBox', cfg.exportViewBox);

    const s = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    const b = new Blob([s], {type:'image/svg+xml'});
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'flatlabs_' + (state.selectedCategory||'garment') + '_' + state.currentMannequin + '_' + Date.now() + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
    log('Downloaded: ' + a.download, 'ok');
}

export function handleEmailSubmit(e, state, triggerDl) {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetch('/', {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams(formData).toString()
    }).then(() => {
        state.emailCaptured = true;
        document.getElementById('emailModal').classList.remove('show');
        triggerDl();
    }).catch(() => {
        state.emailCaptured = true;
        document.getElementById('emailModal').classList.remove('show');
        triggerDl();
    });
}

export function skipEmail(state, triggerDl) {
    state.emailCaptured = true;
    document.getElementById('emailModal').classList.remove('show');
    triggerDl();
}
