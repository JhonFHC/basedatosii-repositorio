// unidad.js - Versión corregida con mejor manejo de errores + BOTÓN RESUMEN DE UNIDAD
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
      const unidadCompleta = semanasUnidad.length >= 4; // ← TIENE 4 SEMANAS?
      
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
            ${unidadCompleta ? renderizarBotonResumen(unidad) : ''}
          </div>
        </div>
      `;
      
      container.appendChild(unidadItem);
    });

    // Inicializar acordeón (FUNCIONALIDAD ORIGINAL)
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

// ========== RENDERIZAR SEMANAS (FUNCIONALIDAD ORIGINAL) ==========
function renderizarSemanas(semanas) {
  if (!semanas || semanas.length === 0) {
    return '<p style="color: #94a3b8; text-align: center; grid-column: 1/-1; padding: 20px;">No hay semanas disponibles</p>';
  }
  
  return semanas.map(semana => `
    <div class="semana-card" onclick="verSemana(${semana.id})">
      <div class="semana-numero">Semana ${semana.numero}</div>
      <h3>${semana.titulo}</h3>
      <p>${semana.descripcion || '           '}</p>
      <span class="semana-estado ${semana.estado === 'disponible' ? 'estado-disponible' : 'estado-proximo'}">
        ${semana.estado === 'disponible' ? '✓ Disponible' : '⏳ Próximamente'}
      </span>
    </div>
  `).join('');
}

// ========== RENDERIZAR BOTÓN DE RESUMEN (NUEVO - SOLO SI HAY 4 SEMANAS) ==========
function renderizarBotonResumen(unidad) {
  return `
    <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
      <button 
        onclick="event.stopPropagation(); abrirResumenUnidad(${unidad.numero})" 
        style="background: linear-gradient(135deg, #00ffc3, #00cfa3); color: #0f172a; border: none; padding: 15px 30px; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 8px 25px rgba(0, 255, 195, 0.3); transition: all 0.3s ease; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 10px;"
        onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 30px rgba(0, 255, 195, 0.5)'"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(0, 255, 195, 0.3)'"
      >
        <i class="fas fa-chalkboard"></i> Ver Resumen de la Unidad ${unidad.numero}
      </button>
    </div>
  `;
}

// ========== INICIALIZAR ACORDEÓN (FUNCIONALIDAD ORIGINAL - RESTAURADA) ==========
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

// ========== VER SEMANA (FUNCIONALIDAD ORIGINAL) ==========
function verSemana(id) {
  sessionStorage.setItem('semanaActual', id);
  window.location.href = `semana.html?id=${id}`;
}

// ========== ABRIR RESUMEN DE UNIDAD (MODAL CON GENIALLY) ==========
function abrirResumenUnidad(numeroUnidad) {
  // Crear modal si no existe
  let modal = document.getElementById('modalResumenUnidad');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalResumenUnidad';
    modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.95); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(10px); overflow-y: auto; -webkit-overflow-scrolling: touch;';
    
    modal.innerHTML = `
      <div style="background: rgba(30, 41, 59, 0.98); border-radius: 20px; max-width: 1200px; width: 95%; max-height: 85vh; overflow-y: auto; border: 2px solid #00ffc3; position: relative; margin: 20px auto;">
        
        <!-- Botón cerrar -->
        <button onclick="cerrarResumenUnidad()" 
          style="position: absolute; top: 15px; right: 15px; background: rgba(0, 255, 195, 0.1); border: 1px solid #00ffc3; color: #00ffc3; font-size: 1.3rem; cursor: pointer; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; z-index: 10; transition: all 0.3s ease;"
          onmouseover="this.style.background='#00ffc3'; this.style.color='#0f172a'"
          onmouseout="this.style.background='rgba(0, 255, 195, 0.1)'; this.style.color='#00ffc3'">
          <i class="fas fa-times"></i>
        </button>
        
        <!-- Contenido -->
        <div style="padding: 30px;">
          <h2 style="color: #00ffc3; text-align: center; margin-bottom: 20px; font-size: 1.8rem; padding-right: 40px;">
            <i class="fas fa-chalkboard"></i> Resumen de la Unidad <span id="resumenUnidadNumero"></span>
          </h2>
          
          <!-- Contenedor del Genially -->
          <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 255, 195, 0.2); border: 1px solid #334155;">
            <iframe 
              id="resumenGeniallyFrame"
              src="https://view.genially.com/69f25ce15df64b7e2a7a6015"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
              allowfullscreen="true" 
              webkitallowfullscreen="true" 
              mozallowfullscreen="true"
              allow="autoplay; fullscreen; picture-in-picture"
              loading="lazy">
            </iframe>
          </div>
          
          <!-- Botones de acción -->
          <div style="text-align: center; margin-top: 20px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <a href="https://view.genially.com/69f25ce15df64b7e2a7a6015" target="_blank" 
               style="display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid #334155; color: #cbd5e1; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 0.9rem; transition: all 0.3s ease;"
               onmouseover="this.style.background='#00ffc3'; this.style.color='#0f172a'; this.style.borderColor='#00ffc3'"
               onmouseout="this.style.background='transparent'; this.style.color='#cbd5e1'; this.style.borderColor='#334155'">
              <i class="fas fa-external-link-alt"></i> Abrir en nueva pestaña
            </a>
            <button onclick="cerrarResumenUnidad()"
               style="display: inline-flex; align-items: center; gap: 8px; background: #ef4444; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;"
               onmouseover="this.style.background='#dc2626'"
               onmouseout="this.style.background='#ef4444'">
              <i class="fas fa-times"></i> Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar haciendo clic fuera del contenido
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        cerrarResumenUnidad();
      }
    });
  }
  
  // Actualizar número de unidad
  document.getElementById('resumenUnidadNumero').textContent = numeroUnidad;
  
  // Mostrar modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ========== CERRAR RESUMEN DE UNIDAD ==========
function cerrarResumenUnidad() {
  const modal = document.getElementById('modalResumenUnidad');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Cerrar con tecla ESC (listener global)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    cerrarResumenUnidad();
  }
});