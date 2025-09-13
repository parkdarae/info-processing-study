// ===== 현대적인 문제 풀이 JavaScript =====

let questionsData = [];
let currentQuestionIndex = 0;
let studyMode = 'sequential';
let studyStartTime = Date.now();

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    initializeStudyApp();
});

async function initializeStudyApp() {
    try {
        console.log('🎯 현대적인 문제 풀이 앱 시작...');
        
        // 문제 데이터 로드
        await loadQuestionsData();
        
        // UI 초기화
        initializeUI();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 첫 문제 표시
        if (questionsData.length > 0) {
            displayQuestion(0);
        }
        
        console.log('✅ 앱 초기화 완료!');
        
    } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        showErrorMessage('앱을 시작할 수 없습니다. 페이지를 새로고침해주세요.');
    }
}

// ===== 데이터 로드 =====
async function loadQuestionsData() {
    try {
        console.log('📚 문제 데이터 로드 중...');
        
        const paths = ['questions.json', './questions.json', '/questions.json'];
        let response = null;
        
        for (const path of paths) {
            try {
                response = await fetch(path);
                if (response.ok) {
                    break;
                }
            } catch (err) {
                continue;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error('문제 데이터를 찾을 수 없습니다.');
        }
        
        const data = await response.json();
        questionsData = data.questions || [];
        
        console.log(`🎉 문제 데이터 로드 완료: ${questionsData.length}개 문제`);
        
    } catch (error) {
        console.error('❌ 문제 데이터 로드 실패:', error);
        throw error;
    }
}

// ===== UI 초기화 =====
function initializeUI() {
    // 전체 문제 수 설정
    const totalElement = document.getElementById('total-questions');
    if (totalElement) {
        totalElement.textContent = questionsData.length;
    }
    
    updateProgress();
}

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
    // 답안 입력
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
        answerInput.addEventListener('input', handleAnswerInput);
    }
    
    // 제출 버튼
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitAnswer);
    }
    
    // 네비게이션 버튼들
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const homeBtn = document.getElementById('home-btn');
    
    if (prevBtn) prevBtn.addEventListener('click', () => navigateQuestion(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateQuestion(1));
    if (homeBtn) homeBtn.addEventListener('click', () => window.location.href = 'index.html');
    
    // 해설 토글
    const explanationHeader = document.getElementById('explanation-toggle');
    if (explanationHeader) {
        explanationHeader.addEventListener('click', toggleExplanation);
    }
}

// ===== 문제 표시 =====
function displayQuestion(index) {
    if (index < 0 || index >= questionsData.length) return;
    
    currentQuestionIndex = index;
    const question = questionsData[index];
    
    // 문제 텍스트 표시
    const questionText = document.getElementById('question-text');
    if (questionText) {
        questionText.textContent = question.question;
    }
    
    // 문제 번호 업데이트
    const questionNumber = document.getElementById('question-number');
    if (questionNumber) {
        questionNumber.innerHTML = `<i class="fas fa-hashtag"></i> Question ${index + 1}`;
    }
    
    // 진행률 업데이트
    updateProgress();
    
    // 답안 입력 초기화
    resetAnswerInput();
    
    // 결과 숨기기
    hideResult();
    
    // 네비게이션 버튼 상태 업데이트
    updateNavigationButtons();
}

