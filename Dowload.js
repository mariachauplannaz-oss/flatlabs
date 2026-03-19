// ═══ download.js — SVG download & email capture logic ═══

import { MANNEQUIN_CFG } from './config.js';

export function downloadSVG(state, log) {
    const cfg = MANNEQUIN_CFG[state.currentMannequin];
    
    // If Pro mannequin, show Pro modal instead
    if (!cfg.free) {
        document.getElementById('proModal').classList.add('show');
        return;
    }
    
    // Check if email already captured
    if (state.emailCaptured || localStorage.getItem('fl_email_captured')) {
        triggerDownload(state, log);
        return;
    }
    
    // Show email modal
    document.getElementById('emailModal').classList.add('show');
}

export function triggerDownload(state, log) {
    const svgEl = document.querySelector('#svg-preview svg');
    if (!svgEl) {
        log('No SVG to download', 'err');
        return;
    }
    
    const cfg = MANNEQUIN_CFG[state.currentMannequin];
    
    // Clone and prepare for export
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('viewBox', cfg.exportViewBox);
    
    // Remove watermark if present
    const watermark = clone.querySelector('#layer-watermark');
    if (watermark) watermark.remove();
    
    // Serialize
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);
    
    // Add XML declaration
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    
    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `flatlabs-${state.selectedCategory || 'garment'}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log('SVG downloaded!', 'ok');
    
    // Close modal if open
    document.getElementById('emailModal').classList.remove('show');
}

export function handleEmailSubmit(event, state, triggerDownloadFn) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[name="email"]').value;
    
    if (!email || !email.includes('@')) {
        return;
    }
    
    // Submit to Netlify
    const formData = new FormData(form);
    
    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        state.emailCaptured = true;
        localStorage.setItem('fl_email_captured', 'true');
        triggerDownloadFn();
    })
    .catch(err => {
        console.error('Form submission error:', err);
        // Still allow download on error
        triggerDownloadFn();
    });
}

export function skipEmail(state, triggerDownloadFn) {
    state.emailCaptured = true;
    localStorage.setItem('fl_email_captured', 'true');
    triggerDownloadFn();
}