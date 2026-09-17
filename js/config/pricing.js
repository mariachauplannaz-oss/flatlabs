// Pricing model: Model 2 (separate SVG vs Tech Pack products)
// Each garment defines if SVG is free or paid, and if Tech Pack is available
// Tech Pack always includes the SVG by nature (PDF needs SVG to render)

export const GARMENT_PRICING = {
  tshirt: {
    enabled: true,
    svg: {
      free: true,
      product_key: null
    },
    techpack: {
      enabled: true,
      product_key: 'techpack_tshirt'
    }
  },
  pants: {
    enabled: false,
    svg: {
      free: false,
      product_key: 'svg_pants'
    },
    techpack: {
      enabled: false,
      product_key: 'techpack_pants'
    }
  },
  hoodie: {
    enabled: false,
    svg: {
      free: false,
      product_key: 'svg_hoodie'
    },
    techpack: {
      enabled: false,
      product_key: 'techpack_hoodie'
    }
  }
};

// Helper to get pricing config for a given garment + product type
export function getProductConfig(garment, type) {
  const garmentCfg = GARMENT_PRICING[garment];
  if (!garmentCfg || !garmentCfg.enabled) return null;

  const productCfg = garmentCfg[type];
  if (!productCfg) return null;
  if (type === 'techpack' && !productCfg.enabled) return null;

  return productCfg;
}
