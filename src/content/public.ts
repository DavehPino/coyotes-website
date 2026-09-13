// Todo el contenido de la web pública vive aquí. Edita textos y enlaces sin tocar componentes.
// IMPORTANTE: no menciones ni enlaces el dashboard interno desde este archivo.

export type PublicLink = { label: string; href: string; handle?: string }

export const publicContent = {
  hero: {
    title: 'Coyotes Volley',
    tagline: 'Garra, equipo y vóley.',
    intro: 'Equipo de vóley de la Liga Regional. Entrenamos duro, jugamos juntos y competimos con orgullo.',
    cta: { label: 'Súmate al equipo', href: '#contacto' },
  },

  about: {
    title: 'Sobre el equipo',
    paragraphs: [
      'Coyotes nació como un grupo de amigos que se juntaba a jugar los fines de semana. Hoy somos un equipo federado que compite en la Liga Regional de mayores.',
      'Nos define la intensidad en la cancha y el compañerismo fuera de ella. Cada temporada crecemos con nuevas incorporaciones y un cuerpo técnico comprometido.',
    ],
    facts: [
      { label: 'Fundación', value: '2021' },
      { label: 'Categoría', value: 'Mayores' },
      { label: 'Competición', value: 'Liga Regional' },
    ],
  },

  trainings: {
    title: 'Entrenamientos',
    intro: 'Entrenamos tres veces por semana. Si quieres probar, ven a una sesión: solo necesitas ropa deportiva y ganas.',
    sessions: [
      {
        days: 'Lunes y miércoles',
        time: '19:30 – 21:00',
        place: 'Polideportivo Municipal',
        focus: 'Técnica y táctica',
      },
      {
        days: 'Martes',
        time: '20:00 – 21:00',
        place: 'Gimnasio Norte',
        focus: 'Preparación física',
      },
      {
        days: 'Sábados',
        time: 'Según calendario',
        place: 'Casa o fuera',
        focus: 'Partidos de liga',
      },
    ],
  },

  contact: {
    title: 'Contacto',
    intro: '¿Quieres jugar con nosotros, organizar un amistoso o patrocinar al equipo? Escríbenos.',
    email: 'hola@coyotesvolley.com',
    links: [
      { label: 'Instagram', href: 'https://instagram.com/coyotesvolley', handle: '@coyotesvolley' },
      { label: 'WhatsApp', href: 'https://wa.me/34600000000', handle: '+34 600 000 000' },
    ] satisfies PublicLink[],
  },

  footer: {
    text: `© ${new Date().getFullYear()} Coyotes Volley`,
  },
} as const

export const publicNav = [
  { label: 'Equipo', href: '#equipo' },
  { label: 'Entrenamientos', href: '#entrenamientos' },
  { label: 'Contacto', href: '#contacto' },
] as const
