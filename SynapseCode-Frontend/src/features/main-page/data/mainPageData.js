export const landingStats = [
  { value: 130, suffix: "+", prefix: "", label: "Endpoints API" },
  { value: 8, suffix: "", prefix: "", label: "Microservicios" },
  { value: 30, suffix: "+", prefix: "", label: "Lenguajes" },
  { value: 0, suffix: "", prefix: "$", label: "Costo" },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "para siempre",
    features: [
      { text: "Hasta 3 salas activas", included: true },
      { text: "Hasta 5 usuarios por sala", included: true },
      { text: "Ejecucion de codigo basica", included: true },
      { text: "Chat e historial limitado", included: true },
      { text: "IA explicaciones (limitado)", included: false },
      { text: "Salas ilimitadas", included: false },
    ],
    buttonText: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "$20",
    description: "por usuario / mes",
    features: [
      { text: "Salas ilimitadas", included: true },
      { text: "Hasta 20 usuarios por sala", included: true },
      { text: "IA explicaciones ilimitadas", included: true },
      { text: "Historial completo de versiones", included: true },
      { text: "Ejecuciones prioritarias", included: true },
      { text: "Generación de codigo con IA", included: true },
    ],
    buttonText: "Empezar Pro",
    popular: true,
  },
  {
    name: "ORG",
    price: "$50 +/-",
    description: "por institución / mes",
    features: [
      { text: "Todo lo del plan Pro", included: true },
      { text: "Panel de administración", included: true },
      { text: "Análisis por alumno", included: true },
      { text: "Branding personalizado", included: true },
      { text: "Soporte dedicado", included: true },
      { text: "Licencia institucional (Kinal, universidades)", included: true },
    ],
    buttonText: "Contratar servicio",
    popular: false,
  },
];

export const languages = [
  { name: "JavaScript", type: "Frontend" },
  { name: "Python", type: "Backend" },
  { name: "Java", type: "Backend" },
  { name: "C#", type: "Backend" },
  { name: "HTML/CSS", type: "Frontend" },
  { name: "TypeScript", type: "Frontend" },
  { name: "Go", type: "Backend" },
  { name: "Rust", type: "Systems" },
  { name: "C++", type: "Systems" },
  { name: "C", type: "Systems" },
  { name: "Bash", type: "Scripting" },
  { name: "SQL", type: "Data" },
  { name: "PHP", type: "Backend" },
  { name: "Ruby", type: "Backend" },
  { name: "Kotlin", type: "Mobile" },
  { name: "Swift", type: "Mobile" },
  { name: "R", type: "Data" },
  { name: "Haskell", type: "Functional" },
  { name: "Dart", type: "Mobile" },
  { name: "Scala", type: "Backend" },
  { name: "Elixir", type: "Functional" },
  { name: "Clojure", type: "Functional" },
  { name: "Objective-C", type: "Mobile" },
  { name: "F#", type: "Functional" },
  { name: "Groovy", type: "Scripting" },
  { name: "Erlang", type: "Functional" },
  { name: "Perl", type: "Scripting" },
  { name: "Pascal", type: "Backend" },
  { name: "Lua", type: "Scripting" },
  { name: "Assembly", type: "Systems" },
  { name: "Fortran", type: "Data" },
  { name: "Prolog", type: "Logic" },
  { name: "Julia", type: "Data" },
];

export const beforeAfterItems = [
  { before: "Teams para la clase + IDE por separado", after: "Todo en una sola plataforma desde el navegador" },
  { before: "Instalar JDK, dependencias y configurar PATH", after: "Ejecuta en +35 lenguajes sin instalar nada" },
  { before: "Copiar codigo de la pantalla, perder legibilidad", after: "El codigo se sincroniza en tiempo real para todos" },
  { before: "Quedarse atascado horas con un error", after: "IA explica el error al instante y sugiere correcciones" },
  { before: "Estudiar solo en casa sin apoyo", after: "Sala de estudio colaborativa disponible 24/7" },
  { before: "El docente no puede verificar quien entendio", after: "Historial de versiones y evaluacion asistida por IA" },
  { before: "Sin integracion con Git en clase", after: "Commit y push desde la misma plataforma" },
];

export const impactTabs = [
  {
    id: "comunidad",
    label: "Comunidad educativa",
    points: [
      { title: "Estudiantes de Kinal", text: "Ayuda inmediata ante errores, practica de pair programming como en la industria y acceso a herramientas profesionales desde una sola app." },
      { title: "Docentes", text: "Asignacion y calificacion de ejercicios colaborativos, monitoreo del progreso y control sobre el uso de IA durante evaluaciones." },
      { title: "Institucion", text: "Reduccion esperada de desercion, mejora en retencion y proyeccion de Kinal como institucion innovadora en Centroamerica." },
    ],
  },
  {
    id: "global",
    label: "Impacto global",
    points: [
      { title: "Codigo abierto", text: "SynapseCode no esta limitado a Kinal ni a Guatemala; cualquier institucion puede adoptarlo mediante sus diferentes planes." },
      { title: "Problema universal", text: "Aborda desercion por aislamiento, falta de acceso a herramientas profesionales y flujos de trabajo fragmentados." },
      { title: "Modelo replicable", text: "Puede escalar en Centroamerica, Latinoamerica y otros contextos donde estudiantes aprenden programacion sin las herramientas que merecen." },
    ],
  },
  {
    id: "escalabilidad",
    label: "Escalabilidad",
    points: [
      { title: "Tecnica", text: "Arquitectura de microservicios preparada para crecer horizontalmente con MongoDB y Node.js." },
      { title: "Funcional", text: "Roadmap con whiteboard colaborativa, grabacion de sesiones, llamadas, video, soporte multi-idioma y roles ampliados." },
      { title: "Sostenibilidad", text: "Costo operativo cero en fase inicial para sostener el acceso gratuito a estudiantes, docentes y equipos." },
    ],
  },
];

