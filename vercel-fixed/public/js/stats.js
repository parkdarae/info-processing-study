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

let charts = {};

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    initializeStats();
});

async function initializeStats() {
    try {
        await loadQuestionsData();
        loadUserData();
        updateAllStatistics();
        initializeCharts();
        updateDetailedAnalysis();
        updateActivityTimeline();
        
        console.log('📊 통계 페이지 초기화 완료');
    } catch (error) {
        console.error('❌ 통계 초기화 실패:', error);
    }
}

// ===== 데이터 로드 =====
async function loadQuestionsData() {
    try {
        console.log('📚 문제 데이터 로드 시작...');
        
        // Vercel에서 public 폴더 내용이 루트로 서빙됨
        const paths = ['data/questions.json', './data/questions.json', '/data/questions.json'];
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
        
    } catch (error) {
        console.error('❌ 문제 데이터 로드 실패:', error);
        showNotification(`통계 데이터를 불러올 수 없습니다: ${error.message}`, 'error');
        
        // 홈으로 리다이렉트
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
        throw error;
    }
}

function loadUserData() {
    const saved = localStorage.getItem('studyAppUserData');
    if (saved) {
        const parsedData = JSON.parse(saved);
        userData.studiedQuestions = new Set(parsedData.studiedQuestions || []);
        userData.correctAnswers = new Set(parsedData.correctAnswers || []);
        userData.wrongAnswers = new Set(parsedData.wrongAnswers || []);
        userData.bookmarkedQuestions = new Set(parsedData.bookmarkedQuestions || []);
        userData.studyHistory = parsedData.studyHistory || [];
        userData.currentStreak = parsedData.currentStreak || 0;
        userData.totalStudyDays = parsedData.totalStudyDays || 0;
        userData.lastStudyDate = parsedData.lastStudyDate;
    }
}

// ===== 종합 통계 업데이트 =====
function updateAllStatistics() {
    updateOverviewStats();
    updateModeStats();
}

function updateOverviewStats() {
    const totalQuestions = questionsData.length;
    const studiedCount = userData.studiedQuestions.size;
    const correctCount = userData.correctAnswers.size;
    
    // 전체 진도율
    const totalProgress = totalQuestions > 0 ? (studiedCount / totalQuestions * 100) : 0;
    document.getElementById('total-progress-number').textContent = `${Math.round(totalProgress)}%`;
    document.getElementById('total-progress-bar').style.width = `${totalProgress}%`;
    document.getElementById('total-studied').textContent = studiedCount;
    
    // 전체 정답률
    const accuracy = studiedCount > 0 ? (correctCount / studiedCount * 100) : 0;
    document.getElementById('accuracy-number').textContent = `${Math.round(accuracy)}%`;
    document.getElementById('accuracy-bar').style.width = `${accuracy}%`;
    document.getElementById('correct-answers').textContent = correctCount;
    document.getElementById('total-answers').textContent = studiedCount;
    
    // 연속 학습
    document.getElementById('streak-number').textContent = `${userData.currentStreak}일`;
    document.getElementById('current-streak').textContent = `${userData.currentStreak}일`;
    document.getElementById('total-days').textContent = `${userData.totalStudyDays}일`;
    
    // 학습 레벨
    const level = calculateLevel(studiedCount);
    const levelProgress = calculateLevelProgress(studiedCount);
    const nextLevelNeed = calculateNextLevelNeed(studiedCount);
    
    document.getElementById('level-number').textContent = level.name;
    document.getElementById('level-progress-bar').style.width = `${levelProgress}%`;
    document.getElementById('next-level-need').textContent = nextLevelNeed;
}

