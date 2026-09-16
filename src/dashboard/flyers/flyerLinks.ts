// Enlaces a la sección Flyers con el borrador ya precargado (los resuelve prefill.ts al abrirla).
// Módulo sin dependencias a propósito: quien solo enlaza no arrastra el generador ni sus queries.
export const PREFILL_PARAM = 'from'

export const flyerLinkForMatch = (slug: string) => `/flyers?${PREFILL_PARAM}=match:${encodeURIComponent(slug)}`
export const flyerLinkForActivity = (id: string) => `/flyers?${PREFILL_PARAM}=activity:${encodeURIComponent(id)}`
