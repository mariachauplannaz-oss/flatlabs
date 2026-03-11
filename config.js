// config.js — Mapeo de grupos SVG a piezas funcionales
// TÚ defines aquí qué grupo SVG es qué pieza

const FLATLABS_CONFIG = {
  version: '2.0',
  
  // ═══════════════════════════════════════════════════════
  // MANIQUÍES: Referencias a tus archivos
  // ═══════════════════════════════════════════════════════
  mannequins: {
    sty: {
      id: 'sty',
      name: 'Illustration 9-head',
      file: 'mannequins/sty.svg',
      viewBox: '0 0 400 800',
      // Qué grupos extraer para el ghost del cuerpo
      bodyGroups: ['#Mannequin_GRP'],
      anchorGroups: ['#construction_points']
    },
    iso: {
      id: 'iso',
      name: 'ISO EU38',
      file: 'mannequins/iso.svg',
      viewBox: '0 0 4535.4 4762.2',
      bodyGroups: ['#Mannequin_ISO_EU38_GRP'],
      anchorGroups: ['#construction_points'],
      status: 'pro'
    }
  },

  // ═══════════════════════════════════════════════════════
  // CATÁLOGO DE PIEZAS: Dónde encontrar cada pieza en el SVG
  // ═══════════════════════════════════════════════════════
  // Estructura: categoría > tipo > pieza > {maniquí: selectorSVG}
  
  catalog: {
    tshirt: {
      // TORSOS — grupos que contienen el cuerpo base
      torsos: {
        reg: {
          id: 'reg',
          name: 'Regular',
          selectors: {
            sty: '#f_top_ts_tor_reg_GRP #f_top_ts_tor_reg', // path específico
            iso: '#f_top_ts_tor_reg_GRP #f_top_ts_tor_reg'
          },
          // Puntos para merge con cuello (en coords del maniquí)
          anchorPoints: {
            neckLeft: { sty: {x: 149.73, y: 131.14}, iso: {x: 742.5, y: 793.3} },
            neckRight: { sty: {x: 250.22, y: 131.14}, iso: {x: 1527.3, y: 793.3} }
          },
          compatibleNecks: ['mok', 'v', 'rnd', 'scp']
        },
        slim: { id: 'slm', name: 'Slim', status: 'soon' },
        baggy: { id: 'bag', name: 'Baggy', status: 'soon' }
      },

      // CUELLOS
      necks: {
        mok: {
          id: 'mok',
          name: 'Mock Neck',
          selectors: {
            sty: '#f_top_ts_nck_mok_GRP',
            iso: '#f_top_ts_nck_mok_GRP'
          },
          // Qué paths extraer dentro del grupo
          extract: {
            outline: 'path[id*="outline"]',      // borde principal
            inline: 'path[id*="inline"]',        // línea interior
            fill: 'path[id*="inside"], path[fill="#939598"]', // relleno gris
            seams: 'path[class*="cls-8"], path[class*="cls-9"], path[stroke-dasharray]'
          },
          mergeMode: 'overlay', // 'overlay' | 'merge' | 'subtract'
          zIndex: 10
        },
        v: {
          id: 'v',
          name: 'V-Neck',
          selectors: { sty: '#f_top_ts_nck_v_GRP', iso: '#f_top_ts_nck_v_GRP' },
          status: 'soon'
        },
        rnd: {
          id: 'rnd',
          name: 'Round',
          selectors: { sty: '#f_top_ts_nck_rnd_GRP', iso: '#f_top_ts_nck_rnd_GRP' },
          status: 'soon'
        }
      },

      // MANGAS
      sleeves: {
        set: {
          id: 'set',
          name: 'Set-in',
          selectors: {
            sty: {
              left: '#f_top_ts_slv_set_l',
              right: '#f_top_ts_slv_set_r'
            },
            iso: {
              left: '#f_top_ts_slv_set_l',
              right: '#f_top_ts_slv_set_r'
            }
          },
          extract: {
            shape: 'path[id*="shape"]',    // fill blanco
            border: 'path[id*="border"]',  // línea exterior
            hem: 'path[id*="sem_cuf"], line[id*="sem_cuf"]' // dobladillo
          }
        },
        rag: { id: 'rag', name: 'Raglan', status: 'soon' },
        cap: { id: 'cap', name: 'Cap', status: 'soon' },
        long: { id: 'lon', name: 'Long', status: 'soon' }
      },

      // BOLSILLOS
      pockets: {
        chest: {
          id: 'chest',
          name: 'Chest Pocket',
          selectors: { sty: '#f_top_ts_pkt_chest_GRP', iso: '#f_top_ts_pkt_chest_GRP' },
          status: 'soon'
        }
      }
    },

    // Preparado para futuras categorías
    pants: { status: 'soon' },
    jacket: { status: 'soon' }
  },

  // ═══════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════
  
  // Obtener configuración de pieza (maneja "soon" y missing)
  getPieceConfig(category, type, pieceId) {
    const cat = this.catalog[category];
    if (!cat || cat.status === 'soon') return null;
    
    const group = cat[type + 's']; // torsos, necks, sleeves...
    if (!group) return null;
    
    const piece = group[pieceId];
    if (!piece || piece.status === 'soon') {
      console.warn(`[Config] ${category}.${type}.${pieceId} not available`);
      return null;
    }
    
    return piece;
  },

  // Selector SVG para maniquí específico
  getSelector(pieceConfig, mannequinType, side = null) {
    if (!pieceConfig) return null;
    const sel = pieceConfig.selectors?.[mannequinType];
    if (!sel) return null;
    return side ? sel[side] : sel;
  },

  // Todos los IDs de pieza disponibles para un tipo
  getAvailable(category, type) {
    const cat = this.catalog[category];
    if (!cat || cat.status === 'soon') return [];
    const group = cat[type + 's'];
    if (!group) return [];
    return Object.values(group).filter(p => p.status !== 'soon');
  }
};

// Exportar
window.FLATLABS_CONFIG = FLATLABS_CONFIG;
