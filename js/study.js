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

let currentStudySession = {
    mode: 'sequential',
    questionQueue: [],
    currentQuestionIndex: 0,
    startRange: 1,
    endRange: 134,
    rangeMode: 'sequential',
    sessionCorrect: 0,
    sessionTotal: 0,
    currentQuestion: null,
    isAnswered: false
};

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    initializeStudySession();
});

async function initializeStudySession() {
    try {
        // URL 파라미터 파싱
        const urlParams = new URLSearchParams(window.location.search);
        currentStudySession.mode = urlParams.get('mode') || 'sequential';
        currentStudySession.startRange = parseInt(urlParams.get('start')) || 1;
        currentStudySession.endRange = parseInt(urlParams.get('end')) || 134;
        currentStudySession.rangeMode = urlParams.get('rangeMode') || 'sequential';

        // 데이터 로드
        await loadQuestionsData();
        loadUserData();
        
        // 문제 큐 생성
        createQuestionQueue();
        
        // 이벤트 리스너 초기화
        initializeEventListeners();
        
        // 첫 문제 표시
        showCurrentQuestion();
        
        // 모드 정보 업데이트
        updateModeInfo();
        
        console.log(`🎯 학습 시작: ${currentStudySession.mode} 모드, ${currentStudySession.questionQueue.length}문제`);
        
    } catch (error) {
        console.error('❌ 초기화 실패:', error);
        showNotification('학습 초기화에 실패했습니다.', 'error');
    }
}

