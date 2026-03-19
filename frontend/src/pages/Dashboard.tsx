import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth, USE_MOCK_AUTH } from '@/context/AuthContext';
import { axiosInstance } from '@/context/AuthContext';
import { getDashboardData } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flame,
  Clock,
  BookOpen,
  FileText,
  Calendar,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  Circle
} from 'lucide-react';
import type { DashboardData, ActivityLog, Schedule } from '@/types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (USE_MOCK_AUTH) {
        // Use mock API
        const data = getDashboardData();
        if (data.success) {
          setDashboardData(data.data);
        }
      } else {
        // Use real backend
        const response = await axiosInstance.get('/dashboard');
        if (response.data.success) {
          setDashboardData(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const streak = dashboardData?.streak;
  const quizProgress = dashboardData?.quiz_progress;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Here's your learning progress today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Study Streak */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Study Streak
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {streak?.current || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Longest: {streak?.longest || 0} days
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Study Time */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Study Time (7d)
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {Math.floor((stats?.total_study_time || 0) / 60)}h
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {(stats?.total_study_time || 0) % 60}m this week
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summaries Created */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Summaries
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats?.total_summaries || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Created so far
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Progress */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Quiz Progress
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {quizProgress?.completion_rate || 0}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {quizProgress?.completed || 0}/{quizProgress?.total || 0} completed
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Log */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your learning activities this week</CardDescription>
              </div>
              <Link to="/schedule">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.activity_logs && dashboardData.activity_logs.length > 0 ? (
                  dashboardData.activity_logs.slice(0, 5).map((log: ActivityLog, index: number) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {log.action}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {log.time_spent}m
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activities yet. Start learning!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Schedule */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Upcoming Schedule</span>
                </CardTitle>
                <CardDescription>Your study plan for the next 7 days</CardDescription>
              </div>
              <Link to="/schedule">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.upcoming_schedule && dashboardData.upcoming_schedule.length > 0 ? (
                  dashboardData.upcoming_schedule.slice(0, 5).map((item: Schedule, index: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          item.completed 
                            ? 'text-slate-500 dark:text-slate-500 line-through' 
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.topic}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(item.scheduled_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming schedule. Create one!</p>
                    <Link to="/schedule">
                      <Button className="mt-4" size="sm">
                        Create Schedule
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quiz Progress Section */}
      <motion.div variants={itemVariants} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Quiz Performance</span>
            </CardTitle>
            <CardDescription>Track your quiz completion and scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Completion Rate
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {quizProgress?.completion_rate || 0}%
                </span>
              </div>
              <Progress 
                value={quizProgress?.completion_rate || 0} 
                className="h-2"
              />
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {quizProgress?.total || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Quizzes</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {quizProgress?.completed || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {quizProgress?.average_score || 0}%
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Avg Score</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
