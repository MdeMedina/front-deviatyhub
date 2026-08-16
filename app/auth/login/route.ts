import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  // Mock credentials
  if (email === 'admin@deviaty.com' && password === 'admin123') {
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'u1',
          email: 'admin@deviaty.com',
          active: true,
          clinic_id: 'c1',
          role: {
            id: 'r1',
            name: 'Super Admin',
            is_superadmin: true,
            permissions: {}
          }
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      }
    })
  }

  return NextResponse.json({
    success: false,
    error: {
      code: 'AUTH_FAILED',
      message: 'Credenciales inválidas (Prueba con admin@deviaty.com / admin123)'
    }
  }, { status: 401 })
}
