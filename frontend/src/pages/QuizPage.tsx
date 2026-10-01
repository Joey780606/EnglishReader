import { useState } from "react";
import { QuizQuestion, fetchQuiz, registerVocabularyView } from "../api/client";

const POINTS_PER_QUESTION = 10;
const QUESTION_COUNT = 10;
const DONT_KNOW_LABEL = "我不知道";

type QuizStatus = "idle" | "playing" | "finished";

export function QuizPage() {
  const [status, setStatus] = useState<QuizStatus>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const hasAnswered = selectedIndex !== null;
  const isLastQuestion = currentIndex === questions.length - 1;

  async function handleStart() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const generated = await fetchQuiz(QUESTION_COUNT);
      setQuestions(generated);
      setCurrentIndex(0);
      setSelectedIndex(null);
      setCorrectCount(0);
      setStatus("playing");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswer(optionIndex: number) {
    if (hasAnswered || !currentQuestion) return;
    setSelectedIndex(optionIndex);
    if (optionIndex === currentQuestion.correct_index) {
      setCorrectCount((count) => count + 1);
    }
    try {
      await registerVocabularyView(currentQuestion.vocabulary_id);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  function handleNext() {
    if (isLastQuestion) {
      setStatus("finished");
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelectedIndex(null);
  }

  // "我不知道" is always the last choice (index === options.length) and counts as a wrong answer.
  function optionClassName(optionIndex: number): string {
    if (!hasAnswered || !currentQuestion) return "quiz-option";
    if (optionIndex === currentQuestion.correct_index) return "quiz-option quiz-option-correct";
    if (optionIndex === selectedIndex) return "quiz-option quiz-option-wrong";
    return "quiz-option";
  }

  return (
    <div className="quiz-page">
      {errorMessage && <p className="error-banner">{errorMessage}</p>}

      {status === "idle" && (
        <div className="panel quiz-panel">
          <div className="panel-title">單字測驗</div>
          <p>每次從單字本產生 {QUESTION_COUNT} 題選擇題，每題 {POINTS_PER_QUESTION} 分。</p>
          <button onClick={handleStart} disabled={isLoading}>
            {isLoading ? "產生題目中..." : "開始測驗"}
          </button>
        </div>
      )}

      {status === "playing" && currentQuestion && (
        <div className="panel quiz-panel">
          <div className="panel-title">
            第 {currentIndex + 1} / {questions.length} 題
          </div>
          <div className="quiz-word">{currentQuestion.english_word}</div>
          <div className="quiz-options">
            {currentQuestion.options.map((option, optionIndex) => (
              <button
                key={optionIndex}
                className={optionClassName(optionIndex)}
                onClick={() => handleAnswer(optionIndex)}
                disabled={hasAnswered}
              >
                {option}
              </button>
            ))}
            <button
              className={`${optionClassName(currentQuestion.options.length)} quiz-option-dont-know`}
              onClick={() => handleAnswer(currentQuestion.options.length)}
              disabled={hasAnswered}
            >
              {DONT_KNOW_LABEL}
            </button>
          </div>
          {hasAnswered && (
            <button onClick={handleNext}>{isLastQuestion ? "查看成績" : "下一題"}</button>
          )}
        </div>
      )}

      {status === "finished" && (
        <div className="panel quiz-panel">
          <div className="panel-title">測驗結果</div>
          <div className="quiz-score">{correctCount * POINTS_PER_QUESTION} 分</div>
          <p>
            答對 {correctCount} / {questions.length} 題
          </p>
          <button onClick={handleStart} disabled={isLoading}>
            {isLoading ? "產生題目中..." : "再測一次"}
          </button>
        </div>
      )}
    </div>
  );
}
