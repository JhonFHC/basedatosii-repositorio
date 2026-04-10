// admin.js - Panel de Administración CONECTADO A SUPABASE

// ========== DATOS EN MEMORIA (Caché local) ==========
// ⚠️ DECLARACIÓN ÚNICA - SOLO UNA VEZ
let appData = {
  unidades: [],
  semanas: [],
  archivos: [],
  actividad: []
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Panel de Administración iniciado');
  
  // Verificar sesión
  if (sessionStorage.getItem('isAdminLogged') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  // Mostrar nombre del admin
  const adminName = sessionStorage.getItem('adminName') || 'Administrador';
  const welcomeElement = document.getElementById('welcomeName');
  if (welcomeElement) welcomeElement.textContent = adminName;
  
  // Esperar a que Supabase esté listo
  await esperarSupabase();
  
  // Cargar datos desde Supabase
  await cargarDatosDesdeSupabase();
  
  // Inicializar selects
  cargarSelectUnidades();
  
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
    
    // Cargar unidades
    const { data: unidades, error: errorU } = await supabase
      .from('unidades')
      .select('*')
      .order('numero', { ascending: true });
    
    if (errorU) throw errorU;
    appData.unidades = unidades || [];
    console.log('✅ Unidades cargadas:', appData.unidades.length);
    
    // Cargar semanas
    const { data: semanas, error: errorS } = await supabase
      .from('semanas')
      .select('*')
      .order('numero', { ascending: true });
    
    if (errorS) throw errorS;
    appData.semanas = semanas || [];
    console.log('✅ Semanas cargadas:', appData.semanas.length);
    
    // Cargar archivos
    const { data: archivos, error: errorA } = await supabase
      .from('archivos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (errorA) throw errorA;
    appData.archivos = archivos || [];
    console.log('✅ Archivos cargados:', appData.archivos.length);
    
    // Cargar actividad
    const { data: actividad, error: errorAct } = await supabase
      .from('actividad')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!errorAct) {
      appData.actividad = actividad || [];
    }
    
    // Actualizar todas las vistas
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
  
  document.querySelectorAll('.admin-page').forEach(page => {
    page.classList.remove('active');
  });
  
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // Actualizar sidebar
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    const span = link.querySelector('span');
    if (span) {
      const text = span.textContent.toLowerCase();
      if (text.includes(pageName.toLowerCase()) || 
          (pageName === 'crearSemana' && text.includes('crear')) ||
          (pageName === 'editarSemana' && text.includes('editar'))) {
        link.classList.add('active');
      }
    }
  });
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
    return `
      <tr>
        <td>${archivo.nombre}</td>
        <td><a href="${archivo.url}" target="_blank" style="color: #00ffc3;">Ver archivo</a></td>
        <td>${semana ? `Semana ${semana.numero}` : 'General'}</td>
        <td>
          <button class="btn-icon delete" onclick="eliminarArchivo(${archivo.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html || '<tr><td colspan="4" class="empty-state">No hay archivos</td></tr>';
}

// ========== CREAR SEMANA (SUPABASE) ==========
document.getElementById('formCrearSemana')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  submitBtn.disabled = true;
  
  try {
    const nuevaSemana = {
      unidad_id: parseInt(document.getElementById('createUnidad').value),
      numero: parseInt(document.getElementById('createNumero').value),
      titulo: document.getElementById('createTitulo').value,
      descripcion: document.getElementById('createDescripcion').value,
      contenido: document.getElementById('createContenido').value || '',
      pdf_url: document.getElementById('createPDF').value || null,
      video_url: document.getElementById('createVideo').value || null,
      estado: document.getElementById('createEstado').value
    };
    
    const editingId = this.dataset.editingId;
    
    let result;
    if (editingId) {
      // Actualizar existente
      result = await supabase
        .from('semanas')
        .update(nuevaSemana)
        .eq('id', editingId)
        .select();
      
      delete this.dataset.editingId;
      showToast('✅ Semana actualizada', 'success');
    } else {
      // Crear nueva
      result = await supabase
        .from('semanas')
        .insert([nuevaSemana])
        .select();
      
      // Registrar actividad
      await supabase.from('actividad').insert([{
        accion: 'Creación',
        elemento: `Semana ${nuevaSemana.numero}: ${nuevaSemana.titulo}`,
        usuario: sessionStorage.getItem('adminName') || 'Admin'
      }]);
      
      showToast('✅ Semana creada', 'success');
    }
    
    if (result.error) throw result.error;
    
    // Recargar datos
    await cargarDatosDesdeSupabase();
    
    this.reset();
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// ========== ELIMINAR SEMANA (SUPABASE) ==========
async function eliminarSemana(id) {
  if (!confirm('¿Eliminar esta semana permanentemente?')) return;
  
  try {
    const semana = appData.semanas.find(s => s.id === id);
    
    const { error } = await supabase
      .from('semanas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Registrar actividad
    await supabase.from('actividad').insert([{
      accion: 'Eliminación',
      elemento: `Semana ${semana?.numero}: ${semana?.titulo}`,
      usuario: sessionStorage.getItem('adminName') || 'Admin'
    }]);
    
    await cargarDatosDesdeSupabase();
    showToast('✅ Semana eliminada', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== ELIMINAR UNIDAD (SUPABASE) ==========
async function eliminarUnidad(id) {
  if (!confirm('¿Eliminar esta unidad y TODAS sus semanas?')) return;
  
  try {
    // Primero eliminar semanas asociadas
    await supabase.from('semanas').delete().eq('unidad_id', id);
    
    // Luego eliminar unidad
    const { error } = await supabase
      .from('unidades')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await cargarDatosDesdeSupabase();
    cargarSelectUnidades();
    showToast('✅ Unidad eliminada', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== ELIMINAR ARCHIVO (SUPABASE) ==========
async function eliminarArchivo(id) {
  if (!confirm('¿Eliminar este archivo?')) return;
  
  try {
    const { error } = await supabase
      .from('archivos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await cargarDatosDesdeSupabase();
    showToast('✅ Archivo eliminado', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
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
  document.getElementById('createDescripcion').value = semana.descripcion || '';
  document.getElementById('createContenido').value = semana.contenido || '';
  document.getElementById('createPDF').value = semana.pdf_url || '';
  document.getElementById('createVideo').value = semana.video_url || '';
  document.getElementById('createEstado').value = semana.estado;
  
  const form = document.getElementById('formCrearSemana');
  form.dataset.editingId = id;
  
  const submitBtn = form.querySelector('.btn-success');
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Semana';
  
  showToast('✏️ Editando: ' + semana.titulo, 'success');
}

// ========== EDITAR UNIDAD ==========
function editarUnidad(id) {
  const unidad = appData.unidades.find(u => u.id === id);
  if (!unidad) {
    showToast('Unidad no encontrada', 'error');
    return;
  }
  
  // Abrir modal de unidad
  document.getElementById('modalUnidadTitle').textContent = 'Editar Unidad';
  document.getElementById('unidadId').value = unidad.id;
  document.getElementById('unidadNumero').value = unidad.numero;
  document.getElementById('unidadTitulo').value = unidad.titulo;
  document.getElementById('unidadDescripcion').value = unidad.descripcion || '';
  document.getElementById('unidadIcono').value = unidad.icono || '📚';
  
  openModal('modalUnidad');
}

// ========== ABRIR MODAL NUEVA UNIDAD ==========
function abrirModalUnidad() {
  document.getElementById('modalUnidadTitle').textContent = 'Nueva Unidad';
  document.getElementById('unidadId').value = '';
  document.getElementById('formUnidad').reset();
  openModal('modalUnidad');
}

// ========== GUARDAR UNIDAD (SUPABASE) ==========
document.getElementById('formUnidad')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('unidadId').value;
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
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
});

// ========== GUARDAR ARCHIVO (SUPABASE) ==========
async function guardarArchivo() {
  const nombre = document.getElementById('fileName')?.value;
  const url = document.getElementById('fileUrl')?.value;
  const semanaId = document.getElementById('fileSemana')?.value;
  
  if (!nombre || !url) {
    showToast('❌ Completa todos los campos', 'error');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('archivos')
      .insert([{
        nombre: nombre,
        url: url,
        semana_id: semanaId || null
      }]);
    
    if (error) throw error;
    
    await cargarDatosDesdeSupabase();
    
    document.getElementById('fileName').value = '';
    document.getElementById('fileUrl').value = '';
    
    showToast('✅ Archivo guardado', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
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
    
    // Aquí puedes implementar la importación a Supabase
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

// ========== GENERAR CÓDIGO HTML ==========
function generateHTMLCode() {
  const titulo = document.getElementById('createTitulo').value;
  const numero = document.getElementById('createNumero').value;
  const descripcion = document.getElementById('createDescripcion').value;
  const contenido = document.getElementById('createContenido').value;
  const pdfUrl = document.getElementById('createPDF').value;
  const videoUrl = document.getElementById('createVideo').value;
  
  const htmlCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Semana ${numero} - ${titulo}</title>
  <link rel="stylesheet" href="../../css/style1.css">
</head>
<body class="dark-theme">
  <canvas id="particles"></canvas>
  <main class="container" style="margin-top: 100px;">
    <h1 style="color: #00ffc3;">Semana ${numero}: ${titulo}</h1>
    <div class="seccion-contenido">
      <h2>Descripción</h2>
      <p>${descripcion}</p>
    </div>
    <div class="seccion-contenido">
      <h2>Contenido</h2>
      ${contenido || '<p>En desarrollo...</p>'}
    </div>
    ${pdfUrl ? `<a href="${pdfUrl}" target="_blank">Descargar PDF</a>` : ''}
  </main>
  <script src="../../js/particles.js"></script>
</body>
</html>`;
  
  document.getElementById('generatedCode').value = htmlCode;
  openModal('modalCode');
}

// ========== COPIAR CÓDIGO ==========
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

// ========== DESCARGAR HTML ==========
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

// ========== VISTA PREVIA ==========
function previewSemana() {
  const titulo = document.getElementById('createTitulo').value;
  const descripcion = document.getElementById('createDescripcion').value;
  const contenido = document.getElementById('createContenido').value;
  
  const previewHTML = `
    <h2 style="color: #00ffc3;">${titulo}</h2>
    <h4>Descripción</h4>
    <p>${descripcion}</p>
    <h4>Contenido</h4>
    ${contenido || '<p>En desarrollo...</p>'}
  `;
  
  document.getElementById('previewContent').innerHTML = previewHTML;
  openModal('modalPreview');
}

// ========== EXPORTAR DATOS ==========
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

// ========== GUARDAR CONFIGURACIÓN ==========
function guardarConfiguracion() {
  const curso = document.getElementById('configCurso')?.value;
  const profesor = document.getElementById('configProfesor')?.value;
  const ciclo = document.getElementById('configCiclo')?.value;
  
  localStorage.setItem('configCurso', JSON.stringify({ curso, profesor, ciclo }));
  showToast('✅ Configuración guardada', 'success');
}

console.log('✅ Admin.js (Supabase) cargado correctamente');