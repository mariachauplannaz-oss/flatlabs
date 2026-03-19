// ═══ pathUtils.js — SVG path endpoint extraction & merge ═══

export function getEndpoints(d) {
    if (!d) return null;
    const tokens = d.match(/[MmCcSsLlHhVvQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g);
    if (!tokens) return null;
    let x=0, y=0, sx=0, sy=0, cmd=null, i=0;
    const n = t => parseFloat(t);
    while (i < tokens.length) {
        const t = tokens[i];
        if (/^[A-Za-z]$/.test(t)) { cmd=t; i++; continue; }
        switch(cmd) {
            case 'M': x=n(tokens[i]);y=n(tokens[i+1]);sx=x;sy=y;i+=2;cmd='L'; break;
            case 'm': x+=n(tokens[i]);y+=n(tokens[i+1]);sx=x;sy=y;i+=2;cmd='l'; break;
            case 'c': x+=n(tokens[i+4]);y+=n(tokens[i+5]);i+=6; break;
            case 'C': x=n(tokens[i+4]);y=n(tokens[i+5]);i+=6; break;
            case 's': x+=n(tokens[i+2]);y+=n(tokens[i+3]);i+=4; break;
            case 'S': x=n(tokens[i+2]);y=n(tokens[i+3]);i+=4; break;
            case 'l': x+=n(tokens[i]);y+=n(tokens[i+1]);i+=2; break;
            case 'L': x=n(tokens[i]);y=n(tokens[i+1]);i+=2; break;
            case 'h': x+=n(tokens[i]);i++; break;
            case 'H': x=n(tokens[i]);i++; break;
            case 'v': y+=n(tokens[i]);i++; break;
            case 'V': y=n(tokens[i]);i++; break;
            case 'Q': x=n(tokens[i+2]);y=n(tokens[i+3]);i+=4; break;
            case 'q': x+=n(tokens[i+2]);y+=n(tokens[i+3]);i+=4; break;
            case 'T': x=n(tokens[i]);y=n(tokens[i+1]);i+=2; break;
            case 't': x+=n(tokens[i]);y+=n(tokens[i+1]);i+=2; break;
            case 'A': x=n(tokens[i+5]);y=n(tokens[i+6]);i+=7; break;
            case 'a': x+=n(tokens[i+5]);y+=n(tokens[i+6]);i+=7; break;
            case 'Z': case 'z': x=sx;y=sy; break;
            default: i++;
        }
    }
    return { start:{x:sx,y:sy}, end:{x,y} };
}

export function stripM(d) {
    return d.replace(/^M[^A-DF-Za-df-z]*/, '').replace(/Z\s*$/i, '').trim();
}

export function merge2(torsoD, neckD, log) {
    const TOL = 5;
    const near = (a,b) => Math.abs(a.x-b.x)<TOL && Math.abs(a.y-b.y)<TOL;
    const tE = getEndpoints(torsoD);
    const nE = getEndpoints(neckD);
    if (!tE || !nE) { log('Missing endpoints', 'err'); return null; }

    log(`  TOR: (${tE.start.x.toFixed(1)},${tE.start.y.toFixed(1)})\u2192(${tE.end.x.toFixed(1)},${tE.end.y.toFixed(1)})`, 'info');
    log(`  NCK: (${nE.start.x.toFixed(1)},${nE.start.y.toFixed(1)})\u2192(${nE.end.x.toFixed(1)},${nE.end.y.toFixed(1)})`, 'info');

    if (near(tE.end, nE.start) && near(nE.end, tE.start)) {
        log('  Circuit: Torso\u2192Neck\u2192Z', 'ok');
        return torsoD.replace(/Z\s*$/i,'').trim() + ' ' + stripM(neckD) + ' Z';
    }
    if (near(tE.start, nE.end) && near(nE.start, tE.end)) {
        log('  Circuit: Neck\u2192Torso\u2192Z', 'ok');
        return neckD.replace(/Z\s*$/i,'').trim() + ' ' + stripM(torsoD) + ' Z';
    }
    log('  Endpoints don\u2019t match \u2014 rendering separate', 'warn');
    return null;
}
