import { describe, expect, it } from 'vitest';
import { DEFAULT_STAGES, parseQuarter, sofiaToday, stagesOf, stageState } from './progress';

describe('stageState', () => {
    it('is done when the stage has a done date', () => expect(stageState({ key: 'act14', started: '2026-01-02', done: '2026-03-01' })).toBe('done'));
    it('is active when the stage only has a start date', () => expect(stageState({ key: 'act14', started: '2026-01-02' })).toBe('active'));
    it('is next when the stage has no date', () => expect(stageState({ key: 'act14' })).toBe('next'));
});

describe('stagesOf', () => {
    it('uses the default list of the kind when the project lists no stages', () =>
        expect(stagesOf({ status: 'in_progress', kind: 'facade' }).map((s) => s.key)).toEqual([
            'scaffold',
            'insulation',
            'render',
            'scaffold_down',
            'handover'
        ]));
    it('keeps the stages the project lists', () =>
        expect(stagesOf({ status: 'in_progress', kind: 'house', stages: [{ label: { bg: 'Разкопки' } }] })).toEqual([{ label: { bg: 'Разкопки' } }]));
    it('has the default lists of the spec', () => {
        expect(DEFAULT_STAGES.building).toEqual(['design', 'permit', 'excavation', 'zero', 'act14', 'act15', 'act16']);
        expect(DEFAULT_STAGES.house).toEqual(['design', 'permit', 'zero', 'rough', 'roof', 'finishing', 'use_permit']);
    });
});

describe('parseQuarter', () => {
    it('reads year and quarter', () => expect(parseQuarter('2028-Q1')).toEqual({ year: 2028, quarter: 1 }));
});

describe('sofiaToday', () => {
    it('uses the date in Sofia, not on the build machine', () => {
        expect(sofiaToday(new Date('2026-11-12T22:30:00Z'))).toBe('2026-11-13');
        expect(sofiaToday(new Date('2026-07-01T20:59:00Z'))).toBe('2026-07-01');
    });
});
