// renderer.js — Composición de piezas en SVG limpio

class FlatRenderer {
  constructor() {
    this.currentMannequin = 'sty';
    this.selections = {
      category: 'tshirt',
      torso: 'reg',
      neck: 'mok',
      sleeve: 'set',
      pocket: null,
      showSeams: true,
      showMannequin: true,
      showAnchors: false
    };
    this.color = '#1a1a1a';
  }

  // ═══════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════
  
  async render() {
    const container = document.getElementById('svg-preview');
    if (!container) return;

    // Limpiar
    container.innerHTML = '';
    
    // Crear SVG base
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '80 90 240 260');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.color = this.color; // currentColor hereda de aquí

    // 1. CAPA MANIQUÍ (opcional)
    if (this.selections.showMannequin) {
      const mannequinBody = await svgParser.extractMannequinBody(this.currentMannequin);
      if (mannequinBody.html) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('opacity', '0.12');
        g.setAttribute('class', 'mannequin-layer');
        g.innerHTML = mannequinBody.html;
        svg.appendChild(g);
      }
    }

    // 2. CAPA ANCLAJES (opcional, para debug)
    if (this.selections.showAnchors) {
      const anchors = await svgParser.extractAnchors(this.currentMannequin);
      if (anchors) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('opacity', '0.3');
        g.setAttribute('class', 'anchor-layer');
        g.innerHTML = anchors;
        svg.appendChild(g);
      }
    }

    // 3. CAPA PRENDA (composición modular)
    const garmentGroup = document.createElementNS(NS, 'g');
    garmentGroup.setAttribute('class', 'garment-layer');

    // Extraer y componer piezas
    const pieces = await this.composeGarment();
    
    for (const piece of pieces) {
      if (!piece) continue;
      
      const pathEl = document.createElementNS(NS, 'path');
      pathEl.setAttribute('d', piece.d);
      pathEl.setAttribute('fill', piece.fill || 'white');
      pathEl.setAttribute('stroke', piece.stroke || 'currentColor');
      pathEl.setAttribute('stroke-width', piece.strokeWidth || '0.7');
      pathEl.setAttribute('stroke-linejoin', 'round');
      pathEl.setAttribute('stroke-linecap', 'round');
      
      if (piece.strokeDasharray) {
        pathEl.setAttribute('stroke-dasharray', piece.strokeDasharray);
      }
      
      garmentGroup.appendChild(pathEl);
    }

    svg.appendChild(garmentGroup);
    container.appendChild(svg);

    return svg;
  }

  // ═══════════════════════════════════════════════════════
  // COMPOSICIÓN DE PIEZAS
  // ═══════════════════════════════════════════════════════

  async composeGarment() {
    const pieces = [];
    const cat = this.selections.category;
    const man = this.currentMannequin;

    // 1. TORSO (base)
    const torsoConfig = FLATLABS_CONFIG.getPieceConfig(cat, 'torso', this.selections.torso);
    if (torsoConfig) {
      const torsoData = await svgParser.extractPiece(man, cat, 'torso', this.selections.torso);
      if (torsoData) {
        // Si es un grupo simple, añadir todos los paths
        if (torsoData.all) {
          pieces.push(...torsoData.all.map(p => ({...p, fill: 'white', stroke: 'currentColor'})));
        }
        // Si tiene estructura específica
        if (torsoData.outline) {
          pieces.push({...torsoData.outline, fill: 'white', stroke: 'currentColor'});
        }
      }
    }

    // 2. CUELLO (overlay)
    const neckConfig = FLATLABS_CONFIG.getPieceConfig(cat, 'neck', this.selections.neck);
    if (neckConfig) {
      const neckData = await svgParser.extractPiece(man, cat, 'neck', this.selections.neck);
      if (neckData) {
        // Fill gris primero (si existe)
        if (neckData.fill) {
          pieces.push({...neckData.fill, fill: '#939598', stroke: 'none'});
        }
        // Outline
        if (neckData.outline) {
          pieces.push({...neckData.outline, fill: 'none', stroke: 'currentColor'});
        }
        // Inline (línea interior)
        if (neckData.inline) {
          pieces.push({...neckData.inline, fill: 'none', stroke: 'currentColor', strokeWidth: '0.35'});
        }
        // Seams
        if (this.selections.showSeams && neckData.seams) {
          neckData.seams.forEach(seam => {
            pieces.push({...seam, fill: 'none', stroke: 'currentColor', strokeWidth: '0.35', strokeDasharray: '1.5 1.5'});
          });
        }
      }
    }

    // 3. MANGAS
    const sleeveConfig = FLATLABS_CONFIG.getPieceConfig(cat, 'sleeve', this.selections.sleeve);
    if (sleeveConfig) {
      for (const side of ['left', 'right']) {
        const sleeveData = await svgParser.extractPiece(man, cat, 'sleeve', this.selections.sleeve, side);
        if (sleeveData && sleeveData.all) {
          // Shape (fill blanco, no stroke)
          const shape = sleeveData.all.find(p => p.id?.includes('shape'));
          if (shape) pieces.push({...shape, fill: 'white', stroke: 'none'});
          
          // Border (stroke sí)
          const border = sleeveData.all.find(p => p.id?.includes('border'));
          if (border) pieces.push({...border, fill: 'none', stroke: 'currentColor'});
          
          // Hem lines (dashed)
          const hems = sleeveData.all.filter(p => p.id?.includes('sem') || p.id?.includes('cuf'));
          hems.forEach(hem => {
            pieces.push({...hem, fill: 'none', stroke: 'currentColor', strokeWidth: '0.35', strokeDasharray: '1.5 1.5'});
          });
        }
      }
    }

    return pieces;
  }

  // ═══════════════════════════════════════════════════════
  // CONTROLES
  // ═══════════════════════════════════════════════════════

  setMannequin(type) {
    const config = FLATLABS_CONFIG.mannequins[type];
    if (config?.status === 'soon') {
      console.warn(`[Renderer] Mannequin ${type} not available`);
      return false;
    }
    this.currentMannequin = type;
    return this.render();
  }

  setSelection(type, value) {
    this.selections[type] = value;
    return this.render();
  }

  setColor(color) {
    this.color = color;
    const svg = document.querySelector('#svg-preview svg');
    if (svg) svg.style.color = color;
  }

  toggle(option) {
    this.selections[option] = !this.selections[option];
    return this.render();
  }
}

// Instancia global
const flatLabs = new FlatRenderer();
window.FlatRenderer = FlatRenderer;
window.flatLabs = flatLabs;