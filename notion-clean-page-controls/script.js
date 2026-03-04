(function() {
    'use strict';

    const STYLE_ID = 'notion-clean-page-controls-style';

    const CSS = `
        .notion-page-controls {
            padding-top: 50px !important;
        }
        .notion-page-controls > div[role="button"],
        .notion-page-controls > [data-popup-origin] {
            display: none !important;
        }
    `;

    function inject() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    if (document.head) {
        inject();
    } else {
        const observer = new MutationObserver(() => {
            if (document.head) {
                observer.disconnect();
                inject();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }
})();
