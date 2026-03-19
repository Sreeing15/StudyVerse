import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth, USE_MOCK_AUTH } from '@/context/AuthContext';
import { axiosInstance } from '@/context/AuthContext';
import { getDashboardData } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Save,
  Loader2,
  Award,
  BookOpen,
  Clock,
  TrendingUp
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    course_of_study: ''
  });
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        course_of_study: user.course_of_study || ''
      });
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      if (USE_MOCK_AUTH) {
        const result = getDashboardData();
        if (result.success) {
          setStats({
            quiz_stats: result.data.quiz_progress,
            summaries_created: result.data.stats.total_summaries,
            schedule_completion: {
              total: result.data.stats.completed_sessions + result.data.upcoming_schedule.length,
              completed: result.data.stats.completed_sessions,
              rate: result.data.stats.completed_sessions > 0 
                ? Math.round((result.data.stats.completed_sessions / (result.data.stats.completed_sessions + result.data.upcoming_schedule.length)) * 100)
                : 0
            },
            total_study_time: result.data.stats.total_study_time
          });
        }
      } else {
        const response = await axiosInstance.get('/dashboard/progress');
        if (response.data.success) {
          setStats(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span>Profile</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your account and view your learning statistics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {message}
                  </AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    {getInitials(user?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {user?.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    Member since {formatDate(user?.created_at || '')}
                  </Badge>
                </div>
              </div>

              <Separator className="my-6" />

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      minLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course_of_study">
                      <GraduationCap className="w-4 h-4 inline mr-1" />
                      Course of Study
                    </Label>
                    <Input
                      id="course_of_study"
                      name="course_of_study"
                      value={formData.course_of_study}
                      onChange={handleChange}
                      placeholder="e.g., Computer Science"
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || '',
                          course_of_study: user?.course_of_study || ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Full Name</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center mt-1">
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        {user?.name}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center mt-1">
                        <Mail className="w-4 h-4 mr-2 text-slate-400" />
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Course of Study</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center mt-1">
                        <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                        {user?.course_of_study || 'Not specified'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Joined</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        {formatDate(user?.created_at || '')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setIsEditing(true)} className="mt-4">
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Learning Stats</CardTitle>
              <CardDescription>Your progress overview</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {stats.summaries_created}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Summaries</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center space-x-3">
                      <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {stats.quiz_stats?.total || 0}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Quizzes Taken</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {stats.quiz_stats?.average_score || 0}%
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Avg Quiz Score</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {Math.floor((stats.total_study_time || 0) / 60)}h
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Study Time (30d)</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Schedule Completion</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>{stats.schedule_completion?.completed || 0} / {stats.schedule_completion?.total || 0}</span>
                      <span>{stats.schedule_completion?.rate || 0}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                        style={{ width: `${stats.schedule_completion?.rate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-4">No stats available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
