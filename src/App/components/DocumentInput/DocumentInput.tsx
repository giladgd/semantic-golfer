import "./DocumentInput.css";

export function DocumentInput({value, disabled, onChange}: {value: string, disabled: boolean, onChange: (value: string) => void}) {
    return <section className="documentInput">
        <label htmlFor="documentText">Document</label>
        <textarea
            id="documentText"
            value={value}
            disabled={disabled}
            maxLength={32_000}
            spellCheck={false}
            placeholder="Type a document…"
            onChange={(event) => onChange(event.target.value)}
        />
        <div className="documentFooter">{value.length.toLocaleString()} characters</div>
    </section>;
}
