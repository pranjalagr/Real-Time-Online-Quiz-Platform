function Options({ options = [], selectedOption, onSelect, disabled = false }) {
  return (
    <div className="options-grid">
      {options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = selectedOption === optionNumber;

        return (
          <button
            key={`${option}-${optionNumber}`}
            className={`option-button${isSelected ? ' selected' : ''}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(optionNumber)}
          >
            <span>{optionNumber}</span>
            <strong>{option}</strong>
          </button>
        );
      })}
    </div>
  );
}

export default Options;
