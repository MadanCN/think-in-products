"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { uid } from "@/lib/blocks";
import type { Annotation, Block, CheckYourselfBlock, MakeTheCallBlock, Option, Pen } from "@/lib/types";
import { uploadImage } from "./store";

type Change<B> = (patch: Partial<B>) => void;

/* Small building blocks ---------------------------------------------------- */

export function AutoText({
  value,
  onChange,
  className = "field",
  placeholder,
  minRows = 1,
  inputRef,
  onKeyDown,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  minRows?: number;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  ariaLabel?: string;
}) {
  const local = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? local;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value, ref]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      rows={minRows}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: "block" }}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="small" style={{ display: "block", marginTop: 4 }}>{hint}</span> : null}
    </label>
  );
}

function PenToggle({ value, onChange }: { value: Pen; onChange: (p: Pen) => void }) {
  return (
    <span className="toggle" role="group" aria-label="Pen colour">
      <button type="button" aria-pressed={value === "red"} onClick={() => onChange("red")} style={{ color: value === "red" ? undefined : "var(--red)" }}>Red pen</button>
      <button type="button" aria-pressed={value === "blue"} onClick={() => onChange("blue")} style={{ color: value === "blue" ? undefined : "var(--blue)" }}>Blue pen</button>
    </span>
  );
}

function ListEditor({ items, onChange, placeholder, min = 1, max = 8, addLabel }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; min?: number; max?: number; addLabel: string }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      {items.map((it, i) => (
        <div className="row" key={i}>
          <span className="small" style={{ width: 18, textAlign: "right" }}>{i + 1}</span>
          <input className="field" value={it} placeholder={placeholder} aria-label={`${placeholder} ${i + 1}`} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="icon-btn" aria-label="Remove" disabled={items.length <= min} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      {items.length < max ? (
        <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => onChange([...items, ""])}>+ {addLabel}</button>
      ) : null}
    </div>
  );
}

