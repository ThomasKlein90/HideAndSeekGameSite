"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type {
  QuestionAnswerType,
  QuestionCategory,
  SeekerAnnotationType,
} from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type QuestionTemplate = {
  id: string;
  category: QuestionCategory;
  title: string;
  prompt: string;
  answer_type: QuestionAnswerType;
  reward_rule: string;
};

type AnsweredQuestion = {
  id: string;
  answer: string;
  answered_at: string;
  round_id: string | null;
  reward_note: string | null;
  question_templates: {
    title: string;
    category: QuestionCategory;
  } | null;
  rounds: {
    number: number;
  } | null;
};

type SeekerAnnotation = {
  id: string;
  annotation_type: SeekerAnnotationType;
  title: string;
  note: string;
  location_label: string | null;
  created_at: string;
};

const categoryDetails: Record<
  QuestionCategory,
  { description: string; label: string }
> = {
  matching: {
    label: "Matching",
    description: "Compare a hider detail against an approved reference.",
  },
  measuring: {
    label: "Measuring",
    description: "Ask for a defined distance, count, or other measurement.",
  },
  thermometer: {
    label: "Thermometer",
    description: "Use a bounded response to indicate relative proximity.",
  },
  radar: {
    label: "Radar",
    description: "Request a targeted geographic or transit signal.",
  },
  tentacles: {
    label: "Tentacles",
    description: "Use a broader, multi-part deduction question.",
  },
  photos: {
    label: "Photos",
    description: "Request a photo response within the agreed game rules.",
  },
};

type SeekerQuestionBoardProps = {
  gameId: string;
  userId: string;
};

