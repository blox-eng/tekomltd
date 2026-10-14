export class TurnError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TurnError';
    }
}

const MAX_TURN_WORDS = 3;

export function splitTurn(phrases: string[]): { start: string; turns: string[] } {
    if (phrases.length < 2) throw new TurnError('A turning heading needs at least two phrases');

    const words = phrases.map((p) => p.trim().split(/\s+/));
    const first = words[0]!;
    let shared = 0;
    while (shared < first.length && words.every((w) => w[shared] === first[shared])) shared++;

    if (shared === 0) throw new TurnError('The phrases do not share a start');

    const turns = words.map((w) => w.slice(shared).join(' '));
    for (const turn of turns) {
        const count = turn === '' ? 0 : turn.split(' ').length;
        if (count < 1 || count > MAX_TURN_WORDS) throw new TurnError(`A turn must be one to ${MAX_TURN_WORDS} words: "${turn}"`);
    }

    return { start: first.slice(0, shared).join(' '), turns };
}
