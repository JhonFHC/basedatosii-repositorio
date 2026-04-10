document.addEventListener('DOMContentLoaded', () => {
  // Animación de entrada (fade-in)
  const fadeInSections = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
  });

  fadeInSections.forEach(section => observer.observe(section));

  // Efecto "volar" en botones del navbar
  const navLinks = document.querySelectorAll('.navbar a');

  navLinks.forEach(link => {
    const label = link.textContent.trim();
    link.setAttribute('data-text', label);

    link.addEventListener('click', (e) => {
      e.preventDefault(); 
      link.classList.add('clicked');

      const href = link.getAttribute('href');

      setTimeout(() => {
        window.location.href = href;
      }, 400); 
    });
  });

  // Botón "Conóceme" para ir a sobre-mi.html
  const btnSobreMi = document.getElementById('btnSobreMi');
  if (btnSobreMi) {
    btnSobreMi.addEventListener('click', () => {
      window.location.href = 'sobre-mi.html';
    });
  }

  // Partículas/neblina animada en canvas para fondo
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let w, h;
  let particlesArray = [];

  function resizeCanvas() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.radius = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x > w) this.x = 0;
      if (this.x < 0) this.x = w;
      if (this.y > h) this.y = 0;
      if (this.y < 0) this.y = h;
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = `rgba(0, 255, 195, ${this.opacity})`;
      ctx.shadowColor = 'rgba(0, 255, 195, 0.7)';
      ctx.shadowBlur = 5;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initParticles() {
    particlesArray = [];
    for (let i = 0; i < 100; i++) {
      particlesArray.push(new Particle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, w, h);
    particlesArray.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateParticles);
  }

  initParticles();
  animateParticles();
}
});