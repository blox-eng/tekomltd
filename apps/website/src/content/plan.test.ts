import { describe, expect, it } from 'vitest';
import { readPlan, writePlan, type Plan } from './plan';

const plan: Plan = {
    viewBox: [0, 0, 20, 12.5],
    walls: 'M0 0H20V12.5H0Z',
    units: [
        { code: '12', d: 'M0 0H10V12.5H0Z', x: 5, y: 6.25 },
        { code: 'A3', d: 'M10 0H20V12.5H10Z', x: 15, y: 6.25 }
    ]
};

describe('plan', () => {
    it('reads back what it writes', () => expect(readPlan(writePlan(plan))).toEqual(plan));
    it('refuses an svg without a viewBox', () => expect(() => readPlan('<svg/>')).toThrow('плана няма viewBox'));
    it('refuses an svg without walls', () =>
        expect(() => readPlan('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>')).toThrow('плана няма стени'));
});
