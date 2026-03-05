(function() {
    'use strict';

    const STYLE_ID = 'notion-clean-page-controls-style';
    const TARGET_PAGE_ID = '319503c7791d803a8917c3dfcf9c97af';

    const CSS = `
        .layout.layout-wide {
            --margin-width: 60px !important;
        }
        .notion-page-controls {
            padding-top: 30px !important;
        }
        .notion-page-controls > div[role="button"],
        .notion-page-controls > [data-popup-origin] {
            display: none !important;
        }
        .notion-record-icon[aria-label*="page icon"] {
            display: none !important;
        }
    `;

    function isTargetPage() {
        return location.pathname.includes(TARGET_PAGE_ID);
    }

    function inject() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function remove() {
        const el = document.getElementById(STYLE_ID);
        if (el) el.remove();
    }

    function sync() {
        if (isTargetPage()) {
            inject();
        } else {
            remove();
        }
    }

    function startUrlWatcher() {
        let lastPath = location.pathname;
        const observer = new MutationObserver(() => {
            if (location.pathname !== lastPath) {
                lastPath = location.pathname;
                sync();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('popstate', sync);
    }

    function onReady() {
        sync();
        startUrlWatcher();
    }

    if (document.body) {
        onReady();
    } else {
        const observer = new MutationObserver(() => {
            if (document.body) {
                observer.disconnect();
                onReady();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }
})();