export const faqs = [
  { q: "SynapseCode es gratuito?", a: "Si, SynapseCode es completamente gratuito. No hay limites ocultos ni planes de pago. Todas las funcionalidades estan disponibles para todos los usuarios sin costo alguno." },
  { q: "Que lenguajes de programacion soportan?", a: "Soportamos mas de 30 lenguajes incluyendo Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, y muchos mas." },
  { q: "Como funciona la colaboracion en tiempo real?", a: "Usamos WebSockets mediante Socket.io para sincronizar el codigo entre todos los participantes de una sala al instante. Puedes ver los cursores de otros usuarios en tiempo real." },
  { q: "Mis proyectos son privados?", a: "Si, tus proyectos son privados por defecto. Solo puedes compartirlos con quienes tu decidas invitando colaboradores a tu sala." },
  { q: "Como funciona el asistente de IA?", a: "El asistente IA esta powered by Groq y puede generar codigo, explicar funciones, sugerir mejoras y responder preguntas sobre programacion directamente desde el editor." },
  { q: "Puedo usar SynapseCode para ensenar?", a: "Absolutamente. SynapseCode es ideal para clases y talleres. Puedes compartir tu pantalla, ver el codigo de tus estudiantes en tiempo real y corregir errores al instante." },
  { q: "Hay limite de participantes por sala?", a: "Actualmente no hay un limite fijo de participantes. Puedes tener tantos colaboradores como necesites en cada sala." },
  { q: "Puedo exportar mi codigo?", a: "Si, puedes copiar o descargar tu codigo en cualquier momento. Tambien planeamos integracion con Git para Q4 2026." },
];

export const services = [
  { title: "Autenticacion segura", desc: "JWT centralizado en AuthService. Registro, login, recuperacion de contrasena, gestion de roles y perfiles con Cloudinary." },
  { title: "Salas colaborativas", desc: "Salas publicas y privadas con codigo unico. Limite de participantes, roles de host y registro de tiempo de conexion por usuario." },
  { title: "Editor multi-archivo", desc: "Crea, edita, renombra y duplica archivos dentro de cada sala. Historial de versiones completo con trazabilidad de cambios." },
  { title: "Ejecucion remota", desc: "Integracion con Judge0 para ejecutar codigo en 20+ lenguajes. Consola compartida, salida en tiempo real y limites configurables." },
  { title: "Chat + Asistente IA", desc: "Chat contextual por sala con historial paginado. Explicaciones y generacion de codigo con Groq AI, guardadas y reutilizables." },
  { title: "Control de versiones Git", desc: "ServiceGit permite clonar, hacer commit y push a GitHub/GitLab directamente desde la plataforma. Workspace por usuario y sala." },
  { title: "Feedback comunitario", desc: "Sistema de comentarios, votos y sugerencias. Los usuarios proponen funcionalidades y la comunidad prioriza el roadmap." },
  { title: "Acceso gratuito", desc: "La plataforma evita diferencias de pago y mantiene las herramientas principales disponibles para todos los usuarios." },
];

export const roadmapSteps = [
  { number: "1", title: "Registro / Login", desc: "Crea tu cuenta en segundos. Recibe tu JWT y accede a todas las funcionalidades de la plataforma.", status: "done" },
  { number: "2", title: "Entra a una sala", desc: "Crea o unete a una sala publica o privada usando su codigo unico. Tu rol se asigna automaticamente.", status: "done" },
  { number: "3", title: "Edita archivos", desc: "Crea, edita, renombra y duplica multiples archivos de codigo dentro de la sala. Todo en tiempo real.", status: "done" },
  { number: "4", title: "Guarda versiones", desc: "Cada guardado genera una sesion con historial completo de cambios. Sabes quien edito que y cuando.", status: "future" },
  { number: "5", title: "Ejecuta el codigo", desc: "Corre tu codigo en 20+ lenguajes via Judge0. Ve la salida, errores y diagnostico sin salir del editor.", status: "future" },
  { number: "6", title: "Chat + IA", desc: "Conversa con tu equipo y pide explicaciones o generacion de codigo con Groq AI. Reutiliza las respuestas guardadas.", status: "future" },
];

export const comparisonRows = [
  { feature: "Colaboracion en tiempo real", synapse: true, replit: true, together: true, codespaces: true },
  { feature: "Ejecucion de codigo", synapse: true, replit: true, together: false, codespaces: true },
  { feature: "Chat integrado", synapse: true, replit: true, together: true, codespaces: false },
  { feature: "Asistente IA", synapse: true, replit: null, together: false, codespaces: null },
  { feature: "30+ lenguajes", synapse: true, replit: true, together: null, codespaces: true },
  { feature: "Gratis sin limites", synapse: true, replit: false, together: true, codespaces: false },
  { feature: "Sistema de archivos", synapse: true, replit: true, together: false, codespaces: true },
  { feature: "Historial de versiones", synapse: true, replit: true, together: false, codespaces: true },
];

export const navLinks = [
  { label: "Features", href: "#features", id: "features" },
  { label: "Kinal", href: "#kinal", id: "kinal" },
  { label: "Lenguajes", href: "#lenguajes", id: "lenguajes" },
  { label: "Planes", href: "#precios", id: "precios" },
  { label: "Roadmap", href: "#roadmap", id: "roadmap" },
];
