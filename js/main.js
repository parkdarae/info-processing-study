// ===== 전역 변수 =====
let questionsData = [];
let userData = {
    studiedQuestions: new Set(),
    correctAnswers: new Set(),
    wrongAnswers: new Set(),
    bookmarkedQuestions: new Set(),
    studyHistory: [],
    currentStreak: 0,
    totalStudyDays: 0,
    lastStudyDate: null
};

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsData();
    loadUserData();
    initializeEventListeners();
    updateStatistics();
    updateRecentActivity();
    
    // 애니메이션 초기화
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// ===== 데이터 로드 =====
async function loadQuestionsData() {
    try {
        console.log('📚 문제 데이터 로드 시작...');
        
        // 여러 경로를 시도해보기 (Vercel용 수정)
        const paths = ['/data/questions.json', './data/questions.json', 'data/questions.json', './public/data/questions.json'];
        let response = null;
        let loadedPath = '';
        
        for (const path of paths) {
            try {
                console.log(`🔍 시도 중: ${path}`);
                response = await fetch(path);
                if (response.ok) {
                    loadedPath = path;
                    console.log(`✅ 성공: ${path}`);
                    break;
                }
            } catch (err) {
                console.log(`❌ 실패: ${path}`);
                continue;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`HTTP error! status: ${response?.status || 'Network Error'}`);
        }
        
        const data = await response.json();
        if (!data || !data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid data format: questions array not found');
        }
        
        questionsData = data.questions;
        console.log(`🎉 문제 데이터 로드 완료: ${questionsData.length}개 문제 (${loadedPath})`);
        updateTotalQuestions();
        
    } catch (error) {
        console.error('❌ 문제 데이터 로드 실패:', error);
        showDetailedError(error);
        questionsData = [];
    }
}