export function SeekerQuestionBoard({
  gameId,
  userId,
}: SeekerQuestionBoardProps) {
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState<Set<string>>(
    new Set(),
  );
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>(
    [],
  );
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<SeekerAnnotation[]>([]);
  const [annotationType, setAnnotationType] =
    useState<SeekerAnnotationType>("note");
  const [annotationTitle, setAnnotationTitle] = useState("");
  const [annotationNote, setAnnotationNote] = useState("");
  const [annotationLocation, setAnnotationLocation] = useState("");
  const [isAnnotationLoading, setIsAnnotationLoading] = useState(true);
  const [isAnnotationSubmitting, setIsAnnotationSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase
      .from("question_templates")
      .select("id, category, title, prompt, answer_type, reward_rule")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setError(loadError.message);
          return;
        }

        setQuestions(data);
      });
  }, []);

  const loadAnsweredQuestions = useCallback(async () => {
    setError("");
    setIsHistoryLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: historyError } = await supabase
      .from("question_events")
      .select(
        "id, answer, answered_at, round_id, reward_note, question_templates(title, category), rounds(number)",
      )
      .eq("game_id", gameId)
      .eq("status", "answered")
      .order("answered_at", { ascending: false });

    setIsHistoryLoading(false);

    if (historyError) {
      setError(historyError.message);
      return;
    }

    setAnsweredQuestions(data as AnsweredQuestion[]);
  }, [gameId]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase
      .from("rounds")
      .select("id")
      .eq("game_id", gameId)
      .is("ended_at", null)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: roundError }) => {
        if (roundError) {
          setError(roundError.message);
          return;
        }

        setCurrentRoundId(data?.id ?? null);
      });
  }, [gameId]);

  useEffect(() => {
    queueMicrotask(() => void loadAnsweredQuestions());
  }, [loadAnsweredQuestions]);

  const loadAnnotations = useCallback(async () => {
    setIsAnnotationLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error: annotationError } = await supabase
      .from("seeker_annotations")
      .select("id, annotation_type, title, note, location_label, created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });

    setIsAnnotationLoading(false);

    if (annotationError) {
      setError(annotationError.message);
      return;
    }

    setAnnotations(data as SeekerAnnotation[]);
  }, [gameId]);

  useEffect(() => {
    queueMicrotask(() => void loadAnnotations());
  }, [loadAnnotations]);

  async function createAnnotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = annotationTitle.trim();
    const note = annotationNote.trim();
    const locationLabel = annotationLocation.trim();

    if (!title || isAnnotationSubmitting) {
      return;
    }

    if (!currentRoundId) {
      setError("No active round is available for this annotation.");
      return;
    }

    setError("");
    setIsAnnotationSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error: annotationError } = await supabase
      .from("seeker_annotations")
      .insert({
        game_id: gameId,
        round_id: currentRoundId,
        created_by: userId,
        annotation_type: annotationType,
        title,
        note,
        location_label: locationLabel || null,
      })
      .select("id, annotation_type, title, note, location_label, created_at")
      .single();

    setIsAnnotationSubmitting(false);

    if (annotationError) {
      setError(annotationError.message);
      return;
    }

    setAnnotations((currentAnnotations) => [data as SeekerAnnotation, ...currentAnnotations]);
    setAnnotationTitle("");
    setAnnotationNote("");
    setAnnotationLocation("");
    setStatus("Seeker annotation saved.");
  }

  async function deleteAnnotation(annotationId: string) {
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error: deleteError } = await supabase
      .from("seeker_annotations")
      .delete()
      .eq("id", annotationId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setAnnotations((currentAnnotations) =>
      currentAnnotations.filter((annotation) => annotation.id !== annotationId),
    );
  }

  const selectedQuestion = questions.find(
    (question) => question.category === selectedCategory,
  );

  async function submitQuestion() {
    if (!selectedQuestion || isSubmitting) {
      return;
    }

    if (!currentRoundId) {
      setError("No active round is available for this game.");
      return;
    }

    setError("");
    setStatus("");
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: submitError } = await supabase.from("question_events").insert({
      game_id: gameId,
      round_id: currentRoundId,
      question_template_id: selectedQuestion.id,
      asked_by: userId,
    });

    setIsSubmitting(false);

    if (submitError) {
      setError(
        submitError.code === "23505"
          ? "This question has already been submitted for the current round."
          : submitError.message,
      );
      return;
    }

    setSubmittedQuestionIds((questionIds) => {
      const nextQuestionIds = new Set(questionIds);
      nextQuestionIds.add(selectedQuestion.id);
      return nextQuestionIds;
    });
    setIsConfirming(false);
    setStatus("Question sent to the Hider Team.");
  }

  return (
    <section className="seeker-board" aria-labelledby="seeker-board-heading">
      <div className="board-heading">
        <div>
          <p className="eyebrow">Seeker board</p>
          <h2 id="seeker-board-heading">Choose a question category.</h2>
        </div>
        <span>Placeholder catalogue</span>
      </div>
      <p className="board-description">
        These categories establish the board structure only. Add the approved
        question text, card draw rules, and answer details before gameplay.
      </p>
      {error ? (
        <p className="board-error" role="status">
          {error}
        </p>
      ) : (
        <div className="question-category-grid">
          {(Object.keys(categoryDetails) as QuestionCategory[]).map((category) => {
            const details = categoryDetails[category];
            const question = questions.find(
              (candidate) => candidate.category === category,
            );

            return (
              <button
                aria-pressed={selectedCategory === category}
                className={
                  selectedCategory === category
                    ? "question-category is-selected"
                    : "question-category"
                }
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
              >
                <span>{details.label}</span>
                <small>{question?.reward_rule ?? "Loading..."}</small>
              </button>
            );
          })}
        </div>
      )}
      {selectedQuestion && (
        <div className="question-detail">
          <p className="eyebrow">
            {categoryDetails[selectedQuestion.category].label}
          </p>
          <h3>{selectedQuestion.title}</h3>
          <p>{selectedQuestion.prompt}</p>
          <dl>
            <div>
              <dt>Answer format</dt>
              <dd>{selectedQuestion.answer_type.replace("_", " ")}</dd>
            </div>
            <div>
              <dt>Card reward</dt>
              <dd>{selectedQuestion.reward_rule}</dd>
            </div>
          </dl>
          {submittedQuestionIds.has(selectedQuestion.id) ? (
            <p className="question-submitted" role="status">
              This question has been sent to the Hider Team.
            </p>
          ) : isConfirming ? (
            <div className="question-confirmation">
              <p>Send this question to the Hider Team?</p>
              <div className="question-actions">
                <button
                  className="button button-primary"
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => void submitQuestion()}
                >
                  {isSubmitting ? "Sending..." : "Confirm and send"}
                </button>
                <button
                  className="text-button"
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => setIsConfirming(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setError("");
                setStatus("");
                setIsConfirming(true);
              }}
            >
              Submit question
            </button>
          )}
        </div>
      )}
      {status && (
        <p className="board-status" role="status">
          {status}
        </p>
      )}
      {!questions.length && !error && <p className="board-loading">Loading categories...</p>}
      <section className="answer-history" aria-labelledby="answer-history-heading">
        <div className="board-heading">
          <div>
            <p className="eyebrow">Answer history</p>
            <h3 id="answer-history-heading">Questions already answered.</h3>
          </div>
          <button
            className="text-button"
            disabled={isHistoryLoading}
            type="button"
            onClick={() => void loadAnsweredQuestions()}
          >
            Refresh
          </button>
        </div>
        {isHistoryLoading ? (
          <p className="board-loading" role="status">
            Loading answers...
          </p>
        ) : answeredQuestions.length ? (
          <div className="answer-history-list">
            {answeredQuestions.map((question) => (
              <article className="answered-question" key={question.id}>
                <div>
                  <strong>
                    {question.question_templates?.title ?? "Question"}
                  </strong>
                  <span>
                    {question.rounds
                      ? `Round ${question.rounds.number}`
                      : "No round"}
                  </span>
                </div>
                <p>{question.answer}</p>
                <small>
                  Answered {new Date(question.answered_at).toLocaleString()}
                  {question.reward_note
                    ? ` · Reward: ${question.reward_note}`
                    : ""}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <p className="board-loading" role="status">
            No answered questions yet.
          </p>
        )}
      </section>
      <section className="seeker-annotations" aria-labelledby="annotations-heading">
        <div className="board-heading">
          <div>
            <p className="eyebrow">Seeker-only map notes</p>
            <h3 id="annotations-heading">Track deductions privately.</h3>
          </div>
          <button
            className="text-button"
            disabled={isAnnotationLoading}
            type="button"
            onClick={() => void loadAnnotations()}
          >
            Refresh
          </button>
        </div>
        <p className="board-description">
          Save notes, map pins, and eliminated areas for your Seeker Team.
        </p>
        <form className="annotation-form" onSubmit={createAnnotation}>
          <label htmlFor="annotation-type">Annotation type</label>
          <select
            id="annotation-type"
            value={annotationType}
            onChange={(event) => {
              const nextType = event.target.value;
              if (
                nextType === "note" ||
                nextType === "pin" ||
                nextType === "eliminated_area"
              ) {
                setAnnotationType(nextType);
              }
            }}
          >
            <option value="note">Note</option>
            <option value="pin">Map pin</option>
            <option value="eliminated_area">Eliminated area</option>
          </select>
          <label htmlFor="annotation-title">Title</label>
          <input
            id="annotation-title"
            maxLength={100}
            value={annotationTitle}
            onChange={(event) => setAnnotationTitle(event.target.value)}
            required
          />
          <label htmlFor="annotation-location">Location label (optional)</label>
          <input
            id="annotation-location"
            maxLength={150}
            placeholder="District, station, or landmark"
            value={annotationLocation}
            onChange={(event) => setAnnotationLocation(event.target.value)}
          />
          <label htmlFor="annotation-note">Details (optional)</label>
          <textarea
            id="annotation-note"
            maxLength={500}
            value={annotationNote}
            onChange={(event) => setAnnotationNote(event.target.value)}
          />
          <button className="button button-primary" disabled={isAnnotationSubmitting} type="submit">
            {isAnnotationSubmitting ? "Saving..." : "Save annotation"}
          </button>
        </form>
        {isAnnotationLoading ? (
          <p className="board-loading" role="status">Loading annotations...</p>
        ) : annotations.length ? (
          <div className="annotation-list">
            {annotations.map((annotation) => (
              <article className="annotation-item" key={annotation.id}>
                <div>
                  <strong>{annotation.title}</strong>
                  <span>{annotation.annotation_type.replace("_", " ")}</span>
                </div>
                {annotation.location_label && <p>{annotation.location_label}</p>}
                {annotation.note && <p>{annotation.note}</p>}
                <button
                  className="text-button"
                  type="button"
                  onClick={() => void deleteAnnotation(annotation.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="board-loading" role="status">No seeker annotations yet.</p>
        )}
      </section>
    </section>
  );
}
