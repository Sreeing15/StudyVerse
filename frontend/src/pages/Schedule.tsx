import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { axiosInstance, USE_MOCK_AUTH } from '@/context/AuthContext';
import { generateSchedule, completeSchedule, getUserData } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Schedule } from '@/types';

interface DaySchedule {
  date: string;
  dayName: string;
  topics: Schedule[];
}

const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [topics, setTopics] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      if (USE_MOCK_AUTH) {
        const data = getUserData();
        setSchedules(data.schedules || []);
      } else {
        const response = await axiosInstance.get('/study/schedule');
        if (response.data.success) {
          // Flatten the grouped schedules
          const allSchedules: Schedule[] = [];
          Object.values(response.data.data.schedules).forEach((daySchedules: any) => {
            allSchedules.push(...daySchedules);
          });
          setSchedules(allSchedules);
        }
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!topics.trim()) {
      setError('Please enter at least one topic');
      return;
    }

    setIsGenerating(true);
    setError('');

    const topicList = topics.split('\n').filter(t => t.trim());

    try {
      if (USE_MOCK_AUTH) {
        const result = generateSchedule(topicList, selectedDate);
        if (result.success) {
          setTopics('');
          setShowGenerator(false);
          fetchSchedules();
        } else {
          setError(result.error || 'Error generating schedule');
        }
      } else {
        const response = await axiosInstance.post('/study/schedule/generate', {
          topics: topicList,
          start_date: selectedDate.toISOString()
        });

        if (response.data.success) {
          setTopics('');
          setShowGenerator(false);
          fetchSchedules();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error generating schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      if (USE_MOCK_AUTH) {
        completeSchedule(id);
        fetchSchedules();
      } else {
        await axiosInstance.put(`/study/schedule/${id}/complete`);
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error completing schedule:', error);
    }
  };

  const getWeekDays = (): DaySchedule[] => {
    const days: DaySchedule[] = [];
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      days.push({
        date: dateStr,
        dayName: dayNames[i],
        topics: schedules.filter(s => s.scheduled_date === dateStr)
      });
    }

    return days;
  };

  const weekDays = getWeekDays();
  const isCurrentWeek = weekOffset === 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Study Schedule</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Plan your learning journey with a personalized 7-day schedule
          </p>
        </div>
        <Button
          onClick={() => setShowGenerator(!showGenerator)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate Schedule
        </Button>
      </div>

      {showGenerator && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Generate Study Schedule</CardTitle>
              <CardDescription>
                Enter topics you want to study (one per line) and select a start date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="topics">Topics (one per line)</Label>
                  <Textarea
                    id="topics"
                    placeholder="Introduction to Python&#10;Data Structures&#10;Algorithms&#10;..."
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex space-x-2">
                <Button
                  onClick={handleGenerateSchedule}
                  disabled={isGenerating || !topics.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Create Schedule
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowGenerator(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(prev => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Week
        </Button>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isCurrentWeek ? 'This Week' : weekOffset === 1 ? 'Next Week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(prev => prev + 1)}
        >
          Next Week
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 7-Day Calendar View */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {weekDays.map((day, index) => {
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const hasTopics = day.topics.length > 0;
          const completedCount = day.topics.filter(t => t.completed).length;
          const allCompleted = hasTopics && completedCount === day.topics.length;

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`min-h-[150px] rounded-lg border-2 p-3 ${
                isToday
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : allCompleted
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="text-center mb-2">
                <p className={`text-xs font-medium ${
                  isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                }`}>
                  {day.dayName}
                </p>
                <p className={`text-lg font-bold ${
                  isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {new Date(day.date).getDate()}
                </p>
              </div>

              <div className="space-y-1">
                {day.topics.slice(0, 3).map((topic) => (
                  <div
                    key={topic.id}
                    className={`text-xs p-1.5 rounded truncate ${
                      topic.completed
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 line-through'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    title={topic.topic}
                  >
                    {topic.topic}
                  </div>
                ))}
                {day.topics.length > 3 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{day.topics.length - 3} more
                  </p>
                )}
              </div>

              {hasTopics && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {completedCount}/{day.topics.length}
                    </span>
                    {allCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Study Plan</CardTitle>
          <CardDescription>All your scheduled topics</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">
                No schedules yet. Generate your first study plan!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules
                .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                .map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    schedule.completed
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleComplete(schedule.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        schedule.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                      }`}
                    >
                      {schedule.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <p className={`font-medium ${
                        schedule.completed
                          ? 'text-slate-500 dark:text-slate-500 line-through'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {schedule.topic}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <CalendarIcon className="w-3 h-3" />
                        <span>
                          {new Date(schedule.scheduled_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {schedule.completed ? (
                      <Badge variant="default" className="bg-green-500">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {schedules.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {schedules.filter(s => s.completed).length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {Math.round(schedules.filter(s => s.completed).length * 45 / 60)}h
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Study Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default SchedulePage;
