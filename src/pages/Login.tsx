import React, { useState } from 'react';
import { useAuth, Role } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, role);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-4">
            <Briefcase className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Placement Portal</h1>
          <p className="text-zinc-500 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
              <TabsTrigger 
                value="student" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent"
              >
                Student
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent"
              >
                Admin / Recruiter
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={role === 'student' ? 'student@university.edu' : 'admin@company.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
