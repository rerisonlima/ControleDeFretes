import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isStaticRoute = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.match(/\.(png|jpg|jpeg|svg|ico)$/);

  if (isStaticRoute || isApiRoute) {
    return NextResponse.next();
  }

  // Se não tem sessão e não está na página de login, redireciona pro login
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se tem sessão, valida
  if (session) {
    try {
      const payload = await decrypt(session);
      const role = payload.role as string;
      const pathname = request.nextUrl.pathname;

      // Restringir operador apenas à página de viagens e despesas
      if (role === 'OPERATOR' && pathname !== '/routes' && pathname !== '/expenses' && !isAuthPage) {
        return NextResponse.redirect(new URL('/routes', request.url));
      }

      // Se está logado e tenta acessar o login, manda pra home
      if (isAuthPage) {
        if (role === 'OPERATOR') {
          return NextResponse.redirect(new URL('/routes', request.url));
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Sessão inválida (token expirado ou alterado)
      if (!isAuthPage) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
