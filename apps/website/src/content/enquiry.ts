import type { UnitType } from './schema';

/** "Ап. 12", "Гараж 3": the word of the type, then the code. */
export const unitLabel = (unit: { type: UnitType; code: string }, words: Record<UnitType, string>) => `${words[unit.type]} ${unit.code}`;

export type Enquiry = { email: string; subjectPrefix: string; project: string; unit: string; floor: string; url: string; greeting: string };

/** A `mailto:` link that opens the buyer's mail app with the unit already named. No form, no server. */
export function enquiryHref({ email, subjectPrefix, project, unit, floor, url, greeting }: Enquiry): string {
    const subject = `${subjectPrefix}: ${project} · ${unit}, ${floor}`;
    const body = `${url}\n${greeting}\n\n`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
