// DOM Elements (Flashcard)
const card = document.getElementById('flashcard');
const cardWord = document.getElementById('card-word');
const cardWordBack = document.getElementById('card-word-back');
const cardTr = document.getElementById('card-tr');
const cardEn = document.getElementById('card-en');
const cardSyn = document.getElementById('card-syn');

// Buttons
const btnAgain = document.getElementById('btn-again');
const btnKnow = document.getElementById('btn-know');
const resetProgressBtn = document.getElementById('reset-progress');

// Header UI
const sublistSelect = document.getElementById('sublist-select');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const views = document.querySelectorAll('.view-section');

// Quiz Elements
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const btnNextQuiz = document.getElementById('btn-next-quiz');

// State
let currentWords = []; 
let learnedWords = JSON.parse(localStorage.getItem('ielts_learned')) || [];
let activeWord = null;
let quizAnswer = null;

// Initialize
function init() {
    loadSublist('all');
    updateProgress();
    showNextCard();
}

function loadSublist(sublist) {
    if (sublist === 'all') {
        currentWords = [...window.ieltsData];
    } else {
        currentWords = window.ieltsData.filter(w => w.sublist == sublist);
    }
}

function updateProgress() {
    let unlearned = currentWords.filter(w => !learnedWords.includes(w.word));
    let total = currentWords.length;
    let learnedCount = total - unlearned.length;
    
    let percentage = total > 0 ? (learnedCount / total) * 100 : 0;
    progressBar.style.width = percentage + '%';
    progressText.innerText = `${learnedCount} / ${total} Öğrenildi`;
}

// ---- FLASHCARD LOGIC ----

function showNextCard() {
    // Reset Card
    card.classList.remove('is-flipped');
    
    let unlearned = currentWords.filter(w => !learnedWords.includes(w.word));
    
    if (unlearned.length === 0) {
        cardWord.innerText = "Tebrikler! 🎉";
        cardWordBack.innerText = "Tümü Öğrenildi";
        cardTr.innerText = "Seçilen listedeki tüm kelimeleri bitirdin.";
        cardEn.innerText = "You have mastered all words in this list.";
        cardSyn.innerText = "-";
        btnAgain.disabled = true;
        btnKnow.disabled = true;
        return;
    }

    btnAgain.disabled = false;
    btnKnow.disabled = false;

    // Pick random word
    let randomIndex = Math.floor(Math.random() * unlearned.length);
    activeWord = unlearned[randomIndex];

    // Build Front
    cardWord.innerText = activeWord.word;

    // Build Back
    cardWordBack.innerText = activeWord.word;
    cardTr.innerText = activeWord.tr;
    cardEn.innerText = activeWord.en;
    cardSyn.innerText = activeWord.syn;
}

card.addEventListener('click', () => {
    if (cardWord.innerText !== "Tebrikler! 🎉") {
        card.classList.toggle('is-flipped');
    }
});

btnKnow.addEventListener('click', () => {
    if (!activeWord) return;
    if (!learnedWords.includes(activeWord.word)) {
        learnedWords.push(activeWord.word);
        localStorage.setItem('ielts_learned', JSON.stringify(learnedWords));
    }
    updateProgress();
    showNextCard();
});

btnAgain.addEventListener('click', () => {
    // Just move to another random card without adding to learned
    showNextCard();
});

resetProgressBtn.addEventListener('click', () => {
    if(confirm("Tüm öğrenme geçmişini siliyorsun. Emin misin?")) {
        learnedWords = [];
        localStorage.removeItem('ielts_learned');
        updateProgress();
        showNextCard();
    }
});

sublistSelect.addEventListener('change', (e) => {
    loadSublist(e.target.value);
    updateProgress();
    showNextCard();
});

// ---- QUIZ LOGIC ----

function generateQuiz() {
    quizFeedback.innerText = "";
    quizFeedback.className = "quiz-feedback";
    btnNextQuiz.style.display = "none";
    quizOptions.innerHTML = "";

    if (currentWords.length < 4) {
        quizQuestion.innerText = "Sınav için en az 4 kelime gereklidir.";
        return;
    }

    // Unlearned or random
    let unlearned = currentWords.filter(w => !learnedWords.includes(w.word));
    let pool = unlearned.length >= 4 ? unlearned : currentWords; 
    
    // Pick 1 Correct
    let correctIndex = Math.floor(Math.random() * pool.length);
    let correctWord = pool[correctIndex];
    quizAnswer = correctWord.word;

    // Pick 3 Wrong
    let wrongOptions = [];
    while(wrongOptions.length < 3) {
        let wr = currentWords[Math.floor(Math.random() * currentWords.length)];
        if(wr.word !== correctWord.word && !wrongOptions.find(o => o.word === wr.word)) {
            wrongOptions.push(wr);
        }
    }

    // Question Type (0 = Meaning to Word, 1 = Word to Meaning)
    let type = Math.random() > 0.5 ? 0 : 1;
    
    let allOptions = [correctWord, ...wrongOptions];
    allOptions.sort(() => Math.random() - 0.5); // Shuffle

    if (type === 0) {
        quizQuestion.innerHTML = `Hangi kelimenin İngilizce açıklaması aşağıdadır?<br><strong>"${correctWord.en}"</strong>`;
        allOptions.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = "quiz-option";
            btn.innerText = opt.word;
            btn.onclick = () => checkQuiz(btn, opt.word, quizAnswer);
            quizOptions.appendChild(btn);
        });
    } else {
        quizQuestion.innerHTML = `What is the Turkish meaning of:<br><strong>${correctWord.word}</strong>`;
        allOptions.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = "quiz-option";
            btn.innerText = opt.tr;
            btn.onclick = () => checkQuiz(btn, opt.word, quizAnswer);
            quizOptions.appendChild(btn);
        });
    }
}

function checkQuiz(btn, selectedWord, correctWord) {
    // Disable all options
    Array.from(quizOptions.children).forEach(b => b.disabled = true);

    if (selectedWord === correctWord) {
        btn.classList.add('correct');
        quizFeedback.innerText = "Doğru! Harikasın.";
        quizFeedback.classList.add('success');
    } else {
        btn.classList.add('wrong');
        document.querySelector('.quiz-container').classList.add('shake');
        setTimeout(() => document.querySelector('.quiz-container').classList.remove('shake'), 300);
        
        quizFeedback.innerText = `Yanlış! Doğru cevap: ${correctWord}`;
        quizFeedback.classList.add('error');
        
        // Highlight correct
        Array.from(quizOptions.children).forEach(b => {
            if(b.innerText === correctWord || window.ieltsData.find(w => w.word === correctWord).tr === b.innerText) {
                 b.classList.add('correct');
            }
        });
    }

    btnNextQuiz.style.display = "block";
}

btnNextQuiz.addEventListener('click', generateQuiz);

// ---- TABS LOGIC ----

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        views.forEach(v => v.classList.remove('active'));
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'quiz-view') {
            generateQuiz();
        }
    });
});

// Run
window.onload = () => {
    if(typeof window.ieltsData !== 'undefined') {
        init();
    } else {
        cardWord.innerText = "Data yüklenemedi!";
    }
};
