// unidad.js - Versión corregida con mejor manejo de errores
document.addEventListener('DOMContentLoaded', async function() {
  
  // ========== PARTÍCULAS (Tu código existente) ==========
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

  // ========== NAVBAR ==========
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    const label = link.textContent.trim();
    link.setAttribute('data-text', label);
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        e.preventDefault();
        link.classList.add('clicked');
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      }
    });
  });

  // ========== ESPERAR A QUE SUPABASE ESTÉ LISTO ==========
  const container = document.getElementById('unidadesContainer');
  
  // Función para esperar a Supabase
  async function esperarSupabase(maxIntentos = 10) {
    for (let i = 0; i < maxIntentos; i++) {
      if (typeof supabase !== 'undefined' && supabase) {
        console.log('✅ Supabase listo en intento', i + 1);
        return true;
      }
      console.log(`⏳ Esperando Supabase... intento ${i + 1}/${maxIntentos}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return false;
  }

  // ========== CARGAR DATOS ==========
  try {
    // Mostrar loader
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #00ffc3;">
        <i class="fas fa-spinner fa-spin" style="font-size: 3rem;"></i>
        <p style="margin-top: 20px;">Conectando con Supabase...</p>
      </div>
    `;

    // Esperar a que Supabase esté listo
    const supabaseListo = await esperarSupabase();
    
    if (!supabaseListo) {
      throw new Error('Supabase no está disponible después de varios intentos');
    }

    console.log('📡 Intentando cargar datos desde Supabase...');

    // Cargar unidades
    const { data: unidades, error: errorUnidades } = await supabase
      .from('unidades')
      .select('*')
      .order('numero', { ascending: true });

    if (errorUnidades) {
      console.error('Error al cargar unidades:', errorUnidades);
      throw errorUnidades;
    }

    console.log('✅ Unidades cargadas:', unidades);

    // Cargar semanas
    const { data: semanas, error: errorSemanas } = await supabase
      .from('semanas')
      .select('*')
      .order('numero', { ascending: true });

    if (errorSemanas) {
      console.error('Error al cargar semanas:', errorSemanas);
      throw errorSemanas;
    }

    console.log('✅ Semanas cargadas:', semanas);

    // Si no hay datos, mostrar mensaje
    if (!unidades || unidades.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #ffc107;">
          <i class="fas fa-database" style="font-size: 3rem;"></i>
          <h3 style="margin-top: 20px;">No hay unidades disponibles</h3>
          <p>Ejecuta el SQL en Supabase para insertar los datos iniciales.</p>
        </div>
      `;
      return;
    }

    // Limpiar container
    container.innerHTML = '';

    // Renderizar cada unidad
    unidades.forEach(unidad => {
      const unidadItem = document.createElement('div');
      unidadItem.className = 'unidad-item';
      unidadItem.dataset.unidadId = unidad.id;
      
      const semanasUnidad = semanas.filter(s => s.unidad_id === unidad.id);
      
      unidadItem.innerHTML = `
        <div class="unidad-header">
          <div class="unidad-icon">${unidad.icono || '📚'}</div>
          <div class="unidad-info">
            <h2>Unidad ${unidad.numero}: ${unidad.titulo}</h2>
            <p>${unidad.descripcion || ''}</p>
          </div>
          <div class="unidad-toggle">
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        <div class="semanas-container">
          <div class="semanas-grid">
            ${renderizarSemanas(semanasUnidad)}
          </div>
        </div>
      `;
      
      container.appendChild(unidadItem);
    });

    // Inicializar acordeón
    inicializarAcordeon();
    
    console.log('✅ Renderizado completado');

  } catch (error) {
    console.error('❌ Error completo:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #ff6b6b; background: rgba(255,107,107,0.1); border-radius: 15px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
        <h3 style="margin-top: 20px;">Error al cargar datos</h3>
        <p><strong>Mensaje:</strong> ${error.message}</p>
        <details style="margin-top: 20px; text-align: left;">
          <summary style="cursor: pointer; color: #00ffc3;">Detalles técnicos</summary>
          <pre style="background: #0f172a; padding: 15px; border-radius: 8px; margin-top: 10px; overflow-x: auto;">${error.stack || 'No hay stack disponible'}</pre>
        </details>
        <p style="margin-top: 20px;">
          <button onclick="location.reload()" style="background: #00ffc3; color: #0f172a; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            <i class="fas fa-sync-alt"></i> Reintentar
          </button>
        </p>
      </div>
    `;
  }
});

// Renderizar semanas
function renderizarSemanas(semanas) {
  if (!semanas || semanas.length === 0) {
    return '<p style="color: #94a3b8; text-align: center; grid-column: 1/-1; padding: 20px;">No hay semanas disponibles</p>';
  }
  
  return semanas.map(semana => `
    <div class="semana-card" onclick="verSemana(${semana.id})">
      <div class="semana-numero">Semana ${semana.numero}</div>
      <h3>${semana.titulo}</h3>
      <p>${semana.descripcion || 'Contenido en desarrollo'}</p>
      <span class="semana-estado ${semana.estado === 'disponible' ? 'estado-disponible' : 'estado-proximo'}">
        ${semana.estado === 'disponible' ? '✓ Disponible' : '⏳ Próximamente'}
      </span>
    </div>
  `).join('');
}

// Inicializar acordeón
function inicializarAcordeon() {
  const unidadHeaders = document.querySelectorAll('.unidad-header');
  unidadHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const unidadItem = this.closest('.unidad-item');
      
      document.querySelectorAll('.unidad-item').forEach(item => {
        if (item !== unidadItem) {
          item.classList.remove('active');
        }
      });
      
      unidadItem.classList.toggle('active');
    });
  });
  
  const primeraUnidad = document.querySelector('.unidad-item');
  if (primeraUnidad) {
    primeraUnidad.classList.add('active');
  }
}

// Ver semana
function verSemana(id) {
  sessionStorage.setItem('semanaActual', id);
  window.location.href = `semana.html?id=${id}`;
}