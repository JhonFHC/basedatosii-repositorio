/* Updated assets/slider.js (removed toggle theme, kept 3D slider and particles) */
// Variables slider 3D
const sliderContainer = document.getElementById('sliderContainer');
const slides = sliderContainer ? sliderContainer.querySelectorAll('.slide') : [];
const total = slides.length;
let currentIndex = 0;

const theta = total > 0 ? 360 / total : 0;
const radius = 500;

function setupCarousel() {
  if (total === 0) return;
  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    const angle = theta * i;
    slide.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
  }
  rotateCarousel();
}

function rotateCarousel() {
  if (total === 0) return;
  const angle = theta * currentIndex * -1;
  sliderContainer.style.transform = `translateZ(-${radius}px) rotateY(${angle}deg)`;
}

// Botones (check if elements exist)
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (total === 0) return;
    currentIndex--;
    if (currentIndex < 0) currentIndex = total - 1;
    rotateCarousel();
  });
}
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (total === 0) return;
    currentIndex++;
    if (currentIndex >= total) currentIndex = 0;
    rotateCarousel();
  });
}

// Efecto luz dinámica que sigue cursor
const slider3d = document.querySelector('.slider-3d');
if (slider3d) {
  slider3d.addEventListener('mousemove', e => {
    const rect = slider3d.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    slides.forEach(slide => {
      const img = slide.querySelector('img');
      const offsetX = (x / rect.width - 0.5) * 20; // movimiento de 20px máximo
      const offsetY = (y / rect.height - 0.5) * 20;

      if (img) {
        img.style.filter = `drop-shadow(${offsetX}px ${offsetY}px 10px #00ffc3)`;
      }
    });
  });

  slider3d.addEventListener('mouseleave', () => {
    slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img) {
        img.style.filter = 'none';
      }
    });
  });
}

// Partículas/neblina animada en canvas
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

// Initialize slider after DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupCarousel();
  });
} else {
  setupCarousel();
}