function showDetailedError(error) {
    const errorMessage = `
        <div style="text-align: left; line-height: 1.5;">
            <strong>🚨 문제 데이터 로드 실패</strong><br><br>
            <strong>원인:</strong> ${error.message}<br><br>
            <strong>해결 방법:</strong><br>
            1. 로컬 서버에서 실행하세요 (http://localhost:8000)<br>
            2. 파일 경로를 직접 열면 CORS 오류가 발생합니다<br>
            3. 서버 실행 명령: <code>python -m http.server 8000</code><br><br>
            <strong>현재 위치:</strong> ${window.location.href}
        </div>
    `;
    
    showNotification('문제 데이터를 불러올 수 없습니다. 로컬 서버에서 실행해주세요.', 'error');
    
    // 상세 에러 다이얼로그 표시
    setTimeout(() => {
        if (questionsData.length === 0) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                max-width: 500px; z-index: 10000; border: 1px solid #e2e8f0;
            `;
            errorDiv.innerHTML = errorMessage;
            document.body.appendChild(errorDiv);
        }
    }, 2000);
}

function loadUserData() {
    const saved = localStorage.getItem('studyAppUserData');
    if (saved) {
        const parsedData = JSON.parse(saved);
        // Set 객체로 변환
        userData.studiedQuestions = new Set(parsedData.studiedQuestions || []);
        userData.correctAnswers = new Set(parsedData.correctAnswers || []);
        userData.wrongAnswers = new Set(parsedData.wrongAnswers || []);
        userData.bookmarkedQuestions = new Set(parsedData.bookmarkedQuestions || []);
        userData.studyHistory = parsedData.studyHistory || [];
        userData.currentStreak = parsedData.currentStreak || 0;
        userData.totalStudyDays = parsedData.totalStudyDays || 0;
        userData.lastStudyDate = parsedData.lastStudyDate;
    }
    console.log('💾 사용자 데이터 로드 완료');
}

function saveUserData() {
    const dataToSave = {
        studiedQuestions: Array.from(userData.studiedQuestions),
        correctAnswers: Array.from(userData.correctAnswers),
        wrongAnswers: Array.from(userData.wrongAnswers),
        bookmarkedQuestions: Array.from(userData.bookmarkedQuestions),
        studyHistory: userData.studyHistory,
        currentStreak: userData.currentStreak,
        totalStudyDays: userData.totalStudyDays,
        lastStudyDate: userData.lastStudyDate
    };
    localStorage.setItem('studyAppUserData', JSON.stringify(dataToSave));
    console.log('💾 사용자 데이터 저장 완료');
}

// ===== 이벤트 리스너 초기화 =====
function initializeEventListeners() {
    // 학습 모드 버튼
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            handleModeSelection(mode);
        });
    });

    // 범위 설정 모달
    document.getElementById('close-range-modal').addEventListener('click', closeRangeModal);
    document.getElementById('cancel-range').addEventListener('click', closeRangeModal);
    document.getElementById('confirm-range').addEventListener('click', confirmRangeStudy);

    // 범위 입력 변경
    document.getElementById('start-range').addEventListener('input', updateRangePreview);
    document.getElementById('end-range').addEventListener('input', updateRangePreview);

    // 모달 외부 클릭시 닫기
    document.getElementById('range-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeRangeModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeRangeModal();
        }
    });
}

// ===== 모드 선택 처리 =====
function handleModeSelection(mode) {
    console.log(`🎯 학습 모드 선택: ${mode}`);

    switch(mode) {
        case 'sequential':
            startSequentialStudy();
            break;
        case 'random':
            startRandomStudy();
            break;
        case 'range':
            showRangeModal();
            break;
        case 'wrong':
            startWrongAnswersStudy();
            break;
        case 'bookmark':
            startBookmarkStudy();
            break;
        default:
            console.error('❌ 알 수 없는 모드:', mode);
    }
}

// ===== 학습 모드 시작 함수들 =====
function startSequentialStudy() {
    if (questionsData.length === 0) {
        showNotification('문제 데이터가 없습니다.', 'error');
        return;
    }

    // 마지막으로 푼 문제 다음부터 시작
    let lastStudied = 0;
    userData.studyHistory.forEach(record => {
        if (record.mode === 'sequential' && record.questionId > lastStudied) {
            lastStudied = record.questionId;
        }
    });

    const startFrom = lastStudied < questionsData.length ? lastStudied + 1 : 1;
    
    addStudyRecord('sequential', startFrom, 'started');
    window.location.href = `study.html?mode=sequential&start=${startFrom}`;
}

function startRandomStudy() {
    if (questionsData.length === 0) {
        showNotification('문제 데이터가 없습니다.', 'error');
        return;
    }

    addStudyRecord('random', 0, 'started');
    window.location.href = `study.html?mode=random`;
}

function startWrongAnswersStudy() {
    if (userData.wrongAnswers.size === 0) {
        showNotification('틀린 문제가 없습니다. 먼저 문제를 풀어보세요!', 'info');
        return;
    }

    addStudyRecord('wrong', 0, 'started');
    window.location.href = `study.html?mode=wrong`;
}

function startBookmarkStudy() {
    if (userData.bookmarkedQuestions.size === 0) {
        showNotification('체크한 문제가 없습니다. 먼저 문제를 체크해보세요!', 'info');
        return;
    }

    addStudyRecord('bookmark', 0, 'started');
    window.location.href = `study.html?mode=bookmark`;
}

// ===== 범위 설정 모달 =====
function showRangeModal() {
    const modal = document.getElementById('range-modal');
    modal.style.display = 'block';
    
    // 초기값 설정
    document.getElementById('start-range').value = 1;
    document.getElementById('end-range').max = questionsData.length;
    document.getElementById('end-range').value = questionsData.length;
    updateRangePreview();
}

function closeRangeModal() {
    const modal = document.getElementById('range-modal');
    modal.style.display = 'none';
}

function updateRangePreview() {
    const start = parseInt(document.getElementById('start-range').value) || 1;
    const end = parseInt(document.getElementById('end-range').value) || questionsData.length;
    const count = Math.max(0, end - start + 1);
    
    document.getElementById('range-preview-text').textContent = 
        `${start}번 ~ ${end}번 (${count}문제)`;
}

function confirmRangeStudy() {
    const start = parseInt(document.getElementById('start-range').value);
    const end = parseInt(document.getElementById('end-range').value);
    const mode = document.querySelector('input[name="range-mode"]:checked').value;

    if (start > end) {
        showNotification('시작 번호가 끝 번호보다 클 수 없습니다.', 'error');
        return;
    }

    if (start < 1 || end > questionsData.length) {
        showNotification('범위가 올바르지 않습니다.', 'error');
        return;
    }

    closeRangeModal();
    addStudyRecord('range', start, 'started');
    window.location.href = `study.html?mode=range&start=${start}&end=${end}&rangeMode=${mode}`;
}

// ===== 통계 업데이트 =====
function updateStatistics() {
    // 전체 진도율
    const totalStudied = userData.studiedQuestions.size;
    const totalQuestions = questionsData.length;
    const overallProgress = totalQuestions > 0 ? (totalStudied / totalQuestions * 100) : 0;
    
    updateProgressBar('overall-progress-bar', overallProgress);
    document.getElementById('overall-percentage').textContent = `${Math.round(overallProgress)}%`;
    
    // 헤더 진도율
    document.getElementById('total-progress').innerHTML = `진도율: <strong>${Math.round(overallProgress)}%</strong>`;
    
    // 정답률
    const correctRate = totalStudied > 0 ? (userData.correctAnswers.size / totalStudied * 100) : 0;
    updateProgressBar('correct-rate-bar', correctRate);
    document.getElementById('correct-percentage').textContent = `${Math.round(correctRate)}%`;
    
    // 오늘 학습량
    const today = new Date().toDateString();
    const todayStudied = userData.studyHistory.filter(record => 
        new Date(record.timestamp).toDateString() === today && record.action === 'completed'
    ).length;
    
    document.getElementById('today-studied').innerHTML = `오늘 학습: <strong>${todayStudied}</strong>문제`;
    
    // 연속 학습일
    updateStreakDays();
    
    // 레벨 계산
    updateUserLevel(totalStudied);
    
    // 모드별 통계
    updateModeStatistics();
}

function updateProgressBar(elementId, percentage) {
    const bar = document.getElementById(elementId);
    if (bar) {
        bar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }
}

function updateModeStatistics() {
    // 순차 진도
    const sequentialMax = Math.max(...Array.from(userData.studiedQuestions), 0);
    document.getElementById('sequential-progress').textContent = `${sequentialMax}/${questionsData.length}`;
    
    // 랜덤 횟수
    const randomCount = userData.studyHistory.filter(r => r.mode === 'random' && r.action === 'completed').length;
    document.getElementById('random-count').textContent = randomCount;
    
    // 오답 개수
    document.getElementById('wrong-count').textContent = userData.wrongAnswers.size;
    
    // 체크 개수
    document.getElementById('bookmark-count').textContent = userData.bookmarkedQuestions.size;
    
    // 범위 설정 정보
    const lastRange = userData.studyHistory.filter(r => r.mode === 'range').pop();
    if (lastRange) {
        document.getElementById('range-info').textContent = `${lastRange.questionId}번부터`;
    }
}

function updateStreakDays() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (userData.lastStudyDate) {
        const lastStudy = new Date(userData.lastStudyDate);
        const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
            // 오늘 학습함
            // 연속일 유지
        } else if (daysDiff === 1) {
            // 어제 마지막 학습, 오늘 학습하면 연속일 증가
            const todayStudied = userData.studyHistory.some(record => 
                new Date(record.timestamp).toDateString() === today.toDateString()
            );
            if (!todayStudied) {
                userData.currentStreak = 0; // 오늘 학습 안함
            }
        } else {
            // 1일 이상 공백, 연속일 리셋
            userData.currentStreak = 0;
        }
    }
    
    document.getElementById('streak-days').textContent = `${userData.currentStreak}일`;
}

function updateUserLevel(totalStudied) {
    let level = '초보자';
    if (totalStudied >= 100) level = '고급자';
    else if (totalStudied >= 50) level = '중급자';
    else if (totalStudied >= 20) level = '초급자';
    
    document.getElementById('user-level').textContent = level;
}

function updateTotalQuestions() {
    // 모든 총 문제 수 표시 업데이트
    document.querySelectorAll('.total-questions').forEach(el => {
        el.textContent = questionsData.length;
    });
}

// ===== 최근 활동 업데이트 =====
function updateRecentActivity() {
    const container = document.getElementById('recent-activities');
    const recentRecords = userData.studyHistory
        .filter(record => record.action === 'completed')
        .slice(-5)
        .reverse();

    if (recentRecords.length === 0) {
        container.innerHTML = `
            <div class="activity-item placeholder">
                <div class="activity-icon"><i class="fas fa-play"></i></div>
                <div class="activity-info">
                    <p>학습을 시작해보세요!</p>
                    <small>위에서 학습 모드를 선택하세요.</small>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = recentRecords.map(record => {
        const date = new Date(record.timestamp);
        const timeAgo = getTimeAgo(date);
        const modeText = getModeText(record.mode);
        const isCorrect = userData.correctAnswers.has(record.questionId);
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${isCorrect ? 'check' : 'times'}" style="color: ${isCorrect ? '#10b981' : '#ef4444'}"></i>
                </div>
                <div class="activity-info">
                    <p>${modeText} - 문제 ${record.questionId}번 ${isCorrect ? '정답' : '오답'}</p>
                    <small>${timeAgo}</small>
                </div>
            </div>
        `;
    }).join('');
}

// ===== 유틸리티 함수 =====
function getModeText(mode) {
    const modes = {
        sequential: '순차 풀기',
        random: '랜덤 풀기',
        range: '범위 설정',
        wrong: '오답 풀기',
        bookmark: '체크 문제'
    };
    return modes[mode] || mode;
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
}

function addStudyRecord(mode, questionId, action) {
    const record = {
        mode,
        questionId,
        action,
        timestamp: new Date().toISOString()
    };
    
    userData.studyHistory.push(record);
    
    // 오늘 학습 기록 업데이트
    if (action === 'completed') {
        const today = new Date().toDateString();
        if (!userData.lastStudyDate || new Date(userData.lastStudyDate).toDateString() !== today) {
            userData.currentStreak++;
            userData.totalStudyDays++;
        }
        userData.lastStudyDate = new Date().toISOString();
    }
    
    saveUserData();
    updateStatistics();
    updateRecentActivity();
}

// ===== 알림 시스템 =====
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // 스타일 추가
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== 추가 기능 함수들 =====
function showStats() {
    // 상세 통계 페이지로 이동하거나 모달 표시
    window.location.href = 'stats.html';
}

function exportData() {
    const exportData = {
        userData,
        exportDate: new Date().toISOString(),
        version: '3.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('학습 데이터를 내보냈습니다.', 'success');
}

function resetProgress() {
    if (confirm('모든 학습 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        userData = {
            studiedQuestions: new Set(),
            correctAnswers: new Set(),
            wrongAnswers: new Set(),
            bookmarkedQuestions: new Set(),
            studyHistory: [],
            currentStreak: 0,
            totalStudyDays: 0,
            lastStudyDate: null
        };
        
        saveUserData();
        updateStatistics();
        updateRecentActivity();
        
        showNotification('모든 학습 기록이 초기화되었습니다.', 'success');
    }
}

// ===== CSS 애니메이션 추가 =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;
document.head.appendChild(style);
