type Message = {
    role: "system" | "user";
    content: string;
};

export class OpenAIRequestError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
    }
}

export async function requestOpenAIJson(messages: Message[]): Promise<unknown> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new OpenAIRequestError("Brakuje OPENAI_API_KEY w konfiguracji serwera.", 503);
    }

    let response: Response;
    try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            signal: AbortSignal.timeout(45_000),
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                temperature: 0.1,
                response_format: { type: "json_object" },
                messages,
            }),
        });
    } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
            throw new OpenAIRequestError("Przekroczono czas oczekiwania na AI.", 504);
        }
        throw new OpenAIRequestError("Nie udało się połączyć z usługą AI.", 502);
    }

    if (!response.ok) {
        throw new OpenAIRequestError("Usługa AI nie mogła przetworzyć danych.", 502);
    }

    const result = await response.json() as {
        choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
        throw new OpenAIRequestError("AI nie zwróciło danych.", 502);
    }

    try {
        return JSON.parse(content);
    } catch {
        throw new OpenAIRequestError("AI zwróciło nieprawidłowy JSON.", 502);
    }
}