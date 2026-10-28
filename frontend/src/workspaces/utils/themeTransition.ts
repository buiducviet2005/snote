/**
 * Hiệu ứng chuyển giao diện giọt nước màu (Water Drop / Ink Ripple Theme Transition)
 * Rơi vào đúng điểm chính giữa màn hình (50vw, 50vh) và lan tỏa hình tròn ra xung quanh.
 */
export function executeWaterDropThemeTransition(
  nextTheme: 'dark' | 'light',
  onApplyTheme: () => void
) {
  const doc = document as any;

  // 1. Nếu trình duyệt hỗ trợ View Transitions API (Chrome 111+, Edge, modern Safari)
  if (typeof doc.startViewTransition === 'function') {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const maxRadius = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY)
    );

    const transition = doc.startViewTransition(() => {
      onApplyTheme();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${centerX}px ${centerY}px)`,
            `circle(${maxRadius * 1.05}px at ${centerX}px ${centerY}px)`
          ]
        },
        {
          duration: 700,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
    return;
  }

  // 2. Fallback Ink Droplet Wave DOM Animation (cho mọi trình duyệt)
  const drop = document.createElement('div');
  drop.className = 'ws-water-drop-ripple';
  const targetBg = nextTheme === 'dark' ? '#070b12' : '#edf2f7';
  drop.style.backgroundColor = targetBg;
  document.body.appendChild(drop);

  // Kích hoạt tỏa màu từ tâm
  requestAnimationFrame(() => {
    drop.classList.add('animate');
    setTimeout(() => {
      onApplyTheme();
    }, 280);
    setTimeout(() => {
      drop.classList.add('fade-out');
      setTimeout(() => {
        drop.remove();
      }, 350);
    }, 600);
  });
}

