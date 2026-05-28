import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: profileSubmitting } } = useForm({
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: '' },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { isSubmitting: pwdSubmitting } } = useForm<{
    currentPassword: string; newPassword: string;
  }>();

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) => authService.updateMe(data),
    onSuccess: (res) => {
      const updated = res.data.data;
      setAuth({ ...user!, ...updated }, accessToken!, refreshToken!);
      toast.success('Profile updated');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed');
      resetPwd();
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* User info summary */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <Badge variant="green" className="mt-1">{user?.role}</Badge>
          </div>
        </div>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
        <form onSubmit={handleProfile((d) => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" {...regProfile('firstName')} />
            <Input label="Last name" {...regProfile('lastName')} />
          </div>
          <Input label="Phone" type="tel" {...regProfile('phone')} />
          <Button type="submit" loading={profileSubmitting || updateMutation.isPending}>Save changes</Button>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <form onSubmit={handlePwd((d) => passwordMutation.mutate(d))} className="space-y-4">
          <Input label="Current password" type="password" {...regPwd('currentPassword', { required: true })} />
          <Input label="New password" type="password" {...regPwd('newPassword', { required: true, minLength: 8 })} />
          <Button type="submit" loading={pwdSubmitting || passwordMutation.isPending}>Update password</Button>
        </form>
      </Card>
    </div>
  );
}
