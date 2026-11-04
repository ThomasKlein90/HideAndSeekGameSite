"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type {
  QuestionAnswerType,
  QuestionCategory,
  SeekerAnnotationType,
} from "@/lib/supabase/database.types";
import {
  formatRadarDistance,
  MAX_RADAR_DISTANCE_METERS,
  MIN_RADAR_DISTANCE_METERS,
  parseRadarDistanceMeters,
} from "@/lib/radar-questions.mjs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type QuestionTemplate = {
  id: string;
  category: QuestionCategory;
  title: string;
  prompt: string;
  answer_type: QuestionAnswerType;
  requires_distance_input: boolean;
  reward_rule: string;
};

type AnsweredQuestion = {
  id: string;
  answer: string;
  answered_at: string;
  radar_distance_meters: number | null;
  round_id: string | null;
  reward_note: string | null;
  question_templates: {
    title: string;
    category: QuestionCategory;
    prompt: string;
    requires_distance_input: boolean;
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
  { label: string; rewardRule: string }
> = {
  matching: {
    label: "Matching",
    rewardRule: "Draw 3 · Pick 1",
  },
  measuring: {
    label: "Measuring",
    rewardRule: "Draw 3 · Pick 1",
  },
  thermometer: {
    label: "Thermometer",
    rewardRule: "Draw 2 · Pick 1",
  },
  radar: {
    label: "Radar",
    rewardRule: "Draw 2 · Pick 1",
  },
  tentacles: {
    label: "Tentacles",
    rewardRule: "Draw 4 · Pick 2",
  },
  photos: {
    label: "Photos",
    rewardRule: "Draw 1",
  },
};
const answerTypeLabels: Record<QuestionAnswerType, string> = {
  yes_no: "Yes / No",
  number: "Number",
  text: "Text",
  photo: "Photo",
};
const ACTIVE_ROUND_REFRESH_INTERVAL_MILLISECONDS = 15_000;

type SeekerQuestionBoardProps = {
  gameId: string;
  userId: string;
};

export function SeekerQuestionBoard({
  gameId,
  userId,
}: SeekerQuestionBoardProps) {
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<QuestionCategory | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [customRadarDistance, setCustomRadarDistance] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmittedQuestionsLoading, setIsSubmittedQuestionsLoading] =
    useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>(
    [],
  );
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [isRoundLoading, setIsRoundLoading] = useState(true);
  const isLoadingCurrentRound = useRef(false);
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
      .select(
        "id, category, title, prompt, answer_type, requires_distance_input, reward_rule",
      )
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error: loadError }) => {
        setIsQuestionsLoading(false);
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
        "id, answer, answered_at, radar_distance_meters, round_id, reward_note, question_templates(title, category, prompt, requires_distance_input), rounds(number)",
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

  const loadCurrentRound = useCallback(async () => {
    if (isLoadingCurrentRound.current) {
      return;
    }

    isLoadingCurrentRound.current = true;
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: roundError } = await supabase
        .from("rounds")
        .select("id")
        .eq("game_id", gameId)
        .is("ended_at", null)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roundError) {
        setError(roundError.message);
        return;
      }

      setCurrentRoundId(data?.id ?? null);
    } catch (roundError) {
      setError(
        roundError instanceof Error
          ? roundError.message
          : "The active round could not be refreshed.",
      );
    } finally {
      isLoadingCurrentRound.current = false;
      setIsRoundLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    queueMicrotask(() => void loadCurrentRound());
    const interval = window.setInterval(
      () => void loadCurrentRound(),
      ACTIVE_ROUND_REFRESH_INTERVAL_MILLISECONDS,
    );
    window.addEventListener("focus", loadCurrentRound);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", loadCurrentRound);
    };
  }, [loadCurrentRound]);

  const loadSubmittedQuestions = useCallback(async () => {
    if (isRoundLoading) {
      return;
    }

    if (!currentRoundId) {
      setSubmittedQuestionIds(new Set());
      setIsSubmittedQuestionsLoading(false);
      return;
    }

    setIsSubmittedQuestionsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error: submittedQuestionsError } = await supabase
      .from("question_events")
      .select("question_template_id")
      .eq("game_id", gameId)
      .eq("round_id", currentRoundId)
      .neq("status", "cancelled");

    setIsSubmittedQuestionsLoading(false);
    if (submittedQuestionsError) {
      setError(submittedQuestionsError.message);
      return;
    }

    setSubmittedQuestionIds(
      new Set(data.map((event) => event.question_template_id)),
    );
  }, [currentRoundId, gameId, isRoundLoading]);

  useEffect(() => {
    if (!isRoundLoading) {
      queueMicrotask(() => void loadSubmittedQuestions());
    }
  }, [isRoundLoading, loadSubmittedQuestions]);

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

  const selectedCategoryQuestions = questions.filter(
    (question) => question.category === selectedCategory,
  );
  const selectedQuestion = selectedCategoryQuestions.find(
    (question) => question.id === selectedQuestionId,
  );
  const selectedRadarDistance = selectedQuestion?.requires_distance_input
    ? parseRadarDistanceMeters(customRadarDistance)
    : null;

  async function submitQuestion() {
    if (
      !selectedQuestion ||
      isSubmitting ||
      isSubmittedQuestionsLoading ||
      submittedQuestionIds.has(selectedQuestion.id)
    ) {
      return;
    }

    if (!currentRoundId) {
      setError("No active round is available for this game.");
      return;
    }

    const radarDistanceMeters = selectedQuestion.requires_distance_input
      ? parseRadarDistanceMeters(customRadarDistance)
      : null;
    if (
      selectedQuestion.requires_distance_input &&
      radarDistanceMeters === null
    ) {
      setError(
        `Enter a whole-number distance from ${MIN_RADAR_DISTANCE_METERS.toLocaleString()} to ${MAX_RADAR_DISTANCE_METERS.toLocaleString()} metres.`,
      );
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
      radar_distance_meters: radarDistanceMeters,
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
          <h2 id="seeker-board-heading">Choose a category.</h2>
        </div>
        <button
          className="text-button"
          disabled={isSubmittedQuestionsLoading || isRoundLoading}
          type="button"
          onClick={() => void loadSubmittedQuestions()}
        >
          Refresh question availability
        </button>
      </div>
      <p className="board-description">
        Choose a category to browse its available questions and card reward.
      </p>
      {error ? (
        <p className="board-error" role="status">
          {error}
        </p>
      ) : (
        <div className="question-category-grid">
          {(Object.keys(categoryDetails) as QuestionCategory[]).map((category) => {
            const details = categoryDetails[category];
            const questionCount = questions.filter(
              (question) => question.category === category,
            ).length;

            return (
              <button
                aria-pressed={selectedCategory === category}
                className={
                  selectedCategory === category
                    ? "question-category is-selected"
                    : "question-category"
                }
                data-category={category}
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedQuestionId(null);
                  setIsConfirming(false);
                }}
              >
                <span className="question-category-name">{details.label}</span>
                <small>{details.rewardRule}</small>
                <span className="question-category-count">
                  {isQuestionsLoading
                    ? "Loading questions..."
                    : questionCount
                      ? `${questionCount} question${questionCount === 1 ? "" : "s"}`
                      : "Questions being added"}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {selectedCategory && (
        <div
          className="question-category-detail"
          data-category={selectedCategory}
        >
          <div className="question-category-detail-heading">
            <p className="eyebrow">{categoryDetails[selectedCategory].label}</p>
            <h3>{categoryDetails[selectedCategory].label} questions</h3>
            <p>Card reward: {categoryDetails[selectedCategory].rewardRule}</p>
          </div>
          {selectedCategoryQuestions.length === 0 ? (
            <p className="board-loading" role="status">
              {isQuestionsLoading
                ? "Loading approved questions..."
                : "Approved questions for this category are being added."}
            </p>
          ) : (
            <>
              <ul
                className="question-template-list"
                aria-label={`${categoryDetails[selectedCategory].label} questions`}
              >
                {selectedCategoryQuestions.map((question) => (
                  <li key={question.id}>
                    <button
                      aria-pressed={selectedQuestionId === question.id}
                      className={
                        selectedQuestionId === question.id
                          ? "question-template-choice is-selected"
                          : "question-template-choice"
                      }
                      type="button"
                      onClick={() => {
                        setSelectedQuestionId(question.id);
                        setCustomRadarDistance("");
                        setIsConfirming(false);
                      }}
                    >
                      <span>{question.title}</span>
                      <small>
                        {submittedQuestionIds.has(question.id)
                          ? "Already used this round"
                          : answerTypeLabels[question.answer_type]}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
              {selectedQuestion && (
                <div className="question-detail">
                  <h3>{selectedQuestion.title}</h3>
                  {selectedQuestion.requires_distance_input ? (
                    <>
                      <label htmlFor="custom-radar-distance">
                        Custom distance (metres)
                      </label>
                      <input
                        id="custom-radar-distance"
                        type="number"
                        min={MIN_RADAR_DISTANCE_METERS}
                        max={MAX_RADAR_DISTANCE_METERS}
                        step={1}
                        required
                        value={customRadarDistance}
                        onChange={(event) =>
                          setCustomRadarDistance(event.target.value)
                        }
                      />
                      <p>
                        Am I within{" "}
                        {selectedRadarDistance === null
                          ? "your selected distance"
                          : formatRadarDistance(selectedRadarDistance)}{" "}
                        of you?
                      </p>
                    </>
                  ) : (
                    <p>{selectedQuestion.prompt}</p>
                  )}
                  <dl>
                    <div>
                      <dt>Answer format</dt>
                      <dd>{answerTypeLabels[selectedQuestion.answer_type]}</dd>
                    </div>
                    <div>
                      <dt>Card reward</dt>
                      <dd>{selectedQuestion.reward_rule}</dd>
                    </div>
                  </dl>
                  {submittedQuestionIds.has(selectedQuestion.id) ? (
                    <p className="question-submitted" role="status">
                      This question has already been used this round.
                    </p>
                  ) : isSubmittedQuestionsLoading ? (
                    <p className="board-loading" role="status">
                      Checking question availability...
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
            </>
          )}
        </div>
      )}
      {status && (
        <p className="board-status" role="status">
          {status}
        </p>
      )}
      {isQuestionsLoading && (
        <p className="board-loading">Loading question categories...</p>
      )}
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
                {question.question_templates && (
                  <p>
                    {question.question_templates.requires_distance_input &&
                    question.radar_distance_meters !== null
                      ? `Am I within ${formatRadarDistance(question.radar_distance_meters)} of you?`
                      : question.question_templates.prompt}
                  </p>
                )}
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
