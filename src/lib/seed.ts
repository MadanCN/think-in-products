import type { Author, Piece } from "./types";

// The four launch pieces. Shown while Supabase isn't connected, and importable
// into the database from the admin. Facts carry sources at the end of each piece.

const WIKI = (file: string, width = 1400) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
const WIKI_PAGE = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

const NETFLIX_ENVELOPE = "Netflixenvelope.jpg";
const BLOCKBUSTER = "Blockbuster Store Closing, Ypsilanti Township, Michigan.JPG";
const AMAZON_FC = "Amazon Fulfillment Center, Shakopee, Minnesota (34043258624).jpg";

const base = {
  tags: [] as string[],
  featured: false,
  cover: null,
  seo_title: "",
  seo_description: "",
  reading_minutes: 1,
  issue_number: null,
  author: "madan",
  access: "free" as const,
  status: "published" as const,
};

export const SEED_PIECES: Piece[] = [
  /* ------------------------------------------------------------------ */
  /* ARTICLE                                                             */
  /* ------------------------------------------------------------------ */
  {
    ...base,
    id: "seed-what-is-pm",
    type: "article",
    title: "What is product management?",
    slug: "what-is-product-management",
    cover: {
      src: "/images/covers/what-is-product-management.webp",
      alt: "A sticky note reads 'Patients keep missing appointments'. An arrow points to three options, and the red pen circles 'Ask why they miss them'.",
      credit: "ThinkInProducts (illustration)",
      creditUrl: "",
    },
    subtitle: "Definitions don't help much here. So instead of one, we'll follow a single request from the moment it lands, and watch what the PM actually does.",
    category: "Fundamentals",
    tags: ["product management basics", "product manager vs project manager", "discovery"],
    featured: true,
    seo_title: "What Is Product Management? A Plain-English Guide With Examples",
    seo_description: "What a product manager actually does, explained by following one real request: why before how, PM vs project manager, and the habits that matter.",
    published_at: "2026-11-23T04:30:00.000Z",
    blocks: [
      {
        id: "call1",
        type: "make_the_call",
        scenario: "Your biggest customer wants dark mode by Friday. Their account manager says the deal depends on it. Engineering is halfway through another feature.",
        question: "What do you do first?",
        options: [
          { id: "a", label: "Pause the current work and start dark mode today.", feedback: "You keep the customer happy this week, but you've let the loudest request set the roadmap without knowing what it's for.", correct: false },
          { id: "b", label: "Ask the customer what problem dark mode solves for them.", feedback: "The PM move. Maybe their staff work night shifts and the bright screen hurts. That might be solved faster another way, or it might make dark mode right for everyone.", correct: true },
          { id: "c", label: "Say no. It isn't on the roadmap.", feedback: "Protecting focus matters, but a flat no skips the step where you learn something. The roadmap is a guess, not a contract.", correct: false },
        ],
      },
      {
        id: "t1",
        type: "text",
        markdown: `## Start with the problem, not the request

Ask five product managers what they do and you'll get five answers. One spends her week in customer calls. Another lives in spreadsheets. A third mostly writes tickets. None of them is wrong.

That's because product management isn't defined by tasks. It's defined by an outcome: ==making sure the team builds the right thing, for the right people, for the right reason.== Whatever that takes this week is the job.`,
      },
      { id: "m1", type: "margin_note", text: "Write that last line on a sticky note. Everything else follows from it.", pen: "red" },
      {
        id: "t2",
        type: "text",
        markdown: `## Dig for the why

Here's a problem from a clinic booking app: patients keep missing appointments. The obvious fix is SMS reminders. But a missed appointment can have several causes, and each one needs a different fix.`,
      },
      { id: "c1", type: "cause_arrows", problem: "Patients miss appointments", reasons: ["They forget", "The slot was booked weeks ago", "They can't reschedule easily", "They feel better and skip it"] },
      {
        id: "ch1",
        type: "chart",
        title: "Why patients said they missed",
        unit: "patients",
        note: "Example numbers from a made-up clinic, to show the method.",
        sourceUrl: "",
        rows: [
          { label: "Couldn't reschedule", value: 34 },
          { label: "Booked too far ahead", value: 27 },
          { label: "Forgot", value: 18 },
          { label: "Felt better", value: 9 },
        ],
      },
      {
        id: "t3",
        type: "text",
        markdown: `If most patients miss because rescheduling is hard, reminders won't fix it. A one-tap reschedule link will. ==That's the job: find the real cause before you pick the fix.==`,
      },
      {
        id: "tip1",
        type: "tip",
        title: "Ask \"what would that let you do?\"",
        text: "Next time someone asks for a feature, ask what it would let them do. The answer is the real requirement, and it's often smaller and faster to build than the feature itself.",
      },
      {
        id: "v1",
        type: "venn",
        title: "Where a PM sits",
        circles: [
          { label: "Users", detail: "What people need, and what hurts today." },
          { label: "Business", detail: "What keeps the company going: revenue, cost, strategy." },
          { label: "Technology", detail: "What the team can build well, and how fast." },
        ],
        overlap: "The PM's job is the middle: the thing worth building that works for all three.",
      },
      {
        id: "t4",
        type: "text",
        markdown: `## Why, what, how

Every product decision has three questions, and different people own each one.

| Question | What it asks | Who owns it |
| --- | --- | --- |
| Why? | Is this problem worth solving now? | The product manager |
| What? | What should we build to solve it? | PM, design and engineering together |
| How? | How do we build it well? | Engineering |

A PM who drifts into the "how" becomes a bottleneck. A PM who never answers the "why" becomes a ticket-writer.

## Product manager is not project manager

They share two letters and often a calendar, but they answer different questions. A project manager asks *"Will we ship this on time?"* A product manager asks *"Should we ship this at all?"* Small teams often need one person to wear both hats, which is fine, as long as you know which hat you're wearing.`,
      },
      { id: "cy1", type: "cycle", title: "And then it starts again", steps: ["Problem", "Users", "Solution", "Measure"] },
      {
        id: "tip2",
        type: "tip",
        title: "Write the problem before the solution",
        text: "Before any spec, write one sentence: \"[Who] can't [do what] because [why], which costs [what].\" If you can't fill it in, you're not ready to build.",
      },
      { id: "co1", type: "callout", text: "Product management is deciding what's worth building next, and being able to say why.", tone: "highlight" },
      {
        id: "check1",
        type: "check_yourself",
        question: "A sales lead says a prospect will sign if you add bulk export. What's your first job?",
        options: [
          { id: "a", label: "Add bulk export to the next sprint so the deal closes.", feedback: "This lets one deal decide for you. It might be right, but you don't know yet.", correct: false },
          { id: "b", label: "Get an effort estimate from engineering.", feedback: "Useful later, but that's a 'how' question. You haven't answered 'why' yet.", correct: false },
          { id: "c", label: "Find out what the prospect wants to do with the export, and whether others need it too.", feedback: "Exactly. Start with the problem and how many people have it. Then decide.", correct: true },
        ],
        rightMessage: "You already think in problems. See it at company scale: how Netflix decided to cannibalise its own DVD business.",
        rightLinkLabel: "Read the Netflix case study",
        rightLinkHref: "/case-studies/netflix-dvd-to-streaming",
        wrongMessage: "Both questions reward asking 'why' before 'how'. Re-read the cause arrows section and try again.",
        wrongLinkLabel: "Back to the cause arrows",
        wrongLinkHref: "#c1",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* CASE STUDY: NETFLIX                                                 */
  /* ------------------------------------------------------------------ */
  {
    ...base,
    id: "seed-netflix",
    type: "case_study",
    title: "Case Study: Netflix – The Transition from DVD Rentals to Streaming",
    slug: "netflix-dvd-to-streaming",
    subtitle: "How a company that mailed red envelopes decided to make its own best business obsolete, nearly broke itself doing it in 2011, and came out as the world's biggest streaming service.",
    category: "Pivots",
    tags: ["netflix", "disruption", "pivot", "pricing", "cannibalization", "streaming"],
    featured: true,
    cover: {
      src: WIKI(NETFLIX_ENVELOPE, 980),
      alt: "A red Netflix DVD mailing envelope",
      credit: "BlueMint, via Wikimedia Commons",
      creditUrl: WIKI_PAGE(NETFLIX_ENVELOPE),
    },
    seo_title: "Netflix Case Study: How Netflix Moved From DVD Rentals to Streaming",
    seo_description: "A detailed product case study of Netflix's shift from DVD-by-mail to streaming: the 2007 launch, the 2011 Qwikster crisis, and the lessons for product managers.",
    published_at: "2026-11-25T04:30:00.000Z",
    blocks: [
      {
        id: "nf-call",
        type: "make_the_call",
        scenario: "It's late 2006. You run product at Netflix. The DVD-by-mail business is growing and profitable. Your streaming technology works, but you can only get rights to about 1,000 titles, and most homes can't watch internet video on a TV yet.",
        question: "What do you do with streaming?",
        options: [
          { id: "a", label: "Wait. Launch when broadband and licensing catch up, so the first version is great.", feedback: "Safe, but someone else learns the market first. By the time it's 'ready', you're the follower in the business you saw coming.", correct: false },
          { id: "b", label: "Launch it small, free for existing DVD members, and improve it every month.", feedback: "This is what Netflix did. Streaming became a perk, not a product to sell, so 1,000 titles was a bonus rather than a disappointment, and the team got years of learning.", correct: true },
          { id: "c", label: "Launch a separate paid streaming service to prove it can stand on its own.", feedback: "With 1,000 titles, a separate paid product would have looked thin next to 70,000 DVDs. Netflix did split pricing later, in 2011, and it went badly.", correct: false },
        ],
      },
      {
        id: "nf-tldr",
        type: "text",
        markdown: `## The short version

Netflix started in 1998 by mailing DVDs in red envelopes. In 2007 it added streaming as a free extra. In 2011 it raised prices and tried to split the two businesses, lost about 800,000 US subscribers in one quarter and saw its stock fall by roughly three quarters. It reversed the split within weeks, kept the price, and bet the company on streaming, then on making its own shows. It mailed its last DVD on September 29, 2023, by which time the DVD business was half a percent of revenue.

The lesson isn't "streaming won". Everyone could see streaming coming. The lesson is ==how a company plans to replace its own best product, and what happens when it moves faster than its customers.==`,
      },
      {
        id: "nf-stats",
        type: "stats",
        items: [
          { value: "1998", label: "First DVD shipped (Beetlejuice)" },
          { value: "5.2 billion", label: "Discs mailed in 25 years" },
          { value: "40 million", label: "DVD customers served" },
          { value: "301.6 million", label: "Paid streaming memberships, end of 2024" },
        ],
        source: "Netflix, Engadget, Netflix Q4 2024 shareholder letter",
        sourceUrl: "https://www.engadget.com/netflix-mails-its-final-dvds-to-subscribers-113557572.html",
      },
      {
        id: "nf-timeline",
        type: "timeline",
        title: "Twenty-six years in one scroll",
        events: [
          { date: "1997", title: "Netflix is founded", text: "Reed Hastings and Marc Randolph start the company. They pick DVDs over VHS tapes, which are too expensive to stock and too delicate to post." },
          { date: "Apr 1998", title: "NetFlix.com launches", text: "Pay per rental: about $4 a DVD plus postage. The first disc shipped is Beetlejuice." },
          { date: "Sep 1999", title: "The subscription", text: "A monthly fee, no due dates and no late fees. The model that made Netflix." },
          { date: "2000", title: "Blockbuster says no", text: "Netflix offers itself to Blockbuster for $50 million. Blockbuster declines." },
          { date: "2002", title: "Netflix goes public", text: "The IPO prices at $15 a share." },
          { date: "Jan 2007", title: "\"Watch Now\" launches", text: "Streaming arrives as a free extra for DVD members, with about 1,000 titles against 70,000 on disc.", highlight: true },
          { date: "Jul 2011", title: "The price split", text: "DVD and streaming become separate plans. Members who want both now pay $15.98 a month, up from $9.99.", highlight: true },
          { date: "Sep–Oct 2011", title: "Qwikster, briefly", text: "Netflix announces the DVD business will be renamed Qwikster, then cancels the plan within weeks. It keeps the new prices." },
          { date: "Q3 2011", title: "The bill arrives", text: "About 800,000 US subscribers leave in one quarter. The stock falls from over $300 in July to about $77 in October." },
          { date: "Feb 2013", title: "House of Cards", text: "Netflix releases its first big original series, all episodes at once, and starts to own what it streams." },
          { date: "Jan 2016", title: "Almost everywhere", text: "Netflix launches in more than 130 new countries on a single day." },
          { date: "Sep 29, 2023", title: "The last red envelope", text: "Netflix ships its final DVDs. The DVD business made $145.7 million in 2022, about 0.5% of revenue." },
          { date: "Q4 2024", title: "301.6 million members", text: "Netflix passes 300 million paid memberships, then stops reporting subscriber numbers every quarter." },
        ],
      },
      {
        id: "nf-p1",
        type: "text",
        markdown: `## Part 1: The problem Netflix was really solving

In the late 1990s, renting a film in the US meant driving to a store, hoping your film was in stock, and paying a fine if you returned it late. Late fees were a big part of how rental stores made money, which meant the store's profit depended on customers making mistakes.

Netflix's first version didn't fix that. It charged per rental, plus postage. It fixed it in 1999 with the subscription: ==one monthly fee, keep a disc as long as you like, no late fees.== When you return one, the next disc in your queue is posted.

Look at what that design does:

- **It turns the store's profit centre into a selling point.** Netflix couldn't charge late fees, so it made "no late fees" the reason to switch.
- **It makes the customer's list the product.** Your queue meant you always had something on its way. That queue became data, which became recommendations.
- **It works better as you use it more.** The more you rated, the better the suggestions, the longer you stayed.`,
      },
      {
        id: "nf-img1",
        type: "image",
        src: WIKI(NETFLIX_ENVELOPE, 980),
        alt: "A red Netflix envelope holding a DVD of the film Coach Carter",
        caption: "The red envelope: a prepaid return mailer that doubled as the brand's most visible ad.",
        credit: "BlueMint, via Wikimedia Commons",
        creditUrl: WIKI_PAGE(NETFLIX_ENVELOPE),
      },
      {
        id: "nf-p1b",
        type: "text",
        markdown: `Even then, the founders said mail was a stage, not the destination. Years later Reed Hastings put it this way: "There's a reason we didn't call the company 'DVD-by-Mail.com'." The name was about films on the internet. The envelope was just the best way to deliver them in 1999.`,
      },
      { id: "nf-m1", type: "margin_note", text: "Name the job, not the delivery method. 'Netflix', not 'DVD-by-Mail'.", pen: "blue" },
      {
        id: "nf-tip1",
        type: "tip",
        title: "Name the need, not today's solution",
        text: "When you describe your product, write the need it serves in one line without mentioning the technology. If that line still makes sense in ten years, your roadmap has room to change how you deliver it.",
      },
      {
        id: "nf-p2",
        type: "text",
        markdown: `## Part 2: Why Blockbuster couldn't follow

In 2000, Netflix was an unprofitable startup. Hastings and Randolph flew to Dallas and offered to sell the company to Blockbuster for $50 million, and to run Blockbuster's online business for them. Blockbuster's CEO turned it down.

It's easy to laugh at that now. At the time, it was a reasonable call: Netflix was losing money, the dot-com bubble was bursting, and mail-order DVDs looked like a niche for film fans. Clayton Christensen later used Netflix as a textbook example of disruption: it started by serving customers Blockbuster didn't care much about, and only became a threat once new technology let it serve Blockbuster's core customers too.

The deeper reason Blockbuster struggled is that copying Netflix meant hurting itself.`,
      },
      {
        id: "nf-causes",
        type: "cause_arrows",
        problem: "Why Blockbuster couldn't simply copy Netflix",
        reasons: ["Late fees were real profit", "Thousands of store leases", "Franchisees wanted foot traffic", "Online would cannibalise stores"],
      },
      {
        id: "nf-img2",
        type: "image",
        src: WIKI(BLOCKBUSTER, 1400),
        alt: "A Blockbuster video store with store closing signs in the windows",
        caption: "A Blockbuster store closing in Ypsilanti Township, Michigan, in November 2013.",
        credit: "Dwight Burdette, via Wikimedia Commons",
        creditUrl: WIKI_PAGE(BLOCKBUSTER),
      },
      {
        id: "nf-tip2",
        type: "tip",
        title: "List what your current business makes you afraid of",
        text: "Write down the moves a new competitor could make that you wouldn't, because they'd hurt your current revenue. That list is your most likely disruption. Netflix kept that list about itself; Blockbuster didn't.",
      },
      {
        id: "nf-p3",
        type: "text",
        markdown: `## Part 3: 2007, launching the thing that would kill your best business

By 2006 Netflix was winning at DVDs. And that's exactly when it had to start replacing them. Streaming had three problems:

1. **Too few titles.** Studios would only license a small slice of their catalogues for internet viewing.
2. **Too few screens.** Watching online mostly meant watching on a computer, not on the living-room TV.
3. **Too little bandwidth.** Many homes couldn't stream video smoothly.

So in January 2007 Netflix launched "Watch Now" in the smallest way that would still teach it something. It wasn't sold as a product. It was added to existing DVD plans at no extra cost, with a monthly limit on hours of viewing tied to your plan.`,
      },
      {
        id: "nf-chart1",
        type: "chart",
        title: "Titles available when streaming launched (January 2007)",
        unit: "titles",
        note: "About 1% of the DVD library was available to stream at launch. Source: Quartz.",
        sourceUrl: "https://qz.com/887010/netflix-nflx-launched-streaming-video-10-years-ago-and-changed-the-way-we-watch-everything",
        rows: [
          { label: "On DVD", value: 70000 },
          { label: "Streaming", value: 1000 },
        ],
      },
      {
        id: "nf-p3b",
        type: "text",
        markdown: `Look at that chart again. As a standalone product, streaming would have looked like a joke. As a free extra, it was a pleasant surprise. ==The framing decided whether the same 1,000 titles felt thin or generous.==

Then Netflix did the unglamorous part for four years: more licensing deals, getting the app onto game consoles, Blu-ray players and connected TVs, and improving the video quality at lower bandwidth. Each step made streaming a little more useful and DVDs a little less necessary.`,
      },
      { id: "nf-m2", type: "margin_note", text: "Same product, different frame: a 'free bonus' can launch what a 'new paid service' can't.", pen: "red" },
      {
        id: "nf-tip3",
        type: "tip",
        title: "Launch the new thing as a bonus, not a bet",
        text: "When your new product is thinner than the old one, attach it to what customers already pay for. You get real usage data without asking anyone to switch, and you can raise expectations later.",
      },
      {
        id: "nf-p4",
        type: "text",
        markdown: `## Part 4: 2011, the year Netflix almost broke

By July 2011 Netflix looked unstoppable. Blockbuster had gone bankrupt the year before. Subscribers, profits and the share price were all at record highs.

Then Netflix made two decisions in quick succession.

**Decision one, July 2011: split the prices.** Until then, one plan of $9.99 a month gave you DVDs by mail plus streaming. Netflix separated them: $7.99 for streaming, $7.99 for one DVD at a time. Members who wanted both now paid $15.98, a 60% increase, announced with little warning.

**Decision two, September 2011: split the company.** Hastings apologised in a blog post for how the change had been communicated, then announced that the DVD business would get its own name, Qwikster, with its own website and its own account. Customers who used both would now manage two services.`,
      },
      {
        id: "nf-chart2",
        type: "chart",
        title: "Monthly price for DVD by mail plus streaming",
        unit: "US dollars",
        note: "One-disc plan plus streaming in the US. Source: TIME.",
        sourceUrl: "https://content.time.com/time/specials/packages/article/0,28804,2101344_2101318,00.html",
        rows: [
          { label: "Before July 2011", value: 9.99 },
          { label: "After the split", value: 15.98 },
        ],
      },
      {
        id: "nf-p4b",
        type: "text",
        markdown: `Customers revolted. Netflix cancelled Qwikster in October, before it launched, but kept the new prices. The damage showed up in the numbers:`,
      },
      {
        id: "nf-stats2",
        type: "stats",
        items: [
          { value: "60%", label: "Price increase for members who wanted DVDs and streaming" },
          { value: "~800,000", label: "US subscribers lost in Q3 2011" },
          { value: "$300+ → $77", label: "Share price, July to late October 2011" },
        ],
        source: "NPR, Associated Press",
        sourceUrl: "https://www.npr.org/transcripts/141677811",
      },
      {
        id: "nf-p4c",
        type: "text",
        markdown: `### What went wrong, as a product manager would see it

The strategy was right. Streaming was the future, DVDs were a shrinking business with expensive warehouses and postage, and the two needed different teams and different economics. Splitting the price reflected real costs.

The execution treated customers as if they had already finished a journey that Netflix had finished in its own head.

| What Netflix saw | What customers felt |
| --- | --- |
| DVDs are the past; streaming is the future | "I still watch new films on DVD; the streaming catalogue is small" |
| Separate prices match separate costs | "My bill went up 60% overnight" |
| Two brands let each business focus | "Now I need two websites, two queues and two logins" |
| Move fast before it's too late | "You didn't ask, and you didn't explain" |

Hastings later said Netflix had been moving too fast. The core error was ==asking customers to pay more and get less convenience at the same moment==, before streaming was good enough to make DVDs feel unnecessary.`,
      },
      { id: "nf-m3", type: "margin_note", text: "Right destination, wrong speed. Customers move on their timeline, not yours.", pen: "red" },
      {
        id: "nf-tip4",
        type: "tip",
        title: "Never take away convenience and raise the price at once",
        text: "If a change makes something cost more, make it easier at the same time, or change one before the other. Customers forgive one loss; two at once feels like a betrayal.",
      },
      {
        id: "nf-p5",
        type: "text",
        markdown: `## Part 5: Owning what you stream

Recovering subscribers wasn't enough. Netflix had a structural problem: it was paying studios for films and shows that those studios could take back, or use to launch their own services. A streaming company that only rents other people's content is always one negotiation away from a weaker catalogue.

In February 2013 Netflix released *House of Cards*, its first big original drama, with the whole season available at once. That single decision changed three things:

- **The catalogue became an asset Netflix owned,** not a rental.
- **Viewing data shaped what got made,** because Netflix knew what its members actually watched.
- **The "drop the whole season" release** created a new habit people now call binge-watching.

In January 2016 Netflix switched on its service in more than 130 new countries on one day. Owning its shows made that possible: it didn't need country-by-country rights for its own originals.`,
      },
      { id: "nf-cycle", type: "cycle", title: "The streaming flywheel Netflix built", steps: ["More members", "More money for shows", "Better catalogue", "More viewing data"] },
      {
        id: "nf-p6",
        type: "text",
        markdown: `## Part 6: Switching off the original business

The DVD business didn't die in 2011. It kept running quietly as DVD.com for another twelve years, serving people with slow internet, film fans who wanted titles that never came to streaming, and people who simply liked the envelopes.

By 2022 it brought in $145.7 million, about 0.5% of Netflix's revenue, and it was shrinking every year. In April 2023 Netflix announced the end, and on September 29, 2023 it shipped its final discs. Customers were told they could keep whatever arrived in their last envelopes.

That's the last lesson: ==you don't have to kill the old business on the day you launch the new one.== You let it fund the transition, serve the customers who still need it, and close it when it no longer matters.`,
      },
      {
        id: "nf-venn",
        type: "venn",
        title: "Why the transition worked in the end",
        circles: [
          { label: "Patience", detail: "Streaming ran alongside DVDs for years before it had to stand alone." },
          { label: "Ownership", detail: "Original shows meant the catalogue couldn't be taken away." },
          { label: "Reach", detail: "Being on every screen, from consoles to smart TVs, made streaming the easy choice." },
        ],
        overlap: "Netflix won when streaming was clearly better for the customer, not when Netflix decided it was the future.",
      },
      {
        id: "nf-lessons",
        type: "text",
        markdown: `## What product managers can take from this

1. **Disrupt yourself on purpose.** If a cheaper, more convenient way to meet your customers' need is coming, someone will build it. Better you than a startup.
2. **Use the old business to fund the new one.** DVD profits paid for streaming licences and technology for years. Don't starve the thing that's paying the bills before its replacement is ready.
3. **Launch thin products as bonuses.** A free extra earns patience that a new paid product doesn't.
4. **Move at the customer's speed.** Being right about the destination doesn't excuse a journey that feels like a loss.
5. **Own the part that can be taken away.** For Netflix it was the content. For your product it might be data, distribution or the relationship with the customer.`,
      },
      { id: "nf-callout", type: "callout", text: "Netflix didn't win by predicting streaming. It won by being willing to make its own best business obsolete, and by learning, painfully, how fast customers would follow.", tone: "dark" },
      {
        id: "nf-tip5",
        type: "tip",
        title: "Run a 'kill our product' session once a year",
        text: "Spend one hour with your team designing the product that would make yours irrelevant. Then ask which parts of it you could start building now, as a small bonus for existing customers.",
      },
      {
        id: "nf-check",
        type: "check_yourself",
        question: "You're moving customers from an old product to a new one. The new one is better for most people, but not all. What's the safest first step?",
        options: [
          { id: "a", label: "Raise the old product's price so people switch faster.", feedback: "That's Netflix in 2011: a cost increase with no extra value. Expect churn and anger.", correct: false },
          { id: "b", label: "Give existing customers the new product at no extra cost, and keep the old one running.", feedback: "Right. That's Netflix in 2007. Let people try the new thing without losing anything, and watch who moves.", correct: true },
          { id: "c", label: "Announce a shutdown date for the old product so everyone plans ahead.", feedback: "Netflix did this, but only in 2023, when the old business was 0.5% of revenue. Too early and you push customers to competitors.", correct: false },
        ],
        rightMessage: "You'd have handled 2011 better than Netflix did. Next, see a different kind of self-reinforcing growth: Amazon's flywheel.",
        rightLinkLabel: "Read: Amazon, the flywheel",
        rightLinkHref: "/breakdowns/amazon-flywheel",
        wrongMessage: "Re-read Part 4 and look at the table: what Netflix saw versus what customers felt.",
        wrongLinkLabel: "Back to 2011",
        wrongLinkHref: "#nf-p4",
      },
      {
        id: "nf-sources",
        type: "sources",
        items: [
          { label: "Netflix: Netflix DVD – The Final Season (2023)", url: "https://about.netflix.com/en/news/netflix-dvd-the-final-season" },
          { label: "Engadget: Netflix mails its final DVDs to subscribers", url: "https://www.engadget.com/netflix-mails-its-final-dvds-to-subscribers-113557572.html" },
          { label: "Quartz: Netflix launched streaming video 10 years ago", url: "https://qz.com/887010/netflix-nflx-launched-streaming-video-10-years-ago-and-changed-the-way-we-watch-everything" },
          { label: "Marketplace: Reed Hastings on how Netflix beat Blockbuster", url: "https://www.marketplace.org/story/2020/09/08/ceo-reed-hastings-on-how-netflix-beat-blockbuster" },
          { label: "Fortune: Marc Randolph recalls Blockbuster rejecting Netflix", url: "https://fortune.com/2023/04/14/netflix-cofounder-marc-randolph-recalls-blockbuster-rejecting-chance-to-buy-it/" },
          { label: "TIME: Reed Hastings and the 2011 price increase", url: "https://content.time.com/time/specials/packages/article/0,28804,2101344_2101318,00.html" },
          { label: "NPR: More bad news for Netflix, 800,000 customers lost", url: "https://www.npr.org/transcripts/141677811" },
          { label: "NPR: Netflix kills Qwikster, price hike lives on", url: "https://www.npr.org/sections/thetwo-way/2011/10/10/141209082/" },
          { label: "Associated Press via Washington Times: Netflix shares tank amid backlash", url: "https://www.washingtontimes.com/news/2011/oct/25/netflix-shares-tank-amid-backlash-and-defections/" },
          { label: "Wikipedia: Timeline of Netflix", url: "https://en.wikipedia.org/wiki/Timeline_of_Netflix" },
          { label: "Netflix Q4 2024 shareholder letter", url: "https://s22.q4cdn.com/959853165/files/doc_downloads/2025/Q4-24-Earnings-8-K.pdf" },
          { label: "The Fool: 12 things you probably didn't know about Netflix", url: "https://www.fool.com/investing/2016/12/21/12-fascinating-things-you-probably-didnt-know-abou.aspx" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* PRODUCT BREAKDOWN: AMAZON FLYWHEEL                                  */
  /* ------------------------------------------------------------------ */
  {
    ...base,
    id: "seed-amazon-flywheel",
    type: "breakdown",
    title: "Amazon: The Flywheel",
    slug: "amazon-flywheel",
    subtitle: "The loop Amazon sketched in 2001 explains almost every decision it has made since: why it cuts prices, invites competitors onto its own store, and built Prime.",
    category: "Growth loops",
    tags: ["amazon", "flywheel", "virtuous cycle", "marketplace", "growth loop", "prime"],
    featured: true,
    cover: {
      src: WIKI(AMAZON_FC, 1400),
      alt: "The exterior of a large Amazon fulfillment centre",
      credit: "Tony Webster, via Wikimedia Commons",
      creditUrl: WIKI_PAGE(AMAZON_FC),
    },
    seo_title: "Amazon Flywheel Explained: How Amazon's Virtuous Cycle Works",
    seo_description: "A product breakdown of the Amazon flywheel: customer experience, traffic, sellers, selection, lower costs and lower prices, and how to find your own.",
    published_at: "2026-11-24T04:30:00.000Z",
    blocks: [
      {
        id: "am-call",
        type: "make_the_call",
        scenario: "You run an online store. Growth has slowed. You have budget for one big move this year.",
        question: "Which move does the most for growth next year and the year after?",
        options: [
          { id: "a", label: "Double the advertising budget to bring in more visitors.", feedback: "More visitors this quarter, but the moment you stop paying, they stop coming. Bought traffic doesn't make the store any better.", correct: false },
          { id: "b", label: "Let other sellers list on your store, even against your own products.", feedback: "The flywheel move. More sellers mean more selection and keener prices, which bring more customers, which bring more sellers. It keeps working after you stop pushing.", correct: true },
          { id: "c", label: "Redesign the homepage to look more premium.", feedback: "Might lift conversion a little, but it doesn't change selection, price or delivery, the things that bring customers back.", correct: false },
        ],
      },
      {
        id: "am-intro",
        type: "text",
        markdown: `## A crisis and a napkin

In 2001 Amazon was in trouble. The dot-com bubble had burst and the company was still losing money. That autumn, the management writer Jim Collins, whose book *Good to Great* had just come out, spent time with Jeff Bezos and his leadership team.

Collins's big idea was the **flywheel**: a giant, heavy wheel that's hard to start turning, but that builds momentum with every push until it seems to turn by itself. Great companies, he argued, don't grow from one dramatic move but from many consistent pushes in the same direction.

Bezos and his team sketched Amazon's own version. As Brad Stone tells it in *The Everything Store*, the loop went roughly like this: lower prices bring more customer visits; more customers bring more sales and attract more third-party sellers; that lets Amazon get more out of fixed costs like warehouses and servers; and that efficiency lets it lower prices again. ==Feed any part of the loop, and the whole wheel speeds up.==`,
      },
      { id: "am-cycle1", type: "cycle", title: "The growth loop: experience brings traffic, traffic brings sellers", steps: ["Customer experience", "Traffic", "Sellers", "Selection"] },
      { id: "am-cycle2", type: "cycle", title: "The cost loop: growth makes it cheaper to serve each order", steps: ["Growth", "Lower cost structure", "Lower prices", "Customer experience"] },
      { id: "am-m1", type: "margin_note", text: "Two loops share one hub: customer experience. Everything Amazon does should push on it.", pen: "blue" },
      {
        id: "am-parts",
        type: "text",
        markdown: `## Each spoke, and the decision behind it

**Customer experience** sits at the centre. Amazon defines it narrowly and measurably: selection, price and convenience. Not brand, not design trends. Three things a customer notices on every order.

**Traffic.** Good experience brings people back and brings their friends. Notice the order: traffic is an *output* of the experience, not an input you buy. Amazon does advertise, but the flywheel says the cheapest traffic is the customer who returns.

**Sellers.** This is the counter-intuitive spoke. Amazon invited other retailers to sell on its own pages, often right next to Amazon's own listing for the same product. That looks like inviting competitors into your shop. In flywheel terms, it's the fastest way to add selection without Amazon buying stock.

**Selection.** More sellers mean more products, more sizes, more prices. More selection improves the experience, and the wheel turns again.

**Lower cost structure.** More orders spread the fixed costs of warehouses, delivery networks and software across more sales. Each order gets cheaper to fulfil.

**Lower prices.** Amazon passes those savings back as lower prices instead of keeping them as margin, which improves the experience. Back to the centre.`,
      },
      {
        id: "am-mark",
        type: "marked_up_image",
        src: "/images/sample-product-page.svg",
        alt: "A made-up online store product page for a water bottle, showing price, delivery promise, ratings, other sellers and suggested products",
        caption: "A made-up product page, drawn for this breakdown. Every element maps to a spoke of the flywheel.",
        credit: "ThinkInProducts",
        creditUrl: "",
        notes: [
          { id: "an1", x: 12, y: 30, text: "Ratings and reviews: other customers do the selling. More buyers, more reviews, more trust.", pen: "blue", side: "left" },
          { id: "an2", x: 10, y: 51, text: "Price: savings from scale come back to you here, not into margin.", pen: "red", side: "left" },
          { id: "an3", x: 88, y: 58, text: "Delivery promise: the convenience spoke, made concrete. Prime made this the default.", pen: "red", side: "right" },
          { id: "an4", x: 88, y: 71, text: "Other sellers: competitors on the same page. Selection without buying stock.", pen: "blue", side: "right" },
          { id: "an5", x: 12, y: 90, text: "Suggestions: more selection seen, more reasons to come back.", pen: "red", side: "left" },
        ],
      },
      {
        id: "am-tip1",
        type: "tip",
        title: "Map every feature to a spoke",
        text: "Draw your product's loop, then label each feature on your roadmap with the spoke it pushes. Features that push no spoke are decoration. Cut or postpone them.",
      },
      {
        id: "am-img",
        type: "image",
        src: WIKI(AMAZON_FC, 1400),
        alt: "A large Amazon fulfillment centre building with trucks and a car park",
        caption: "The cost loop lives in buildings like this one in Shakopee, Minnesota: the more orders flow through, the cheaper each one gets.",
        credit: "Tony Webster, via Wikimedia Commons",
        creditUrl: WIKI_PAGE(AMAZON_FC),
      },
      {
        id: "am-prime",
        type: "text",
        markdown: `## Prime: a flywheel inside the flywheel

In February 2005 Amazon launched Prime: $79 a year for unlimited two-day shipping on eligible items. Many people inside and outside the company thought it would lose money. Shipping was expensive, and members who'd paid up front would order more often.

That was the point. Once you've paid for Prime, you check Amazon first, because shipping already feels free. More orders per customer means more traffic for sellers, more sellers join, selection grows, and the cost of each delivery falls. In 2006 Amazon launched **Fulfilment by Amazon**, letting other sellers store their goods in Amazon's warehouses so their products could be Prime-eligible too. Prime pulled sellers into the loop, and sellers made Prime more valuable.`,
      },
      {
        id: "am-stats",
        type: "stats",
        items: [
          { value: "$79", label: "Prime's yearly price at launch in 2005" },
          { value: "62%", label: "Share of units sold by third-party sellers, Q4 2024" },
          { value: "$156.1B", label: "Third-party seller services revenue in 2024" },
        ],
        source: "Marketplace Pulse, Amazon earnings, Wikipedia",
        sourceUrl: "https://www.marketplacepulse.com/articles/amazon-steers-third-party-seller-share-to-all-time-high",
      },
      {
        id: "am-timeline",
        type: "timeline",
        title: "How the wheel got its spokes",
        events: [
          { date: "2000", title: "Third-party sellers arrive", text: "Amazon opens its pages to other sellers, the spoke that drives selection." },
          { date: "2001", title: "The flywheel is drawn", text: "After time with Jim Collins, Bezos and his team sketch their virtuous cycle.", highlight: true },
          { date: "Feb 2005", title: "Prime launches", text: "$79 a year for unlimited two-day shipping." },
          { date: "2006", title: "Fulfilment by Amazon", text: "Sellers can use Amazon's warehouses and become Prime-eligible." },
          { date: "Feb 2011", title: "Prime Video added", text: "Streaming films and shows join Prime, one more reason to stay a member." },
          { date: "Q4 2024", title: "62% of units", text: "Third-party sellers account for a record share of units sold.", highlight: true },
        ],
      },
      {
        id: "am-critique",
        type: "text",
        markdown: `## Where flywheels wobble

Flywheels aren't magic, and Amazon's has costs.

- **The loop can tax its own spokes.** Seller fees for storage, delivery and advertising grew into a huge business. If fees rise faster than the value sellers get, sellers raise prices or leave, and two spokes weaken at once.
- **Momentum hides problems.** A spinning wheel can keep growing for a while even when one part is getting worse. You need a metric for every spoke, not just the total.
- **Not every business has one.** A flywheel needs a genuine link from each step to the next. If more customers don't actually make your product better or cheaper, you have a funnel, not a flywheel.`,
      },
      {
        id: "am-howto",
        type: "text",
        markdown: `## Find your own flywheel in five steps

1. **Write your hub.** The one thing customers come back for. For Amazon: selection, price, convenience.
2. **List what improves the hub.** Not features, but forces: more content, more users, lower cost, faster delivery.
3. **Draw arrows only where one thing truly causes the next.** "More users means more reviews means better decisions for the next user" is a real arrow. "More users means more revenue" isn't, because it doesn't feed back.
4. **Close the loop.** The last arrow must point back to the hub. If it doesn't, keep looking.
5. **Pick one metric per spoke** and review them together every month.`,
      },
      {
        id: "am-tip2",
        type: "tip",
        title: "Test every arrow with 'so what?'",
        text: "For each arrow in your loop, ask: so what does that change for the next customer? If the answer is 'nothing they'd notice', the arrow isn't real and the loop won't spin.",
      },
      { id: "am-callout", type: "callout", text: "A flywheel isn't a growth hack. It's a decision about where every unit of effort goes: into the hub customers come back for.", tone: "highlight" },
      {
        id: "am-check",
        type: "check_yourself",
        question: "Which of these is a real flywheel arrow?",
        options: [
          { id: "a", label: "More users → more revenue", feedback: "True, but revenue doesn't automatically make the product better for the next user. It doesn't loop back.", correct: false },
          { id: "b", label: "More drivers on a ride app → shorter waits for riders", feedback: "Yes. Each new driver makes the product better for the next rider, which brings more riders, which brings more drivers.", correct: true },
          { id: "c", label: "Bigger marketing budget → more sign-ups", feedback: "That's a funnel you pay to fill. Stop paying and it stops.", correct: false },
        ],
        rightMessage: "You can tell a loop from a funnel. See how Netflix built its own content flywheel.",
        rightLinkLabel: "Read the Netflix case study",
        rightLinkHref: "/case-studies/netflix-dvd-to-streaming",
        wrongMessage: "A real arrow makes the product better or cheaper for the next customer. Look at the growth loop again.",
        wrongLinkLabel: "Back to the loops",
        wrongLinkHref: "#am-cycle1",
      },
      {
        id: "am-sources",
        type: "sources",
        items: [
          { label: "Jim Collins, Turning the Flywheel (extract via Outlook Business)", url: "https://www.outlookbusiness.com/hardbound/escape-velocity-5110" },
          { label: "Brad Stone, The Everything Store (quote via Goodreads)", url: "https://www.goodreads.com/quotes/8744243-drawing-on-collins-s-concept-of-a-flywheel-or-self-reinforcing-loop" },
          { label: "Marketplace Pulse: third-party seller share at an all-time high", url: "https://www.marketplacepulse.com/articles/amazon-steers-third-party-seller-share-to-all-time-high" },
          { label: "Wikipedia: Amazon Prime", url: "https://en.wikipedia.org/wiki/Amazon_Prime" },
          { label: "Pattern: Amazon Prime timeline", url: "https://pattern.com/blog/amazon-prime-timeline" },
          { label: "Fortune: Amazon's record profits and seller fees (2025)", url: "https://fortune.com/2025/02/07/amazon-2024-earnings-third-party-seller-fees-profits/" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* NEWSLETTER: ISSUE 1                                                 */
  /* ------------------------------------------------------------------ */
  {
    ...base,
    id: "seed-newsletter-1",
    type: "newsletter",
    title: "Issue #1: Why I'm starting a product notebook",
    slug: "issue-1-why-a-product-notebook",
    cover: {
      src: "/images/covers/newsletter-issue-1.webp",
      alt: "An envelope stamped 'Issue 1', addressed to everyone learning to think in products, next to a page of the newsletter.",
      credit: "ThinkInProducts (illustration)",
      creditUrl: "",
    },
    subtitle: "What ThinkInProducts is, what lands in your inbox each week, and the three pieces to read first.",
    category: "",
    issue_number: 1,
    seo_title: "ThinkInProducts Newsletter, Issue #1",
    seo_description: "The first issue of the ThinkInProducts newsletter: what to expect each week and three pieces to start with.",
    published_at: "2026-11-26T04:30:00.000Z",
    blocks: [
      {
        id: "nl-hello",
        type: "text",
        markdown: `Hi there,

Thanks for subscribing. This is the first issue of ThinkInProducts, so let me tell you why it exists and what you'll get.

I started my career as a developer and moved into product management in healthcare SaaS. The hardest part of the switch wasn't learning frameworks. It was learning to ==ask "why" before "how"==, and to explain my decisions so others could follow them. Most of what I read about product management was either too abstract or too much like a checklist.

So this is the notebook I wish I'd had: real decisions, taken apart in plain words, with a question for you to answer before I show you mine.`,
      },
      {
        id: "nl-what",
        type: "text",
        markdown: `## What lands in your inbox

Every week you'll get this newsletter, with what's happening in product and what I'm working on and learning. On the site, every week, there's also a new **article** on a product management idea and a **product breakdown** of a product or business model. Once a month there's a deep **case study**.

Only this newsletter comes by email. I'll link the week's pieces here, so you can read them when you have time.`,
      },
      {
        id: "nl-stats",
        type: "stats",
        items: [
          { value: "1", label: "Newsletter a week, in your inbox" },
          { value: "2", label: "New pieces a week on the site" },
          { value: "1", label: "Deep case study a month" },
        ],
        source: "",
        sourceUrl: "",
      },
      {
        id: "nl-read",
        type: "text",
        markdown: `## Start with these three

**[What is product management?](/articles/what-is-product-management)** Instead of a definition, we follow one request from the moment it lands. You'll make a call before you read on.

**[Case study: Netflix, from DVD rentals to streaming](/case-studies/netflix-dvd-to-streaming)** How Netflix replaced its own best business, nearly broke itself in 2011, and what it learned. The longest piece on the site, and the one I'd most like you to read.

**[Amazon: the flywheel](/breakdowns/amazon-flywheel)** The loop Amazon drew in 2001 that explains why it cuts prices and lets competitors sell on its own pages.`,
      },
      {
        id: "nl-tip",
        type: "tip",
        title: "Ask \"what would that let you do?\"",
        text: "This week, when someone asks you for a feature, ask what it would let them do before you say yes or no. Write down the answer. You'll often find the real need is smaller than the request.",
      },
      {
        id: "nl-working",
        type: "text",
        markdown: `## What I'm working on

Building this site, in public. Every article here is written with interactive pieces: a question at the start, a picture or chart in the middle, and a check at the end. If something doesn't work on your phone, or a piece loses you halfway, reply and tell me. That feedback is the most useful thing you can send.

## One question for you

What's one product decision at your work this month that you didn't agree with, or didn't understand? Hit reply. With your permission, the best ones become future issues (anonymised, of course).

See you next week,
[Your name]`,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* AUTHORS                                                             */
/* ------------------------------------------------------------------ */
export const SEED_AUTHORS: Author[] = [
  {
    slug: "madan",
    name: "Madan",
    role: "Product Manager, healthcare SaaS",
    short_bio: "Product manager who started as a Salesforce developer. I write ThinkInProducts to learn product management in public.",
    bio: `I'm a product manager in healthcare SaaS, working on practice management and EHR software used by clinics.

I started my career in July 2024 as a Salesforce developer, and moved into product management in 2025. Building things first taught me that the hard part is rarely *how* to build. It's deciding *what* is worth building, and why.

ThinkInProducts is my notebook for that question. Every week I write an article and a product breakdown, every month a long case study, and a newsletter that ties it together. I write to learn, so if you spot something I got wrong, tell me.`,
    photo: "/images/authors/madan.jpg",
    avatar: "/images/authors/madan-avatar.jpg",
    links: [],
  },
];
