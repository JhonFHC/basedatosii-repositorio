// =============================================
// CHATBOT - GESTOR DE DATOS NIVEL DIOS
// Carga, indexa y gestiona el conocimiento
// =============================================

class ChatBotData {
  constructor() {
    this.conocimiento = null;
    this.indiceInvertido = {};     // palabra → [claves]
    this.tagsIndex = {};           // tag → [claves]
    this.categorias = {};          // categoria → [claves]
    this.indiceNiveles = {         // nivel → [claves]
      'basico': [],
      'intermedio': [],
      'avanzado': []
    };
    this.indiceRelaciones = {};    // clave → [relaciones]
    this.cargado = false;
  }
  
  // ========== CARGAR DATOS ==========
  async cargar() {
    // Intentar cargar archivo externo primero
    try {
      const respuesta = await fetch('js/conocimiento.json');
      if (respuesta.ok) {
        this.conocimiento = await respuesta.json();
        this.construirIndices();
        this.cargado = true;
        console.log('📚 Conocimiento cargado:', Object.keys(this.conocimiento).length, 'temas');
        return true;
      }
    } catch (e) {
      console.warn('⚠️ No se pudo cargar conocimiento.json externo');
    }
    
    // Si no se pudo cargar externamente, usar datos embebidos
    if (typeof CONOCIMIENTO_EMBEBIDO !== 'undefined') {
      this.conocimiento = CONOCIMIENTO_EMBEBIDO;
      this.construirIndices();
      this.cargado = true;
      console.log('📚 Conocimiento embebido cargado:', Object.keys(this.conocimiento).length, 'temas');
      return true;
    }
    
    console.error('❌ No se pudo cargar ningún conocimiento');
    return false;
  }
  
  // ========== CONSTRUIR TODOS LOS ÍNDICES ==========
  construirIndices() {
    this.indiceInvertido = {};
    this.tagsIndex = {};
    this.categorias = {};
    this.indiceNiveles = { basico: [], intermedio: [], avanzado: [] };
    this.indiceRelaciones = {};
    
    for (const [clave, info] of Object.entries(this.conocimiento)) {
      // 1. Índice invertido por palabras clave
      const palabrasClave = clave.toLowerCase().split('|');
      for (const palabra of palabrasClave) {
        const p = palabra.trim();
        if (!this.indiceInvertido[p]) this.indiceInvertido[p] = [];
        if (!this.indiceInvertido[p].includes(clave)) {
          this.indiceInvertido[p].push(clave);
        }
      }
      
      // 2. Índice por tags
      if (info.tags) {
        for (const tag of info.tags) {
          if (!this.tagsIndex[tag]) this.tagsIndex[tag] = [];
          if (!this.tagsIndex[tag].includes(clave)) {
            this.tagsIndex[tag].push(clave);
          }
        }
      }
      
      // 3. Índice por categoría
      if (info.categoria) {
        if (!this.categorias[info.categoria]) this.categorias[info.categoria] = [];
        this.categorias[info.categoria].push(clave);
      }
      
      // 4. Índice por nivel de dificultad
      if (info.dificultad && this.indiceNiveles[info.dificultad]) {
        this.indiceNiveles[info.dificultad].push(clave);
      } else {
        // Si no tiene dificultad, asumir intermedio
        this.indiceNiveles['intermedio'].push(clave);
      }
      
      // 5. Índice de relaciones inversas
      if (info.relaciones) {
        for (const rel of info.relaciones) {
          if (!this.indiceRelaciones[rel]) this.indiceRelaciones[rel] = [];
          if (!this.indiceRelaciones[rel].includes(clave)) {
            this.indiceRelaciones[rel].push(clave);
          }
        }
      }
    }
    
    console.log('📊 Índices construidos:',
      '\n  - Palabras:', Object.keys(this.indiceInvertido).length,
      '\n  - Tags:', Object.keys(this.tagsIndex).length,
      '\n  - Categorías:', Object.keys(this.categorias).length,
      '\n  - Niveles:', Object.values(this.indiceNiveles).reduce((a, b) => a + b.length, 0)
    );
  }
  
  // ========== BUSCAR POR PALABRA CLAVE ==========
  buscarPorPalabra(palabra) {
    return this.indiceInvertido[palabra] || [];
  }
  
  // ========== BUSCAR POR MÚLTIPLES PALABRAS (CON PESO) ==========
  buscarPorPalabras(palabras) {
    const resultados = new Map();
    
    for (const palabra of palabras) {
      const claves = this.buscarPorPalabra(palabra);
      for (const clave of claves) {
        resultados.set(clave, (resultados.get(clave) || 0) + 1);
      }
    }
    
    // Ordenar por relevancia
    return [...resultados.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([clave]) => clave);
  }
  
