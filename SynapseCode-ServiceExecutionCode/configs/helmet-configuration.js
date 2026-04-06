export const helmetConfiguration = {
    contentSecurityPolicy: { useDefaults: true },
    hsts: false,
    frameguard: { action: 'deny' },
    noSniff: true,
    hidePoweredBy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
};