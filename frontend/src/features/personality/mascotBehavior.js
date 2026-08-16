export const MASCOT_ROUTES = [/^\/home\/?$/, /^\/products\/?$/, /^\/products\/[^/]+\/?$/, /^\/cart\/?$/, /^\/login\/?$/, /^\/checkout\/?$/];
export const IDLE_STATES = ["idle", "sit", "sleep", "curious"];
export const mascotKindsForMode = (mode) => mode === "both" ? ["cat", "dog"] : [mode];
export const supportsMascotRoute = (pathname) => MASCOT_ROUTES.some((pattern) => pattern.test(pathname));
export const randomItem = (items, random = Math.random) => items[Math.floor(random() * items.length)];
export const randomWait = (minimum, spread, random = Math.random) => minimum + Math.floor(random() * spread);
export const isPerchableRect = (rect, viewportHeight) => rect.width > 100 && rect.top > 82 && rect.top < viewportHeight - 105 && rect.bottom > 120;
