(function() {
    'use strict';

    console.log('[rakuro-flex-hours] スクリプト開始');

    // カスタムスタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        /* 既存のカラムの幅を調整（21% → 17%に縮小） */
        .timeline-table__head .th-daytime,
        .timeline-table__head .th-latenight,
        .timeline-table__head .th-break-time {
            width: 17% !important;
        }
        .td-daytime,
        .td-latenight,
        .td-break-time {
            width: 17% !important;
        }
        
        /* 新しいカラムの幅（12%） */
        .timeline-table__head .th-required-time {
            width: 12% !important;
        }
        .td-required-time {
            width: 12% !important;
        }
    `;
    document.head.appendChild(style);
    console.log('[rakuro-flex-hours] スタイルを追加しました');

    // DOMの完全な読み込みを待つ
    function waitForElement(selector, callback, maxAttempts = 50) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.log('[rakuro-flex-hours] 要素が見つかりませんでした:', selector);
            }
        }, 200);
    }

    // 時間文字列（HH:MM形式）を分に変換
    function timeToMinutes(timeStr) {
        if (!timeStr || timeStr === '-') return 0;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return hours * 60 + minutes;
    }

    // 分を時間文字列（HH:MM形式）に変換
    function minutesToTime(minutes) {
        if (minutes <= 0) return '0:00';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }

    // 日付文字列をDateオブジェクトに変換（YYYY-MM-DD形式）
    function parseDate(dateStr) {
        return new Date(dateStr + 'T00:00:00');
    }

    // 日付ヘッダー行から休日日付のセットを構築
    function buildHolidaySet() {
        const holidays = new Set();
        const rows = document.querySelectorAll('.timeline-table__row');
        rows.forEach(row => {
            if (row.querySelector('[data-test-id]')) return;
            const text = row.textContent.trim();
            if (text.includes('法休') || text.includes('所休')) {
                const match = text.match(/(\d{2})\/(\d{2})/);
                if (match) {
                    holidays.add(`${match[1]}-${match[2]}`);
                }
            }
        });
        return holidays;
    }

    // 今日の日付を取得（YYYY-MM-DD形式）
    function getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // メイン処理
    function addRequiredWorkingHours() {
        console.log('[rakuro-flex-hours] メイン処理開始');

        const timelineRows = document.querySelectorAll('.timeline-table__row');
        if (timelineRows.length === 0) return;

        let scheduledMinutes = 0;
        const allTds = document.querySelectorAll('td');
        for (let td of allTds) {
            const text = td.textContent.trim().replace(/\s+/g, ' ');
            if (text.includes('所定労働時間')) {
                const timeMatch = text.match(/(\d+):(\d+)/);
                if (timeMatch) {
                    scheduledMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
                    console.log('[rakuro-flex-hours] 所定労働時間:', minutesToTime(scheduledMinutes));
                }
                break;
            }
        }

        if (scheduledMinutes === 0) {
            console.log('[rakuro-flex-hours] 所定労働時間が見つかりませんでした。処理を中断します。');
            return;
        }

        // 今日の日付を取得
        const today = getTodayString();
        console.log('[rakuro-flex-hours] 今日の日付:', today);

        const holidaySet = buildHolidaySet();

        // テーブルの各行から労働時間を取得
        const rows = document.querySelectorAll('.timeline-table__row');
        let totalWorkedMinutes = 0;
        let daysUntilToday = 0;
        let remainingDays = 0;
        const todayDate = parseDate(today);

        rows.forEach(row => {
            const dateElement = row.querySelector('[data-test-id]');
            if (!dateElement) return;

            const dateStr = dateElement.getAttribute('data-test-id');
            if (!dateStr) return;

            const rowDate = parseDate(dateStr);
            const monthDay = dateStr.substring(5).replace('-', '-');
            const isHoliday = holidaySet.has(monthDay);

            const breakTimeElement = row.querySelector('.td-break-time__value');
            if (!breakTimeElement) return;

            const breakTimeText = breakTimeElement.textContent.trim();
            const [workTime] = breakTimeText.split('/').map(s => s.trim());

            if (rowDate < todayDate) {
                if (!isHoliday) {
                    const minutes = timeToMinutes(workTime);
                    totalWorkedMinutes += minutes;
                    daysUntilToday++;
                }
            } else if (rowDate.getTime() === todayDate.getTime()) {
                console.log('[rakuro-flex-hours] 今日の労働時間（参考）:', workTime);
                if (!isHoliday) {
                    remainingDays++;
                }
            } else {
                if (!isHoliday) {
                    remainingDays++;
                }
            }
        });

        console.log('[rakuro-flex-hours] 昨日までの労働時間:', minutesToTime(totalWorkedMinutes));
        console.log('[rakuro-flex-hours] 昨日までの営業日数:', daysUntilToday);
        console.log('[rakuro-flex-hours] 残りの営業日数:', remainingDays);

        // 今後1日あたりの必要労働時間を計算
        const remainingMinutes = scheduledMinutes - totalWorkedMinutes;
        const requiredMinutesPerDay = remainingDays > 0 ? remainingMinutes / remainingDays : 0;
        const requiredTimeStr = minutesToTime(Math.max(0, requiredMinutesPerDay));

        console.log('[rakuro-flex-hours] 今後1日あたりの必要労働時間:', requiredTimeStr);

        // テーブルヘッダーに「必要労働時間」カラムを追加
        const headerBreakTime = document.querySelector('.th.th-break-time');
        if (headerBreakTime) {
            // 既に追加されていないかチェック
            if (!document.querySelector('.th-required-time')) {
                const requiredHeader = document.createElement('div');
                requiredHeader.className = 'th th-required-time';
                requiredHeader.setAttribute('data-v-dc39b466', '');
                requiredHeader.innerHTML = '<span data-v-dc39b466="">必要労働時間</span>';
                headerBreakTime.parentNode.insertBefore(requiredHeader, headerBreakTime.nextSibling);
                console.log('[rakuro-flex-hours] ヘッダーカラムを追加しました');
            }
        }

        rows.forEach((row) => {
            const dateElement = row.querySelector('[data-test-id]');
            if (!dateElement) return;

            const dateStr = dateElement.getAttribute('data-test-id');
            if (!dateStr) return;

            const rowDate = parseDate(dateStr);
            const breakTimeCell = row.querySelector('.td.td-break-time');
            const monthDay = dateStr.substring(5).replace('-', '-');
            const isHoliday = holidaySet.has(monthDay);

            if (breakTimeCell && !row.querySelector('.td-required-time')) {
                const requiredCell = document.createElement('div');
                requiredCell.className = 'td td-required-time px-2 overflow-hidden';
                requiredCell.setAttribute('data-v-d60458cb', '');
                
                // 今日以降かつ営業日の場合のみ必要労働時間を表示
                if (rowDate >= todayDate && !isHoliday) {
                    requiredCell.innerHTML = `<div class="text-center text-nowrap">${requiredTimeStr}</div>`;
                } else {
                    // 昨日以前、または土日祝日の場合は "-" を表示
                    requiredCell.innerHTML = '<div class="text-center text-nowrap">-</div>';
                }
                
                breakTimeCell.parentNode.insertBefore(requiredCell, breakTimeCell.nextSibling);
            }
        });

        console.log('[rakuro-flex-hours] 完了');
    }

    // DOMの読み込みを待ってから実行
    // 複数の要素が揃うまで待つ（再試行あり）
    let retryCount = 0;
    const maxRetries = 10;
    
    function checkAndRun() {
        const hasRows = document.querySelectorAll('.timeline-table__row').length > 0;
        const hasTds = document.querySelectorAll('td').length > 0;
        const hasBreakTime = document.querySelectorAll('.td-break-time__value').length > 0;
        
        if (hasRows && hasBreakTime && hasTds) {
            addRequiredWorkingHours();
        } else if (retryCount < maxRetries) {
            // まだ揃っていないので再試行
            retryCount++;
            setTimeout(checkAndRun, 500);
        } else {
            console.log('[rakuro-flex-hours] DOM読み込みがタイムアウトしました。');
        }
    }
    
    // 少し遅延させて実行開始
    setTimeout(checkAndRun, 1000);

    // SPAの場合、ページ遷移を検知して再実行
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('[rakuro-flex-hours] ページ遷移を検知:', url);
            setTimeout(() => {
                waitForElement('.timeline-table__row', addRequiredWorkingHours);
            }, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();
