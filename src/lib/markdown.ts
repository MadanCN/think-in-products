import MarkdownIt from "markdown-it";

// HTML is disabled, so authors can't inject scripts; links open safely.
const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false });

// ==text== renders as a highlighter mark.
md.inline.ruler.before("emphasis", "highlight", (state, silent) => {
  const start = state.pos;
  const src = state.src;
  if (src.charCodeAt(start) !== 0x3d || src.charCodeAt(start + 1) !== 0x3d) return false;
  const end = src.indexOf("==", start + 2);
  if (end < 0 || end === start + 2) return false;
  if (!silent) {
    const open = state.push("mark_open", "mark", 1);
    open.markup = "==";
    const text = state.push("text", "", 0);
    text.content = src.slice(start + 2, end);
    const close = state.push("mark_close", "mark", -1);
    close.markup = "==";
  }
  state.pos = end + 2;
  return true;
});

export function renderMarkdown(src: string): string {
  return md.render(src || "");
}

export function renderInline(src: string): string {
  return md.renderInline(src || "");
}
