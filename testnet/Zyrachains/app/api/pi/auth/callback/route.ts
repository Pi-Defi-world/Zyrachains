import { NextRequest, NextResponse } from 'next/server';

const PI_API_BASE = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true'
  ? 'https://api.testnet.minepi.com'
  : 'https://api.minepi.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Pi OAuth error:', error);
      return NextResponse.redirect('/admin?error=oauth_failed');
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect('/admin?error=no_code');
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`${PI_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.PI_NETWORK_APP_ID || '',
        code: code,
        redirect_uri: process.env.PI_NETWORK_REDIRECT_URI || 'http://localhost:8000/api/pi/auth/callback',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect('/admin?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token received');
      return NextResponse.redirect('/admin?error=no_access_token');
    }

    // Verify the token and get user data
    const verifyResponse = await fetch('/api/pi/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    });

    if (!verifyResponse.ok) {
      console.error('Token verification failed');
      return NextResponse.redirect('/admin?error=verification_failed');
    }

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      console.error('User verification failed:', verifyData.message);
      return NextResponse.redirect('/admin?error=user_verification_failed');
    }

    // Check if user is admin
    const adminCheckResponse = await fetch('/api/admin/auth/check', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (adminCheckResponse.ok) {
      const adminData = await adminCheckResponse.json();
      if (adminData.success && adminData.isAdmin) {
        // Success - redirect to admin dashboard with token
        return NextResponse.redirect(`/admin?token=${accessToken}&success=true`);
      } else {
        return NextResponse.redirect('/admin?error=not_admin');
      }
    } else {
      return NextResponse.redirect('/admin?error=admin_check_failed');
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect('/admin?error=callback_failed');
  }
} 