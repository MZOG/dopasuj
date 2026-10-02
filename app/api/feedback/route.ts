import { parseCandidate } from "@/lib/candidate";
import { parseJobOffer } from "@/lib/job-offer";
import {
    calculateScores,
    createMatchCriteria,
    parseFeedback,
    parseMatchStatuses,
} from "@/lib/matching";
import { OpenAIRequestError, requestOpenAIJson } from "@/lib/openai";

function errorResponse(error: unknown) {
    if (error instanceof OpenAIRequestError) {
        return Response.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
        return Response.json({ error: "Nieprawidłowe żądanie." }, { status: 400 });
    }
    return Response.json({ error: "Nie udało się przygotować feedbacku." }, { status: 422 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as {
            job?: unknown;
            candidate?: unknown;
            matches?: unknown;
        };
        const job = parseJobOffer(body.job);
        const candidate = parseCandidate(body.candidate);
        const criteria = createMatchCriteria(job);
        const matches = parseMatchStatuses(body.matches, criteria);
        const scores = calculateScores(matches);
        const feedback = await requestOpenAIJson([
            {
                role: "system",
                content: `Prepare concise, factual feedback in Polish about a candidate and a job. Return exactly a JSON object with string arrays: strengths, weaknesses, missingRequirements, partialMatches, recommendations. Base all statements on the provided job, CV, classified matches, and computed scores. Do not change or invent a score, requirement, skill, or experience. Keep recommendations actionable and do not repeat the same point across fields.`,
            },
            { role: "user", content: JSON.stringify({ job, candidate, matches, scores }) },
        ]);

        try {
            return Response.json({ feedback: parseFeedback(feedback) });
        } catch {
            return Response.json({ error: "AI zwróciło feedback w nieprawidłowym formacie." }, { status: 502 });
        }
    } catch (error) {
        return errorResponse(error);
    }
}