export function ImagePicker({ src, onChange }: { src: string; local?: boolean; onChange: (src: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(file?: File | null) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  }
  return (
    <div
      className="stack"
      style={{ gap: 6 }}
      onPaste={(e) => {
        const f = Array.from(e.clipboardData.files)[0];
        if (f) {
          e.preventDefault();
          void pick(f);
        }
      }}
    >
      <div className="row" style={{ flexWrap: "wrap" }}>
        <label className="btn btn-sm" style={{ minHeight: 36 }}>
          {busy ? "Uploading..." : src ? "Replace image" : "Upload image"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <span className="small">or paste a screenshot here, or a link:</span>
      </div>
      <input className="field" placeholder="https://..." value={src} onChange={(e) => onChange(e.target.value)} aria-label="Image link" />
      {err ? <span style={{ color: "var(--red)", fontSize: 14 }}>{err}</span> : null}
    </div>
  );
}

export function CreditFields({ credit, creditUrl, onChange }: { credit: string; creditUrl: string; onChange: (patch: { credit?: string; creditUrl?: string }) => void }) {
  return (
    <div className="row" style={{ flexWrap: "wrap" }}>
      <input className="field" style={{ flex: "1 1 200px" }} value={credit} placeholder="Credit, e.g. Jane Doe, via Wikimedia Commons" aria-label="Image credit" onChange={(e) => onChange({ credit: e.target.value })} />
      <input className="field" style={{ flex: "1 1 200px" }} value={creditUrl} placeholder="Source link" aria-label="Image source link" onChange={(e) => onChange({ creditUrl: e.target.value })} />
    </div>
  );
}

/* Options for Make the call / Check yourself --------------------------------- */

function OptionsEditor({ options, onChange }: { options: Option[]; onChange: (o: Option[]) => void }) {
  const set = (i: number, patch: Partial<Option>) => onChange(options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  return (
    <div className="stack">
      {options.map((o, i) => (
        <div key={o.id} className={`opt-edit${o.correct ? " best" : ""}`}>
          <div className="row" style={{ marginBottom: 6 }}>
            <b style={{ fontFamily: "var(--font-hand)", fontSize: 20, width: 20 }}>{"ABCDEF"[i]}</b>
            <input className="field" value={o.label} placeholder="Option" aria-label={`Option ${"ABCDEF"[i]}`} onChange={(e) => set(i, { label: e.target.value })} />
            <button type="button" className="icon-btn" aria-label="Remove option" disabled={options.length <= 2} onClick={() => onChange(options.filter((_, j) => j !== i))}>×</button>
          </div>
          <AutoText value={o.feedback} placeholder="What the reader sees after picking this" onChange={(v) => set(i, { feedback: v })} />
          <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center", marginTop: 6, cursor: "pointer" }}>
            <input type="radio" checked={o.correct} onChange={() => onChange(options.map((x, j) => ({ ...x, correct: j === i })))} />
            This is the PM move
          </label>
        </div>
      ))}
      {options.length < 4 ? (
        <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => onChange([...options, { id: uid("o"), label: "", feedback: "", correct: false }])}>
          + Add an option
        </button>
      ) : null}
    </div>
  );
}

/* Marked-up image: click the picture to drop a note ------------------------ */

function MarkupEditor({ block, onChange, local }: { block: Extract<Block, { type: "marked_up_image" }>; onChange: Change<Extract<Block, { type: "marked_up_image" }>>; local: boolean }) {
  const [moving, setMoving] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const setNote = (id: string, patch: Partial<Annotation>) => onChange({ notes: block.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });

  function onImageClick(e: React.MouseEvent) {
    const r = imgRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
    if (moving) {
      setNote(moving, { x, y, side: x < 50 ? "left" : "right" });
      setMoving(null);
      return;
    }
    onChange({ notes: [...block.notes, { id: uid("n"), x, y, text: "", pen: "red", side: x < 50 ? "left" : "right" }] });
  }

  return (
    <div className="stack">
      <ImagePicker src={block.src} local={local} onChange={(src) => onChange({ src })} />
      {block.src ? (
        <>
          <p className="small" style={{ margin: 0 }}>
            {moving ? "Click the new spot for this note." : "Click on the picture where a note should point. Each click adds a note."}
          </p>
          <div className="markup-editor" onClick={onImageClick}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={block.src} alt="" draggable={false} />
            {block.notes.map((n, i) => (
              <span key={n.id} className={`pin${moving === n.id ? " moving" : ""}`} style={{ left: `${n.x}%`, top: `${n.y}%`, background: n.pen === "red" ? "var(--red)" : "var(--blue)" }}>
                {i + 1}
              </span>
            ))}
          </div>
          {block.notes.map((n, i) => (
            <div key={n.id} className="opt-edit">
              <div className="row" style={{ marginBottom: 6 }}>
                <b style={{ width: 20 }}>{i + 1}</b>
                <AutoText value={n.text} placeholder="What should the reader notice here?" onChange={(v) => setNote(n.id, { text: v })} />
              </div>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <PenToggle value={n.pen} onChange={(pen) => setNote(n.id, { pen })} />
                <span className="toggle" role="group" aria-label="Note side">
                  <button type="button" aria-pressed={n.side === "left"} onClick={() => setNote(n.id, { side: "left" })}>Left</button>
                  <button type="button" aria-pressed={n.side === "right"} onClick={() => setNote(n.id, { side: "right" })}>Right</button>
                </span>
                <button type="button" className="linkbtn" onClick={() => setMoving(moving === n.id ? null : n.id)}>{moving === n.id ? "Cancel move" : "Move point"}</button>
                <button type="button" className="linkbtn" style={{ color: "var(--red)" }} onClick={() => onChange({ notes: block.notes.filter((x) => x.id !== n.id) })}>Remove</button>
              </div>
            </div>
          ))}
        </>
      ) : null}
      <div className="row">
        <input className="field" value={block.alt} placeholder="Describe the picture (for screen readers)" aria-label="Alt text" onChange={(e) => onChange({ alt: e.target.value })} />
      </div>
      <input className="field" value={block.caption} placeholder="Caption (optional)" aria-label="Caption" onChange={(e) => onChange({ caption: e.target.value })} />
      <CreditFields credit={block.credit} creditUrl={block.creditUrl} onChange={onChange} />
    </div>
  );
}

/* Chart: type rows or paste from a spreadsheet ----------------------------- */

function ChartEditor({ block, onChange }: { block: Extract<Block, { type: "chart" }>; onChange: Change<Extract<Block, { type: "chart" }>> }) {
  const [paste, setPaste] = useState(false);
  const [raw, setRaw] = useState("");
  const setRow = (i: number, patch: Partial<{ label: string; value: number }>) => onChange({ rows: block.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  return (
    <div className="stack">
      <input className="field" value={block.title} placeholder="Chart title, e.g. Why patients missed" aria-label="Chart title" onChange={(e) => onChange({ title: e.target.value })} />
      {block.rows.map((r, i) => (
        <div className="row" key={i}>
          <input className="field" value={r.label} placeholder="Label" aria-label={`Row ${i + 1} label`} onChange={(e) => setRow(i, { label: e.target.value })} />
          <input className="field" type="number" value={Number.isFinite(r.value) ? r.value : 0} aria-label={`Row ${i + 1} value`} style={{ width: 110 }} onChange={(e) => setRow(i, { value: Number(e.target.value) })} />
          <button type="button" className="icon-btn" aria-label="Remove row" disabled={block.rows.length <= 1} onClick={() => onChange({ rows: block.rows.filter((_, j) => j !== i) })}>×</button>
        </div>
      ))}
      <div className="row">
        <button type="button" className="linkbtn" onClick={() => onChange({ rows: [...block.rows, { label: "", value: 0 }] })}>+ Add a row</button>
        <button type="button" className="linkbtn" onClick={() => setPaste(!paste)}>Paste from a spreadsheet</button>
      </div>
      {paste ? (
        <div className="stack" style={{ gap: 6 }}>
          <AutoText value={raw} minRows={3} placeholder={"Couldn't reschedule\t34\nBooked too far ahead\t27"} onChange={setRaw} />
          <button
            type="button"
            className="btn btn-sm btn-dark"
            style={{ alignSelf: "flex-start", minHeight: 34 }}
            onClick={() => {
              const rows = raw
                .split(/\n/)
                .map((l) => l.split(/\t|,(?=[^,]*$)/))
                .filter((p) => p.length >= 2 && p[0].trim())
                .map((p) => ({ label: p[0].trim(), value: Number(p[1].replace(/[^0-9.-]/g, "")) || 0 }));
              if (rows.length) onChange({ rows });
              setPaste(false);
              setRaw("");
            }}
          >
            Use these rows
          </button>
        </div>
      ) : null}
      <input className="field" value={block.note} placeholder="Note under the chart, e.g. where the numbers come from" aria-label="Chart note" onChange={(e) => onChange({ note: e.target.value })} />
      <input className="field" value={block.sourceUrl} placeholder="Source link (optional)" aria-label="Chart source link" onChange={(e) => onChange({ sourceUrl: e.target.value })} />
    </div>
  );
}

/* Text: a plain writing area with a few formatting buttons ----------------- */

function TextEditor({ value, onChange, onSlash, autoFocus }: { value: string; onChange: (v: string) => void; onSlash: () => void; autoFocus?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  function wrap(before: string, after = before, placeholder = "text") {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }
  function linePrefix(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    requestAnimationFrame(() => el.focus());
  }
  return (
    <>
      <AutoText
        inputRef={ref}
        className="text-block"
        value={value}
        placeholder="Start writing, or type / to add a block"
        onChange={(v) => {
          if (v === "/" && value === "") onSlash();
          else onChange(v);
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            wrap("**");
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
            e.preventDefault();
            wrap("*");
          }
        }}
      />
      <div className="fmt" aria-label="Formatting">
        <button type="button" onClick={() => linePrefix("## ")}>Heading</button>
        <button type="button" onClick={() => wrap("**")}><b>Bold</b></button>
        <button type="button" onClick={() => wrap("*")}><i>Italic</i></button>
        <button type="button" onClick={() => wrap("==")} style={{ background: "var(--highlighter)" }}>Highlight</button>
        <button type="button" onClick={() => linePrefix("- ")}>List</button>
        <button type="button" onClick={() => wrap("[", "](https://)", "link text")}>Link</button>
        <button type="button" onClick={() => linePrefix("> ")}>Quote</button>
      </div>
    </>
  );
}

/* The form for each block type --------------------------------------------- */

export function BlockEditor({ block, onChange, local, onSlash, autoFocus }: { block: Block; onChange: (patch: Partial<Block>) => void; local: boolean; onSlash: () => void; autoFocus?: boolean }) {
  switch (block.type) {
    case "text":
      return <TextEditor value={block.markdown} onChange={(markdown) => onChange({ markdown })} onSlash={onSlash} autoFocus={autoFocus} />;
    case "margin_note":
      return (
        <div className="stack">
          <AutoText value={block.text} className="field" placeholder="A short handwritten aside" onChange={(text) => onChange({ text })} />
          <PenToggle value={block.pen} onChange={(pen) => onChange({ pen })} />
        </div>
      );
    case "callout":
      return (
        <div className="stack">
          <AutoText value={block.text} placeholder="The one idea to remember" onChange={(text) => onChange({ text })} />
          <span className="toggle" role="group" aria-label="Callout style">
            <button type="button" aria-pressed={block.tone === "highlight"} onClick={() => onChange({ tone: "highlight" })}>Yellow</button>
            <button type="button" aria-pressed={block.tone === "dark"} onClick={() => onChange({ tone: "dark" })}>Dark</button>
          </span>
        </div>
      );
    case "make_the_call": {
      const b = block as MakeTheCallBlock;
      return (
        <div className="stack">
          <Field label="The situation"><AutoText value={b.scenario} minRows={2} placeholder="Your biggest customer wants dark mode by Friday..." onChange={(scenario) => onChange({ scenario })} /></Field>
          <Field label="The question"><input className="field" value={b.question} onChange={(e) => onChange({ question: e.target.value })} /></Field>
          <span className="label" style={{ margin: 0 }}>Options and what each answer says back</span>
          <OptionsEditor options={b.options} onChange={(options) => onChange({ options })} />
        </div>
      );
    }
    case "check_yourself": {
      const b = block as CheckYourselfBlock;
      return (
        <div className="stack">
          <Field label="The question"><AutoText value={b.question} placeholder="A sales lead says..." onChange={(question) => onChange({ question })} /></Field>
          <OptionsEditor options={b.options} onChange={(options) => onChange({ options })} />
          <div className="opt-edit best">
            <span className="label">If they pick the PM move</span>
            <AutoText value={b.rightMessage} onChange={(rightMessage) => onChange({ rightMessage })} />
            <div className="row" style={{ marginTop: 6 }}>
              <input className="field" value={b.rightLinkLabel} placeholder="Button text" aria-label="Right answer button text" onChange={(e) => onChange({ rightLinkLabel: e.target.value })} />
              <input className="field" value={b.rightLinkHref} placeholder="/articles/next-article" aria-label="Right answer link" onChange={(e) => onChange({ rightLinkHref: e.target.value })} />
            </div>
          </div>
          <div className="opt-edit">
            <span className="label">If they pick something else</span>
            <AutoText value={b.wrongMessage} onChange={(wrongMessage) => onChange({ wrongMessage })} />
            <div className="row" style={{ marginTop: 6 }}>
              <input className="field" value={b.wrongLinkLabel} placeholder="Button text" aria-label="Other answer button text" onChange={(e) => onChange({ wrongLinkLabel: e.target.value })} />
              <input className="field" value={b.wrongLinkHref} placeholder="#section" aria-label="Other answer link" onChange={(e) => onChange({ wrongLinkHref: e.target.value })} />
            </div>
          </div>
        </div>
      );
    }
    case "marked_up_image":
      return <MarkupEditor block={block} onChange={onChange as Change<typeof block>} local={local} />;
    case "image":
      return (
        <div className="stack">
          <ImagePicker src={block.src} local={local} onChange={(src) => onChange({ src })} />
          <input className="field" value={block.alt} placeholder="Describe the picture (for screen readers)" aria-label="Alt text" onChange={(e) => onChange({ alt: e.target.value })} />
          <input className="field" value={block.caption} placeholder="Caption (optional)" aria-label="Caption" onChange={(e) => onChange({ caption: e.target.value })} />
          <CreditFields credit={block.credit} creditUrl={block.creditUrl} onChange={onChange} />
        </div>
      );
    case "tip":
      return (
        <div className="stack">
          <div className="small" style={{ fontWeight: 700, color: "var(--red)" }}>TiP: one practical thing the reader can do at work this week</div>
          <input className="field" value={block.title} placeholder="Short title, e.g. Ask what it would let them do" aria-label="Tip title" onChange={(e) => onChange({ title: e.target.value })} />
          <AutoText value={block.text} minRows={2} placeholder="The tip, in one to three sentences" onChange={(text) => onChange({ text })} />
        </div>
      );
    case "stats":
      return (
        <div className="stack">
          {block.items.map((it, i) => (
            <div className="row" key={i}>
              <input className="field" style={{ width: 140 }} value={it.value} placeholder="5.2 billion" aria-label={`Number ${i + 1}`} onChange={(e) => onChange({ items: block.items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <input className="field" value={it.label} placeholder="What it counts" aria-label={`Label ${i + 1}`} onChange={(e) => onChange({ items: block.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <button type="button" className="icon-btn" aria-label="Remove" disabled={block.items.length <= 1} onClick={() => onChange({ items: block.items.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          {block.items.length < 4 ? <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ items: [...block.items, { value: "", label: "" }] })}>+ Add a number</button> : null}
          <div className="row" style={{ flexWrap: "wrap" }}>
            <input className="field" style={{ flex: "1 1 200px" }} value={block.source} placeholder="Source name" aria-label="Source" onChange={(e) => onChange({ source: e.target.value })} />
            <input className="field" style={{ flex: "1 1 200px" }} value={block.sourceUrl} placeholder="Source link" aria-label="Source link" onChange={(e) => onChange({ sourceUrl: e.target.value })} />
          </div>
        </div>
      );
    case "timeline":
      return (
        <div className="stack">
          <input className="field" value={block.title} placeholder="Timeline title (optional)" aria-label="Timeline title" onChange={(e) => onChange({ title: e.target.value })} />
          {block.events.map((ev, i) => (
            <div key={i} className="opt-edit">
              <div className="row" style={{ marginBottom: 6 }}>
                <input className="field" style={{ width: 120 }} value={ev.date} placeholder="Jan 2007" aria-label={`Event ${i + 1} date`} onChange={(e) => onChange({ events: block.events.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)) })} />
                <input className="field" value={ev.title} placeholder="What happened" aria-label={`Event ${i + 1} title`} onChange={(e) => onChange({ events: block.events.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <button type="button" className="icon-btn" aria-label="Remove event" disabled={block.events.length <= 2} onClick={() => onChange({ events: block.events.filter((_, j) => j !== i) })}>×</button>
              </div>
              <AutoText value={ev.text} placeholder="One or two sentences" onChange={(v) => onChange({ events: block.events.map((x, j) => (j === i ? { ...x, text: v } : x)) })} />
              <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                <input type="checkbox" checked={Boolean(ev.highlight)} onChange={(e) => onChange({ events: block.events.map((x, j) => (j === i ? { ...x, highlight: e.target.checked } : x)) })} />
                Highlight this moment
              </label>
            </div>
          ))}
          <div className="row">
            <button type="button" className="linkbtn" onClick={() => onChange({ events: [...block.events, { date: "", title: "", text: "" }] })}>+ Add an event</button>
            <button type="button" className="linkbtn" onClick={() => onChange({ events: [...block.events].reverse() })}>Reverse order</button>
          </div>
        </div>
      );
    case "sources":
      return (
        <div className="stack">
          {block.items.map((it, i) => (
            <div className="row" key={i}>
              <input className="field" value={it.label} placeholder="Publisher: title" aria-label={`Source ${i + 1}`} onChange={(e) => onChange({ items: block.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input className="field" value={it.url} placeholder="https://" aria-label={`Source ${i + 1} link`} onChange={(e) => onChange({ items: block.items.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
              <button type="button" className="icon-btn" aria-label="Remove source" disabled={block.items.length <= 1} onClick={() => onChange({ items: block.items.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ items: [...block.items, { label: "", url: "" }] })}>+ Add a source</button>
        </div>
      );
    case "chart":
      return <ChartEditor block={block} onChange={onChange as Change<typeof block>} />;
    case "cause_arrows":
      return (
        <div className="stack">
          <Field label="The problem"><input className="field" value={block.problem} placeholder="Patients miss appointments" onChange={(e) => onChange({ problem: e.target.value })} /></Field>
          <span className="label" style={{ margin: 0 }}>Possible reasons (2 to 5)</span>
          <ListEditor items={block.reasons} min={2} max={5} placeholder="Reason" addLabel="Add a reason" onChange={(reasons) => onChange({ reasons })} />
        </div>
      );
    case "venn":
      return (
        <div className="stack">
          <input className="field" value={block.title} placeholder="Title, e.g. Where a PM sits" aria-label="Venn title" onChange={(e) => onChange({ title: e.target.value })} />
          {block.circles.map((c, i) => (
            <div key={i} className="opt-edit">
              <div className="row" style={{ marginBottom: 6 }}>
                <input className="field" value={c.label} placeholder={`Circle ${i + 1} name`} aria-label={`Circle ${i + 1} name`} onChange={(e) => onChange({ circles: block.circles.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <button type="button" className="icon-btn" aria-label="Remove circle" disabled={block.circles.length <= 2} onClick={() => onChange({ circles: block.circles.filter((_, j) => j !== i) })}>×</button>
              </div>
              <AutoText value={c.detail} placeholder="Shown when the reader hovers this circle" onChange={(v) => onChange({ circles: block.circles.map((x, j) => (j === i ? { ...x, detail: v } : x)) })} />
            </div>
          ))}
          {block.circles.length < 3 ? <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ circles: [...block.circles, { label: "", detail: "" }] })}>+ Add a third circle</button> : null}
          <Field label="The middle (shown before anyone hovers)"><AutoText value={block.overlap} onChange={(overlap) => onChange({ overlap })} /></Field>
        </div>
      );
    case "cycle":
      return (
        <div className="stack">
          <input className="field" value={block.title} placeholder="Title, e.g. And then it starts again" aria-label="Cycle title" onChange={(e) => onChange({ title: e.target.value })} />
          <span className="label" style={{ margin: 0 }}>Steps, in order (3 to 6, keep each short)</span>
          <ListEditor items={block.steps} min={3} max={6} placeholder="Step" addLabel="Add a step" onChange={(steps) => onChange({ steps })} />
        </div>
      );
  }
}
