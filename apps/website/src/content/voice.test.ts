import { describe, expect, it } from 'vitest';
import { voiceProblems } from './voice';

describe('voiceProblems', () => {
    it('rejects an em dash and names the fix', () => {
        expect(voiceProblems('Фасада — 2021')).toEqual(['em dash (—): use a comma, a colon or a new sentence']);
    });

    it('keeps an en dash in a range', () => {
        expect(voiceProblems('ул. „Х. Д. Асенов“ 118–120, 9.00–18.00')).toEqual([]);
    });

    it.each([
        ['Поискайте оферта', 'оферта'],
        ['Цената е добра', 'Цената'],
        ['апартамент висок клас', 'висок клас'],
        ['домът на мечтите', 'мечтите'],
        ['Request a quote', 'quote'],
        ['premium construction', 'premium'],
        ['Angebot anfragen', 'Angebot'],
        ['hochwertiger Innenausbau', 'hochwertiger']
    ])('rejects the price or luxury word in "%s"', (text, word) => {
        expect(voiceProblems(text)).toEqual([`"${word}": no price, luxury or bargain words (docs/VOICE.md)`]);
    });

    it('does not flag a word that only contains a banned stem', () => {
        expect(voiceProblems('Оценка на сградата. ТЕКОМ е съинвеститор. Quoted text.')).toEqual([]);
    });
});
