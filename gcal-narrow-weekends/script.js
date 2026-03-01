(function() {
    'use strict';

    const LOG = '[gcal-narrow-weekends]';
    const WEEKEND_FLEX = '0.3 1 0%';
    const WEEKDAY_FLEX = '1 1 0%';

    function isWeeklyView() {
        return document.querySelectorAll('[role="columnheader"]').length === 7;
    }

    function detectWeekendIndices() {
        const headers = document.querySelectorAll('[role="columnheader"]');
        const indices = [];
        headers.forEach((header, index) => {
            const h2 = header.querySelector('h2');
            if (!h2) return;
            const label = h2.getAttribute('aria-label') || h2.textContent || '';
            if (/土曜日|日曜日|Saturday|Sunday/i.test(label)) {
                indices.push(index);
            }
        });
        return indices;
    }

    function applyFlexToChildren(container, weekendIndices) {
        if (!container) return 0;
        const children = Array.from(container.children);
        let applied = 0;
        children.forEach((child, i) => {
            const flex = weekendIndices.includes(i) ? WEEKEND_FLEX : WEEKDAY_FLEX;
            if (child.style.flex !== flex) {
                child.style.flex = flex;
                applied++;
            }
        });
        return applied;
    }

    function apply() {
        if (!isWeeklyView()) return;

        const weekendIndices = detectWeekendIndices();
        if (weekendIndices.length === 0) return;
        let applied = 0;

        // 1. ヘッダー行: .EYcIbe 内の .yzWBv[role="columnheader"]
        const headerContainer = document.querySelector('.EYcIbe');
        if (headerContainer) {
            const headers = Array.from(
                headerContainer.querySelectorAll('[role="columnheader"]')
            );
            headers.forEach((header, i) => {
                const flex = weekendIndices.includes(i) ? WEEKEND_FLEX : WEEKDAY_FLEX;
                if (header.style.flex !== flex) {
                    header.style.flex = flex;
                    applied++;
                }
            });
        }

        // 2. 背景ストライプ: .djb5I 内の .INK2ed
        document.querySelectorAll('.djb5I').forEach(container => {
            const cells = Array.from(container.querySelectorAll('.INK2ed'));
            if (cells.length === 7) {
                applied += applyFlexToChildren(container, weekendIndices);
            }
        });

        // 3. 勤務場所 / 終日イベント背景: .NFVL1c 内の .E42vBe
        document.querySelectorAll('.NFVL1c').forEach(container => {
            const cells = Array.from(container.children).filter(
                c => c.classList.contains('E42vBe')
            );
            if (cells.length === 7) {
                cells.forEach((cell, i) => {
                    const flex = weekendIndices.includes(i) ? WEEKEND_FLEX : WEEKDAY_FLEX;
                    if (cell.style.flex !== flex) {
                        cell.style.flex = flex;
                        applied++;
                    }
                });
            }
        });

        // 4. 終日イベント背景リスト: ul.bOyeud 内の li.gZ8fdb
        document.querySelectorAll('ul.bOyeud').forEach(ul => {
            const items = Array.from(ul.querySelectorAll('li.gZ8fdb'));
            if (items.length === 7) {
                items.forEach((li, i) => {
                    const flex = weekendIndices.includes(i) ? WEEKEND_FLEX : WEEKDAY_FLEX;
                    if (li.style.flex !== flex) {
                        li.style.flex = flex;
                        applied++;
                    }
                });
            }
        });

        // 5. 終日イベントセル: .PTdDEc 内の .qLWd9c[role="gridcell"]
        document.querySelectorAll('.PTdDEc').forEach(container => {
            const cells = Array.from(
                container.querySelectorAll('[role="gridcell"]')
            );
            if (cells.length === 7) {
                cells.forEach((cell, i) => {
                    const flex = weekendIndices.includes(i) ? WEEKEND_FLEX : WEEKDAY_FLEX;
                    if (cell.style.flex !== flex) {
                        cell.style.flex = flex;
                        applied++;
                    }
                });
            }
        });

        // 6. 時間グリッド: .Tmdkcc 内の .BiKU4b[data-column-index]
        document.querySelectorAll('.Tmdkcc').forEach(row => {
            const cells = Array.from(
                row.querySelectorAll('[data-column-index]')
            );
            cells.forEach(cell => {
                const idx = parseInt(cell.getAttribute('data-column-index'), 10);
                const flex = weekendIndices.includes(idx) ? WEEKEND_FLEX : WEEKDAY_FLEX;
                if (cell.style.flex !== flex) {
                    cell.style.flex = flex;
                    applied++;
                }
            });
        });

        // 7. 時間グリッド背景線: .aLC8Le 内の列区切り線
        //    (8本の線で7列を区切っている。最後の2区間を狭めるために
        //     線自体を動かすのは困難なので、ここではスキップ)

        if (applied > 0) {
            console.log(LOG, `${applied} 要素に適用 (休日列: ${weekendIndices.join(', ')})`);
        }
    }

    // 初期適用: DOM が安定するまでリトライ
    let retryCount = 0;
    const MAX_RETRIES = 30;

    function tryApply() {
        if (!isWeeklyView()) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(tryApply, 500);
            }
            return;
        }
        apply();
        setTimeout(apply, 500);
        setTimeout(apply, 1000);
        setTimeout(apply, 2000);
    }

    setTimeout(tryApply, 500);

    // DOM の変更を監視して再適用
    let mutationTimer = null;
    const observer = new MutationObserver(() => {
        if (mutationTimer) clearTimeout(mutationTimer);
        mutationTimer = setTimeout(() => {
            apply();
            mutationTimer = null;
        }, 200);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    // URL 変更の検知 (SPA 対応)
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log(LOG, 'ページ遷移を検知:', lastUrl);
            retryCount = 0;
            setTimeout(tryApply, 500);
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });

    window.addEventListener('resize', () => {
        setTimeout(apply, 300);
    });

    console.log(LOG, 'スクリプト読み込み完了');
})();
