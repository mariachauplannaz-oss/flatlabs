// ═══ needles.js — Needle specifications ═══

export const NEEDLES = {
    ballpoint_70_10: {
        label:      'Ballpoint 70/10 SUK',
        size:       70,
        point_type: 'ballpoint',
        for_weight: { min: 80,  max: 180 },
        use:        'Light knits, jersey 150-180'
    },
    ballpoint_80_12: {
        label:      'Ballpoint 80/12 SUK',
        size:       80,
        point_type: 'ballpoint',
        for_weight: { min: 150, max: 240 },
        use:        'Standard knits, jersey 180-200'
    },
    ballpoint_90_14: {
        label:      'Ballpoint 90/14 SUK',
        size:       90,
        point_type: 'ballpoint',
        for_weight: { min: 200, max: 320 },
        use:        'Heavy knits, fleece, sweatshirt'
    },
    sharp_80_12: {
        label:      'Sharp 80/12',
        size:       80,
        point_type: 'sharp',
        for_weight: { min: 100, max: 220 },
        use:        'Wovens — shirting, light denim'
    },
    universal_80_12: {
        label:      'Universal 80/12',
        size:       80,
        point_type: 'universal',
        for_weight: { min: 100, max: 220 },
        use:        'General purpose'
    }
};
