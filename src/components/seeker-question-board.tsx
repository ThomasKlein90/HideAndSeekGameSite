"use client";

import { useEffect, useState } from "react";
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

export function SeekerQuestionBoard() {
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [error, setError] = useState("");

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

  const selectedQuestion = questions.find(
    (question) => question.category === selectedCategory,
  );

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
        <div className="question-detail" role="status">
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
        </div>
      )}
      {!questions.length && !error && <p className="board-loading">Loading categories...</p>}
    </section>
  );
}