// ===== 데이터 로드 =====
async function loadQuestionsData() {
    try {
        console.log('📚 문제 데이터 로드 시작...');
        
        // 여러 경로를 시도해보기
        const paths = ['./public/data/questions.json', './data/questions.json', 'public/data/questions.json', 'data/questions.json'];
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
        showNotification(`문제 데이터를 불러올 수 없습니다: ${error.message}`, 'error');
        
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
}

// ===== 문제 큐 생성 =====
function createQuestionQueue() {
    let questionIds = [];

    switch (currentStudySession.mode) {
        case 'sequential':
            // 순차: 마지막 풀이 위치부터 시작
            const lastCompleted = Math.max(...Array.from(userData.studiedQuestions).filter(id => id <= questionsData.length), 0);
            const startId = lastCompleted < questionsData.length ? lastCompleted + 1 : 1;
            questionIds = Array.from({length: questionsData.length - startId + 1}, (_, i) => startId + i);
            break;

        case 'random':
            // 랜덤: 전체 문제 중 무작위
            questionIds = Array.from({length: questionsData.length}, (_, i) => i + 1);
            shuffleArray(questionIds);
            break;

        case 'range':
            // 범위: 지정된 범위 내에서
            questionIds = Array.from({length: currentStudySession.endRange - currentStudySession.startRange + 1}, 
                                   (_, i) => currentStudySession.startRange + i);
            if (currentStudySession.rangeMode === 'random') {
                shuffleArray(questionIds);
            }
            break;

        case 'wrong':
            // 오답: 틀린 문제들만
            questionIds = Array.from(userData.wrongAnswers);
            shuffleArray(questionIds);
            break;

        case 'bookmark':
            // 즐겨찾기: 체크한 문제들만
            questionIds = Array.from(userData.bookmarkedQuestions);
            shuffleArray(questionIds);
            break;

        default:
            questionIds = [1]; // 기본값
    }

    currentStudySession.questionQueue = questionIds.filter(id => id <= questionsData.length);
    
    if (currentStudySession.questionQueue.length === 0) {
        showNotification('풀 수 있는 문제가 없습니다.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ===== 이벤트 리스너 초기화 =====
function initializeEventListeners() {
    // 답안 제출
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    
    // 엔터키로 답안 제출
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey && !currentStudySession.isAnswered) {
            submitAnswer();
        }
    });

    // 네비게이션 버튼
    document.getElementById('home-btn').addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('prev-btn').addEventListener('click', showPreviousQuestion);
    document.getElementById('next-btn').addEventListener('click', showNextQuestion);
    document.getElementById('retry-btn').addEventListener('click', retryCurrentQuestion);

    // 즐겨찾기 토글
    document.getElementById('bookmark-toggle').addEventListener('click', toggleBookmark);

    // 해설 토글
    document.getElementById('explanation-toggle').addEventListener('click', toggleExplanation);

    // 목록 모달
    document.getElementById('bookmark-list-btn').addEventListener('click', () => showAnswerListModal('bookmark'));
    document.getElementById('wrong-list-btn').addEventListener('click', () => showAnswerListModal('wrong'));
    document.getElementById('close-list-modal').addEventListener('click', closeAnswerListModal);
    document.getElementById('close-list').addEventListener('click', closeAnswerListModal);

    // 완료 모달
    document.getElementById('continue-study').addEventListener('click', closeCompletionModal);
    document.getElementById('go-home').addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('unlock-timeattack').addEventListener('click', unlockTimeAttack);
}

// ===== 문제 표시 =====
function showCurrentQuestion() {
    if (currentStudySession.currentQuestionIndex >= currentStudySession.questionQueue.length) {
        showCompletionModal();
        return;
    }

    const questionId = currentStudySession.questionQueue[currentStudySession.currentQuestionIndex];
    const question = questionsData.find(q => q.id === questionId);
    
    if (!question) {
        console.error('❌ 문제를 찾을 수 없습니다:', questionId);
        showNextQuestion();
        return;
    }

    currentStudySession.currentQuestion = question;
    currentStudySession.isAnswered = false;

    // UI 업데이트
    updateQuestionDisplay(question);
    updateProgressDisplay();
    resetAnswerSection();
    updateBookmarkStatus();
    updateNavigationButtons();

    console.log(`📝 문제 ${questionId}번 표시`);
}

function updateQuestionDisplay(question) {
    // 문제 번호
    document.getElementById('question-number').textContent = `문제 ${question.id}번`;
    
    // 문제 텍스트
    document.getElementById('question-text').textContent = question.question;
    
    // 문제 이미지
    const imagesContainer = document.getElementById('question-images');
    if (question.images && question.images.length > 0) {
        imagesContainer.innerHTML = question.images.map(imagePath => 
            `<img src="${imagePath}" alt="문제 이미지" class="question-image" onerror="this.style.display='none'">`
        ).join('');
        imagesContainer.style.display = 'block';
    } else {
        imagesContainer.style.display = 'none';
    }

    // 복수 답안 처리
    setupAnswerInputs(question);
}

function setupAnswerInputs(question) {
    const container = document.getElementById('answer-inputs-container');
    const isMultipleAnswer = Array.isArray(question.answer) && 
        question.answer.some(answer => answer.includes('①') || answer.includes('②'));

    if (isMultipleAnswer) {
        // 복수 답안용 입력 필드들
        const answerCount = question.answer[0].split(/[①②③④⑤]/).length - 1;
        container.innerHTML = '';
        container.classList.add('multiple-answers');

        for (let i = 1; i <= Math.min(answerCount, 5); i++) {
            const input = document.createElement('textarea');
            input.className = 'answer-input';
            input.id = `answer-input-${i}`;
            input.placeholder = `답안 ${i}번을 입력하세요...`;
            input.rows = 2;
            
            const label = document.createElement('label');
            label.textContent = `답안 ${i}번`;
            label.htmlFor = `answer-input-${i}`;
            
            container.appendChild(label);
            container.appendChild(input);
        }
    } else {
        // 단일 답안용 입력 필드
        container.innerHTML = `
            <textarea 
                id="answer-input" 
                class="answer-input" 
                placeholder="여기에 답안을 입력하세요..."
                rows="3"
            ></textarea>
        `;
        container.classList.remove('multiple-answers');
    }
}

function updateProgressDisplay() {
    const current = currentStudySession.currentQuestionIndex + 1;
    const total = currentStudySession.questionQueue.length;
    const percentage = (current / total) * 100;

    document.getElementById('progress-text').textContent = `문제 ${current} / ${total}`;
    document.getElementById('header-progress-bar').style.width = `${percentage}%`;

    // 세션 정답률 업데이트
    const accuracy = currentStudySession.sessionTotal > 0 
        ? Math.round((currentStudySession.sessionCorrect / currentStudySession.sessionTotal) * 100) 
        : 0;
    document.getElementById('session-accuracy').textContent = `${accuracy}%`;
}

function updateModeInfo() {
    const modeTexts = {
        sequential: '순차 풀기',
        random: '랜덤 풀기',
        range: `범위 설정 (${currentStudySession.startRange}~${currentStudySession.endRange})`,
        wrong: '오답만 풀기',
        bookmark: '체크한 문제'
    };

    document.getElementById('current-mode').textContent = modeTexts[currentStudySession.mode] || currentStudySession.mode;
}

// ===== 답안 제출 및 처리 =====
function submitAnswer() {
    if (currentStudySession.isAnswered) {
        showNextQuestion();
        return;
    }

    const question = currentStudySession.currentQuestion;
    if (!question) return;

    // 답안 수집
    const userAnswers = collectUserAnswers();
    if (userAnswers.length === 0 || userAnswers.every(answer => !answer.trim())) {
        showNotification('답안을 입력해주세요.', 'error');
        return;
    }

    // 정답 검사
    const isCorrect = checkAnswer(question, userAnswers);
    
    // 결과 처리
    currentStudySession.isAnswered = true;
    currentStudySession.sessionTotal++;
    
    if (isCorrect) {
        currentStudySession.sessionCorrect++;
        userData.correctAnswers.add(question.id);
        userData.wrongAnswers.delete(question.id); // 오답에서 제거
        showResult(true, question);
    } else {
        userData.wrongAnswers.add(question.id);
        userData.correctAnswers.delete(question.id); // 정답에서 제거
        showResult(false, question);
    }

    // 학습 기록 저장
    userData.studiedQuestions.add(question.id);
    addStudyRecord(currentStudySession.mode, question.id, 'completed');
    
    // UI 업데이트
    updateProgressDisplay();
    updateSubmitButton();
    
    console.log(`${isCorrect ? '✅' : '❌'} 문제 ${question.id}번: ${isCorrect ? '정답' : '오답'}`);
}

function collectUserAnswers() {
    const container = document.getElementById('answer-inputs-container');
    const inputs = container.querySelectorAll('.answer-input');
    
    return Array.from(inputs).map(input => input.value.trim()).filter(answer => answer);
}

function checkAnswer(question, userAnswers) {
    if (!question.answer || !Array.isArray(question.answer)) {
        return false;
    }

    // 각 가능한 정답과 비교
    return question.answer.some(correctAnswer => {
        return compareAnswer(correctAnswer, userAnswers);
    });
}

function compareAnswer(correctAnswer, userAnswers) {
    // 복수 답안 패턴 검사 (①, ②, ③ 등을 포함하는 경우)
    if (correctAnswer.includes('①') || correctAnswer.includes('②')) {
        return compareMultipleAnswer(correctAnswer, userAnswers);
    }

    // 단일 답안 또는 키워드 기반 검사
    if (userAnswers.length === 1) {
        return compareKeywords(correctAnswer, userAnswers[0]);
    }

    return false;
}

function compareMultipleAnswer(correctAnswer, userAnswers) {
    // 복수 답안을 파싱
    const correctParts = parseMultipleAnswer(correctAnswer);
    
    if (correctParts.length !== userAnswers.length) {
        return false;
    }

    // 각 부분이 정답과 일치하는지 확인
    return correctParts.every((correctPart, index) => {
        return compareKeywords(correctPart, userAnswers[index]);
    });
}

function parseMultipleAnswer(answerString) {
    // ① A, ② B, ③ C 형태를 ['A', 'B', 'C']로 파싱
    const parts = answerString.split(/[①②③④⑤]/).filter(part => part.trim());
    return parts.map(part => part.trim().replace(/^,\s*/, ''));
}

function compareKeywords(correctAnswer, userAnswer) {
    // 대소문자, 공백, 특수문자 무시하고 비교
    const normalize = (str) => str.toLowerCase().replace(/[\s\(\)\-\.]/g, '');
    const normalizedCorrect = normalize(correctAnswer);
    const normalizedUser = normalize(userAnswer);

    // 완전 일치
    if (normalizedCorrect === normalizedUser) {
        return true;
    }

    // 키워드 기반 검사 (3-5개 키워드 중 50% 이상)
    const keywords = extractKeywords(correctAnswer);
    if (keywords.length >= 3) {
        const matchedKeywords = keywords.filter(keyword => 
            normalizedUser.includes(normalize(keyword))
        );
        return matchedKeywords.length >= Math.ceil(keywords.length * 0.5);
    }

    // 부분 문자열 검사 (80% 이상 유사)
    return calculateSimilarity(normalizedCorrect, normalizedUser) >= 0.8;
}

function extractKeywords(answer) {
    // 답안에서 주요 키워드 추출
    const cleanAnswer = answer.replace(/[\(\)]/g, ' ').trim();
    const words = cleanAnswer.split(/[\s,]+/).filter(word => word.length >= 2);
    return [...new Set(words)]; // 중복 제거
}

function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    return matrix[str2.length][str1.length];
}

