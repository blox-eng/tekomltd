import { describe, expect, it } from 'vitest';
import { enquiryHref, unitLabel } from './enquiry';

const BG = { flat: 'Ап.', garage: 'Гараж', parking: 'Паркомясто', storage: 'Склад', shop: 'Магазин' };

describe('unitLabel', () => {
    it('names a flat by its short word', () => expect(unitLabel({ type: 'flat', code: '12' }, BG)).toBe('Ап. 12'));
    it('names a garage', () => expect(unitLabel({ type: 'garage', code: '3' }, BG)).toBe('Гараж 3'));
});

describe('enquiryHref', () => {
    const href = enquiryHref({
        email: 'info@tekomltd.com',
        subjectPrefix: 'Запитване',
        project: 'Блок „Кула“ & Co',
        unit: 'Ап. 12',
        floor: 'ет. 4',
        url: 'https://tekomltd.com/projects/kula/12',
        greeting: 'Здравейте, интересувам се от Ап. 12.'
    });
    const query = new URLSearchParams(href.split('?')[1]!.replace(/\+/g, '%2B'));

    it('writes to the address', () => expect(href.startsWith('mailto:info@tekomltd.com?')).toBe(true));
    it('names the project, the unit and the floor in the subject', () => expect(query.get('subject')).toBe('Запитване: Блок „Кула“ & Co · Ап. 12, ет. 4'));
    it('puts the page address and a greeting in the body', () =>
        expect(query.get('body')).toBe('https://tekomltd.com/projects/kula/12\nЗдравейте, интересувам се от Ап. 12.\n\n'));
    it('encodes every part, so an & in a title cannot start a new field', () => {
        expect(href.split('?')[1]!.split('&')).toHaveLength(2);
        expect(href).not.toMatch(/[ „“·\n]/);
    });
});
