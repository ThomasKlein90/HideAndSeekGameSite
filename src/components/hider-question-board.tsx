"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuestionAnswerType } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PendingQuestion = {
  id: string;
  created_at: string;
  question_templates: {
    title: string;
    prompt: string;
    answer_type: QuestionAnswerType;
    reward_rule: string;
  } | null;
};

type HiderQuestionBoardProps = {
  gameId: string;
  userId: string;
};

export function HiderQuestionBoard({ gameId, userId }: HiderQuestionBoardProps) {
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [rewardNote, setRewardNote] = useState<Record<string, string>>({});
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadQuestions = useCallback(async () => {
    setError("");
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: loadError } = await supabase
      .from("question_events")
      .select(
        "id, created_at, question_templates(title, prompt, answer_type, reward_rule)",
      )
      .eq("game_id", gameId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    setIsLoading(false);

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setQuestions(data as PendingQuestion[]);
  }, [gameId]);

  async function answerQuestion(question: PendingQuestion) {
    const nextAnswer = answer[question.id]?.trim() ?? "";

    if (!nextAnswer || submittingQuestionId) {
      return;
    }

    setError("");
    setSubmittingQuestionId(question.id);
    const supabase = createSupabaseBrowserClient();
    const nextRewardNote = rewardNote[question.id]?.trim() ?? "";
    const answeredAt = new Date().toISOString();
    const { data, error: answerError } = await supabase
      .from("question_events")
      .update({
        answer: nextAnswer,
        answered_by: userId,
        answered_at: answeredAt,
        reward_note: nextRewardNote || null,
        reward_logged_by: nextRewardNote ? userId : null,
        reward_logged_at: nextRewardNote ? answeredAt : null,
        status: "answered",
      })
      .eq("id", question.id)
      .eq("status", "pending")
      .select("id")
      .single();

    setSubmittingQuestionId(null);

    if (answerError || !data) {
      setError(answerError?.message ?? "The question was not updated.");
      return;
    }

    setQuestions((pendingQuestions) =>
      pendingQuestions.filter((pendingQuestion) => pendingQuestion.id !== question.id),
    );
  }

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  return (
    <section className="hider-board" aria-labelledby="hider-board-heading">
      <div className="board-heading">
        <div>
          <p className="eyebrow">Hider Team</p>
          <h2 id="hider-board-heading">Incoming questions.</h2>
        </div>
        <button
          className="text-button"
          disabled={isLoading}
          type="button"
          onClick={() => void loadQuestions()}
        >
          Refresh
        </button>
      </div>
      <p className="board-description">
        New questions appear here for the Hider Team to review and answer.
      </p>
      {error && (
        <p className="board-error" role="status">
          {error}
        </p>
      )}
      {!error && isLoading && (
        <p className="board-loading" role="status">
          Loading pending questions...
        </p>
      )}
      {!error && !isLoading && !questions.length && (
        <p className="board-loading" role="status">
          No pending questions.
        </p>
      )}
      {!error && questions.length > 0 && (
        <div className="hider-question-list">
          {questions.map((question) => (
            <article className="hider-question" key={question.id}>
              <p className="eyebrow">Pending question</p>
              <h3>{question.question_templates?.title ?? "Question"}</h3>
              <p>{question.question_templates?.prompt}</p>
              <dl>
                <div>
                  <dt>Answer format</dt>
                  <dd>
                    {question.question_templates?.answer_type.replace("_", " ")}
                  </dd>
                </div>
                <div>
                  <dt>Card reward</dt>
                  <dd>{question.question_templates?.reward_rule}</dd>
                </div>
              </dl>
              <form
                className="hider-answer-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void answerQuestion(question);
                }}
              >
                <label htmlFor={`answer-${question.id}`}>Answer</label>
                {question.question_templates?.answer_type === "yes_no" ? (
                  <select
                    id={`answer-${question.id}`}
                    value={answer[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswer((answers) => ({
                        ...answers,
                        [question.id]: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select an answer</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : (
                  <input
                    id={`answer-${question.id}`}
                    type={
                      question.question_templates?.answer_type === "number"
                        ? "number"
                        : "text"
                    }
                    value={answer[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswer((answers) => ({
                        ...answers,
                        [question.id]: event.target.value,
                      }))
                    }
                    placeholder={
                      question.question_templates?.answer_type === "photo"
                        ? "Add a photo reference"
                        : undefined
                    }
                    required
                  />
                )}
                <label htmlFor={`reward-${question.id}`}>
                  Physical-card reward note (optional)
                </label>
                <input
                  id={`reward-${question.id}`}
                  value={rewardNote[question.id] ?? ""}
                  onChange={(event) =>
                    setRewardNote((notes) => ({
                      ...notes,
                      [question.id]: event.target.value,
                    }))
                  }
                  placeholder="For example: draw 1, keep 1"
                />
                <button
                  className="button button-primary"
                  disabled={submittingQuestionId !== null}
                  type="submit"
                >
                  {submittingQuestionId === question.id
                    ? "Saving answer..."
                    : "Submit answer"}
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