// ===== 진행률 업데이트 =====
function updateProgress() {
    const current = currentQuestionIndex + 1;
    const total = questionsData.length;
    const percentage = Math.round((current / total) * 100);
    
    // 현재 문제 번호
    const currentElement = document.getElementById('current-question');
    if (currentElement) {
        currentElement.textContent = current;
    }
    
    // 진행률 퍼센트
    const progressPercent = document.getElementById('progress-percent');
    if (progressPercent) {
        progressPercent.textContent = `${percentage}%`;
    }
    
    // 원형 프로그레스 바
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 26;
        const offset = circumference - (percentage / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
    
    // 네비게이션 프로그레스
    const navProgress = document.getElementById('nav-progress');
    if (navProgress) {
        navProgress.textContent = `${current} / ${total}`;
    }
}

// ===== 답안 입력 처리 =====
function handleAnswerInput(e) {
    const input = e.target;
    const submitBtn = document.getElementById('submit-btn');
    
    if (submitBtn) {
        submitBtn.disabled = input.value.trim().length === 0;
    }
}

// ===== 답안 제출 =====
function submitAnswer() {
    const answerInput = document.getElementById('answer-input');
    if (!answerInput || !answerInput.value.trim()) return;
    
    const userAnswer = answerInput.value.trim();
    const question = questionsData[currentQuestionIndex];
    const isCorrect = checkAnswer(userAnswer, question.answer);
    
    // 결과 표시
    displayResult(isCorrect, question.answer);
    
    // 입력 비활성화
    answerInput.disabled = true;
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // 다음 버튼 활성화
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.disabled = false;
    }
}

// ===== 답안 검증 =====
function checkAnswer(userAnswer, correctAnswers) {
    if (!Array.isArray(correctAnswers)) {
        correctAnswers = [correctAnswers];
    }
    
    const normalizedUserAnswer = userAnswer.toLowerCase().replace(/\s/g, '');
    
    return correctAnswers.some(answer => {
        const normalizedAnswer = answer.toLowerCase().replace(/\s/g, '');
        return normalizedAnswer === normalizedUserAnswer;
    });
}

// ===== 결과 표시 =====
function displayResult(isCorrect, correctAnswers) {
    const resultCard = document.getElementById('result-section');
    const resultIcon = document.getElementById('result-icon');
    const resultText = document.getElementById('result-text');
    const correctAnswersDiv = document.getElementById('correct-answers');
    
    if (!resultCard) return;
    
    // 결과 카드 표시
    resultCard.style.display = 'block';
    resultCard.classList.add('show');
    
    if (isCorrect) {
        resultCard.classList.add('correct');
        if (resultIcon) {
            resultIcon.innerHTML = '<i class="fas fa-check"></i>';
            resultIcon.classList.add('correct');
        }
        if (resultText) resultText.textContent = '🎉 정답입니다!';
    } else {
        resultCard.classList.add('incorrect');
        if (resultIcon) {
            resultIcon.innerHTML = '<i class="fas fa-times"></i>';
            resultIcon.classList.add('incorrect');
        }
        if (resultText) resultText.textContent = '❌ 틀렸습니다';
    }
    
    // 정답 표시
    if (correctAnswersDiv && Array.isArray(correctAnswers)) {
        correctAnswersDiv.innerHTML = correctAnswers.map(answer => 
            `<span class="answer-chip">${answer}</span>`
        ).join('');
    }
    
    // 해설 표시
    displayExplanation();
}

// ===== 해설 표시 =====
function displayExplanation() {
    const question = questionsData[currentQuestionIndex];
    const explanationText = document.getElementById('explanation-text');
    
    if (explanationText) {
        explanationText.textContent = question.explanation || '해설이 준비되지 않았습니다.';
    }
}

// ===== 해설 토글 =====
function toggleExplanation() {
    const explanationCard = document.getElementById('explanation-section');
    if (explanationCard) {
        explanationCard.classList.toggle('expanded');
    }
}

// ===== 네비게이션 =====
function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    
    if (newIndex >= 0 && newIndex < questionsData.length) {
        displayQuestion(newIndex);
    }
}

// ===== 네비게이션 버튼 상태 업데이트 =====
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentQuestionIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = true; // 답안 제출 후 활성화
    }
}

// ===== 유틸리티 함수들 =====
function resetAnswerInput() {
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    
    if (answerInput) {
        answerInput.value = '';
        answerInput.disabled = false;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
    }
}

function hideResult() {
    const resultCard = document.getElementById('result-section');
    
    if (resultCard) {
        resultCard.style.display = 'none';
        resultCard.classList.remove('show', 'correct', 'incorrect');
    }
}

function showErrorMessage(message) {
    console.error('오류:', message);
    alert(message); // 간단한 알림
}