// admin.js - Panel de Administración CONECTADO A SUPABASE

// ========== DATOS EN MEMORIA ==========
let appData = {
  unidades: [],
  semanas: [],
  archivos: [],
  actividad: []
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Panel de Administración iniciado');
  
  if (sessionStorage.getItem('isAdminLogged') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  const adminName = sessionStorage.getItem('adminName') || 'Administrador';
  const welcomeElement = document.getElementById('welcomeName');
  if (welcomeElement) welcomeElement.textContent = adminName;
  
  await esperarSupabase();
  await cargarDatosDesdeSupabase();
  cargarSelectUnidades();
  cargarConfiguracionGuardada();
  
  // Cargar preguntas pendientes después de un breve delay
  setTimeout(() => {
    if (document.getElementById('tablaPreguntasPendientes')) {
      cargarPreguntasPendientes();
    }
  }, 1500);
  
  console.log('✅ Panel listo');
});

// ========== ESPERAR A SUPABASE ==========
async function esperarSupabase(maxIntentos = 15) {
  for (let i = 0; i < maxIntentos; i++) {
    if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') {
      console.log('✅ Supabase listo');
      return true;
    }
    console.log(`⏳ Esperando Supabase... (${i + 1}/${maxIntentos})`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('❌ Supabase no está disponible');
}

// ========== CARGAR DATOS DESDE SUPABASE ==========
async function cargarDatosDesdeSupabase() {
  try {
    console.log('📡 Cargando datos desde Supabase...');
    
    const { data: unidades, error: errorU } = await supabase
      .from('unidades')
      .select('*')
      .order('numero', { ascending: true });
    
    if (errorU) throw errorU;
    appData.unidades = unidades || [];
    
    const { data: semanas, error: errorS } = await supabase
      .from('semanas')
      .select('*')
      .order('numero', { ascending: true });
    
    if (errorS) throw errorS;
    appData.semanas = semanas || [];
    
    const { data: archivos, error: errorA } = await supabase
      .from('archivos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (errorA) throw errorA;
    appData.archivos = archivos || [];
    
    const { data: actividad, error: errorAct } = await supabase
      .from('actividad')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!errorAct) {
      appData.actividad = actividad || [];
    }
    
    cargarDashboard();
    cargarTablaSemanas();
    cargarTablaUnidades();
    cargarTablaArchivos();
    cargarSelectSemanas();
    
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    showToast('Error al cargar datos: ' + error.message, 'error');
  }
}

// ========== NAVEGACIÓN ==========
function switchPage(pageName) {
  console.log('🔄 Cambiando a:', pageName);
  
  const pageMap = {
    'dashboard': 'dashboard',
    'unidades': 'unidades',
    'semanas': 'editarSemana',
    'archivos': 'archivos',
    'crearSemana': 'crearSemana',
    'editarSemana': 'editarSemana',
    'configuracion': 'configuracion',
    'preguntasPendientes': 'preguntasPendientes'
  };
  
  const targetPageName = pageMap[pageName] || pageName;
  
  document.querySelectorAll('.admin-page').forEach(page => {
    page.classList.remove('active');
  });
  
  const targetPage = document.getElementById(`page-${targetPageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    const span = link.querySelector('span');
    if (span) {
      const text = span.textContent.toLowerCase();
      if ((pageName === 'semanas' && text.includes('editar')) ||
          (pageName === 'crearSemana' && text.includes('crear')) ||
          (pageName === 'unidades' && text.includes('unidades')) ||
          (pageName === 'archivos' && text.includes('archivos')) ||
          (pageName === 'configuracion' && text.includes('config')) ||
          (pageName === 'preguntasPendientes' && text.includes('preguntas')) ||
          text.includes(pageName.toLowerCase())) {
        link.classList.add('active');
      }
    }
  });
  
  document.querySelectorAll('.admin-nav a').forEach(link => {
    link.classList.remove('active');
    const onclick = link.getAttribute('onclick') || '';
    if (onclick.includes(`'${pageName}'`)) {
      link.classList.add('active');
    }
  });

  if (pageName === 'preguntasPendientes') {
    setTimeout(cargarPreguntasPendientes, 300);
  }
}

// ========== DASHBOARD ==========
function cargarDashboard() {
  const dashUnidades = document.getElementById('dashUnidades');
  const dashSemanas = document.getElementById('dashSemanas');
  const dashPDFs = document.getElementById('dashPDFs');
  
  if (dashUnidades) dashUnidades.textContent = appData.unidades.length;
  if (dashSemanas) dashSemanas.textContent = appData.semanas.length;
  if (dashPDFs) dashPDFs.textContent = appData.archivos.length;
  
  const tbody = document.getElementById('actividadReciente');
  if (tbody) {
    const actividadHTML = appData.actividad.slice(0, 5).map(item => `
      <tr>
        <td>${item.accion}</td>
        <td>${item.elemento}</td>
        <td>${new Date(item.created_at).toLocaleString()}</td>
        <td><span class="badge badge-success">Completado</span></td>
      </tr>
    `).join('');
    tbody.innerHTML = actividadHTML || '<tr><td colspan="4" class="empty-state">No hay actividad</td></tr>';
  }
}

// ========== CARGAR SELECTS ==========
function cargarSelectSemanas() {
  const select = document.getElementById('fileSemana');
  if (!select) return;
  
  select.innerHTML = '<option value="">Ninguna (General)</option>' + 
    appData.semanas.map(s => `<option value="${s.id}">Semana ${s.numero}: ${s.titulo}</option>`).join('');
}

function cargarSelectUnidades() {
  const select = document.getElementById('createUnidad');
  if (!select) return;
  
  select.innerHTML = '<option value="">Seleccionar unidad...</option>' + 
    appData.unidades.map(u => `<option value="${u.id}">Unidad ${u.numero}: ${u.titulo}</option>`).join('');
}

// ========== CARGAR TABLAS ==========
function cargarTablaSemanas() {
  const tbody = document.getElementById('tablaSemanas');
  if (!tbody) return;
  
  const html = appData.semanas.map(semana => {
    const unidad = appData.unidades.find(u => u.id === semana.unidad_id);
    return `
      <tr>
        <td>${semana.id}</td>
        <td>${unidad?.titulo || 'N/A'}</td>
        <td>${semana.numero}</td>
        <td>${semana.titulo}</td>
        <td><span class="badge ${semana.estado === 'disponible' ? 'badge-success' : 'badge-warning'}">${semana.estado}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="editarSemana(${semana.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete" onclick="eliminarSemana(${semana.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html || '<tr><td colspan="6" class="empty-state">No hay semanas</td></tr>';
}

function cargarTablaUnidades() {
  const tbody = document.getElementById('tablaUnidades');
  if (!tbody) return;
  
  const html = appData.unidades.map(unidad => {
    const semanasCount = appData.semanas.filter(s => s.unidad_id === unidad.id).length;
    return `
      <tr>
        <td>${unidad.id}</td>
        <td>${unidad.numero}</td>
        <td>${unidad.titulo}</td>
        <td>${semanasCount} semanas</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="editarUnidad(${unidad.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete" onclick="eliminarUnidad(${unidad.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html;
}

function cargarTablaArchivos() {
  const tbody = document.getElementById('tablaArchivos');
  if (!tbody) return;
  
  const html = appData.archivos.map(archivo => {
    const semana = appData.semanas.find(s => s.id === archivo.semana_id);
    const iconoTipo = archivo.tipo === 'local' ? '💾' : '🔗';
    return `
      <tr>
        <td>${iconoTipo} ${archivo.nombre}</td>
        <td><a href="#" onclick="abrirEnVisor('${archivo.url}', '${archivo.nombre}'); return false;" style="color: #00ffc3;">Ver archivo</a></td>
        <td>${semana ? `Semana ${semana.numero}` : 'General'}</td>
        <td>
          <button class="btn-icon delete" onclick="eliminarArchivo(${archivo.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html || '<tr><td colspan="4" class="empty-state">No hay archivos</td></tr>';
}

// ========== CREAR / ACTUALIZAR SEMANA ==========
document.getElementById('formCrearSemana')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = this.querySelector('button[type="submit"]');
  const editingId = this.dataset.editingId;
  
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (editingId ? 'Actualizando...' : 'Guardando...');
  submitBtn.disabled = true;
  
  try {
    const nuevaSemana = {
      unidad_id: parseInt(document.getElementById('createUnidad').value),
      numero: parseInt(document.getElementById('createNumero').value),
      titulo: document.getElementById('createTitulo').value,
      descripcion: '',
      contenido: document.getElementById('createContenido').value || '',
      pdf_url: document.getElementById('createPDF').value || null,
      video_url: document.getElementById('createVideo').value || null,
      estado: document.getElementById('createEstado').value
    };
    
    let result;
    if (editingId) {
      result = await supabase.from('semanas').update(nuevaSemana).eq('id', editingId).select();
      showToast('✅ Semana actualizada', 'success');
    } else {
      result = await supabase.from('semanas').insert([nuevaSemana]).select();
      await supabase.from('actividad').insert([{
        accion: 'Creación',
        elemento: `Semana ${nuevaSemana.numero}: ${nuevaSemana.titulo}`,
        usuario: sessionStorage.getItem('adminName') || 'Admin'
      }]);
      showToast('✅ Semana creada', 'success');
    }
    
    if (result.error) throw result.error;
    
    await cargarDatosDesdeSupabase();
    this.reset();
    
    const htmlPaste = document.getElementById('createHTMLPaste');
    if (htmlPaste) htmlPaste.value = '';
    
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Crear Semana';
    submitBtn.disabled = false;
    delete this.dataset.editingId;
    cargarSelectUnidades();
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
    submitBtn.innerHTML = editingId ? '<i class="fas fa-save"></i> Actualizar Semana' : '<i class="fas fa-save"></i> Crear Semana';
    submitBtn.disabled = false;
  }
});

// ========== ELIMINAR SEMANA ==========
async function eliminarSemana(id) {
  if (!confirm('¿Eliminar esta semana permanentemente?')) return;
  
  try {
    const semana = appData.semanas.find(s => s.id === id);
    const { error } = await supabase.from('semanas').delete().eq('id', id);
    if (error) throw error;
    
    await supabase.from('actividad').insert([{
      accion: 'Eliminación',
      elemento: `Semana ${semana?.numero}: ${semana?.titulo}`,
      usuario: sessionStorage.getItem('adminName') || 'Admin'
    }]);
    
    await cargarDatosDesdeSupabase();
    showToast('✅ Semana eliminada', 'success');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== ELIMINAR UNIDAD ==========
async function eliminarUnidad(id) {
  if (!confirm('¿Eliminar esta unidad y TODAS sus semanas?')) return;
  
  try {
    await supabase.from('semanas').delete().eq('unidad_id', id);
    const { error } = await supabase.from('unidades').delete().eq('id', id);
    if (error) throw error;
    
    await cargarDatosDesdeSupabase();
    cargarSelectUnidades();
    showToast('✅ Unidad eliminada', 'success');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== ELIMINAR ARCHIVO ==========
async function eliminarArchivo(id) {
  if (!confirm('¿Eliminar este archivo?')) return;
  
  try {
    const archivo = appData.archivos.find(a => a.id === id);
    
    if (archivo?.tipo === 'local') {
      await supabase.storage.from('archivos').remove([archivo.nombre]);
    }
    
    const { error } = await supabase.from('archivos').delete().eq('id', id);
    if (error) throw error;
    
    await cargarDatosDesdeSupabase();
    showToast('✅ Archivo eliminado', 'success');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== EDITAR SEMANA ==========
function editarSemana(id) {
  const semana = appData.semanas.find(s => s.id === id);
  if (!semana) {
    showToast('Semana no encontrada', 'error');
    return;
  }
  
  switchPage('crearSemana');
  
  document.getElementById('createUnidad').value = semana.unidad_id;
  document.getElementById('createNumero').value = semana.numero;
  document.getElementById('createTitulo').value = semana.titulo;
  document.getElementById('createContenido').value = semana.contenido || '';
  document.getElementById('createPDF').value = semana.pdf_url || '';
  document.getElementById('createVideo').value = semana.video_url || '';
  document.getElementById('createEstado').value = semana.estado;
  
  const htmlPaste = document.getElementById('createHTMLPaste');
  if (htmlPaste) htmlPaste.value = '';
  
  const form = document.getElementById('formCrearSemana');
  form.dataset.editingId = id;
  
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Semana';
  }
  
  showToast('✏️ Editando: ' + semana.titulo, 'success');
}

// ========== EDITAR UNIDAD ==========
function editarUnidad(id) {
  const unidad = appData.unidades.find(u => u.id === id);
  if (!unidad) {
    showToast('Unidad no encontrada', 'error');
    return;
  }
  
  document.getElementById('modalUnidadTitle').textContent = 'Editar Unidad';
  document.getElementById('unidadId').value = unidad.id;
  document.getElementById('unidadNumero').value = unidad.numero;
  document.getElementById('unidadTitulo').value = unidad.titulo;
  document.getElementById('unidadDescripcion').value = unidad.descripcion || '';
  document.getElementById('unidadIcono').value = unidad.icono || '📚';
  
  openModal('modalUnidad');
}

// ========== MENSAJE UNIDAD DESHABILITADA ==========
function mostrarMensajeUnidadDeshabilitada() {
  showToast('📢 Esta funcionalidad estará disponible próximamente', 'success');
}

// ========== GUARDAR UNIDAD ==========
document.getElementById('formUnidad')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('unidadId').value;
  
  if (!id && appData.unidades.length >= 4) {
    showToast('⚠️ Solo se permiten 4 unidades', 'error');
    return;
  }
  
  const unidadData = {
    numero: parseInt(document.getElementById('unidadNumero').value),
    titulo: document.getElementById('unidadTitulo').value,
    descripcion: document.getElementById('unidadDescripcion').value,
    icono: document.getElementById('unidadIcono').value || '📚'
  };
  
  try {
    let result;
    if (id) {
      result = await supabase.from('unidades').update(unidadData).eq('id', id);
      showToast('✅ Unidad actualizada', 'success');
    } else {
      result = await supabase.from('unidades').insert([unidadData]);
      showToast('✅ Unidad creada', 'success');
    }
    
    if (result.error) throw result.error;
    
    await cargarDatosDesdeSupabase();
    cargarSelectUnidades();
    closeModal('modalUnidad');
    
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
});

// ========== GUARDAR ARCHIVO ==========
async function guardarArchivo() {
  let nombre = document.getElementById('fileName')?.value;
  const url = document.getElementById('fileUrl')?.value;
  const semanaId = document.getElementById('fileSemana')?.value;
  const localFile = document.getElementById('localFile')?.files[0];
  
  const subiendoArchivoLocal = !!localFile;
  const subiendoEnlace = !!url;
  
  if (!subiendoArchivoLocal && !subiendoEnlace) {
    showToast('❌ Debes proporcionar un enlace o seleccionar un archivo', 'error');
    return;
  }
  
  try {
    let finalUrl = '';
    let nombreFinal = nombre;
    
    if (subiendoArchivoLocal) {
      let nombreOriginal = localFile.name;
      let extension = '';
      
      const ultimoPunto = nombreOriginal.lastIndexOf('.');
      if (ultimoPunto > 0) {
        extension = nombreOriginal.substring(ultimoPunto);
        nombreOriginal = nombreOriginal.substring(0, ultimoPunto);
      }
      
      let nombreLimpio = nombreOriginal
        .replace(/[°ºª]/g, '')
        .replace(/[:\/,;]/g, '-')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .replace(/_+/g, '_')
        .replace(/-+/g, '-')
        .replace(/^[-_]+|[-_]+$/g, '');
      
      if (!nombreLimpio) {
        nombreLimpio = 'archivo_' + Date.now();
      }
      
      nombreFinal = nombreLimpio + extension;
      
      if (nombre) {
        let nombreUsuario = nombre;
        const puntoUsuario = nombreUsuario.lastIndexOf('.');
        if (puntoUsuario > 0) {
          nombreUsuario = nombreUsuario.substring(0, puntoUsuario);
        }
        nombreUsuario = nombreUsuario
          .replace(/[°ºª]/g, '')
          .replace(/[:\/,;]/g, '-')
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_-]/g, '');
        if (nombreUsuario) {
          nombreFinal = nombreUsuario + extension;
        }
      }
      
      document.getElementById('fileName').value = nombreFinal;
      
      showToast(`📤 Subiendo ${nombreFinal}...`, 'success');
      
      const { error } = await supabase
        .storage
        .from('archivos')
        .upload(nombreFinal, localFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase
        .storage
        .from('archivos')
        .getPublicUrl(nombreFinal);
      
      finalUrl = urlData.publicUrl;
      
    } else if (subiendoEnlace) {
      if (!nombre) {
        showToast('❌ El nombre del archivo es obligatorio para enlaces', 'error');
        return;
      }
      finalUrl = url;
      nombreFinal = nombre;
    }
    
    const { error: dbError } = await supabase
      .from('archivos')
      .insert([{
        nombre: nombreFinal,
        url: finalUrl,
        semana_id: semanaId || null,
        tipo: subiendoArchivoLocal ? 'local' : 'enlace'
      }]);
    
    if (dbError) throw dbError;
    
    await supabase.from('actividad').insert([{
      accion: 'Subida',
      elemento: `Archivo: ${nombreFinal}`,
      usuario: sessionStorage.getItem('adminName') || 'Admin'
    }]);
    
    await cargarDatosDesdeSupabase();
    
    document.getElementById('fileName').value = '';
    document.getElementById('fileUrl').value = '';
    document.getElementById('localFile').value = '';
    
    showToast('✅ Archivo guardado correctamente', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== ABRIR EN VISOR ==========
function abrirEnVisor(url, nombre) {
  window.location.href = `visor.html?file=${encodeURIComponent(url)}&name=${encodeURIComponent(nombre)}`;
}

// ========== IMPORTAR DATOS ==========
function importarDatos() {
  document.getElementById('importFile')?.click();
}

document.getElementById('importFile')?.addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    showToast('✅ Función en desarrollo', 'success');
  } catch (error) {
    showToast('❌ Error al importar: ' + error.message, 'error');
  }
  
  this.value = '';
});

// ========== MODALES ==========
function openModal(modalId) {
  document.getElementById(modalId)?.classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('active');
}

// ========== TOAST ==========
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== CERRAR SESIÓN ==========
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ========== CONFIGURACIÓN ==========
function cargarConfiguracionGuardada() {
  const config = JSON.parse(localStorage.getItem('configCurso') || '{}');
  if (document.getElementById('configCurso')) {
    document.getElementById('configCurso').value = config.curso || 'Base de Datos II';
    document.getElementById('configProfesor').value = config.profesor || 'MG. Raul Enrique Fernandez Bejarano';
    document.getElementById('configCiclo').value = config.ciclo || '2024-II';
  }
  actualizarTitulosEnPaginas(config.curso);
}

function guardarConfiguracion() {
  const curso = document.getElementById('configCurso')?.value || 'Base de Datos II';
  const profesor = document.getElementById('configProfesor')?.value || 'MG. Raul Enrique Fernandez Bejarano';
  const ciclo = document.getElementById('configCiclo')?.value || '2024-II';
  
  localStorage.setItem('configCurso', JSON.stringify({ curso, profesor, ciclo }));
  actualizarTitulosEnPaginas(curso);
  showToast('✅ Configuración guardada', 'success');
}

function actualizarTitulosEnPaginas(curso) {
  localStorage.setItem('nombreCursoActual', curso);
}

// ========== GENERAR CÓDIGO HTML ==========
function generateHTMLCode() {
  const titulo = document.getElementById('createTitulo').value;
  const numero = document.getElementById('createNumero').value;
  const contenido = document.getElementById('createContenido').value;
  
  const htmlCode = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Semana ${numero} - ${titulo}</title></head><body><h1>${titulo}</h1>${contenido}</body></html>`;
  
  document.getElementById('generatedCode').value = htmlCode;
  openModal('modalCode');
}

function copyGeneratedCode() {
  const textarea = document.getElementById('generatedCode');
  textarea.select();
  document.execCommand('copy');
  showToast('✅ Código copiado', 'success');
}

function copyToClipboard() {
  const content = document.getElementById('previewContent')?.innerText || '';
  navigator.clipboard?.writeText(content).then(() => {
    showToast('✅ Contenido copiado', 'success');
  });
}

function downloadHTML() {
  const code = document.getElementById('generatedCode').value;
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `semana_${document.getElementById('createNumero').value}.html`;
  a.click();
  showToast('✅ HTML descargado', 'success');
}

function exportarDatos() {
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'basedatosii_backup.json';
  a.click();
  showToast('✅ Datos exportados', 'success');
}

// ========== APLICAR HTML PEGADO ==========
function aplicarHTMLPegado() {
  const htmlCode = document.getElementById('createHTMLPaste').value;
  if (!htmlCode || htmlCode.trim() === '') {
    showToast('❌ Pega un código HTML primero', 'error');
    return;
  }
  
  try {
    const titleMatch = htmlCode.match(/<h1[^>]*>([^<]+)<\/h1>/) || htmlCode.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      const titulo = titleMatch[1].trim();
      document.getElementById('createTitulo').value = titulo;
      
      const semanaMatch = titulo.match(/Semana\s*(\d+)/i);
      if (semanaMatch) {
        document.getElementById('createNumero').value = parseInt(semanaMatch[1]);
      }
    }
    
    const pdfMatch = htmlCode.match(/href=["']([^"']*\.pdf[^"']*)["']/i) || htmlCode.match(/drive\.google\.com[^"'\s]*/i);
    if (pdfMatch) {
      const pdfUrl = pdfMatch[1] || pdfMatch[0];
      document.getElementById('createPDF').value = pdfUrl.startsWith('http') ? pdfUrl : 'https://' + pdfUrl;
    }
    
    document.getElementById('createContenido').value = htmlCode;
    
    if (typeof ClassicEditor !== 'undefined') {
      const editorElement = document.querySelector('#createContenido');
      if (editorElement && editorElement.ckeditorInstance) {
        editorElement.ckeditorInstance.setData(htmlCode);
      }
    }
    
    showToast('✅ HTML aplicado', 'success');
    
  } catch (error) {
    showToast('❌ Error al procesar el HTML', 'error');
  }
}

function limpiarHTMLPegado() {
  document.getElementById('createHTMLPaste').value = '';
  showToast('🧹 Campo HTML limpiado', 'success');
}

function previewSemana() {
  const titulo = document.getElementById('createTitulo').value || 'Sin título';
  const numero = document.getElementById('createNumero').value || '?';
  const contenido = document.getElementById('createContenido').value || '<p>Contenido en desarrollo...</p>';
  const pdfUrl = document.getElementById('createPDF').value;
  const estado = document.getElementById('createEstado').value;
  const unidadSelect = document.getElementById('createUnidad');
  const unidad = unidadSelect?.options[unidadSelect.selectedIndex]?.text || 'Sin unidad';
  
  const estadoBadge = {
    'disponible': '<span class="badge badge-success">Disponible</span>',
    'proximo': '<span class="badge badge-warning">Próximamente</span>',
    'bloqueado': '<span class="badge badge-info">Bloqueado</span>'
  }[estado] || '';
  
  const previewHTML = `
    <div style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <span class="badge badge-info">Semana ${numero}</span>
        ${estadoBadge}
      </div>
      <h2 style="color: #00ffc3;">${titulo}</h2>
      <p style="color: #94a3b8;"><strong>Unidad:</strong> ${unidad}</p>
      <div style="background: #0f172a; padding: 20px; border-radius: 10px; margin: 20px 0;">
        ${contenido}
      </div>
      ${pdfUrl ? `<a href="${pdfUrl}" target="_blank" style="color: #00ffc3;"><i class="fas fa-file-pdf"></i> Ver PDF</a>` : ''}
    </div>
  `;
  
  document.getElementById('previewContent').innerHTML = previewHTML;
  openModal('modalPreview');
}

function usarContenidoParaCrear() {
  closeModal('modalPreview');
  showToast('✅ Contenido listo', 'success');
}

// =============================================
// ⭐⭐⭐ GESTIÓN DE PREGUNTAS PENDIENTES ⭐⭐⭐
// =============================================

async function cargarPreguntasPendientes() {
  const tbody = document.getElementById('tablaPreguntasPendientes');
  if (!tbody) return;
  
  const filtro = document.getElementById('filtroEstadoPreguntas')?.value || 'todas';
  
  let todasPreguntas = [];
  try {
    todasPreguntas = JSON.parse(localStorage.getItem('bdito_preguntas_pendientes') || '[]');
  } catch (e) {
    todasPreguntas = [];
  }
  
  try {
    if (typeof supabase !== 'undefined' && supabase) {
      const { data, error } = await supabase
        .from('preguntas_pendientes')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (!error && data && data.length > 0) {
        for (const p of data) {
          const existe = todasPreguntas.some(lp => lp.pregunta === p.pregunta);
          if (!existe) {
            todasPreguntas.push({
              pregunta: p.pregunta,
              fecha: p.fecha,
              estado: p.estado || 'pendiente',
              usuario: p.usuario || 'Anónimo'
            });
          }
        }
      }
    }
  } catch (e) {
    console.log('ℹ️ Tabla preguntas_pendientes no disponible en Supabase');
  }
  
  const frecuenciaPreguntas = {};
  for (const p of todasPreguntas) {
    const clave = p.pregunta.toLowerCase().trim();
    if (!frecuenciaPreguntas[clave]) {
      frecuenciaPreguntas[clave] = { ...p, veces: 1 };
    } else {
      frecuenciaPreguntas[clave].veces++;
      if (new Date(p.fecha) > new Date(frecuenciaPreguntas[clave].fecha)) {
        frecuenciaPreguntas[clave].fecha = p.fecha;
      }
    }
  }
  
  let preguntasUnicas = Object.values(frecuenciaPreguntas);
  
  if (filtro !== 'todas') {
    preguntasUnicas = preguntasUnicas.filter(p => p.estado === filtro);
  }
  
  preguntasUnicas.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === 'pendiente' ? -1 : 1;
    return b.veces - a.veces;
  });
  
  const totalPendientes = preguntasUnicas.filter(p => p.estado === 'pendiente').length;
  const totalResueltas = preguntasUnicas.filter(p => p.estado === 'resuelta').length;
  const masPedida = preguntasUnicas.length > 0 
    ? preguntasUnicas[0] 
    : null;
  
  const elTotalPendientes = document.getElementById('totalPreguntasPendientes');
  const elTotalResueltas = document.getElementById('totalPreguntasResueltas');
  const elMasPedida = document.getElementById('preguntaMasPedida');
  const elVecesMasPedida = document.getElementById('vecesMasPedida');
  
  if (elTotalPendientes) elTotalPendientes.textContent = totalPendientes;
  if (elTotalResueltas) elTotalResueltas.textContent = totalResueltas;
  
  if (masPedida) {
    if (elMasPedida) {
      elMasPedida.textContent = masPedida.pregunta.length > 80 
        ? masPedida.pregunta.substring(0, 80) + '...' 
        : masPedida.pregunta;
    }
    if (elVecesMasPedida) {
      elVecesMasPedida.style.display = 'inline-block';
      elVecesMasPedida.textContent = `🔥 ${masPedida.veces}x pedida`;
    }
  } else {
    if (elMasPedida) elMasPedida.textContent = '-';
    if (elVecesMasPedida) elVecesMasPedida.style.display = 'none';
  }
  
  if (preguntasUnicas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 50px; color: #64748b;">
      <i class="fas fa-check-circle" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px; display: block; color: #10b981;"></i>
      <p style="font-size: 1rem; margin: 5px 0;">¡Todas las preguntas han sido respondidas!</p>
      <p style="font-size: 0.8rem;">Cuando un usuario use el botón "Reportar" en el chat, aparecerán aquí</p>
    </td></tr>`;
    return;
  }
  
  tbody.innerHTML = preguntasUnicas.map(p => `
    <tr style="${p.veces >= 3 ? 'border-left: 3px solid #f59e0b;' : ''}">
      <td style="text-align: center;">
        <input type="checkbox" class="checkbox-pregunta" value="${escapeHtml(p.pregunta)}" style="width: 16px; height: 16px; cursor: pointer;">
      </td>
      <td>
        <strong style="color: ${p.estado === 'resuelta' ? '#10b981' : '#f59e0b'};">${p.pregunta}</strong>
        ${p.veces >= 3 ? `<br><span class="badge badge-warning" style="margin-top:5px; font-size: 0.7rem;"><i class="fas fa-fire"></i> Popular (${p.veces} veces)</span>` : ''}
      </td>
      <td style="font-size: 0.85rem; color: #94a3b8;">
        <i class="far fa-calendar-alt" style="margin-right: 5px;"></i>${new Date(p.fecha).toLocaleDateString()}
      </td>
      <td style="text-align: center;">
        <span class="badge ${p.veces >= 5 ? 'badge-warning' : 'badge-info'}" style="font-size: 0.75rem;">
          <i class="fas fa-chart-bar" style="margin-right: 3px;"></i>${p.veces}x
        </span>
      </td>
      <td>
        ${p.estado === 'resuelta' 
          ? '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Resuelta</span>' 
          : '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pendiente</span>'}
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="generarPlantillaIndividual('${escapeHtml(p.pregunta)}')" title="Generar JSON con plantilla maestra">
            <i class="fas fa-magic" style="color: #a78bfa;"></i>
          </button>
          ${p.estado === 'pendiente' 
            ? `<button class="btn-icon" onclick="marcarComoResuelta('${escapeHtml(p.pregunta)}')" title="Marcar como resuelta">
                <i class="fas fa-check" style="color: #10b981;"></i>
              </button>` 
            : ''}
          <button class="btn-icon delete" onclick="eliminarPregunta('${escapeHtml(p.pregunta)}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ⭐⭐⭐ GENERAR JSON CON PLANTILLA MAESTRA NIVEL DIOS v2.0 ⭐⭐⭐
function generarPlantillaDesdePreguntas() {
  const checkboxes = document.querySelectorAll('.checkbox-pregunta:checked');
  let preguntas = checkboxes.length > 0 ? Array.from(checkboxes).map(cb => cb.value) : [];
  
  if (preguntas.length === 0) {
    const filas = document.querySelectorAll('#tablaPreguntasPendientes tr');
    filas.forEach(fila => {
      const celda = fila.querySelector('td:nth-child(2) strong');
      if (celda) preguntas.push(celda.textContent);
    });
  }
  
  if (preguntas.length === 0) {
    showToast('No hay preguntas para generar', 'error');
    return;
  }
  
  const plantilla = generarJSONPlantillaMaestra(preguntas);
  document.getElementById('plantillaJSONGenerada').value = plantilla;
  document.getElementById('seccionPlantillaJSON').style.display = 'block';
  document.getElementById('seccionPlantillaJSON').scrollIntoView({ behavior: 'smooth' });
}

function generarPlantillaIndividual(pregunta) {
  const plantilla = generarJSONPlantillaMaestra([pregunta]);
  document.getElementById('plantillaJSONGenerada').value = plantilla;
  document.getElementById('seccionPlantillaJSON').style.display = 'block';
  document.getElementById('seccionPlantillaJSON').scrollIntoView({ behavior: 'smooth' });
}

/**
 * PLANTILLA MAESTRA NIVEL DIOS v2.0
 * Genera un bloque JSON completo listo para pegar en conocimiento.json
 */
function generarJSONPlantillaMaestra(preguntas) {
  const bloques = preguntas.map((pregunta, index) => {
    const preguntaLimpia = pregunta.replace(/[¿?¡!]/g, '').trim();
    const palabras = preguntaLimpia.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    const palabrasSinTilde = preguntaLimpia.toLowerCase().replace(/[áéíóú]/g, m => ({'á':'a','é':'e','í':'i','ó':'o','ú':'u'}[m]));
    
    // Generar variantes de clave
    const variantes = [
      preguntaLimpia.toLowerCase(),
      palabrasSinTilde,
      ...palabras.slice(0, 5),
      `qué es ${palabrasSinTilde}`,
      `que es ${palabrasSinTilde}`,
      `definición de ${palabrasSinTilde}`,
      `definicion de ${palabrasSinTilde}`,
      `explicame ${palabrasSinTilde}`,
      `explícame ${palabrasSinTilde}`,
      `dame un ejemplo de ${palabrasSinTilde}`,
      `para qué sirve ${palabrasSinTilde}`,
      `para que sirve ${palabrasSinTilde}`,
      `me podrias explicar ${palabrasSinTilde}`
    ];
    
    const clave = [...new Set(variantes.filter(v => v.length > 2))].join('|');
    const titulo = preguntaLimpia.charAt(0).toUpperCase() + preguntaLimpia.slice(1);
    const palabraPrincipal = palabras[0] || 'tema';
    
    return `  "${clave}": {
    "titulo": "${titulo}",
    "categoria": "general",
    "dificultad": "intermedio",
    "definicion": "Aquí va la definición completa de <strong>${palabraPrincipal}</strong>. Explica qué es, para qué sirve y su importancia. Usa <strong>negritas</strong> para conceptos clave y <code>código inline</code> para términos técnicos.",
    "definicion_corta": "Aquí va una definición breve en máximo 15 palabras.",
    "intenciones": {
      "definicion": "Aquí va la definición DETALLADA de <strong>${palabraPrincipal}</strong>. Explica el concepto, su origen (si aplica), y cómo se relaciona con bases de datos. Incluye datos curiosos o históricos si son relevantes.\\n\\n📊 <strong>Características principales:</strong>\\n• Característica 1\\n• Característica 2\\n• Característica 3\\n\\n💡 <strong>Dato clave:</strong> Un dato importante que el estudiante deba recordar.",
      "ejemplo": "Aquí va un ejemplo PRÁCTICO de <strong>${palabraPrincipal}</strong>. Si es código SQL/PL/NoSQL, usa <code>bloques de código</code>. Si es un concepto teórico, usa casos prácticos numerados.\\n\\n<code>-- Ejemplo práctico\\nSELECT * FROM ejemplo WHERE concepto = '${palabraPrincipal}';</code>\\n\\n📝 <strong>Explicación del ejemplo:</strong>\\nDescribe brevemente qué hace el código anterior.",
      "codigo": "<code>-- Código de ejemplo para ${palabraPrincipal}\\n-- Agregar aquí el código SQL/PL/NoSQL relevante</code>",
      "pasos": "📋 <strong>Cómo implementar/usar ${palabraPrincipal} paso a paso:</strong>\\n\\n1️⃣ <strong>Paso 1:</strong> Descripción del primer paso\\n2️⃣ <strong>Paso 2:</strong> Descripción del segundo paso\\n3️⃣ <strong>Paso 3:</strong> Descripción del tercer paso\\n4️⃣ <strong>Paso 4:</strong> Descripción del cuarto paso\\n5️⃣ <strong>Paso 5:</strong> Descripción del quinto paso",
      "comparacion": "🆚 <strong>Comparación de ${palabraPrincipal}:</strong>\\n\\n• <strong>Opción A:</strong> Característica / ventaja / desventaja\\n• <strong>Opción B:</strong> Característica / ventaja / desventaja\\n• <strong>Opción A:</strong> Cuándo usarla\\n• <strong>Opción B:</strong> Cuándo usarla\\n\\n📊 <strong>Conclusión:</strong> Cuál elegir según el caso de uso.",
      "ventajas": "✅ Ventaja 1 de ${palabraPrincipal}\\n✅ Ventaja 2 de ${palabraPrincipal}\\n✅ Ventaja 3 de ${palabraPrincipal}\\n✅ Ventaja 4 de ${palabraPrincipal}\\n✅ Ventaja 5 de ${palabraPrincipal}",
      "desventajas": "⚠️ Desventaja 1 de ${palabraPrincipal}\\n⚠️ Desventaja 2 de ${palabraPrincipal}\\n⚠️ Desventaja 3 de ${palabraPrincipal}\\n⚠️ Limitación 1 de ${palabraPrincipal}",
      "resumen": "🧠 Resumen breve de ${palabraPrincipal}: Una o dos frases que capturen lo esencial del concepto.",
      "error": "🔧 <strong>Error común con ${palabraPrincipal}:</strong>\\n\\nDescripción del error frecuente que cometen los estudiantes.\\n\\n<strong>Causa:</strong> Por qué ocurre este error.\\n\\n<strong>Solución:</strong> Cómo resolverlo o evitarlo."
    },
    "relaciones": [
      "tema_relacionado_1",
      "tema_relacionado_2", 
      "tema_relacionado_3",
      "tema_opuesto_o_contrario"
    ],
    "ruta": [
      "prerrequisito_1",
      "prerrequisito_2",
      "${palabraPrincipal}",
      "tema_siguiente_1",
      "tema_siguiente_2"
    ],
    "tags": ["${palabraPrincipal}", "pendiente", "agregar", "intermedio"],
    "casos_reales": [
      "🌍 Industria/Empresa real: Ejemplo concreto de dónde se usa ${palabraPrincipal} en el mundo real",
      "🏢 PYME/Local: Ejemplo cercano de aplicación de ${palabraPrincipal}",
      "🎓 Academia/Curso: Cómo se aplica ${palabraPrincipal} en el contexto del curso de BD II"
    ],
    "errores_comunes": [
      "❌ Error frecuente 1: Descripción del error y su consecuencia",
      "❌ Confusión típica: Los principiantes suelen confundir ${palabraPrincipal} con otro concepto",
      "❌ Mala práctica: Algo que NO se debe hacer con ${palabraPrincipal}",
      "❌ Error silencioso: Error que no da mensaje pero causa problemas"
    ],
    "faq": [
      {"q": "¿Pregunta frecuente 1 sobre ${palabraPrincipal}?", "a": "Respuesta directa y útil."},
      {"q": "¿Pregunta frecuente 2 sobre ${palabraPrincipal}?", "a": "Respuesta que aclare conceptos confusos."},
      {"q": "¿Pregunta frecuente 3 sobre ${palabraPrincipal}?", "a": "Respuesta con mini-ejemplo si aplica."}
    ]
  }`;
  });
  
  return bloques.join(',\n\n');
}

function marcarComoResuelta(pregunta) {
  try {
    const preguntas = JSON.parse(localStorage.getItem('bdito_preguntas_pendientes') || '[]');
    const idx = preguntas.findIndex(p => p.pregunta === pregunta);
    if (idx !== -1) {
      preguntas[idx].estado = 'resuelta';
      localStorage.setItem('bdito_preguntas_pendientes', JSON.stringify(preguntas));
    }
  } catch (e) {}
  
  showToast('✅ Marcada como resuelta', 'success');
  cargarPreguntasPendientes();
}

function eliminarPregunta(pregunta) {
  if (!confirm('¿Eliminar esta pregunta?')) return;
  
  try {
    const preguntas = JSON.parse(localStorage.getItem('bdito_preguntas_pendientes') || '[]');
    localStorage.setItem('bdito_preguntas_pendientes', JSON.stringify(preguntas.filter(p => p.pregunta !== pregunta)));
  } catch (e) {}
  
  showToast('✅ Eliminada', 'success');
  cargarPreguntasPendientes();
}

function limpiarPreguntas() {
  if (!confirm('¿Eliminar TODAS las preguntas?')) return;
  localStorage.removeItem('bdito_preguntas_pendientes');
  showToast('✅ Limpiado', 'success');
  cargarPreguntasPendientes();
}

function toggleSelectAllPreguntas() {
  const selectAll = document.getElementById('selectAllPreguntas');
  document.querySelectorAll('.checkbox-pregunta').forEach(cb => cb.checked = selectAll.checked);
}

function copiarPlantillaJSON() {
  const textarea = document.getElementById('plantillaJSONGenerada');
  textarea.select();
  document.execCommand('copy');
  showToast('✅ JSON copiado al portapapeles', 'success');
}

function descargarPlantillaJSON() {
  const contenido = document.getElementById('plantillaJSONGenerada').value;
  const blob = new Blob([contenido], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nuevo_conocimiento_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  showToast('✅ Plantilla descargada', 'success');
}

function exportarPreguntasCSV() {
  const filas = document.querySelectorAll('#tablaPreguntasPendientes tr');
  let csv = 'Pregunta,Fecha,Veces,Estado\n';
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length >= 4) {
      const pregunta = celdas[1]?.textContent?.replace(/🔥 Popular.*/, '').trim() || '';
      const fecha = celdas[2]?.textContent?.trim() || '';
      const veces = celdas[3]?.textContent?.replace(/[^0-9]/g, '').trim() || '1';
      const estado = celdas[4]?.textContent?.trim() || 'pendiente';
      csv += `"${pregunta}","${fecha}","${veces}","${estado}"\n`;
    }
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'preguntas_pendientes_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  showToast('✅ CSV exportado', 'success');
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

console.log('✅ Admin.js cargado correctamente');