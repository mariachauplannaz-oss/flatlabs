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

// SVG cache — loaded once, reused
const svgCache = {};

// ═══ LOGGER ═══
const logEl = document.getElementById('log');
function log(m, t='info') {
    logEl.style.display = 'block';
    const l = document.createElement('div');
    l.className = t;
    l.textContent = m;
    logEl.appendChild(l);
    logEl.scrollTop = logEl.scrollHeight;
}

// ═══ LOAD SVG (fetch external file) ═══
async function loadSVG() {
    const cfg = MANNEQUIN_CFG[state.currentMannequin];
    const file = cfg.file;

    if (svgCache[file]) {
        state.svgData = parseSVG(svgCache[file]);
        log(`Loaded ${state.currentMannequin} (cached): ${Object.keys(state.svgData.torsos).length}T ${Object.keys(state.svgData.necks).length}N ${Object.keys(state.svgData.sleeves).length}S`, 'ok');
        return;
    }

    try {
        const resp = await fetch(file);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const svgText = await resp.text();
        svgCache[file] = svgText;
        state.svgData = parseSVG(svgText);
        log(`Loaded ${state.currentMannequin}: ${Object.keys(state.svgData.torsos).length}T ${Object.keys(state.svgData.necks).length}N ${Object.keys(state.svgData.sleeves).length}S`, 'ok');
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
    // Re-generate if preview exists
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

// ═══ EXPOSE TO HTML ═══
// (These are called from onclick attributes in index.html)
window.setMannequin = setMannequin;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.downloadSVG = doDownload;
window.nextAction = nextAction;
window.goStep = (n) => goStep(n, state, doUpdateButton);
window.handleEmailSubmit = doEmailSubmit;
window.skipEmail = doSkipEmail;

// ═══ INIT ═══
async function init() {
    initCategories(state, doUpdateButton);
    initToggles();
    await loadSVG();
    goStep(0, state, doUpdateButton);
}

init();
