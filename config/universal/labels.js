// ═══ labels.js — Care and brand label types ═══

export const CARE_LABELS = {
    woven: {
        label:        'Woven Care Label',
        construction: 'Sewn into side seam, symbols per EN ISO 3758',
        cost_tier:    'standard'
    },
    printed: {
        label:        'Printed Care Label (tagless)',
        construction: 'Heat-printed directly on garment, inside back neck',
        cost_tier:    'low'
    },
    heat_transfer: {
        label:        'Heat Transfer Care Label',
        construction: 'Heat-pressed label, smooth feel against skin',
        cost_tier:    'standard'
    },
    satin: {
        label:        'Satin Care Label',
        construction: 'Soft satin tape, sewn into side seam',
        cost_tier:    'premium'
    }
};

export const BRAND_LABELS = {
    woven: {
        label:        'Woven Brand Label',
        construction: 'Loom-woven, sewn at neck or hem',
        cost_tier:    'standard'
    },
    heat_transfer: {
        label:        'Heat Transfer Brand Label',
        construction: 'Heat-pressed logo, no stitching needed',
        cost_tier:    'low'
    },
    embroidered: {
        label:        'Embroidered Brand Label',
        construction: 'Embroidered patch, stitched onto garment',
        cost_tier:    'premium'
    },
    printed: {
        label:        'Printed Brand Label (tagless)',
        construction: 'Direct print inside back neck',
        cost_tier:    'low'
    }
};