// ===== 결과 표시 =====
function showResult(isCorrect, question) {
    const resultSection = document.getElementById('result-section');
    const resultIcon = document.getElementById('result-icon');
    const resultText = document.getElementById('result-text');
    const correctAnswers = document.getElementById('correct-answers');

    resultSection.className = `result-section ${isCorrect ? 'correct' : 'incorrect'}`;
    resultSection.style.display = 'block';

    if (isCorrect) {
        resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        resultText.innerHTML = '<h3>정답입니다! 🎉</h3><p>잘 하셨습니다!</p>';
    } else {
        resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
        resultText.innerHTML = '<h3>틀렸습니다 😅</h3><p>다시 한번 도전해보세요!</p>';
        
        // 정답 표시
        if (question.answer && question.answer.length > 0) {
            correctAnswers.innerHTML = `
                <div class="correct-answer-display">
                    <h4>정답:</h4>
                    <ul>
                        ${question.answer.slice(0, 3).map(ans => `<li>${ans}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    // 해설 준비
    const explanationSection = document.getElementById('explanation-section');
    const explanationContent = document.getElementById('explanation-content');
    
    if (question.explanation && question.explanation.trim()) {
        explanationContent.textContent = question.explanation;
        explanationSection.style.display = 'block';
    } else {
        explanationSection.style.display = 'none';
    }
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-answer');
    const nextBtn = document.getElementById('next-btn');
    const retryBtn = document.getElementById('retry-btn');

    if (currentStudySession.isAnswered) {
        submitBtn.textContent = '다음 문제';
        submitBtn.innerHTML = '<i class="fas fa-arrow-right"></i> 다음 문제';
        nextBtn.disabled = false;
        retryBtn.style.display = 'inline-block';
    } else {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> 답안 제출';
        nextBtn.disabled = true;
        retryBtn.style.display = 'none';
    }
}

// ===== 네비게이션 =====
function showNextQuestion() {
    if (currentStudySession.currentQuestionIndex < currentStudySession.questionQueue.length - 1) {
        currentStudySession.currentQuestionIndex++;
        showCurrentQuestion();
    } else {
        showCompletionModal();
    }
}

function showPreviousQuestion() {
    if (currentStudySession.currentQuestionIndex > 0) {
        currentStudySession.currentQuestionIndex--;
        showCurrentQuestion();
    }
}

function retryCurrentQuestion() {
    resetAnswerSection();
    currentStudySession.isAnswered = false;
    updateSubmitButton();
    
    // 결과 섹션 숨기기
    document.getElementById('result-section').style.display = 'none';
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.disabled = currentStudySession.currentQuestionIndex === 0;
    nextBtn.disabled = !currentStudySession.isAnswered;
}

function resetAnswerSection() {
    // 답안 입력 필드 초기화
    const inputs = document.querySelectorAll('.answer-input');
    inputs.forEach(input => {
        input.value = '';
        input.style.borderColor = '#e5e7eb';
    });

    // 결과 섹션 숨기기
    document.getElementById('result-section').style.display = 'none';
    
    // 해설 섹션 초기화
    document.getElementById('explanation-section').style.display = 'none';
    const explanationContent = document.getElementById('explanation-content');
    explanationContent.style.display = 'none';
    document.getElementById('explanation-toggle').innerHTML = '<i class="fas fa-eye"></i> 해설 보기';
}

// ===== 즐겨찾기 및 해설 토글 =====
function toggleBookmark() {
    const question = currentStudySession.currentQuestion;
    if (!question) return;

    const bookmarkBtn = document.getElementById('bookmark-toggle');
    const isBookmarked = userData.bookmarkedQuestions.has(question.id);

    if (isBookmarked) {
        userData.bookmarkedQuestions.delete(question.id);
        bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        showNotification('즐겨찾기에서 제거되었습니다.', 'info');
    } else {
        userData.bookmarkedQuestions.add(question.id);
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
        showNotification('즐겨찾기에 추가되었습니다.', 'success');
    }

    saveUserData();
}

function updateBookmarkStatus() {
    const question = currentStudySession.currentQuestion;
    if (!question) return;

    const bookmarkBtn = document.getElementById('bookmark-toggle');
    const isBookmarked = userData.bookmarkedQuestions.has(question.id);
    
    bookmarkBtn.innerHTML = isBookmarked 
        ? '<i class="fas fa-bookmark"></i>' 
        : '<i class="far fa-bookmark"></i>';
}

function toggleExplanation() {
    const explanationContent = document.getElementById('explanation-content');
    const explanationToggle = document.getElementById('explanation-toggle');
    
    if (explanationContent.style.display === 'none' || !explanationContent.style.display) {
        explanationContent.style.display = 'block';
        explanationToggle.innerHTML = '<i class="fas fa-eye-slash"></i> 해설 숨기기';
    } else {
        explanationContent.style.display = 'none';
        explanationToggle.innerHTML = '<i class="fas fa-eye"></i> 해설 보기';
    }
}

// ===== 모달 관련 =====
function showCompletionModal() {
    const modal = document.getElementById('completion-modal');
    const totalSolved = document.getElementById('total-solved');
    const totalCorrect = document.getElementById('total-correct');
    const completionRate = document.getElementById('completion-rate');
    const easterEgg = document.getElementById('easter-egg');

    totalSolved.textContent = currentStudySession.sessionTotal;
    totalCorrect.textContent = currentStudySession.sessionCorrect;
    
    const rate = currentStudySession.sessionTotal > 0 
        ? Math.round((currentStudySession.sessionCorrect / currentStudySession.sessionTotal) * 100) 
        : 0;
    completionRate.textContent = `${rate}%`;

    // 이스터에그: 130문제 완주 체크
    const totalStudiedEver = userData.studiedQuestions.size;
    if (totalStudiedEver >= 130) {
        easterEgg.style.display = 'block';
    }

    modal.style.display = 'block';
}

function closeCompletionModal() {
    document.getElementById('completion-modal').style.display = 'none';
}

function showAnswerListModal(type) {
    const modal = document.getElementById('answer-list-modal');
    const title = document.getElementById('list-modal-title');
    const content = document.getElementById('answer-list-content');

    let questionSet;
    let titleText;

    if (type === 'bookmark') {
        questionSet = userData.bookmarkedQuestions;
        titleText = '<i class="fas fa-bookmark"></i> 즐겨찾기 문제';
    } else if (type === 'wrong') {
        questionSet = userData.wrongAnswers;
        titleText = '<i class="fas fa-times-circle"></i> 오답 문제';
    }

    title.innerHTML = titleText;

    if (questionSet.size === 0) {
        content.innerHTML = `
            <div class="empty-list">
                <p>목록이 비어있습니다.</p>
            </div>
        `;
    } else {
        content.innerHTML = Array.from(questionSet)
            .sort((a, b) => a - b)
            .map(questionId => {
                const question = questionsData.find(q => q.id === questionId);
                if (!question) return '';
                
                return `
                    <div class="answer-list-item" onclick="goToQuestion(${questionId})">
                        <div class="question-number">문제 ${questionId}번</div>
                        <div class="question-preview">${question.question.substring(0, 80)}...</div>
                    </div>
                `;
            }).join('');
    }

    modal.style.display = 'block';
}

function closeAnswerListModal() {
    document.getElementById('answer-list-modal').style.display = 'none';
}

function goToQuestion(questionId) {
    const index = currentStudySession.questionQueue.indexOf(questionId);
    if (index !== -1) {
        currentStudySession.currentQuestionIndex = index;
        showCurrentQuestion();
        closeAnswerListModal();
    } else {
        showNotification('현재 학습 모드에서 해당 문제를 찾을 수 없습니다.', 'error');
    }
}

function unlockTimeAttack() {
    showNotification('🚀 타임어택 모드가 준비중입니다! 곧 업데이트 예정입니다.', 'success');
    closeCompletionModal();
}

// ===== 유틸리티 함수 =====
function addStudyRecord(mode, questionId, action) {
    const record = {
        mode,
        questionId,
        action,
        timestamp: new Date().toISOString()
    };
    
    userData.studyHistory.push(record);
    
    if (action === 'completed') {
        const today = new Date().toDateString();
        if (!userData.lastStudyDate || new Date(userData.lastStudyDate).toDateString() !== today) {
            userData.currentStreak++;
            userData.totalStudyDays++;
        }
        userData.lastStudyDate = new Date().toISOString();
    }
    
    saveUserData();
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
