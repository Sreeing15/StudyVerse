import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosInstance, USE_MOCK_AUTH } from '@/context/AuthContext';
import { generateQuiz, submitQuiz, getUserData } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  Brain,
  Timer
} from 'lucide-react';
import type { Quiz } from '@/types';

const QuizPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      if (USE_MOCK_AUTH) {
        const data = getUserData();
        setQuizzes(data.quizzes || []);
      } else {
        const response = await axiosInstance.get('/study/quizzes');
        if (response.data.success) {
          setQuizzes(response.data.data.quizzes);
        }
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!text.trim()) {
      setError('Please enter some text to generate a quiz');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      if (USE_MOCK_AUTH) {
        const result = generateQuiz(text, 5);
        if (result.success && result.data) {
          setActiveQuiz({
            id: result.data.saved_id || 'temp',
            user_id: '',
            title: 'Generated Quiz',
            questions: result.data.quiz.questions,
            score: 0,
            total_questions: result.data.quiz.total_questions,
            completed: false,
            created_at: new Date().toISOString()
          });
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
          setShowResults(false);
          setQuizResult(null);
          fetchQuizzes();
        } else {
          setError((result as any).error || 'Error generating quiz');
        }
      } else {
        const response = await axiosInstance.post('/study/quiz/generate', {
          summary_text: text,
          num_questions: 5
        });

        if (response.data.success) {
          setActiveQuiz({
            id: response.data.data.saved_id || 'temp',
            user_id: '',
            title: 'Generated Quiz',
            questions: response.data.data.quiz.questions,
            score: 0,
            total_questions: response.data.data.quiz.questions.length,
            completed: false,
            created_at: new Date().toISOString()
          });
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
          setShowResults(false);
          setQuizResult(null);
          fetchQuizzes();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error generating quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (activeQuiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;

    const answers = Object.entries(selectedAnswers).map(([question_id, selected_option]) => ({
      question_id,
      selected_option
    }));

    try {
      if (USE_MOCK_AUTH) {
        const result = submitQuiz(activeQuiz.id, answers);
        if (result.success) {
          setQuizResult(result.data);
          setShowResults(true);
          fetchQuizzes();
        } else {
          setError(result.error || 'Error submitting quiz');
        }
      } else {
        const response = await axiosInstance.post('/study/quiz/submit', {
          quiz_id: activeQuiz.id,
          answers
        });

        if (response.data.success) {
          setQuizResult(response.data.data);
          setShowResults(true);
          fetchQuizzes();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error submitting quiz');
    }
  };

  const handleRestart = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizResult(null);
    setText('');
  };

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
  const progress = activeQuiz 
    ? ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100 
    : 0;
  const answeredCount = Object.keys(selectedAnswers).length;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span>Quiz Master</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Generate quizzes from your summaries and test your knowledge
        </p>
      </div>

      {!activeQuiz ? (
        <div className="space-y-8">
          {/* Generate New Quiz */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Quiz</CardTitle>
              <CardDescription>
                Paste your summary or notes to generate a multiple-choice quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-text">Your Text</Label>
                <Textarea
                  id="quiz-text"
                  placeholder="Paste your summary here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || !text.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Previous Quizzes */}
          {quizzes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Quizzes</CardTitle>
                <CardDescription>Previously generated quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizzes.slice(0, 5).map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          quiz.completed 
                            ? 'bg-green-100 dark:bg-green-900/50' 
                            : 'bg-indigo-100 dark:bg-indigo-900/50'
                        }`}>
                          {quiz.completed ? (
                            <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {quiz.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {quiz.total_questions} questions • 
                            {quiz.completed 
                              ? ` Score: ${Math.round((quiz.score / quiz.total_questions) * 100)}%`
                              : ' Not completed'
                            }
                          </p>
                        </div>
                      </div>
                      <Badge variant={quiz.completed ? 'default' : 'secondary'}>
                        {quiz.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : showResults ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center py-12">
              <CardContent>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                >
                  <Trophy className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Quiz Completed!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  You scored {quizResult?.score}% ({quizResult?.correct_answers}/{quizResult?.total_questions} correct)
                </p>
                
                <div className="max-w-md mx-auto mb-8">
                  <Progress value={quizResult?.score} className="h-3" />
                </div>

                <div className="space-y-4 max-w-lg mx-auto text-left">
                  {quizResult?.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        result.is_correct 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {result.is_correct ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            Question {index + 1}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {result.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={handleRestart} className="mt-8">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Take Another Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary">
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                  </Badge>
                  <div className="flex items-center text-sm text-slate-500">
                    <Timer className="w-4 h-4 mr-1" />
                    {answeredCount}/{activeQuiz.questions.length} answered
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <h3 className="text-xl font-medium text-slate-900 dark:text-white">
                  {currentQuestion?.question}
                </h3>

                <div className="space-y-3">
                  {currentQuestion?.options.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedAnswers[currentQuestion.id] === option.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedAnswers[currentQuestion.id] === option.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {option.id.toUpperCase()}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{option.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={answeredCount < activeQuiz.questions.length}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!selectedAnswers[currentQuestion?.id || '']}
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default QuizPage;
