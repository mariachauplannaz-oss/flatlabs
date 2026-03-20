// ═══ app.js — Main entry point, connects all modules ═══

import { MANNEQUIN_CFG } from './config.js';
import { parseSVG } from './parser.js';
import { generate } from './generator.js';
import { initCategories, goStep, updateButton, buildStep1, initToggles, toggleSidebar, closeSidebar } from './ui.js';
import { downloadSVG, triggerDownload, handleEmailSubmit, skipEmail } from './download.js';

// ═══ STATE ═══
const state = {
    currentStep: 0,
    selectedCategory: null,
    currentMannequin: 'sty',
    svgData: null,
    selections: { torso: null, neck: null, sleeve: null },
    emailCaptured: false
};

const svgCache = {};

// ═══ LOGGER (console only, no UI) ═══
function log(m, t='info') {
    const prefix = t === 'ok' ? '✓' : t === 'err' ? '✗' : t === 'warn' ? '⚠' : 'ℹ';
    console.log(`[FlatLabs ${prefix}] ${m}`);
}

// ═══ LOAD SVG ═══
async function loadSVG() {
    const cfg = MANNEQUIN_CFG[state.currentMannequin];
    const file = cfg.file;

    if (svgCache[file]) {
        state.svgData = parseSVG(svgCache[file]);
        log(`Loaded ${state.currentMannequin} (cached): F=${Object.keys(state.svgData.front.torsos).length}T ${Object.keys(state.svgData.front.necks).length}N ${Object.keys(state.svgData.front.sleeves).length}S | B=${Object.keys(state.svgData.back.torsos).length}T`, 'ok');
        return;
    }

    try {
        const resp = await fetch(file);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const svgText = await resp.text();
        svgCache[file] = svgText;
        state.svgData = parseSVG(svgText);
        log(`Loaded ${state.currentMannequin}: F=${Object.keys(state.svgData.front.torsos).length}T ${Object.keys(state.svgData.front.necks).length}N ${Object.keys(state.svgData.front.sleeves).length}S | B=${Object.keys(state.svgData.back.torsos).length}T`, 'ok');
    } catch(err) {
        log(`Failed to load ${file}: ${err.message}`, 'err');
    }
}

// ═══ MANNEQUIN TOGGLE ═══
async function setMannequin(type) {
    state.currentMannequin = type;
    document.getElementById('btnSty').classList.toggle('active', type==='sty');
    document.getElementById('btnIso').classList.toggle('active', type==='iso');
    await loadSVG();
    if (state.currentStep === 1) buildStep1(state);
    if (document.querySelector('#svg-preview svg')) {
        generate(state, log);
    }
}

// ═══ NAVIGATION ═══
function doUpdateButton() { updateButton(state); }

function nextAction() {
    if (state.currentStep === 0) {
        goStep(1, state, doUpdateButton);
        buildStep1(state);
    } else {
        generate(state, log);
        if (window.innerWidth <= 800) closeSidebar();
    }
}

// ═══ DOWNLOAD WRAPPERS ═══
function doDownload() { downloadSVG(state, log); }
function doTriggerDownload() { triggerDownload(state, log); }
function doEmailSubmit(e) { handleEmailSubmit(e, state, doTriggerDownload); }
function doSkipEmail() { skipEmail(state, doTriggerDownload); }

// ═══ INIT ═══
async function init() {
    initCategories(state, doUpdateButton);
    initToggles();
    await loadSVG();
    goStep(0, state, doUpdateButton);
    
    // Event listeners (ES6 modules don't work with inline onclick)
    document.getElementById('burgerBtn')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebar);
    document.getElementById('mobileDownload')?.addEventListener('click', doDownload);
    document.getElementById('btnDownload')?.addEventListener('click', doDownload);
    document.getElementById('btnSty')?.addEventListener('click', () => setMannequin('sty'));
    document.getElementById('btnIso')?.addEventListener('click', () => setMannequin('iso'));
    document.getElementById('btnBack')?.addEventListener('click', () => goStep(0, state, doUpdateButton));
    document.getElementById('btnNext')?.addEventListener('click', nextAction);
    
    // Modal listeners
    document.getElementById('leadForm')?.addEventListener('submit', doEmailSubmit);
    document.getElementById('btnSkipEmail')?.addEventListener('click', doSkipEmail);
    document.getElementById('btnCloseEmailModal')?.addEventListener('click', () => {
        document.getElementById('emailModal').classList.remove('show');
    });
    document.getElementById('btnCloseProModal')?.addEventListener('click', () => {
        document.getElementById('proModal').classList.remove('show');
    });

    // Email input focus/blur styles
    const emailInput = document.getElementById('emailInput');
    emailInput?.addEventListener('focus', function() { this.style.borderColor = 'var(--accent)'; });
    emailInput?.addEventListener('blur', function() { this.style.borderColor = 'var(--gray3)'; });

    // Skip email hover
    const btnSkip = document.getElementById('btnSkipEmail');
    btnSkip?.addEventListener('mouseover', function() { this.style.opacity = '1'; });
    btnSkip?.addEventListener('mouseout', function() { this.style.opacity = '.6'; });
}

init();
