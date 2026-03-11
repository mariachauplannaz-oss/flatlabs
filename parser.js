// parser.js — Extrae paths de los maniquíes SVG

class SVGParser {
  constructor() {
    this.cache = new Map(); // SVGs parseados en caché
  }

  // ═══════════════════════════════════════════════════════
  // CARGA Y PARSEO
  // ═══════════════════════════════════════════════════════
  
  async loadAndParse(mannequinType) {
    if (this.cache.has(mannequinType)) {
      return this.cache.get(mannequinType);
    }

    const config = FLATLABS_CONFIG.mannequins[mannequinType];
    if (!config) throw new Error(`Unknown mannequin: ${mannequinType}`);

    try {
      const response = await fetch(config.file);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const svgText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      
      // Verificar errores de parseo
      const parseError = doc.querySelector('parsererror');
      if (parseError) throw new Error('SVG parse error');

      const parsed = {
        document: doc,
        viewBox: config.viewBox,
        groups: new Map() // caché de grupos extraídos
      };

      this.cache.set(mannequinType, parsed);
      return parsed;

    } catch (error) {
      console.error(`[Parser] Failed to load ${config.file}:`, error);
      // Retornar estructura vacía para no romper la app
      return { document: null, viewBox: config.viewBox, groups: new Map(), error: true };
    }
  }

  // ═══════════════════════════════════════════════════════
  // EXTRACCIÓN DE PIEZAS
  // ═══════════════════════════════════════════════════════

  // Extraer un grupo completo por selector CSS
  extractGroup(parsedDoc, selector) {
    if (!parsedDoc.document || parsedDoc.error) return null;
    
    // Cache check
    const cacheKey = selector;
    if (parsedDoc.groups.has(cacheKey)) {
      return parsedDoc.groups.get(cacheKey);
    }

    const element = parsedDoc.document.querySelector(selector);
    if (!element) {
      console.warn(`[Parser] Group not found: ${selector}`);
      return null;
    }

    // Extraer todos los paths relevantes
    const extractPaths = (el, filters = {}) => {
      const paths = [];
      
      // Si es path directo
      if (el.tagName === 'path') {
        paths.push(this.cleanPath(el, filters));
      }
      
      // Buscar paths hijos
      const children = el.querySelectorAll('path, line, polyline');
      children.forEach(child => {
        const pathData = this.elementToPath(child);
        if (pathData) paths.push(pathData);
      });

      return paths;
    };

    const result = {
      element: element,
      paths: extractPaths(element),
      outerHTML: element.outerHTML,
      // Extraer atributos de viewBox si existen
      viewBox: element.getAttribute('viewBox')
    };

    parsedDoc.groups.set(cacheKey, result);
    return result;
  }

  // Convertir cualquier elemento SVG a path string
  elementToPath(el) {
    const tag = el.tagName.toLowerCase();
    
    switch(tag) {
      case 'path':
        return {
          d: el.getAttribute('d'),
          fill: el.getAttribute('fill') || 'none',
          stroke: el.getAttribute('stroke') || 'currentColor',
          strokeWidth: el.getAttribute('stroke-width'),
          strokeDasharray: el.getAttribute('stroke-dasharray'),
          id: el.getAttribute('id')
        };
        
      case 'line':
        const x1 = el.getAttribute('x1');
        const y1 = el.getAttribute('y1');
        const x2 = el.getAttribute('x2');
        const y2 = el.getAttribute('y2');
        if (x1 && y1 && x2 && y2) {
          return {
            d: `M${x1},${y1}L${x2},${y2}`,
            fill: 'none',
            stroke: el.getAttribute('stroke') || 'currentColor',
            strokeWidth: el.getAttribute('stroke-width'),
            strokeDasharray: el.getAttribute('stroke-dasharray'),
            id: el.getAttribute('id')
          };
        }
        return null;
        
      case 'polyline':
        const points = el.getAttribute('points');
        if (points) {
          return {
            d: 'M' + points.trim().replace(/\s+/g, 'L'),
            fill: el.getAttribute('fill') || 'none',
            stroke: el.getAttribute('stroke') || 'currentColor',
            strokeWidth: el.getAttribute('stroke-width'),
            id: el.getAttribute('id')
          };
        }
        return null;
        
      default:
        return null;
    }
  }

