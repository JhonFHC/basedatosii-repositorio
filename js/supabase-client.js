// supabase-client.js - Configuración correcta para tu proyecto

// TU CONFIGURACIÓN REAL
const SUPABASE_URL = 'https://rihkzlwtrwvbdaqlufnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OSwFYSuqFHcs0iRkFa8ACg_SieWv1d_';

// Inicializar cliente
let supabase = null;

// Esperar a que la librería esté disponible
function inicializarSupabase() {
  try {
    // Verificar si la librería de Supabase está cargada
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase conectado correctamente a:', SUPABASE_URL);
      
      // Probar conexión
      supabase.from('unidades').select('count').then(({ data, error }) => {
        if (error) {
          console.error('❌ Error al conectar con la base de datos:', error.message);
        } else {
          console.log('✅ Conexión a la base de datos exitosa. Unidades:', data);
        }
      });
      
    } else {
      console.error('❌ La librería de Supabase no está disponible');
      console.log('Reintentando en 1 segundo...');
      setTimeout(inicializarSupabase, 1000);
    }
  } catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
  inicializarSupabase();
}