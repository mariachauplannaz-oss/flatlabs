// ═══ ui.js — Navigation, steps, toggles, component builder ═══

import { DICT, GARMENT_ICONS, CATEGORIES } from './config.js';

export function initCategories(state, updateButton) {
    const grid = document.getElementById('catGrid');
    CATEGORIES.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'cat-card' + (cat.disabled ? ' disabled' : '');
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-label', cat.label + (cat.disabled ? ' - Coming soon' : ''));
        card.innerHTML = '<div class="cat-icon">' + GARMENT_ICONS[cat.icon] + '</div><div class="cat-label">' + cat.label + '</div>';
        if (!cat.disabled) {
            card.onclick = () => {
                grid.querySelectorAll('.cat-card').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked','false'); });
                card.classList.add('selected');
                card.setAttribute('aria-checked','true');
                state.selectedCategory = cat.id;
                state.selections = { torso:null, neck:null, sleeve:null };
                updateButton();
            };
        }
        grid.appendChild(card);
    });
}

export function goStep(n, state, updateButton) {
    state.currentStep = n;
    document.getElementById('stepsTrack').style.transform = 'translateX(-' + (n*50) + '%)';
    document.querySelectorAll('.step-dot').forEach((d,i) => {
        d.className = 'step-dot' + (i<n?' done':i===n?' active':'');
    });
    document.getElementById('btnBack').style.display = n>0 ? '' : 'none';
    updateButton();
}

export function updateButton(state) {
    const btn = document.getElementById('btnNext');
    if (state.currentStep === 0) { btn.textContent = 'Next'; btn.disabled = !state.selectedCategory; }
    else { btn.textContent = 'Generate'; btn.disabled = false; }
}

export function buildStep1(state) {
    const { svgData, selections } = state;
    const container = document.getElementById('componentsContainer');
    container.innerHTML = '';

    function buildOptions(label, dataObj, selKey, allowNone) {
        if (Object.keys(dataObj).length === 0) return;
        const sec = document.createElement('div');
        sec.innerHTML = '<div class="sec-label">' + label + '</div>';
        const scroll = document.createElement('div');
        scroll.className = 'opt-scroll';
        scroll.setAttribute('role', 'radiogroup');
        scroll.setAttribute('aria-label', label);

        if (allowNone) {
            const none = document.createElement('div');
            none.className = 'opt-card none-card' + (selections[selKey]==='none'?' selected':'');
            none.setAttribute('role','radio');
            none.innerHTML = '<div class="opt-preview">\u2014</div><div class="opt-name">None</div>';
            none.onclick = () => {
                selections[selKey] = 'none';
                scroll.querySelectorAll('.opt-card').forEach(o=>o.classList.remove('selected'));
                none.classList.add('selected');
            };
            scroll.appendChild(none);
        }

        Object.keys(dataObj).forEach((key, idx) => {
            const opt = document.createElement('div');
            const isSelected = selections[selKey]===key || (!selections[selKey] && idx===0 && !allowNone);
            if (isSelected) selections[selKey] = key;
            opt.className = 'opt-card' + (isSelected?' selected':'');
            opt.setAttribute('role','radio');
            opt.setAttribute('aria-label', DICT[key]||key);
            opt.innerHTML = '<div class="opt-preview" style="font-size:12px;font-weight:700">' + (key.slice(0,3).toUpperCase()) + '</div><div class="opt-name">' + (DICT[key]||key) + '</div>';
            opt.onclick = () => {
                selections[selKey] = key;
                scroll.querySelectorAll('.opt-card').forEach(o=>o.classList.remove('selected'));
                opt.classList.add('selected');
            };
            scroll.appendChild(opt);
        });

        sec.appendChild(scroll);
        container.appendChild(sec);
    }

    buildOptions('Torso', svgData.torsos, 'torso', false);
    buildOptions('Neckline', svgData.necks, 'neck', false);
    buildOptions('Sleeves', svgData.sleeves, 'sleeve', true);
}

export function initToggles() {
    document.getElementById('togSeams').onclick = function() {
        this.classList.toggle('on');
        this.setAttribute('aria-checked', this.classList.contains('on'));
    };
    document.getElementById('togPocket').onclick = function() {
        this.classList.toggle('on');
        this.setAttribute('aria-checked', this.classList.contains('on'));
    };
    document.getElementById('cFill').oninput = function() {
        document.getElementById('hFill').textContent = this.value;
    };
}

export function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarBackdrop').classList.toggle('show');
}

export function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarBackdrop').classList.remove('show');
}
