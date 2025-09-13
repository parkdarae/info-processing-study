# 🎓 정보처리기사 실기 문제은행

[![Vercel Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![GitHub](https://img.shields.io/badge/Source-GitHub-181717?logo=github)](https://github.com)
[![Version](https://img.shields.io/badge/Version-3.0.0-blue)](https://github.com)

**완전한 수동 입력**으로 제작된 정보처리기사 실기 대비 학습 앱입니다.  
**134개의 문제**를 원본과 **100% 동일**하게 추출하여 완벽한 학습 환경을 제공합니다.

## 🚀 **Live Demo**

### 📍 **배포된 앱 접속**
```
https://info-processing-exam-app.vercel.app
```

### 🖥️ **로컬 실행**
```bash
# Python으로 로컬 서버 실행
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

## ✨ **주요 기능**

### 📖 **5가지 학습 모드**
- **순차 풀기**: 1번부터 마지막까지 차례대로
- **랜덤 풀기**: 무작위 순서로 문제 출제  
- **범위 설정**: 원하는 구간만 반복 학습
- **오답만 풀기**: 틀린 문제만 다시 도전
- **체크한 문제**: 즐겨찾기한 문제만 학습

### 🎯 **스마트 정답 시스템**
- **키워드 기반 채점**: 3-5개 키워드 중 50% 이상 매칭시 정답
- **대소문자/띄어쓰기 무시**: `애자일` = `Agile` = `agile`
- **복수 답안 처리**: ①②③④ 형태의 다중 답안 완벽 지원
- **서술형 최적화**: 실기 시험 환경과 동일한 답안 입력 방식

### 📊 **완전한 통계 시스템**
- **실시간 진도율**: 전체/모드별 학습 현황 추적
- **정답률 분석**: Chart.js를 이용한 시각화
- **학습 패턴 차트**: 일별/주별 학습량 시각화
- **취약점 분석**: 자주 틀리는 분야 식별
- **연속 학습일**: 학습 동기 부여 스트릭 시스템

## 🔧 **CORS 대응 완료**

### ✅ **문제 해결**
- **다중 경로 시도**: 여러 가능한 JSON 경로를 자동으로 시도
- **상대경로 사용**: `./public/data/questions.json` 등 상대경로로 CORS 방지
- **에러 핸들링**: 로딩 실패시 자세한 가이드 제공
- **Vercel 최적화**: vercel.json 설정으로 정적 자산 최적화

### 🌐 **지원 환경**
- ✅ **Vercel 배포**: 완전 동작
- ✅ **로컬 서버**: http://localhost:8000
- ✅ **모바일 지원**: 완전 반응형
- ❌ **file:// 직접 실행**: CORS 정책상 불가

## 📈 **데이터 정확성**

### 💯 **100% 완벽 추출**
- ✅ **수동 입력**: 자동화가 아닌 완전한 수동 작업으로 정확성 보장
- ✅ **원본 대조**: PDF 원본과 100% 동일한 문제 내용
- ✅ **모든 답안 변형**: 대소문자, 띄어쓰기, 괄호 등 모든 경우의 수 포함
- ✅ **이미지 포함**: 67개 도표, 다이어그램 등 모든 관련 이미지 연결

### 📋 **문제 구성**
- **총 134문제** (목표 130문제 초과 달성!)
- **실기형 서술 문제**: 단답형/서술형 혼합
- **이미지 문제**: 도표와 다이어그램 포함
- **상세한 해설**: 이해하기 쉬운 해설 제공

## 🛠️ **기술 스택**

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js (통계 시각화)
- **Icons**: Font Awesome 6
- **Fonts**: Noto Sans Korean
- **Storage**: LocalStorage API
- **Deploy**: Vercel (정적 호스팅)
- **Design**: 완전 반응형 (Mobile-First)

## 📁 **프로젝트 구조**

```
deploy-ready/
├── 📄 index.html              # 메인 홈 화면
├── 📄 study.html              # 문제 풀이 화면
├── 📄 stats.html              # 통계 및 분석 화면
├── 📄 vercel.json             # Vercel 배포 설정
├── 📄 package.json            # 프로젝트 정보
├── 📁 css/
│   └── 🎨 styles.css          # 완전한 스타일시트
├── 📁 js/
│   ├── ⚡ main.js             # 메인 화면 로직
│   ├── ⚡ study.js            # 학습 화면 로직
│   └── ⚡ stats.js            # 통계 화면 로직
└── 📁 public/
    ├── 📁 data/
    │   └── 📊 questions.json   # 134개 완벽한 문제 데이터
    └── 📁 assets/
        └── 📁 images/          # 67개 문제 관련 이미지들
```

## 🚀 **배포 방법**

### **GitHub → Vercel 자동 배포**

1. **GitHub 레포지토리 생성**
   ```bash
   git init
   git add .
   git commit -m "🎉 정보처리기사 실기 문제은행 초기 배포"
   git remote add origin https://github.com/username/info-processing-exam-app.git
   git push -u origin main
   ```

2. **Vercel 연결**
   - [Vercel.com](https://vercel.com) 접속
   - GitHub 계정으로 로그인
   - "Import Project" → GitHub 레포지토리 선택
   - 자동 배포 시작

3. **배포 완료**
   - 자동으로 HTTPS URL 할당
   - 커밋시마다 자동 재배포
   - CDN으로 전세계 고속 접근

## 🎯 **학습 팁**

### 효과적인 학습 방법
1. **순차 풀기**로 전체 문제 파악
2. **틀린 문제**를 오답노트에서 반복 학습
3. **중요한 문제**는 즐겨찾기로 관리
4. **통계 화면**에서 취약점 분석
5. **매일 꾸준히** 10-15문제씩 풀이

### 정답 입력 가이드
- 띄어쓰기: `데이터베이스` = `데이터 베이스`
- 대소문자: `애자일` = `Agile` = `AGILE`
- 복수 답안: 각각의 입력창에 하나씩 입력
- 키워드 중심: 핵심 단어가 포함되면 정답

## 🎊 **특별 기능**

### 🏆 **이스터에그**
- **134문제 완주시**: 🚀 레벨2 타임어택 모드 해금!

### 💾 **데이터 관리**
- **로컬 저장**: 브라우저 localStorage 사용
- **데이터 내보내기**: 학습 기록 백업 가능
- **실시간 동기화**: 모든 학습 기록 즉시 저장

## 📄 **라이센스**

이 프로젝트는 교육 목적으로 제작되었습니다.
- ✅ 개인 학습 목적 자유 사용
- ✅ 학습 자료로 활용 가능
- ❌ 상업적 사용 금지

---

**🎯 정보처리기사 실기 시험 합격을 위해 열심히 공부하세요!** ✨

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/username/info-processing-exam-app)
