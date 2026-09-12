// Variables de entorno del servidor. Se leen en diferido para que un fallo de
// configuración devuelva un 500 claro en vez de romper el arranque de la función.

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined
}

export const env = {
  get supabaseUrl() {
    return required('SUPABASE_URL')
  },
  get supabaseSecretKey() {
    return required('SUPABASE_SECRET_KEY')
  },
  get s3() {
    return {
      endpoint: optional('S3_ENDPOINT'),
      region: optional('S3_REGION') ?? 'auto',
      bucket: required('S3_BUCKET'),
      accessKeyId: required('S3_ACCESS_KEY_ID'),
      secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
      videoPrefix: optional('S3_VIDEO_PREFIX') ?? '',
      publicBaseUrl: optional('STORAGE_PUBLIC_BASE_URL'),
      signedUrlTtlSeconds: Number(optional('SIGNED_URL_TTL_SECONDS') ?? 3600),
    }
  },
  get cronSecret() {
    return optional('CRON_SECRET')
  },
}
