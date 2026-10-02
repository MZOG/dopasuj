"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ArrowRight, Link, Check, Circle, FileText, LoaderCircle, RotateCcw } from "lucide-react";
import type { Candidate } from "@/lib/candidate";
import type { JobOffer } from "@/lib/job-offer";
import type { Feedback, MatchAnalysis, MatchCategory } from "@/lib/matching";

type AnalysisStep = "job" | "candidate" | "matching" | "feedback";

async function apiRequest<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result = await response.json() as T & { error?: string };

    if (!response.ok) {
        throw new Error(result.error || "Nie udało się zakończyć analizy.");
    }

    return result;
}

const scoreCategories: Array<{ key: MatchCategory; label: string }> = [
    { key: "experience", label: "Doświadczenie" },
    { key: "technical", label: "Techniczne" },
    { key: "requirements", label: "Wymagania" },
    { key: "responsibilities", label: "Obowiązki" },
    { key: "niceToHave", label: "Dodatkowe atuty" },
];

const analysisSteps: Array<{ key: AnalysisStep; label: string }> = [
    { key: "job", label: "Analizuję ofertę" },
    { key: "candidate", label: "Analizuję CV" },
    { key: "matching", label: "Porównuję wymagania" },
    { key: "feedback", label: "Przygotowuję feedback" },
];

function formatScoreLabel(status: string) {
    if (status === "matched") return "Dopasowane";
    if (status === "partial") return "Częściowo";
    return "Brak";
}

