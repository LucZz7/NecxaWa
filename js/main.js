/* NecxaWA landing animations */
document.addEventListener("DOMContentLoaded", () => {
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // subtle parallax on hero glow
  const glow = document.querySelector(".grid-bg");
  if (glow) {
    window.addEventListener("scroll", () => {
      glow.style.transform = `translateY(${window.scrollY * 0.08}px)`;
    }, { passive: true });
  }
});
