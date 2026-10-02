import type { JobOffer } from "@/lib/job-offer";

export type MatchStatus = "matched" | "partial" | "missing";
export type MatchCategory = "experience" | "technical" | "requirements" | "responsibilities" | "niceToHave";

export type MatchItem = {
    id: string;
    requirement: string;
    status: MatchStatus;
    evidence?: string;
};

export type MatchCriteria = Record<MatchCategory, Array<{ id: string; requirement: string }>>;

export type MatchAnalysis = {
    scores: Record<MatchCategory | "overall", number>;
    matches: Record<MatchCategory, MatchItem[]>;
};

export type Feedback = {
    strengths: string[];
    weaknesses: string[];
    missingRequirements: string[];
    partialMatches: string[];
    recommendations: string[];
};

export function createMatchCriteria(job: JobOffer): MatchCriteria {
    const seniority = job.seniority ? ` na poziomie ${job.seniority}` : "";

    return {
        experience: [{ id: "experience-0", requirement: `Doświadczenie na stanowisku ${job.title}${seniority}` }],
        technical: job.requiredSkills.map((skill, index) => ({
            id: `technical-${index}`,
            requirement: skill.context ? `${skill.name}: ${skill.context}` : skill.name,
        })),
        requirements: job.requirements.map((requirement, index) => ({
            id: `requirement-${index}`,
            requirement,
        })),
        responsibilities: job.responsibilities.map((responsibility, index) => ({
            id: `responsibility-${index}`,
            requirement: responsibility,
        })),
        niceToHave: job.niceToHaveSkills.map((skill, index) => ({
            id: `nice-to-have-${index}`,
            requirement: skill.context ? `${skill.name}: ${skill.context}` : skill.name,
        })),
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMatchStatuses(value: unknown, criteria: MatchCriteria): MatchAnalysis["matches"] {
    if (!isRecord(value)) throw new Error("AI zwróciło nieprawidłowe dopasowania.");

    const categories = Object.keys(criteria) as MatchCategory[];
    return Object.fromEntries(categories.map((category) => {
        const expected = criteria[category];
        const results = Array.isArray(value[category]) ? value[category] : [];
        const byId = new Map<string, Record<string, unknown>>();

        for (const result of results) {
            if (isRecord(result) && typeof result.id === "string" && !byId.has(result.id)) {
                byId.set(result.id, result);
            }
        }

        const items = expected.map(({ id, requirement }) => {
            const result = byId.get(id);
            const status = result?.status;
            const item: MatchItem = {
                id,
                requirement,
                status: status === "matched" || status === "partial" ? status : "missing",
            };
            if (typeof result?.evidence === "string" && result.evidence.trim()) {
                item.evidence = result.evidence.trim();
            }
            return item;
        });

        return [category, items];
    })) as MatchAnalysis["matches"];
}

export function calculateScores(matches: MatchAnalysis["matches"]): MatchAnalysis["scores"] {
    const weights: Record<MatchCategory, number> = {
        experience: 0.25,
        technical: 0.35,
        requirements: 0.2,
        responsibilities: 0.15,
        niceToHave: 0.05,
    };
    const categoryScore = (items: MatchItem[]) => items.length === 0
        ? 0
        : Math.round(items.reduce((total, item) => total + (item.status === "matched" ? 1 : item.status === "partial" ? 0.5 : 0), 0) / items.length * 100);
    const scores = Object.fromEntries(
        (Object.keys(weights) as MatchCategory[]).map((category) => [category, categoryScore(matches[category])]),
    ) as Record<MatchCategory, number>;
    const activeWeight = (Object.keys(weights) as MatchCategory[])
        .filter((category) => matches[category].length > 0)
        .reduce((total, category) => total + weights[category], 0);
    const overall = activeWeight === 0
        ? 0
        : Math.round((Object.keys(weights) as MatchCategory[])
            .filter((category) => matches[category].length > 0)
            .reduce((total, category) => total + scores[category] * weights[category], 0) / activeWeight);

    return { ...scores, overall };
}

export function parseFeedback(value: unknown): Feedback {
    if (!isRecord(value)) throw new Error("AI zwróciło nieprawidłowy feedback.");
    const fields: Array<keyof Feedback> = [
        "strengths", "weaknesses", "missingRequirements", "partialMatches", "recommendations",
    ];
    const feedback = {} as Feedback;

    for (const field of fields) {
        const items = value[field];
        if (!Array.isArray(items) || !items.every((item) => typeof item === "string")) {
            throw new Error(`AI zwróciło nieprawidłowe pole feedbacku: ${field}.`);
        }
        feedback[field] = items.map((item: string) => item.trim()).filter(Boolean);
    }

    return feedback;
}