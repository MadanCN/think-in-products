"use client";

import { createContext, useContext, useState } from "react";
import type { CheckYourselfBlock, MakeTheCallBlock, Option } from "@/lib/types";

// Answers given in this piece, so "Check yourself" can refer back to "Make the call".
type Answers = Record<string, { optionId: string; correct: boolean }>;
const AnswersContext = createContext<{ answers: Answers; set: (blockId: string, o: Option) => void }>({
  answers: {},
  set: () => {},
});

export function AnswersProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<Answers>({});
  return (
    <AnswersContext.Provider
      value={{ answers, set: (blockId, o) => setAnswers((a) => ({ ...a, [blockId]: { optionId: o.id, correct: o.correct } })) }}
    >
      {children}
    </AnswersContext.Provider>
  );
}

const LETTERS = "ABCDEF";

function Options({ blockId, options }: { blockId: string; options: Option[] }) {
  const { answers, set } = useContext(AnswersContext);
  const picked = answers[blockId]?.optionId;
  return (
    <div className="quiz-options">
      {options.map((o, i) => {
        const isPicked = picked === o.id;
        return (
          <div key={o.id}>
            <button
              type="button"
              className={`opt${isPicked ? ` picked ${o.correct ? "good" : "bad"}` : ""}`}
              aria-pressed={isPicked}
              onClick={() => set(blockId, o)}
            >
              <span className="letter">{LETTERS[i]}</span>
              <span>{o.label || <em>Option {LETTERS[i]}</em>}</span>
            </button>
            {isPicked && o.feedback ? <p className={`feedback ${o.correct ? "good" : "bad"}`}>{o.feedback}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function MakeTheCall({ block }: { block: MakeTheCallBlock }) {
  const { answers } = useContext(AnswersContext);
  return (
    <section className="quiz dark" aria-label="Make the call">
      <p className="quiz-kicker">Before you read on, make the call</p>
      {block.scenario ? <p className="quiz-q" style={{ fontSize: "clamp(24px, 2.6vw, 34px)" }}>{block.scenario}</p> : null}
      <p className="quiz-scenario" style={{ fontWeight: 700, color: "var(--sheet)", fontSize: 20 }}>{block.question}</p>
      <Options blockId={block.id} options={block.options} />
      {answers[block.id] ? (
        <p style={{ margin: "18px 0 0", fontSize: 16, color: "var(--on-dark-2)" }}>
          Hold on to that answer. The rest of this piece explains why.
        </p>
      ) : null}
    </section>
  );
}

export function CheckYourself({ block }: { block: CheckYourselfBlock }) {
  const { answers } = useContext(AnswersContext);
  const mine = answers[block.id];
  const firstCall = Object.entries(answers).find(([id]) => id !== block.id);
  const right = mine?.correct;
  return (
    <section className="quiz light" aria-label="Check yourself">
      <p className="quiz-kicker">Check yourself</p>
      <p className="quiz-q">{block.question}</p>
      <Options blockId={block.id} options={block.options} />
      {mine ? (
        <div className="result">
          <h4>{right ? "Nicely done." : "Not quite yet."}</h4>
          <p style={{ margin: "0 0 12px" }}>
            {right ? block.rightMessage : block.wrongMessage}
            {firstCall ? (
              <span style={{ display: "block", marginTop: 8, fontSize: 15, color: "var(--ink-2)" }}>
                Your first call was {firstCall[1].correct ? "the PM move too" : "different from the PM move"}.
              </span>
            ) : null}
          </p>
          <a className="btn btn-dark btn-sm" href={right ? block.rightLinkHref : block.wrongLinkHref}>
            {right ? block.rightLinkLabel : block.wrongLinkLabel}
          </a>
        </div>
      ) : null}
    </section>
  );
}