function updateModeStats() {
    // 순차 풀이 통계
    const sequentialMax = Math.max(...Array.from(userData.studiedQuestions), 0);
    const sequentialProgress = Math.round((sequentialMax / questionsData.length) * 100);
    document.getElementById('sequential-progress').textContent = `${sequentialMax}/${questionsData.length}`;
    document.getElementById('sequential-rate').textContent = `${sequentialProgress}%`;
    document.getElementById('sequential-bar').style.width = `${sequentialProgress}%`;
    
    // 랜덤 풀이 통계
    const randomSessions = userData.studyHistory.filter(r => r.mode === 'random' && r.action === 'completed').length;
    const randomCorrect = userData.studyHistory.filter(r => 
        r.mode === 'random' && r.action === 'completed' && userData.correctAnswers.has(r.questionId)
    ).length;
    const randomRate = randomSessions > 0 ? Math.round((randomCorrect / randomSessions) * 100) : 0;
    
    document.getElementById('random-sessions').textContent = `${randomSessions}회`;
    document.getElementById('random-rate').textContent = `${randomRate}%`;
    document.getElementById('random-bar').style.width = `${Math.min(randomRate, 100)}%`;
    
    // 오답 풀이 통계
    const wrongCount = userData.wrongAnswers.size;
    const wrongImprovement = calculateWrongImprovement();
    document.getElementById('wrong-count').textContent = `${wrongCount}개`;
    document.getElementById('wrong-improvement').textContent = `${wrongImprovement}%`;
    document.getElementById('wrong-bar').style.width = `${wrongImprovement}%`;
    
    // 즐겨찾기 통계
    const bookmarkCount = userData.bookmarkedQuestions.size;
    const bookmarkCorrect = Array.from(userData.bookmarkedQuestions).filter(id => 
        userData.correctAnswers.has(id)
    ).length;
    const bookmarkRate = bookmarkCount > 0 ? Math.round((bookmarkCorrect / bookmarkCount) * 100) : 0;
    
    document.getElementById('bookmark-count').textContent = `${bookmarkCount}개`;
    document.getElementById('bookmark-rate').textContent = `${bookmarkRate}%`;
    document.getElementById('bookmark-bar').style.width = `${bookmarkRate}%`;
}

// ===== 레벨 계산 함수들 =====
function calculateLevel(studiedCount) {
    const levels = [
        { name: '초보자', min: 0, max: 19, color: '#94a3b8' },
        { name: '초급자', min: 20, max: 49, color: '#22c55e' },
        { name: '중급자', min: 50, max: 99, color: '#3b82f6' },
        { name: '고급자', min: 100, max: 134, color: '#8b5cf6' }
    ];
    
    return levels.find(level => studiedCount >= level.min && studiedCount <= level.max) || levels[0];
}

function calculateLevelProgress(studiedCount) {
    const currentLevel = calculateLevel(studiedCount);
    const range = currentLevel.max - currentLevel.min + 1;
    const progress = studiedCount - currentLevel.min;
    return Math.round((progress / range) * 100);
}

function calculateNextLevelNeed(studiedCount) {
    const currentLevel = calculateLevel(studiedCount);
    return Math.max(0, currentLevel.max - studiedCount + 1);
}

function calculateWrongImprovement() {
    // 오답 중 재도전해서 맞춘 비율 계산
    const wrongQuestions = Array.from(userData.wrongAnswers);
    if (wrongQuestions.length === 0) return 0;
    
    const improvedCount = wrongQuestions.filter(questionId => {
        const wrongHistory = userData.studyHistory.filter(r => 
            r.questionId === questionId && r.action === 'completed'
        );
        
        if (wrongHistory.length <= 1) return false;
        
        // 마지막 시도가 정답인지 확인
        const lastAttempt = wrongHistory[wrongHistory.length - 1];
        return userData.correctAnswers.has(lastAttempt.questionId);
    }).length;
    
    return Math.round((improvedCount / wrongQuestions.length) * 100);
}

// ===== 차트 초기화 및 업데이트 =====
function initializeCharts() {
    initializeDailyChart();
    initializeAccuracyChart();
    initializeProgressChart();
}

