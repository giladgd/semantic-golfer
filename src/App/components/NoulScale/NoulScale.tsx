import "./NoulScale.css";

export function NoulScale({value}: {value?: number}) {
    return <div
        className="noulScale"
        role={value == null ? undefined : "meter"}
        aria-label="Probability of yes"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value == null ? undefined : value * 100}
    >
        <div className="track">
            {value != null && <span className="position" style={{left: `${Math.max(0, Math.min(1, value)) * 100}%`}} />}
        </div>
        <div className="labels" aria-hidden="true"><span>No</span><span>Yes</span></div>
    </div>;
}
