// Використовуємо Vue 3, оскільки він має зручну глобальну CDN-збірку без необхідності налаштовувати Babel (як у React), та інтуїтивно зрозумілий синтаксис шаблонів.
console.log('script.js підключено: Робота з Vue 3');

const API_URL = 'https://opentdb.com/api.php?amount=10&type=multiple';

function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Крок 4: Створення компонента елемента/списку згідно з варіантом 8
const QuizQuestion = {
  name: 'QuizQuestion',
  props: ['question', 'options', 'correctAnswer', 'hasAnswered', 'selectedAnswer'],
  emits: ['answer'], 
  template: `
    <div>
      <h2 id="question-text">{{ question }}</h2>
      <form @submit.prevent>
        <div id="options-container">
          <div v-for="(option, index) in options" :key="index" style="margin-bottom: 10px;">
            <input 
              type="radio" 
              :id="'option-'+index" 
              name="quiz-option" 
              :value="option" 
              :checked="selectedAnswer === option" 
              :disabled="hasAnswered"
              @change="$emit('answer', option)" 
              required>
            <label 
              :for="'option-'+index"
              :class="{
                'correct-answer': hasAnswered && option === correctAnswer,
                'wrong-answer': hasAnswered && option === selectedAnswer && option !== correctAnswer
              }"
            >
              {{ option }}
            </label>
          </div>
        </div>
      </form>
    </div>
  `
};

// Головний застосунок Vue
const app = Vue.createApp({
  components: {
    QuizQuestion // Реєструємо наш компонент
  },
  // Крок 3: Перенесення даних у реактивний стан data()
  data() {
    return {
      quizQuestions: [],
      currentQuestionIndex: 0,
      correctCount: 0,
      
      isLoading: false,
      errorMessage: '',
      quizStarted: false,
      quizFinished: false,
      
      hasAnswered: false,
      selectedAnswer: null,
      isCorrect: false
    };
  },
  computed: {
    // Похідне значення: поточне питання
    currentQuestion() {
      return this.quizQuestions[this.currentQuestionIndex];
    },
    // Похідне значення: прогрес у відсотках
    progressPercentage() {
      if (this.quizQuestions.length === 0) return 0;
      return ((this.currentQuestionIndex + 1) / this.quizQuestions.length) * 100;
    }
  },
  methods: {
    async loadData() {
      this.isLoading = true;
      this.errorMessage = '';
      this.quizQuestions = [];

      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
        
        const data = await response.json();
        if (!data.results || data.results.length === 0) throw new Error('Немає питань для завантаження.');

        // Форматуємо питання
        this.quizQuestions = data.results.map(item => {
          const allOptions = [...item.incorrect_answers, item.correct_answer];
          allOptions.sort(() => Math.random() - 0.5);

          return {
            question: decodeHTML(item.question),
            options: allOptions.map(decodeHTML),
            answer: decodeHTML(item.correct_answer)
          };
        });

        this.quizStarted = true;
        this.resetQuestionState();

      } catch (error) {
        console.error('Деталі помилки:', error);
        this.errorMessage = 'Не вдалося завантажити питання. Перевірте з\'єднання або спробуйте пізніше.';
      } finally {
        this.isLoading = false;
      }
    },
    
    // Крок 6: Обробка події від дочірнього компонента (без мутацій DOM)
    checkAnswer(answer) {
      this.selectedAnswer = answer;
      this.hasAnswered = true;
      
      if (this.selectedAnswer === this.currentQuestion.answer) {
        this.isCorrect = true;
        this.correctCount++;
      } else {
        this.isCorrect = false;
      }
    },

    nextQuestion() {
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex < this.quizQuestions.length) {
        this.resetQuestionState();
      } else {
        this.quizFinished = true;
      }
    },

    resetQuestionState() {
      this.hasAnswered = false;
      this.selectedAnswer = null;
      this.isCorrect = false;
    },

    resetQuiz() {
      this.quizStarted = false;
      this.quizFinished = false;
      this.currentQuestionIndex = 0;
      this.correctCount = 0;
      this.loadData();
    }
  }
});

// Монтуємо застосунок у <div id="app">
app.mount('#app');

// Крок 7: Ручний DOM-код (renderQuestion з innerHTML та querySelector) 
// повністю видалено, оскільки тепер інтерфейс малюється декларативно через Vue.