// Akhdar Perfumes - Main Frontend Script

document.addEventListener('DOMContentLoaded', () => {
  initFlashMessages();
});

function initFlashMessages() {
  const alerts = document.querySelectorAll('[role="alert"]');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease-out';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });
}
