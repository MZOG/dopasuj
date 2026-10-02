import type { Language, Skill } from "@/lib/job-offer";

export type Experience = {
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description: string;
    technologies: string[];
};

export type Education = {
    institution: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
};

export type Candidate = {
    name?: string;
    title?: string;
    summary?: string;
    experience: Experience[];
    skills: Skill[];
    education: Education[];
    languages: Language[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(value: unknown, field: string): string {
    const result = optionalString(value);
    if (!result) throw new Error(`Nieprawidłowe pole CV: ${field}.`);
    return result;
}

function stringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error(`Nieprawidłowe pole CV: ${field}.`);
    }
    return value.map((item: string) => item.trim()).filter(Boolean);
}

function recordArray(value: unknown, field: string): Record<string, unknown>[] {
    if (!Array.isArray(value) || !value.every(isRecord)) {
        throw new Error(`Nieprawidłowe pole CV: ${field}.`);
    }
    return value;
}

function parseSkills(value: unknown): Skill[] {
    return recordArray(value, "skills").map((item) => ({
        name: requiredString(item.name, "skills.name"),
        context: optionalString(item.context),
    }));
}

function parseLanguages(value: unknown): Language[] {
    return recordArray(value, "languages").map((item) => ({
        name: requiredString(item.name, "languages.name"),
        level: optionalString(item.level),
    }));
}

export function parseCandidate(value: unknown): Candidate {
    if (!isRecord(value)) throw new Error("AI zwróciło nieprawidłowy format CV.");

    const experience = recordArray(value.experience, "experience").map((item) => ({
        company: requiredString(item.company, "experience.company"),
        role: requiredString(item.role, "experience.role"),
        startDate: optionalString(item.startDate),
        endDate: optionalString(item.endDate),
        description: requiredString(item.description, "experience.description"),
        technologies: stringArray(item.technologies, "experience.technologies"),
    }));
    const education = recordArray(value.education, "education").map((item) => ({
        institution: requiredString(item.institution, "education.institution"),
        degree: optionalString(item.degree),
        field: optionalString(item.field),
        startDate: optionalString(item.startDate),
        endDate: optionalString(item.endDate),
        description: optionalString(item.description),
    }));

    return {
        name: optionalString(value.name),
        title: optionalString(value.title),
        summary: optionalString(value.summary),
        experience,
        skills: parseSkills(value.skills),
        education,
        languages: parseLanguages(value.languages),
    };
}