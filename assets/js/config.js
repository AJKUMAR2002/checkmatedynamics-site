/* Site settings the founder fills in before launch (see website/LAUNCH.md).
   While a value is null the site shows a clear "opens soon" or "Contact details coming soon" state and sends nothing. */
window.CM_CONFIG = {
  // POST endpoint for the interest, call and parts forms (a form service URL). null = forms stay hidden and a "Registration opens soon" notice shows.
  formEndpoint: null,
  // Scheduling link for "Book a call" buttons (a 20-minute calendar page). null = those buttons go to contact.html#call.
  bookingUrl: null,
  // Public contact address (founder, Oct 12). The build also writes it into every page as mailto links.
  contactEmail: "contact@checkmatedynamics.com"
};
