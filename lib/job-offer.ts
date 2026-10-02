export type Skill = {
    name: string;
    context?: string;
};

export type Language = {
    name: string;
    level?: string;
};

export type JobOffer = {
    title: string;
    company?: string;
    seniority?: string;
    location?: string[];
    workMode?: string;
    employmentType?: string;
    requiredSkills: Skill[];
    niceToHaveSkills: Skill[];
    responsibilities: string[];
    requirements: string[];
    languages?: Language[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`AI zwróciło nieprawidłowe pole: ${field}.`);
    }

    return value.trim();
}

function optionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error(`AI zwróciło nieprawidłowe pole: ${field}.`);
    }

    return value.map((item: string) => item.trim()).filter(Boolean);
}

function objectArray<T extends { name: string }>(
    value: unknown,
    field: string,
    extraField?: "context" | "level",
): T[] {
    if (!Array.isArray(value)) {
        throw new Error(`AI zwróciło nieprawidłowe pole: ${field}.`);
    }

    return value.map((item) => {
        if (!isRecord(item)) {
            throw new Error(`AI zwróciło nieprawidłowe pole: ${field}.`);
        }

        const result: Record<string, string> = {
            name: requiredString(item.name, field),
        };
        const extra = extraField ? optionalString(item[extraField]) : undefined;

        if (extraField && extra) {
            result[extraField] = extra;
        }

        return result as T;
    });
}

export function parseJobOffer(value: unknown): JobOffer {
    if (!isRecord(value)) {
        throw new Error("AI zwróciło nieprawidłowy format oferty.");
    }

    return {
        title: requiredString(value.title, "title"),
        company: optionalString(value.company),
        seniority: optionalString(value.seniority),
        location: value.location == null ? undefined : stringArray(value.location, "location"),
        workMode: optionalString(value.workMode),
        employmentType: optionalString(value.employmentType),
        requiredSkills: objectArray<Skill>(value.requiredSkills, "requiredSkills", "context"),
        niceToHaveSkills: objectArray<Skill>(value.niceToHaveSkills, "niceToHaveSkills", "context"),
        responsibilities: stringArray(value.responsibilities, "responsibilities"),
        requirements: stringArray(value.requirements, "requirements"),
        languages: value.languages == null
            ? undefined
            : objectArray<Language>(value.languages, "languages", "level"),
    };
}