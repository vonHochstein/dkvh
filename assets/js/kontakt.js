(() => {
  const form = document.getElementById('contact-form');
  const email = form.elements.namedItem('_replyto');
  const phone = form.elements.namedItem('contact');

  const clearReplyError = () => email.setCustomValidity('');
  for (const field of [email, phone]) {
    field.addEventListener('input', clearReplyError);
    field.addEventListener('change', clearReplyError);
  }

  form.addEventListener('submit', event => {
    if (!email.value.trim() && !phone.value.trim()) {
      event.preventDefault();
      email.setCustomValidity('Bitte geben Sie Ihre E-Mail-Adresse oder Telefonnummer an.');
      email.reportValidity();
      return;
    }

    history.replaceState({ ...history.state, contactSubmitted: true }, '');
  });

  window.addEventListener('pageshow', () => {
    if (!history.state?.contactSubmitted) return;

    // History traversal can restore field values after pageshow.
    setTimeout(() => {
      const state = { ...history.state };
      delete state.contactSubmitted;
      history.replaceState(state, '');
      form.reset();
      clearReplyError();
    }, 0);
  });

  // Without JavaScript, the browser still requires an email address.
  email.required = false;
})();
