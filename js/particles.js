// ==========================================
// SISTEMA DE PARTÍCULAS OPTIMIZADO
// ==========================================
class ParticleSystem {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.config = {
      count: options.count || 100,
      color: options.color || '0, 255, 195',
      speed: options.speed || 0.3,
      size: options.size || 1.5
    };
    
    this.init();
    this.animate();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createParticles();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createParticles() {
    this.particles = Array.from({ length: this.config.count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: Math.random() * this.config.size + 0.5,
      speedX: (Math.random() - 0.5) * this.config.speed,
      speedY: (Math.random() - 0.5) * this.config.speed,
      opacity: Math.random() * 0.5 + 0.1
    }));
  }

  updateParticle(p) {
    p.x += p.speedX;
    p.y += p.speedY;

    // Wrap alrededor de los bordes
    p.x = p.x > this.width ? 0 : p.x < 0 ? this.width : p.x;
    p.y = p.y > this.height ? 0 : p.y < 0 ? this.height : p.y;
  }

  drawParticle(p) {
    const { ctx, config } = this;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${config.color}, ${p.opacity})`;
    ctx.shadowColor = `rgba(${config.color}, 0.7)`;
    ctx.shadowBlur = 5;
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  animate = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    this.particles.forEach(p => {
      this.updateParticle(p);
      this.drawParticle(p);
    });
    
    requestAnimationFrame(this.animate);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ParticleSystem('particles'));
} else {
  new ParticleSystem('particles');
}