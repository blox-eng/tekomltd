import { describe, expect, it } from 'vitest';
import { TurnError, splitTurn } from './turn';

describe('splitTurn', () => {
    it('splits the shared start', () => {
        expect(splitTurn(['Хората зад мазилката', 'Хората зад Вашата мечта', 'Хората зад Вашето доверие'])).toEqual({
            start: 'Хората зад',
            turns: ['мазилката', 'Вашата мечта', 'Вашето доверие']
        });
    });

    it('rejects phrases with a different start', () => {
        expect(() => splitTurn(['Хората зад мазилката', 'Екипът зад мечтата'])).toThrow(TurnError);
    });

    it('needs at least two phrases', () => {
        expect(() => splitTurn(['Хората зад мазилката'])).toThrow(TurnError);
    });

    it('rejects a turn longer than three words', () => {
        expect(() => splitTurn(['Хората зад мазилката', 'Хората зад една две три четири'])).toThrow(TurnError);
    });
});
