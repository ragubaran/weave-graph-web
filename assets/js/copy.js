// Weave Graph - Clipboard & Toast System

function showToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span style="color:var(--color-primary)">✓</span> ${message}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Find code content from parent container's active code pane or data-clipboard attribute
      const container = button.closest('.code-tabs-wrapper, .terminal-window, .code-snippet-box');
      let textToCopy = '';

      if (button.getAttribute('data-clipboard-text')) {
        textToCopy = button.getAttribute('data-clipboard-text');
      } else if (container) {
        const activePane = container.querySelector('.code-pane.active, code, pre');
        if (activePane) {
          textToCopy = activePane.innerText.trim();
        }
      }

      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = button.innerHTML;
        button.innerHTML = `<span style="color:var(--color-success)">✓</span> Copied`;
        showToast('Command copied to clipboard');

        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });
  });
});