  // Limpiar path para renderizado (fill white, stroke currentColor)
  cleanPath(pathEl, options = {}) {
    return {
      d: pathEl.getAttribute('d'),
      fill: options.fill !== undefined ? options.fill : 'white',
      stroke: options.stroke !== undefined ? options.stroke : 'currentColor',
      strokeWidth: pathEl.getAttribute('stroke-width') || '0.7',
      strokeDasharray: pathEl.getAttribute('stroke-dasharray'),
      id: pathEl.getAttribute('id')
    };
  }

  // ═══════════════════════════════════════════════════════
  // EXTRACCIÓN ESPECÍFICA POR TIPO DE PIEZA
  // ═══════════════════════════════════════════════════════

  // Extraer pieza según configuración
  async extractPiece(mannequinType, category, pieceType, pieceId, side = null) {
    const parsed = await this.loadAndParse(mannequinType);
    const config = FLATLABS_CONFIG.getPieceConfig(category, pieceType, pieceId);
    
    if (!config) {
      console.warn(`[Parser] No config for ${category}.${pieceType}.${pieceId}`);
      return null;
    }

    const selector = FLATLABS_CONFIG.getSelector(config, mannequinType, side);
    if (!selector) {
      console.warn(`[Parser] No selector for ${pieceId} in ${mannequinType}`);
      return null;
    }

    const group = this.extractGroup(parsed, selector);
    if (!group) return null;

    // Aplicar reglas de extracción específicas (outline, fill, seams)
    if (config.extract) {
      return this.extractWithRules(group, config.extract, parsed.document);
    }

    return group;
  }

  // Extraer con reglas específicas (outline, fill, seams)
  extractWithRules(group, rules, doc) {
    const result = {
      outline: null,
      inline: null,
      fill: null,
      seams: [],
      all: []
    };

    // Si hay reglas de selección CSS específicas
    if (rules.outline) {
      const el = group.element.querySelector(rules.outline);
      if (el) result.outline = this.elementToPath(el);
    }
    
    if (rules.inline) {
      const el = group.element.querySelector(rules.inline);
      if (el) result.inline = this.elementToPath(el);
    }
    
    if (rules.fill) {
      // Puede ser múltiple
      const els = group.element.querySelectorAll(rules.fill);
      if (els.length > 0) result.fill = this.elementToPath(els[0]);
    }
    
    if (rules.seams) {
      const els = group.element.querySelectorAll(rules.seams);
      els.forEach(el => {
        const path = this.elementToPath(el);
        if (path) result.seams.push(path);
      });
    }

    // Si no hay reglas específicas, devolver todo
    if (!result.outline && !result.fill) {
      result.all = group.paths;
    }

    return result;
  }

  // Extraer maniquí base (cuerpo fantasma)
  async extractMannequinBody(mannequinType) {
    const parsed = await this.loadAndParse(mannequinType);
    const config = FLATLABS_CONFIG.mannequins[mannequinType];
    
    const bodyParts = [];
    
    for (const selector of config.bodyGroups) {
      const group = this.extractGroup(parsed, selector);
      if (group) bodyParts.push(group.outerHTML);
    }

    return {
      html: bodyParts.join(''),
      viewBox: config.viewBox
    };
  }

  // Extraer puntos de anclaje (construction points)
  async extractAnchors(mannequinType) {
    const parsed = await this.loadAndParse(mannequinType);
    const config = FLATLABS_CONFIG.mannequins[mannequinType];
    
    const anchors = [];
    
    for (const selector of config.anchorGroups) {
      const group = this.extractGroup(parsed, selector);
      if (group) anchors.push(group.outerHTML);
    }

    return anchors.join('');
  }
}

// Instancia global
const svgParser = new SVGParser();
window.SVGParser = SVGParser;
window.svgParser = svgParser;