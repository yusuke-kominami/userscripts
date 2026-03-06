(function() {
    'use strict';

    const STYLE_ID = 'notion-clean-page-controls-style';
    const TARGET_PAGE_ID = '319503c7791d803a8917c3dfcf9c97af';

    const CSS = `
        /* ページ幅を狭める */
        .layout.layout-wide {
            --margin-width: 60px !important;
        }

        /* ページ上部コントロールのボタン類を非表示 */
        .notion-page-controls {
            padding-top: 30px !important;
        }
        .notion-page-controls > div[role="button"],
        .notion-page-controls > [data-popup-origin] {
            display: none !important;
        }

        /* ページアイコン非表示（日英両対応） */
        .notion-record-icon[aria-label*="page icon"],
        .notion-record-icon[aria-label*="ページアイコン"] {
            display: none !important;
        }

        /* 親タスク: 左パネルのタスク名を太字に */
        .notion-timeline-view .notion-collection-item[data-parent-task] [data-col-index="0"] [data-testid="property-value"] span {
            font-weight: 700 !important;
        }

        /* 子タスク: 左パネルで「-」箇条書き＋深いインデント＋タスク名をグレー寄りに */
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-testid="property-value"] {
            padding-inline-start: 36px !important;
            color: var(--c-texTer) !important;
        }
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-testid="property-value"]::before {
            content: "-" !important;
            position: absolute !important;
            inset-inline-start: 24px !important;
            color: var(--c-texTer) !important;
        }

        /* 子タスク: 左パネルの矢印アイコン・親タスク名を縮小 */
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-popup-origin] .arrowTurnLeftUpSmall {
            width: 12px !important;
            height: 12px !important;
        }
        .notion-collection-item:has(.arrowTurnLeftUpSmall) [data-col-index="0"] [data-popup-origin] div[style*="font-size"] {
            font-size: 10px !important;
            line-height: 14px !important;
        }

        /* タイムライン上の依存線（SVG）を非表示 */
        .notion-timeline-view svg[style*="z-index: 83"] {
            display: none !important;
        }

        /* タイムラインバー上の親ページ名ラベルを非表示（日英両対応） */
        .notion-timeline-view [aria-label*="親ページ"]:not(.notion-collection-item *),
        .notion-timeline-view [aria-label*="parent page"]:not(.notion-collection-item *),
        .notion-timeline-view [data-popup-origin]:has(.arrowTurnLeftUpSmall):not(.notion-collection-item *) {
            display: none !important;
        }

        /* タイムラインバー上のタスク名を小さくグレー表示 */
        .notion-timeline-item-properties, .notion-timeline-item-properties * {
            font-size: 12px !important;
            color: rgba(255, 255, 255, 0.3) !important;
        }

        /* 左パネルの条件付きカラー背景を透明化 */
        .notion-timeline-view .notion-collection-item .notion-table-view-row {
            background: transparent !important;
        }

        /* 全タイムラインバーを少し狭める */
        .notion-timeline-item-row .notion-timeline-item {
            height: 24px !important;
            margin-top: 5px !important;
            margin-bottom: 5px !important;
        }

        /* タイムライン上部の浮遊ナビバー非表示（「カレンダーで管理」「月」「< 今日 >」） */
        .notion-timeline-view div[style*="sticky-horizontal-offset"] {
            display: none !important;
        }

        /* リンクドデータベースのヘッダー右パディングを除去してツールバーを右端まで広げる */
        div[data-content-editable-void="true"]:has(.notion-collection_view-block) {
            padding-right: 0px !important;
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
