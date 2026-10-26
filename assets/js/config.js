/* Site settings the founder fills in before launch (see website/LAUNCH.md).
   While a value is null the site shows a clear "opens soon" or "Contact details coming soon" state and sends nothing. */
window.CM_CONFIG = {
  // POST endpoint for the interest, call and parts forms (a form service URL). null = forms stay hidden and a "Registration opens soon" notice shows.
  formEndpoint: null,
  // Scheduling link for "Book a call" buttons (a 20-minute calendar page). null = those buttons go to contact.html#call.
  bookingUrl: null,
  // Public contact address (founder, Oct 12). The build also writes it into every page as mailto links.
  contactEmail: "contact@checkmatedynamics.com",
  // Store API (the Cloudflare Worker, website/store/worker). null = the store does not exist on the site: mailto buttons, no bag.
  // When set, the site still shows nothing new until GET {storeApi}/api/store answers {open:true}.
  storeApi: null
};

// Development only: on localhost, ?storeApi=http://localhost:8787 points this tab at a local store API for the session.
// ?storeApi=off clears it. It is ignored on every other host, so a link can never redirect a visitor's orders.
(function () {
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var key = "cd-storeApi-dev";
  if (!local) return;
  try {
    var q = new URLSearchParams(location.search).get("storeApi");
    if (q === "off") sessionStorage.removeItem(key);
    else if (q && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/.test(q)) sessionStorage.setItem(key, q.replace(/\/+$/, ""));
    var v = sessionStorage.getItem(key);
    if (v) window.CM_CONFIG.storeApi = v;
  } catch (e) { /* storage blocked: no override */ }
})();
