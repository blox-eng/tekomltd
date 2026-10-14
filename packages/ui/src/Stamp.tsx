export function Stamp({ label, date }: { label: string; date: string }) {
    return (
        <span className="stamp">
            {label}
            <small>{date}</small>
        </span>
    );
}
