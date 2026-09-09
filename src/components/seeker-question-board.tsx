"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuestionAnswerType, QuestionCategory } from "@/lib/supabase/database.types";
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
  reward_note: string | null;
  question_templates: {
    title: string;
    category: QuestionCategory;
  } | null;
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
        "id, answer, answered_at, reward_note, question_templates(title, category)",
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
    void loadAnsweredQuestions();
  }, [loadAnsweredQuestions]);

  const selectedQuestion = questions.find(
    (question) => question.category === selectedCategory,
  );

  async function submitQuestion() {
    if (!selectedQuestion || isSubmitting) {
      return;
    }

    setError("");
    setStatus("");
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: submitError } = await supabase.from("question_events").insert({
      game_id: gameId,
      question_template_id: selectedQuestion.id,
      asked_by: userId,
    });

    setIsSubmitting(false);

    if (submitError) {
      setError(submitError.message);
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
                    {question.question_templates
                      ? categoryDetails[question.question_templates.category].label
                      : "Answered"}
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
    </section>
  );
}
