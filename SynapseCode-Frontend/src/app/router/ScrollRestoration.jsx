import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const keyFor = (location) => `scroll:${location.pathname}${location.search}${location.hash}`;

const wasReload = () => {
    const [navigation] = performance.getEntriesByType("navigation");
    return navigation?.type === "reload";
};

export const ScrollRestoration = () => {
    const location = useLocation();

    useEffect(() => {
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }
    }, []);

    useEffect(() => {
        const storageKey = keyFor(location);
        let frameId;

        if (wasReload()) {
            const savedPosition = Number(sessionStorage.getItem(storageKey) || 0);
            frameId = window.requestAnimationFrame(() => {
                window.scrollTo({ top: savedPosition, left: 0, behavior: "auto" });
            });
        }

        const savePosition = () => {
            sessionStorage.setItem(storageKey, String(window.scrollY));
        };

        window.addEventListener("pagehide", savePosition);
        window.addEventListener("beforeunload", savePosition);

        return () => {
            savePosition();
            window.removeEventListener("pagehide", savePosition);
            window.removeEventListener("beforeunload", savePosition);
            if (frameId) window.cancelAnimationFrame(frameId);
        };
    }, [location]);

    return null;
};