function initializeDailyChart() {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    const dailyData = getDailyStudyData(7);
    
    charts.daily = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dailyData.labels,
            datasets: [{
                label: '학습한 문제 수',
                data: dailyData.values,
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // 기간 선택 이벤트 리스너
    document.getElementById('chart-period').addEventListener('change', function(e) {
        const period = parseInt(e.target.value);
        updateDailyChart(period);
    });
}

function initializeAccuracyChart() {
    const ctx = document.getElementById('accuracyChart').getContext('2d');
    const correctCount = userData.correctAnswers.size;
    const wrongCount = userData.studiedQuestions.size - correctCount;
    
    charts.accuracy = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['정답', '오답'],
            datasets: [{
                data: [correctCount, wrongCount],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function initializeProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const progressData = getProgressData();
    
    charts.progress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: progressData.labels,
            datasets: [{
                label: '누적 학습 문제 수',
                data: progressData.values,
                fill: true,
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

// ===== 차트 데이터 생성 함수들 =====
function getDailyStudyData(days) {
    const data = { labels: [], values: [] };
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dateString = date.toDateString();
        const studyCount = userData.studyHistory.filter(record => 
            record.action === 'completed' && 
            new Date(record.timestamp).toDateString() === dateString
        ).length;
        
        data.labels.push(date.toLocaleDateString('ko-KR', { 
            month: 'short', 
            day: 'numeric' 
        }));
        data.values.push(studyCount);
    }
    
    return data;
}

function getProgressData() {
    const data = { labels: [], values: [] };
    const studyDates = [...new Set(userData.studyHistory
        .filter(r => r.action === 'completed')
        .map(r => new Date(r.timestamp).toDateString()))].sort();
    
    let cumulativeCount = 0;
    const studiedQuestions = new Set();
    
    studyDates.slice(-15).forEach(dateString => { // 최근 15일
        const dayRecords = userData.studyHistory.filter(r => 
            r.action === 'completed' && 
            new Date(r.timestamp).toDateString() === dateString
        );
        
        dayRecords.forEach(record => {
            if (!studiedQuestions.has(record.questionId)) {
                studiedQuestions.add(record.questionId);
                cumulativeCount++;
            }
        });
        
        data.labels.push(new Date(dateString).toLocaleDateString('ko-KR', { 
            month: 'short', 
            day: 'numeric' 
        }));
        data.values.push(cumulativeCount);
    });
    
    return data;
}

function updateDailyChart(days) {
    const dailyData = getDailyStudyData(days);
    charts.daily.data.labels = dailyData.labels;
    charts.daily.data.datasets[0].data = dailyData.values;
    charts.daily.update();
}

// ===== 상세 분석 업데이트 =====
function updateDetailedAnalysis() {
    updateWeakAreas();
    updateStrongAreas();
    updateRecommendations();
}

function updateWeakAreas() {
    const weakAreas = analyzeWeakAreas();
    const container = document.getElementById('weak-areas');
    
    if (weakAreas.length === 0) {
        container.innerHTML = '<p class="no-data">분석할 데이터가 부족합니다.</p>';
        return;
    }
    
    container.innerHTML = weakAreas.map(area => `
        <div class="weak-area-item">
            <span class="area-name">${area.name}</span>
            <div class="area-bar">
                <div class="area-fill" style="width: ${area.rate}%"></div>
            </div>
            <span class="area-rate">${area.rate}%</span>
        </div>
    `).join('');
}

function updateStrongAreas() {
    const strongAreas = analyzeStrongAreas();
    const container = document.getElementById('strong-areas');
    
    if (strongAreas.length === 0) {
        container.innerHTML = '<p class="no-data">분석할 데이터가 부족합니다.</p>';
        return;
    }
    
    container.innerHTML = strongAreas.map(area => `
        <div class="strong-area-item">
            <span class="area-name">${area.name}</span>
            <div class="area-bar">
                <div class="area-fill strong" style="width: ${area.rate}%"></div>
            </div>
            <span class="area-rate">${area.rate}%</span>
        </div>
    `).join('');
}

function analyzeWeakAreas() {
    // 임시 분석 데이터 (실제로는 문제 카테고리별로 분석)
    const categories = [
        { name: '데이터베이스', rate: 45 },
        { name: '네트워크', rate: 52 },
        { name: '소프트웨어 공학', rate: 38 }
    ];
    
    return categories.filter(cat => cat.rate < 60).sort((a, b) => a.rate - b.rate);
}

function analyzeStrongAreas() {
    // 임시 분석 데이터
    const categories = [
        { name: '프로그래밍', rate: 88 },
        { name: '자료구조', rate: 82 },
        { name: '알고리즘', rate: 75 }
    ];
    
    return categories.filter(cat => cat.rate >= 75).sort((a, b) => b.rate - a.rate);
}

function updateRecommendations() {
    const recommendations = generateRecommendations();
    const container = document.getElementById('recommendations');
    
    document.getElementById('wrong-question-count').textContent = userData.wrongAnswers.size;
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <div class="rec-icon">
                <i class="fas fa-${rec.icon}"></i>
            </div>
            <div class="rec-content">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
            </div>
        </div>
    `).join('');
}

function generateRecommendations() {
    const recommendations = [];
    
    if (userData.wrongAnswers.size > 0) {
        recommendations.push({
            icon: 'target',
            title: '오답 집중 학습',
            description: `현재 ${userData.wrongAnswers.size}개의 오답 문제가 있습니다. 이 문제들을 다시 풀어보세요.`
        });
    }
    
    if (userData.studiedQuestions.size < 30) {
        recommendations.push({
            icon: 'rocket',
            title: '학습량 늘리기',
            description: '매일 꾸준히 5-10문제씩 풀어보세요. 일관성이 실력 향상의 핵심입니다.'
        });
    }
    
    if (userData.bookmarkedQuestions.size === 0) {
        recommendations.push({
            icon: 'bookmark',
            title: '중요 문제 체크',
            description: '어려웠거나 중요한 문제들을 즐겨찾기에 추가하여 나중에 다시 복습하세요.'
        });
    }
    
    return recommendations;
}

// ===== 활동 타임라인 업데이트 =====
function updateActivityTimeline() {
    const container = document.getElementById('activity-timeline');
    const recentActivities = userData.studyHistory
        .filter(record => record.action === 'completed')
        .slice(-10)
        .reverse();
    
    if (recentActivities.length === 0) {
        container.innerHTML = '<p class="no-activity">학습 활동이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = recentActivities.map(activity => {
        const date = new Date(activity.timestamp);
        const isCorrect = userData.correctAnswers.has(activity.questionId);
        const modeText = getModeText(activity.mode);
        
        return `
            <div class="timeline-item">
                <div class="timeline-marker ${isCorrect ? 'correct' : 'incorrect'}">
                    <i class="fas fa-${isCorrect ? 'check' : 'times'}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-title">${modeText} - 문제 ${activity.questionId}번</span>
                        <span class="timeline-time">${formatTimeAgo(date)}</span>
                    </div>
                    <div class="timeline-result ${isCorrect ? 'correct' : 'incorrect'}">
                        ${isCorrect ? '정답' : '오답'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== 유틸리티 함수들 =====
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

function formatTimeAgo(date) {
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

// ===== 추가 기능 =====
function exportDetailedData() {
    const exportData = {
        userData,
        statistics: {
            totalQuestions: questionsData.length,
            studiedCount: userData.studiedQuestions.size,
            correctCount: userData.correctAnswers.size,
            wrongCount: userData.wrongAnswers.size,
            bookmarkCount: userData.bookmarkedQuestions.size,
            currentStreak: userData.currentStreak,
            totalStudyDays: userData.totalStudyDays
        },
        exportDate: new Date().toISOString(),
        version: '3.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('상세 통계 데이터를 내보냈습니다.', 'success');
}

function printStats() {
    window.print();
}

function showNotification(message, type = 'info') {
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

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
