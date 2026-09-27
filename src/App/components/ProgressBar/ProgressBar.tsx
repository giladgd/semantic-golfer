import "./ProgressBar.css";

export function ProgressBar({value, label}: {value?: number, label: string}) {
    return <div
        className="decisionProgressBar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value == null ? undefined : Math.round(value * 100)}
        data-indeterminate={value == null || undefined}
    >
        <div className="fill" style={{transform: `scaleX(${Math.max(0, Math.min(1, value ?? 0.35))})`}} />
    </div>;
}
