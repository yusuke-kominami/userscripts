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
        .notion-record-icon[aria-label*="page icon"],
        .notion-record-icon[aria-label*="ページアイコン"] {
            display: none !important;
        }
        /* Parent task: left panel - bold */
        .notion-timeline-view .notion-collection-item[data-parent-task] [data-col-index="0"] [data-testid="property-value"] span {
            font-weight: 700 !important;
        }

        /* Child task: left panel - deeper indent with bullet */
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-testid="property-value"] {
            padding-inline-start: 36px !important;
        }
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-testid="property-value"]::before {
            content: "-" !important;
            position: absolute !important;
            inset-inline-start: 24px !important;
            color: var(--c-texTer) !important;
        }
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-popup-origin] .arrowTurnLeftUpSmall {
            width: 12px !important;
            height: 12px !important;
        }
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-popup-origin] div[style*="font-size"] {
            font-size: 10px !important;
            line-height: 14px !important;
        }
        .notion-timeline-view svg[style*="z-index: 83"] {
            display: none !important;
        }
        .notion-timeline-view [aria-label*="親ページ"]:not(.notion-collection-item *),
        .notion-timeline-view [aria-label*="parent page"]:not(.notion-collection-item *),
        .notion-timeline-view [data-popup-origin]:has(.arrowTurnLeftUpSmall):not(.notion-collection-item *) {
            display: none !important;
        }
        .notion-timeline-item-properties, .notion-timeline-item-properties * {
            font-size: 12px !important;
            color: rgba(255, 255, 255, 0.3) !important;
        }
        .notion-timeline-view .notion-collection-item .notion-table-view-row {
            background: transparent !important;
        }

        /* Child/standalone task: right panel - slightly narrower bar */
        .notion-timeline-item-row:not([data-parent-task]) .notion-timeline-item {
            height: 24px !important;
            margin-top: 5px !important;
            margin-bottom: 5px !important;
        }

        /* Parent task: right panel - thin bar within same row height */
        .notion-timeline-item-row[data-parent-task] .notion-timeline-item {
            height: 8px !important;
            margin-top: 13px !important;
            margin-bottom: 13px !important;
            border-radius: 4px !important;
        }
        .notion-timeline-item-row[data-parent-task] .notion-timeline-item-properties {
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

    function markParentTasks() {
        const view = document.querySelector('.notion-timeline-view');
        if (!view) return;

        const items = view.querySelectorAll('.notion-collection-item');
        const parentBlockIds = new Set();

        items.forEach((item) => {
            if (item.querySelector('.arrowTurnLeftUpSmall')) {
                item.removeAttribute('data-parent-task');
                return;
            }
            const next = item.nextElementSibling;
            if (next && next.classList.contains('notion-collection-item') && next.querySelector('.arrowTurnLeftUpSmall')) {
                parentBlockIds.add(item.getAttribute('data-block-id'));
                item.setAttribute('data-parent-task', '');
            } else {
                item.removeAttribute('data-parent-task');
            }
        });

        view.querySelectorAll('.notion-timeline-item-row').forEach((row) => {
            const ti = row.querySelector('.notion-timeline-item');
            if (ti && parentBlockIds.has(ti.getAttribute('data-block-id'))) {
                row.setAttribute('data-parent-task', '');
            } else {
                row.removeAttribute('data-parent-task');
            }
        });
    }

    let markTimer = null;
    function scheduleMarkParentTasks() {
        if (markTimer) return;
        markTimer = setTimeout(() => {
            markTimer = null;
            markParentTasks();
        }, 300);
    }

    function sync() {
        if (isTargetPage()) {
            inject();
            scheduleMarkParentTasks();
        } else {
            remove();
        }
    }

    let mainObserver = null;

    function startMainObserver() {
        if (mainObserver) return;
        let lastPath = location.pathname;
        mainObserver = new MutationObserver(() => {
            if (location.pathname !== lastPath) {
                lastPath = location.pathname;
                sync();
            } else if (isTargetPage()) {
                scheduleMarkParentTasks();
            }
        });
        mainObserver.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('popstate', sync);
    }

    function onReady() {
        sync();
        startMainObserver();
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
