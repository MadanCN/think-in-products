import { BLOCK_MENU } from "./blocks";
import { MAX_FEATURED, SECTION_LIST } from "./types";

// Returned by the MCP tool get_writing_guide, so Claude writes in the house style.
export function writingGuide(): string {
  return `# ThinkInProducts writing guide

ThinkInProducts is a product-management notebook. Readers are aspiring and early-career product managers.
Every piece teaches by making the reader decide first, then showing the thinking.

## Voice
- Plain English, short sentences (under 25 words), active voice. Explain any term the first time.
- Specific over clever: real numbers with units, real dates, named companies.
- No hype words, no "in today's fast-paced world", no emoji.
- Use ==highlight== once or twice per piece for the single idea to remember.

## Formats
${SECTION_LIST.map((s) => `- **${s.label}** (type: "${s.type}"): ${s.blurb}${s.categories.length ? ` Categories: ${s.categories.join(", ")}.` : ""}`).join("\n")}

Only newsletter issues are emailed. Articles, case studies and breakdowns live on the site and are linked from the newsletter.

## Structure that works
1. **make_the_call** first: a realistic scenario and 3 options, exactly one marked correct, each with feedback.
2. Short **text** sections with ## headings. 2–4 paragraphs each.
3. A visual every 2–3 sections: chart, stats, timeline, cause_arrows, venn, cycle, image or marked_up_image.
4. **tip** blocks (TiP = Think in Products tip): at least 2 per article/breakdown, 3–5 per case study, 1 per newsletter. Each is one practical action for work this week.
5. Optional **margin_note** right after a block: a short handwritten aside.
6. **callout** with the one-line takeaway near the end.
7. **check_yourself** last (not in newsletters), with right/wrong messages and a link to a related piece.
8. **sources** at the very end whenever the piece states facts, numbers or dates.

Case studies should be long and complete: background, the problem, the decision, what happened, numbers, what went wrong, lessons. Breakdowns explain how a product or model works, part by part.

## Facts and images
- Every number, date and quote must come from a source you can link in the sources block. Never invent statistics. If you use example numbers, say so in the chart note.
- Images: only use images you are allowed to use (e.g. Wikimedia Commons, your own drawings, press kits that allow reuse). Always fill credit and creditUrl. For Wikimedia Commons use https://commons.wikimedia.org/wiki/Special:FilePath/<File name>?width=1400 as src and the file page as creditUrl.
- Quotes: under 15 words, attributed, and listed in sources.

## Blocks
${BLOCK_MENU.map((b) => `- \`${b.type}\`: ${b.hint}`).join("\n")}

Each block needs a unique \`id\`. Ids are anchors, so check_yourself links can point to "#id".

## Workflow
- create_draft saves a draft only. A human reviews it in the admin, then publishes it.
- update_draft replaces the fields you send (send the full blocks array if you change blocks).
- Featured pieces are chosen in the admin (max ${MAX_FEATURED} per type).
`;
}
