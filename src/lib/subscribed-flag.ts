// Remembers in this browser that the reader is subscribed, so we stop asking.
// The <html data-subscribed> attribute is set before the page draws (see layout),
// and CSS hides anything marked .when-unsub and shows .when-sub.

export const SUBSCRIBED_KEY = "tip:subscribed";

export const SUBSCRIBED_BOOT = `try{if(localStorage.getItem("${SUBSCRIBED_KEY}")==="1")document.documentElement.setAttribute("data-subscribed","")}catch(e){}`;

// applyNow=false keeps the page as it is (e.g. so a "check your inbox" message stays
// visible); the prompts disappear from the next page on.
export function markSubscribed(on: boolean, applyNow = true) {
  try {
    if (on) localStorage.setItem(SUBSCRIBED_KEY, "1");
    else localStorage.removeItem(SUBSCRIBED_KEY);
  } catch {}
  if (applyNow && typeof document !== "undefined") document.documentElement.toggleAttribute("data-subscribed", on);
}
