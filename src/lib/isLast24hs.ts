'use client'

let last24h = false;

export function initFilter() {
    last24h = (localStorage.getItem('last24h') === 'true');
}

export function setLast24h(value:boolean) {
    last24h = Boolean(value);
    localStorage.setItem('last24h', last24h ? 'true' : 'false');
}

export function isLast24h() {
    return last24h;
}
