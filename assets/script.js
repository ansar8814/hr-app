const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusEl.textContent = 'Sending...';

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to send your message right now.');
    }

    statusEl.textContent = 'Thanks! Your message has been sent.';
    form.reset();
  } catch (error) {
    statusEl.textContent = error.message;
  }
});
