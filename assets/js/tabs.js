// Weave Graph - Tab Switching Engine

document.addEventListener('DOMContentLoaded', () => {
  const tabContainers = document.querySelectorAll('.code-tabs-wrapper, .interactive-tabs');

  tabContainers.forEach(container => {
    const tabButtons = container.querySelectorAll('.tab-btn');
    const tabPanes = container.querySelectorAll('.code-pane, .tab-pane');

    tabButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        // Deactivate all buttons & panes in this container
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        // Activate clicked button
        btn.classList.add('active');

        // Check for data-target or fallback to index
        const targetId = btn.getAttribute('data-target');
        if (targetId) {
          const targetPane = container.querySelector(`#${targetId}`);
          if (targetPane) targetPane.classList.add('active');
        } else if (tabPanes[index]) {
          tabPanes[index].classList.add('active');
        }
      });
    });
  });
});
