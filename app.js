// Handles subscribe form (unchanged API routes). Small UX polish.
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  // set IG link if needed
  document.getElementById('ig-link').textContent = '@introvert_to_alphafitness';
  document.getElementById('ig-link').href = 'https://www.instagram.com/introvert_to_alphafitness';

  const form = document.getElementById('subscribe-form');
  const msg = document.getElementById('msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.style.display = 'none';
    const email = document.getElementById('email').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    if (!email) {
      showMsg('Please enter your email', 'danger');
      return;
    }
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, firstName })
      });
      const data = await res.json();
      if (data && data.success) {
        showMsg('Thanks! You are on the list. Check your inbox for starter tips.', 'success');
        form.reset();
      } else {
        showMsg(data.error || 'Something went wrong', 'danger');
      }
    } catch (err) {
      showMsg('Network error', 'danger');
    }
  });

  function showMsg(text, type) {
    msg.style.display = 'block';
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
  }
});