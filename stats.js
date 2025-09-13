// ===== Stats.js - 간단한 버전 =====
let questionsData = [];

document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsData();
});

async function loadQuestionsData() {
    try {
        console.log('📊 Stats 페이지 - 문제 데이터 로드 시작...');
        
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
        console.log(`🎉 Stats - 문제 데이터 로드 완료: ${questionsData.length}개 문제 (${loadedPath})`);
        
    } catch (error) {
        console.error('❌ Stats - 문제 데이터 로드 실패:', error);
        showNotification('통계 데이터를 불러올 수 없습니다.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
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
