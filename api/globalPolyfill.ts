// Polyfill global for edge functions
declare global {
    var global: any;
}

if (typeof global === 'undefined') {
    (globalThis as any).global = globalThis;
}

export { };