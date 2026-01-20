import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { authService } from '@/services/auth.service';
import { getMultiRoleDashboardPath } from '@/utils/roleHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import loginBg from '@/assets/login-background.svg';
import logoImage from '@/assets/logo.png';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { passwordService } from '@/services/password.service';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { branding } = useBranding();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authService.login({
        email,
        password
      });
      if (response.success) {
        // Direct login - no forced password change
        login(response.user, response.token);
        toast.success(`Welcome back, ${response.user.name}!`);

        // Get tenant slug for path-based routing
        const tenantSlug = response.tenant?.slug;
        
        // Validate tenant slug for tenant-level roles
        const tenantRoles = ['management', 'officer', 'teacher', 'student'];
        if (tenantRoles.includes(response.user.role) && !tenantSlug) {
          console.error('[Login] User has tenant role but no institution assigned');
          toast.error('Your account is not associated with any institution. Please contact your administrator.');
          await authService.logout();
          setIsLoading(false);
          return;
        }

        // Redirect based on role (uses multi-role path for CEO)
        const dashboardPath = getMultiRoleDashboardPath(response.user, tenantSlug);
        
        // Don't use location.state.from if it contains 'undefined' or invalid paths
        const fromPath = location.state?.from?.pathname;
        const isValidFromPath = fromPath && 
          !fromPath.includes('undefined') && 
          !fromPath.includes('/login') &&
          fromPath !== '/';
        
        const redirectPath = isValidFromPath ? fromPath : dashboardPath;
        console.log('[Login] Redirecting to:', redirectPath);
        
        navigate(redirectPath, { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 28, 45, 0.85), rgba(5, 28, 45, 0.95)), url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div 
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full overflow-hidden" 
            style={{ backgroundColor: '#ffffff' }}
          >
            <img 
              src={branding.logo_collapsed_url || logoImage} 
              alt="Logo" 
              className="h-full w-full object-contain p-2" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">{branding.site_title || 'Meta-INNOVA LMS'}</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={isLoading} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm h-auto"
                  onClick={() => setForgotPasswordOpen(true)}
                  disabled={isLoading}
                >
                  Forgot Password?
                </Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={isLoading} 
              />
            </div>
            <Button type="submit" className="w-full bg-meta-dark hover:bg-meta-dark-lighter" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ForgotPasswordDialog 
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onRequestReset={async (email) => {
          await passwordService.requestPasswordReset(email);
        }}
      />
    </div>
  );
}
