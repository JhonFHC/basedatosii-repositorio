// login.js - Sistema de autenticación para Base de Datos II
document.addEventListener('DOMContentLoaded', function() {
  
  // ========== 1. PARTÍCULAS DE FONDO ==========
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

  // ========== 2. EFECTO "VOLAR" EN NAVBAR ==========
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    const label = link.textContent.trim();
    link.setAttribute('data-text', label);
    
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#')) {
        e.preventDefault();
        link.classList.add('clicked');
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      }
    });
  });

  // ========== 3. MANEJO DEL FORMULARIO DE LOGIN ==========
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorEl = document.getElementById('loginError');

  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      // Credenciales para el profesor
      if (username === 'admin' && password === 'basedatos2024') {
        // Guardar sesión en sessionStorage
        sessionStorage.setItem('isAdminLogged', 'true');
        sessionStorage.setItem('adminName', 'Jhon Huaman Cardenas');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Mostrar mensaje de éxito
        errorEl.style.color = '#00ffc3';
        errorEl.textContent = '✓ Acceso correcto. Redirigiendo...';
        
        // Redirigir al panel de administración
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 1000);
        
      } else {
        // Error de credenciales
        errorEl.style.color = '#ff6b6b';
        errorEl.textContent = '❌ Usuario o contraseña incorrectos';
        
        // Añadir efecto shake al formulario
        const loginContainer = document.querySelector('.login-container');
        loginContainer.classList.add('shake');
        setTimeout(() => {
          loginContainer.classList.remove('shake');
        }, 500);
        
        // Limpiar campo de contraseña
        passwordInput.value = '';
        passwordInput.focus();
      }
    });
  }

  // ========== 4. PERMITIR SUBMIT CON ENTER ==========
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  // ========== 5. ANIMACIÓN DE ENTRADA ==========
  const loginContainer = document.querySelector('.login-container');
  if (loginContainer) {
    loginContainer.style.opacity = '0';
    loginContainer.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
      loginContainer.style.transition = 'all 0.6s ease';
      loginContainer.style.opacity = '1';
      loginContainer.style.transform = 'translateY(0)';
    }, 100);
  }

  console.log('✅ login.js cargado correctamente');
});