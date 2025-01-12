export const PATH_ROOT = '/'
export const PATH_ADMIN = '/admin'

export const DEFAULT_LOGIN_REDIRECT = '/admin'

export const authRoutes = ['/login']

export const publicRoutes = ['/']
export const protectedRoutes = ['/admin', '/upload']

export const apiAuthPrefix = '/api/auth'

export const checkPathPrefix = (prefix: string, pathname = '') =>
  pathname.toLowerCase().startsWith(prefix)

export const protectedRoute = (pathname?: string) =>
  protectedRoutes.some((route) => checkPathPrefix(route, pathname))