  // ========== BUSCAR POR SIMILITUD USANDO CORE ==========
  buscarPorSimilitud(texto, core) {
    if (!this.cargado) return [];
    
    const palabras = core.tokenizar(texto);
    let candidatos = this.buscarPorPalabras(palabras);
    
    // Si hay suficientes candidatos, devolver los mejores
    if (candidatos.length > 0) return candidatos.slice(0, 10);
    
    // Búsqueda más amplia: recorrer todas las claves
    const resultados = [];
    for (const clave of Object.keys(this.conocimiento)) {
      const similitud = core.calcularSimilitud(texto, clave);
      if (similitud > 0.15) {
        resultados.push({ clave, similitud });
      }
    }
    
    return resultados
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, 10)
      .map(r => r.clave);
  }
  
  // ========== BUSCAR POR CATEGORÍA ==========
  buscarPorCategoria(categoria) {
    return this.categorias[categoria] || [];
  }
  
  // ========== BUSCAR POR TAG ==========
  buscarPorTag(tag) {
    return this.tagsIndex[tag] || [];
  }
  
  // ========== BUSCAR POR NIVEL ==========
  buscarPorNivel(nivel) {
    return this.indiceNiveles[nivel] || this.indiceNiveles['intermedio'];
  }
  
  // ========== OBTENER INFORMACIÓN DE UN TEMA ==========
  obtenerTema(clave) {
    return this.conocimiento[clave] || null;
  }
  
  // ========== OBTENER RESPUESTA POR INTENCIÓN ==========
  obtenerPorIntencion(info, intencion) {
    if (!info) return null;
    
    // Si tiene intenciones definidas (estructura nueva)
    if (info.intenciones && info.intenciones[intencion]) {
      return info.intenciones[intencion];
    }
    
    // Mapeo por tipo de campo (estructura legacy)
    const mapeo = {
      'definicion': info.definicion || info.respuesta || info.definicion_corta,
      'ejemplo': info.ejemplo,
      'comparacion': info.comparacion || (info.ventajas && info.desventajas ? `${info.ventajas}\n\n${info.desventajas}` : null),
      'ventajas': info.ventajas || info.pros,
      'desventajas': info.desventajas || info.limitaciones,
      'pasos': info.pasos || info.procedimiento || info.estructura,
      'resumen': info.definicion_corta || info.resumen || (info.definicion ? info.definicion.substring(0, 200) + '...' : null),
      'error': info.errores_comunes ? (Array.isArray(info.errores_comunes) ? info.errores_comunes.join('<br>') : info.errores_comunes) : null,
      'codigo': info.ejemplo || info.codigo || (info.estructura && info.estructura.includes('<code>') ? info.estructura : null)
    };
    
    return mapeo[intencion] || info.definicion || info.respuesta || null;
  }
  
  // ========== OBTENER RELACIONES DE UN TEMA ==========
  obtenerRelaciones(clave) {
    const info = this.conocimiento[clave];
    const relacionesDirectas = info?.relaciones || [];
    const relacionesInversas = this.indiceRelaciones[clave] || [];
    
    return [...new Set([...relacionesDirectas, ...relacionesInversas])];
  }
  
  // ========== OBTENER RUTA DE APRENDIZAJE ==========
  obtenerRutaAprendizaje(clave) {
    const info = this.conocimiento[clave];
    return info?.ruta || [];
  }
  
  // ========== OBTENER TEMAS RELACIONADOS POR CATEGORÍA ==========
  obtenerTemasMismaCategoria(clave) {
    const info = this.conocimiento[clave];
    if (!info?.categoria) return [];
    
    return (this.categorias[info.categoria] || []).filter(c => c !== clave);
  }
  
  // ========== GENERAR RESPUESTA CON PLANTILLA ==========
  generarConPlantilla(info, intencion, nivel) {
    if (!info) return null;
    
    const contenido = this.obtenerPorIntencion(info, intencion);
    if (!contenido) return null;
    
    // Plantillas por intención
    const plantillas = {
      'definicion': {
        'basico': `📘 <strong>${info.titulo || 'Definición'}:</strong><br>${contenido}`,
        'intermedio': `📘 <strong>${info.titulo || 'Definición'}:</strong><br>${contenido}`,
        'avanzado': `📘 <strong>${info.titulo || 'Definición técnica'}:</strong><br>${contenido}`
      },
      'ejemplo': {
        'basico': `💡 <strong>Ejemplo práctico:</strong><br>${contenido}`,
        'intermedio': `💻 <strong>Ejemplo:</strong><br>${contenido}`,
        'avanzado': `💻 <strong>Ejemplo avanzado:</strong><br>${contenido}`
      },
      'comparacion': {
        'basico': `⚖️ <strong>Comparativa:</strong><br>${contenido}`,
        'intermedio': `⚖️ <strong>Análisis comparativo:</strong><br>${contenido}`,
        'avanzado': `⚖️ <strong>Análisis técnico comparativo:</strong><br>${contenido}`
      },
      'ventajas': {
        'basico': `✅ <strong>Lo bueno:</strong><br>${contenido}`,
        'intermedio': `✅ <strong>Ventajas:</strong><br>${contenido}`,
        'avanzado': `✅ <strong>Fortalezas técnicas:</strong><br>${contenido}`
      },
      'desventajas': {
        'basico': `⚠️ <strong>Limitaciones:</strong><br>${contenido}`,
        'intermedio': `⚠️ <strong>Desventajas:</strong><br>${contenido}`,
        'avanzado': `⚠️ <strong>Limitaciones técnicas:</strong><br>${contenido}`
      },
      'resumen': {
        'basico': `🧠 <strong>En pocas palabras:</strong><br>${contenido}`,
        'intermedio': `🧠 <strong>Resumen:</strong><br>${contenido}`,
        'avanzado': `🧠 <strong>Síntesis técnica:</strong><br>${contenido}`
      },
      'codigo': {
        'basico': `💾 <strong>Código de ejemplo:</strong><br>${contenido}`,
        'intermedio': `💾 <strong>Script SQL:</strong><br>${contenido}`,
        'avanzado': `💾 <strong>Código optimizado:</strong><br>${contenido}`
      }
    };
    
    const plantilla = plantillas[intencion]?.[nivel] || plantillas[intencion]?.['intermedio'];
    
    if (plantilla) {
      return plantilla.replace('{contenido}', contenido);
    }
    
    return contenido;
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.ChatBotData = ChatBotData;
}

console.log('✅ ChatBotData NIVEL DIOS cargado');