// ═══ infoPanel.js — Tooltip + Info Panel for glossary terms ═══

import { getTerm } from './glossary.js';

// ─── TOOLTIP ─────────────────────────────────────────────────
let tooltipEl = null;
let tooltipTimeout = null;

export function showTooltip(termKey, anchorEl) {
    const term = getTerm(termKey);
    if (!term) return;

    hideTooltip();

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'info-tooltip';
    tooltipEl.textContent = term.tooltip;
    document.body.appendChild(tooltipEl);

    const rect = anchorEl.getBoundingClientRect();
    const scrollY = window.scrollY || 0;
    const scrollX = window.scrollX || 0;

    tooltipEl.style.top  = (rect.bottom + scrollY + 6) + 'px';
    tooltipEl.style.left = (rect.left + scrollX) + 'px';

    // Clamp to viewport right edge
    requestAnimationFrame(() => {
        const tipRect = tooltipEl.getBoundingClientRect();
        if (tipRect.right > window.innerWidth - 12) {
            tooltipEl.style.left = (window.innerWidth - tipRect.width - 12) + 'px';
        }
    });
}

export function hideTooltip() {
    if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
    }
    clearTimeout(tooltipTimeout);
}

// ─── INFO PANEL ──────────────────────────────────────────────
let panelEl = null;

function buildPanel() {
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.className = 'info-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.innerHTML = `
        <div class="info-panel-handle"></div>
        <div class="info-panel-header">
            <div class="info-panel-title-wrap">
                <span class="info-panel-category"></span>
                <h3 class="info-panel-title"></h3>
            </div>
            <button class="info-panel-close" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="info-panel-body">
            <p class="info-panel-detail"></p>
            <div class="info-panel-production">
                <span class="info-panel-prod-label">Production spec</span>
                <span class="info-panel-prod-value"></span>
            </div>
            <a class="info-panel-link" href="#" target="_blank" rel="noopener">Learn more →</a>
        </div>
    `;

    panelEl.querySelector('.info-panel-close').addEventListener('click', closeInfoPanel);

    // Close on backdrop click (mobile)
    panelEl.addEventListener('click', (e) => {
        if (e.target === panelEl) closeInfoPanel();
    });

    document.body.appendChild(panelEl);
}

export function openInfoPanel(termKey) {
    const term = getTerm(termKey);
    if (!term) return;

    hideTooltip();
    buildPanel();

    panelEl.querySelector('.info-panel-category').textContent = term.category;
    panelEl.querySelector('.info-panel-title').textContent    = term.name;
    panelEl.querySelector('.info-panel-detail').textContent   = term.detail;
    panelEl.querySelector('.info-panel-prod-value').textContent = term.production;
    panelEl.querySelector('.info-panel-link').href = term.url;

    // Force reflow before adding open class for transition
    panelEl.offsetHeight;
    panelEl.classList.add('open');
}

export function closeInfoPanel() {
    if (!panelEl) return;
    panelEl.classList.remove('open');
}
