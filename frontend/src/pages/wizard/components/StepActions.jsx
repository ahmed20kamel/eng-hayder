// src/pages/wizard/components/StepActions.jsx
export default function StepActions({
  onPrev,
  onNext,
  disableNext,
  nextLabel = "التالي →",
  nextClassName = ""
}) {
  return (
    <div className="wizard-footer">
      {onPrev ? (
        <button type="button" className="btn secondary" onClick={onPrev}>
          رجوع
        </button>
      ) : <span />}
      <button
        type="button"
        className={`btn ${nextClassName}`}
        onClick={onNext}
        disabled={disableNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}
