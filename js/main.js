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
        
        // 모든 파일이 루트에 배치됨
        const paths = ['questions.json', './questions.json', '/questions.json'];
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
        showNotification('문제 데이터를 불러올 수 없습니다.', 'error');
        questionsData = [];
    }
}

// ===== 기본 함수들 =====
function updateTotalQuestions() {
    const totalElement = document.querySelector('#total-questions');
    if (totalElement) {
        totalElement.textContent = `${questionsData.length}개`;
    }
}

function loadUserData() {
    try {
        const saved = localStorage.getItem('studyAppUserData');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Set 객체들 복원
            userData.studiedQuestions = new Set(parsed.studiedQuestions || []);
            userData.correctAnswers = new Set(parsed.correctAnswers || []);
            userData.wrongAnswers = new Set(parsed.wrongAnswers || []);
            userData.bookmarkedQuestions = new Set(parsed.bookmarkedQuestions || []);
            userData.studyHistory = parsed.studyHistory || [];
            userData.currentStreak = parsed.currentStreak || 0;
            userData.totalStudyDays = parsed.totalStudyDays || 0;
            userData.lastStudyDate = parsed.lastStudyDate;
        }
    } catch (error) {
        console.error('사용자 데이터 로드 실패:', error);
    }
}

function saveUserData() {
    try {
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
    } catch (error) {
        console.error('사용자 데이터 저장 실패:', error);
    }
}

function initializeEventListeners() {
    // 학습 모드 버튼들
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', handleModeSelection);
    });

    // 통계 보기 버튼
    const statsBtn = document.querySelector('#stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            window.location.href = 'stats.html';
        });
    }
}

function handleModeSelection(event) {
    const mode = event.currentTarget.dataset.mode;
    console.log('선택된 모드:', mode);
    
    // 학습 페이지로 이동
    window.location.href = `study.html?mode=${mode}`;
}

function updateStatistics() {
    // 진도율 업데이트
    const totalProgress = document.querySelector('#total-progress strong');
    if (totalProgress && questionsData.length > 0) {
        const progress = Math.round((userData.studiedQuestions.size / questionsData.length) * 100);
        totalProgress.textContent = `${progress}%`;
    }

    // 오늘 학습 문제 수
    const todayStudied = document.querySelector('#today-studied strong');
    if (todayStudied) {
        const today = new Date().toDateString();
        const todayCount = userData.studyHistory.filter(h => 
            new Date(h.timestamp).toDateString() === today
        ).length;
        todayStudied.textContent = todayCount;
    }

    // 모드별 통계 업데이트
    updateModeStats();
}

function updateModeStats() {
    // 각 모드 카드의 통계 업데이트
    const modeStats = {
        sequential: { solved: userData.studiedQuestions.size, total: questionsData.length },
        random: { solved: userData.studiedQuestions.size, total: questionsData.length },
        wrong: { solved: 0, total: userData.wrongAnswers.size },
        bookmark: { solved: 0, total: userData.bookmarkedQuestions.size }
    };

    Object.keys(modeStats).forEach(mode => {
        const statElement = document.querySelector(`[data-mode="${mode}"] .mode-stats`);
        if (statElement) {
            const { solved, total } = modeStats[mode];
            if (mode === 'wrong') {
                statElement.textContent = `틀린 문제: ${total}개`;
            } else if (mode === 'bookmark') {
                statElement.textContent = `체크: ${total}개`;
            } else {
                statElement.textContent = `진도: ${solved}/${total}`;
            }
        }
    });
}

function updateRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    // 최근 5개 활동 가져오기
    const recentActivities = userData.studyHistory
        .slice(-5)
        .reverse();

    if (recentActivities.length === 0) {
        activityList.innerHTML = '<div class="activity-item placeholder">아직 학습 기록이 없습니다.</div>';
        return;
    }

    activityList.innerHTML = recentActivities.map(activity => {
        const date = new Date(activity.timestamp);
        const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const resultClass = activity.correct ? 'correct' : 'incorrect';
        const resultText = activity.correct ? '정답' : '오답';
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${resultClass}">
                    <i class="fas ${activity.correct ? 'fa-check' : 'fa-times'}"></i>
                </div>
                <div class="activity-info">
                    <p>문제 ${activity.questionId}</p>
                    <small>${timeStr} - ${resultText}</small>
                </div>
            </div>
        `;
    }).join('');
}

function showNotification(message, type = 'info') {
    // 간단한 알림 표시
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // 실제 UI에 알림 표시 (옵션)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: ${type === 'error' ? '#ef4444' : '#4f46e5'};
        color: white; padding: 1rem 1.5rem; border-radius: 8px;
        font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ===== 유틸리티 함수 =====
function formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateAccuracy(correct, total) {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
}
