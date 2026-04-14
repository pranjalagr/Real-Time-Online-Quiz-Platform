import Options from './options.jsx';

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelect,
  onSubmit,
  isSubmitted,
  result
}) {
  if (!question) {
    return null;
  }

  return (
    <section className="question-card">
      <div className="question-meta">
        <span className="eyebrow">Question {questionNumber} of {totalQuestions}</span>
      </div>

      <h2>{question.question_text}</h2>

      <Options
        options={question.question_options}
        selectedOption={selectedOption}
        onSelect={onSelect}
        disabled={isSubmitted}
      />

      <div className="question-actions">
        <button
          className="primary-button"
          type="button"
          disabled={!selectedOption || isSubmitted}
          onClick={onSubmit}
        >
          {isSubmitted ? 'Submitted' : 'Submit Answer'}
        </button>

        {result ? (
          <p className={result.isCorrect ? 'form-success' : 'form-error'}>
            {result.isCorrect
              ? `Correct. Option ${result.correctOption} was right.`
              : `Incorrect. Correct option was ${result.correctOption}.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default QuestionCard;