export default function Home() {
    const cvInputRef = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState("");
    const [showCvStep, setShowCvStep] = useState(false);
    const [analysisStep, setAnalysisStep] = useState<AnalysisStep | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState<number | null>(null);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);

    async function handleJobSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setShowCvStep(true);
        setJobOffer(null);
        setCvFile(null);
        setCandidate(null);
        setAnalysis(null);
        setFeedback(null);
    }

    function selectFile(file: File | undefined) {
        if (!file) return;
        setCvFile(file);
        setCandidate(null);
        setAnalysis(null);
        setFeedback(null);
        setError(null);
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        selectFile(event.dataTransfer.files[0]);
    }

    function resetAnalysis() {
        setUrl("");
        setShowCvStep(false);
        setAnalysisStep(null);
        setAnalysisProgress(null);
        setCvFile(null);
        setError(null);
        setJobOffer(null);
        setCandidate(null);
        setAnalysis(null);
        setFeedback(null);
    }

    async function handleCvSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!showCvStep || !cvFile) return;

        setError(null);
        setJobOffer(null);
        setCandidate(null);
        setAnalysis(null);
        setFeedback(null);
        setAnalysisProgress(0);
        setAnalysisStep("job");

        try {
            const offer = await apiRequest<JobOffer>("/api/job-offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            setJobOffer(offer);
            setAnalysisProgress(25);

            setAnalysisStep("candidate");
            setAnalysisProgress(30);
            const formData = new FormData();
            formData.set("file", cvFile);
            const parsedCandidate = await apiRequest<Candidate>("/api/candidate", {
                method: "POST",
                body: formData,
            });
            setCandidate(parsedCandidate);
            setAnalysisProgress(55);

            setAnalysisStep("matching");
            setAnalysisProgress(60);
            const matchAnalysis = await apiRequest<MatchAnalysis>("/api/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job: offer, candidate: parsedCandidate }),
            });
            setAnalysis(matchAnalysis);
            setAnalysisProgress(82);

            setAnalysisStep("feedback");
            setAnalysisProgress(88);
            const feedbackResult = await apiRequest<{ feedback: Feedback }>("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job: offer, candidate: parsedCandidate, matches: matchAnalysis.matches }),
            });
            setFeedback(feedbackResult.feedback);
            setAnalysisProgress(100);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Wystąpił nieoczekiwany błąd.");
        } finally {
            setAnalysisStep(null);
        }
    }

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-4 py-16">
            <h1 className="text-3xl font-semibold">Czy pasujesz do tej pracy?</h1>
            <p className="text-center text-[17px]">Wklej ofertę pracy i swoje CV.
                <span className="block">Sprawdź dopasowanie w kilka minut.</span></p>
            {!showCvStep ? (
                <form onSubmit={handleJobSubmit} className="flex w-full max-w-md flex-col items-center gap-3">
                    <InputGroup className="h-10 pl-1 shadow-none">
                        <InputGroupInput
                            type="url"
                            required
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            placeholder="Wklej link do oferty pracy"
                            aria-label="Link do oferty pracy"
                        />
                        <InputGroupAddon>
                            <Link />
                        </InputGroupAddon>
                    </InputGroup>
                    <Button type="submit" size="lg" className="px-5">
                        Sprawdź ofertę
                        <ArrowRight />
                    </Button>
                </form>
            ) : (
                <div className="mt-3 flex w-full max-w-xl items-center justify-between gap-4 border-y py-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{url}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!!analysisStep}
                        onClick={() => {
                            setShowCvStep(false);
                            setAnalysisProgress(null);
                            setAnalysisStep(null);
                            setJobOffer(null);
                            setCandidate(null);
                            setAnalysis(null);
                            setFeedback(null);
                        }}
                    >
                        Zmień link
                    </Button>
                </div>
            )}
            {error && <p role="alert" className="mt-3 text-center text-sm text-destructive">{error}</p>}

            {showCvStep && <>
                <section aria-label="Oferta wybrana do analizy" className="mt-8 max-w-xl border-y py-5">
                    <div className="flex items-center gap-3">
                        <Link className="size-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <h2 className="font-semibold">Oferta do analizy</h2>
                            <p className="truncate text-sm text-muted-foreground">{url}</p>
                        </div>
                    </div>
                </section>

                <form onSubmit={handleCvSubmit} className="mt-2 w-full max-w-xl">
                    <h2 className="mb-3 text-lg font-semibold">Dodaj swoje CV</h2>
                    <input
                        ref={cvInputRef}
                        id="cv-upload"
                        className="sr-only"
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(event) => {
                            selectFile(event.currentTarget.files?.[0]);
                            event.currentTarget.value = "";
                        }}
                        aria-label="Wybierz CV w formacie PDF lub DOCX"
                    />
                    {!cvFile ? (
                        <label
                            htmlFor="cv-upload"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={handleDrop}
                            className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 px-5 py-6 text-center transition-colors hover:bg-muted"
                        >
                            <FileText className="size-6 text-muted-foreground" />
                            <span className="font-medium">Upuść plik tutaj lub wybierz z urządzenia</span>
                            <span className="text-sm text-muted-foreground">PDF tekstowy lub DOCX, maksymalnie 8 MB</span>
                        </label>
                    ) : (
                        <div className="flex min-h-24 items-center gap-4 border-y py-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <FileText className="size-9" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{cvFile.name}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {cvFile.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX"} · CV gotowe do analizy
                                </p>
                            </div>
                            <Button type="button" variant="outline" onClick={() => cvInputRef.current?.click()}>
                                Zamień CV
                            </Button>
                        </div>
                    )}
                    <div className="mt-4 flex justify-center">
                        <Button type="submit" size="lg" className="px-5" disabled={!cvFile || !!analysisStep}>
                            {analysisStep ? "Analizuję..." : "Sprawdź dopasowanie"}
                            {!analysisStep && <ArrowRight />}
                        </Button>
                    </div>
                </form>
            </>}

            {analysisProgress !== null && (
                <section aria-label="Postęp analizy" className="mt-5 w-full max-w-xl">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">
                            {analysisStep ? analysisSteps.find((step) => step.key === analysisStep)?.label
                                : analysisProgress === 100 ? "Analiza zakończona" : "Analiza przerwana"}
                        </span>
                        <span className="tabular-nums">{analysisProgress}%</span>
                    </div>
                    <div
                        role="progressbar"
                        aria-label="Postęp analizy dopasowania"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={analysisProgress}
                        className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${analysisProgress}%` }} />
                    </div>
                </section>
            )}

            {(analysisStep || candidate || analysis || analysisProgress !== null) && (
                <ol aria-label="Etapy analizy" className="mt-6 flex w-full max-w-xl flex-col gap-3 border-y py-5">
                    {analysisSteps.map(({ key, label }) => {
                        const complete = key === "job" ? !!jobOffer
                            : key === "candidate" ? !!candidate
                                : key === "matching" ? !!analysis
                                    : !!feedback;
                        const active = analysisStep === key;
                        return (
                            <li key={key} className="flex items-center gap-3 text-sm">
                                {complete
                                    ? <Check className="size-4 text-emerald-700" />
                                    : active
                                        ? <LoaderCircle className="size-4 animate-spin text-primary" />
                                        : <Circle className="size-4 text-muted-foreground" />}
                                <span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
                            </li>
                        );
                    })}
                </ol>
            )}

            {candidate && <p className="text-sm text-muted-foreground">
                CV rozpoznane{candidate.name ? `: ${candidate.name}` : ""}{candidate.title ? ` · ${candidate.title}` : ""}
            </p>}

            {analysis && <section aria-label="Wynik dopasowania" className="mt-5 w-full">
                <div className="border-y py-5">
                    <p className="text-sm font-medium text-muted-foreground">Dopasowanie ogólne</p>
                    <p className="mt-1 text-5xl font-semibold tabular-nums">{analysis.scores.overall}%</p>
                </div>
                <ul className="divide-y">
                    {scoreCategories.map(({ key, label }) => (
                        <li key={key} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-x-4 gap-y-2 py-4">
                            <span className="font-medium">{label}</span>
                            <span className="text-right tabular-nums">{analysis.scores[key]}%</span>
                            <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${analysis.scores[key]}%` }} />
                            </div>
                            <ul className="col-span-2 space-y-2 pt-1">
                                {analysis.matches[key].map((match) => (
                                    <li key={match.id} className="rounded-sm bg-muted/50 px-3 py-2.5 text-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="min-w-0 flex-1">{match.requirement}</span>
                                            <span className={match.status === "matched"
                                                ? "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm bg-emerald-700/10 px-2 py-1 font-medium text-emerald-800"
                                                : match.status === "partial"
                                                    ? "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm bg-amber-700/10 px-2 py-1 font-medium text-amber-800"
                                                    : "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm bg-destructive/10 px-2 py-1 font-medium text-destructive"}>
                                                {match.status === "matched" ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
                                                {formatScoreLabel(match.status)}
                                            </span>
                                        </div>
                                        {match.evidence && <p className="mt-2 text-xs text-muted-foreground">{match.evidence}</p>}
                                    </li>
                                ))}
                                {analysis.matches[key].length === 0 && (
                                    <li className="py-1 text-sm text-muted-foreground">Brak kryteriów w tej kategorii.</li>
                                )}
                            </ul>
                        </li>
                    ))}
                </ul>
            </section>}

            {feedback && <section aria-label="Informacja zwrotna" className="mt-8 w-full border-t pt-5">
                <h2 className="mb-4 text-xl font-semibold">Informacja zwrotna</h2>
                <div className="flex flex-col divide-y">
                    {([
                        ["Mocne strony", feedback.strengths],
                        ["Luki", feedback.weaknesses],
                        ["Brakujące wymagania", feedback.missingRequirements],
                        ["Częściowe dopasowania", feedback.partialMatches],
                        ["Rekomendacje", feedback.recommendations],
                    ] as Array<[string, string[]]>).map(([title, items]) => items.length > 0 && (
                        <div key={title} className="py-4 first:pt-0">
                            <h3 className="mb-2 font-medium">{title}</h3>
                            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>}

            {analysis && (
                <div className="mt-8 flex w-full justify-center border-t pt-6">
                    <Button type="button" variant="outline" onClick={resetAnalysis}>
                        <RotateCcw />
                        Sprawdź kolejną ofertę
                    </Button>
                </div>
            )}
        </main>
    );
}
