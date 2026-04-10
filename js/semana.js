// semana.js - Carga el contenido de una semana específica
document.addEventListener('DOMContentLoaded', async function() {
  
  // Obtener ID de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const semanaId = urlParams.get('id') || sessionStorage.getItem('semanaActual');
  
  const container = document.getElementById('semanaContent');
  
  if (!semanaId) {
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
        <h3>No se especificó una semana</h3>
        <a href="unidad.html" class="btn-volver">Volver a Unidades</a>
      </div>
    `;
    return;
  }
  
  try {
    // Esperar a Supabase
    await esperarSupabase();
    
    // Cargar datos de la semana
    const { data: semana, error } = await supabase
      .from('semanas')
      .select(`
        *,
        unidades (*)
      `)
      .eq('id', semanaId)
      .single();
    
    if (error) throw error;
    
    if (!semana) {
      throw new Error('Semana no encontrada');
    }
    
    // Renderizar contenido
    container.innerHTML = `
      <div class="semana-header">
        <span class="badge" style="background: #00ffc3; color: #0f172a; padding: 5px 15px; border-radius: 20px;">
          Unidad ${semana.unidades?.numero} - Semana ${semana.numero}
        </span>
        <h1>${semana.titulo}</h1>
        <div class="semana-meta">
          <span><i class="fas fa-calendar"></i> ${formatearFecha(semana.created_at)}</span>
          <span><i class="fas fa-tag"></i> ${semana.estado}</span>
        </div>
      </div>
      
      <div class="contenido-seccion">
        <h2><i class="fas fa-info-circle"></i> Descripción</h2>
        <p>${semana.descripcion || 'No hay descripción disponible.'}</p>
      </div>
      
      <div class="contenido-seccion">
        <h2><i class="fas fa-book"></i> Contenido de la Clase</h2>
        <div class="contenido-html">
          ${semana.contenido || '<p>El contenido está en desarrollo...</p>'}
        </div>
      </div>
      
      ${renderRecursos(semana)}
      
      <div style="text-align: center;">
        <a href="unidad.html" class="btn-volver">
          <i class="fas fa-arrow-left"></i> Volver a Unidades
        </a>
      </div>
    `;
    
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
        <h3>Error al cargar el contenido</h3>
        <p>${error.message}</p>
        <a href="unidad.html" class="btn-volver">Volver a Unidades</a>
      </div>
    `;
  }
});

// Esperar a que Supabase esté listo
async function esperarSupabase(maxIntentos = 10) {
  for (let i = 0; i < maxIntentos; i++) {
    if (typeof supabase !== 'undefined' && supabase) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Supabase no está disponible');
}

// Formatear fecha
function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Renderizar recursos (PDF, Video)
function renderRecursos(semana) {
  const recursos = [];
  
  if (semana.pdf_url) {
    recursos.push(`
      <div class="recurso-card">
        <i class="fas fa-file-pdf"></i>
        <h3>Material PDF</h3>
        <a href="${semana.pdf_url}" target="_blank">Descargar</a>
      </div>
    `);
  }
  
  if (semana.video_url) {
    recursos.push(`
      <div class="recurso-card">
        <i class="fas fa-video"></i>
        <h3>Video de Clase</h3>
        <a href="${semana.video_url}" target="_blank">Ver Video</a>
      </div>
    `);
  }
  
  if (recursos.length === 0) return '';
  
  return `
    <div class="contenido-seccion">
      <h2><i class="fas fa-paperclip"></i> Recursos</h2>
      <div class="recursos-grid">
        ${recursos.join('')}
      </div>
    </div>
  `;
}