import { v4 as uuidv4 } from 'uuid';

// Mock API service that stores data in localStorage
// This allows the app to work without a backend server

const getUserId = (): string | null => {
  const user = localStorage.getItem('studyverse_user');
  return user ? JSON.parse(user).id : null;
};

const getMockData = (key: string) => {
  const userId = getUserId();
  if (!userId) return null;
  
  const allData = JSON.parse(localStorage.getItem(`studyverse_mock_${key}`) || '{}');
  return allData[userId] || [];
};

const setMockData = (key: string, data: any) => {
  const userId = getUserId();
  if (!userId) return;
  
  const allData = JSON.parse(localStorage.getItem(`studyverse_mock_${key}`) || '{}');
  allData[userId] = data;
  localStorage.setItem(`studyverse_mock_${key}`, JSON.stringify(allData));
};

// Dashboard API
export const getDashboardData = () => {
  const user = JSON.parse(localStorage.getItem('studyverse_user') || '{}');
  const streaks = JSON.parse(localStorage.getItem('studyverse_mock_streaks') || '{}');
  const userStreak = streaks[user.id] || { current_streak: 0, longest_streak: 0, last_study_date: null };
  
  const activityLogs = getMockData('activity_logs') || [];
  const quizzes = getMockData('quizzes') || [];
  const schedules = getMockData('schedules') || [];
  const summaries = getMockData('summaries') || [];

  const completedQuizzes = quizzes.filter((q: any) => q.completed);
  const averageScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((acc: number, q: any) => acc + (q.score / q.total_questions) * 100, 0) / completedQuizzes.length)
    : 0;

  const today = new Date().toISOString().split('T')[0];
  const upcomingSchedule = schedules
    .filter((s: any) => s.scheduled_date >= today && !s.completed)
    .sort((a: any, b: any) => a.scheduled_date.localeCompare(b.scheduled_date))
    .slice(0, 7);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLogs = activityLogs
    .filter((log: any) => new Date(log.created_at) >= sevenDaysAgo)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const totalStudyTime = recentLogs.reduce((acc: number, log: any) => acc + (log.time_spent || 0), 0);

  return {
    success: true,
    data: {
      user,
      streak: {
        current: userStreak.current_streak,
        longest: userStreak.longest_streak,
        last_study_date: userStreak.last_study_date
      },
      activity_logs: recentLogs,
      quiz_progress: {
        total: quizzes.length,
        completed: completedQuizzes.length,
        average_score: averageScore,
        completion_rate: quizzes.length > 0 ? Math.round((completedQuizzes.length / quizzes.length) * 100) : 0
      },
      upcoming_schedule: upcomingSchedule,
      stats: {
        total_summaries: summaries.length,
        total_quizzes: quizzes.length,
        total_study_time: totalStudyTime,
        completed_sessions: schedules.filter((s: any) => s.completed).length
      }
    }
  };
};

// Summarize API
export const createSummary = (text: string, title?: string, maxBulletPoints: number = 10) => {
  // Simple summarization logic
  const sentences = text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300);

  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    const importanceKeywords = [
      'important', 'key', 'main', 'primary', 'essential', 'crucial',
      'significant', 'major', 'fundamental', 'critical', 'vital',
      'definition', 'concept', 'principle', 'theory', 'method',
      'result', 'conclusion', 'summary', 'therefore', 'thus'
    ];
    
    importanceKeywords.forEach(keyword => {
      if (lowerSentence.includes(keyword)) score += 2;
    });
    
    if (/\d+/.test(sentence)) score += 1;
    if (lowerSentence.includes('example')) score += 1;
    
    const length = sentence.length;
    if (length > 50 && length < 200) score += 1;
    
    return { sentence, score };
  });

  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxBulletPoints)
    .map(item => {
      let cleanSentence = item.sentence.replace(/^\s+/, '').replace(/\s+/g, ' ').trim();
      if (!/[.!?]$/.test(cleanSentence)) cleanSentence += '.';
      return cleanSentence;
    });

  const summaryTitle = title || generateTitle(text);

  const summary = {
    id: uuidv4(),
    user_id: getUserId(),
    title: summaryTitle,
    original_text: text,
    summary_text: topSentences.join('\n\n'),
    source_type: 'manual',
    created_at: new Date().toISOString()
  };

  const summaries = getMockData('summaries') || [];
  summaries.push(summary);
  setMockData('summaries', summaries);

  // Log activity
  logActivity('Created summary', 5);
  updateStudyStreak();

  return {
    success: true,
    data: {
      summary: {
        title: summaryTitle,
        original_length: text.length,
        summary_length: topSentences.join(' ').length,
        compression_ratio: Math.round((topSentences.join(' ').length / text.length) * 100),
        bullet_points: topSentences,
        full_summary: topSentences.join('\n\n')
      },
      saved_id: summary.id
    },
    error: undefined
  };
};

const generateTitle = (text: string): string => {
  const firstSentence = text.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 10 && firstSentence.length < 80) {
    return firstSentence;
  }
  return 'Study Summary';
};

// Quiz API
export const generateQuiz = (summaryText: string, numQuestions: number = 5) => {
  const sentences = summaryText
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);

  if (sentences.length < numQuestions) {
    return { success: false, error: 'Not enough content to generate quiz' };
  }

  const questions = [];
  const usedSentences = new Set();

  for (let i = 0; i < numQuestions && i < sentences.length; i++) {
    let sentence;
    let attempts = 0;
    do {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      sentence = sentences[randomIndex];
      attempts++;
    } while (usedSentences.has(sentence) && attempts < 10);
    
    if (usedSentences.has(sentence)) continue;
    usedSentences.add(sentence);

    const words = sentence.split(/\s+/);
    const keyTerms = words.filter(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      return clean.length > 4;
    });

    if (keyTerms.length === 0) continue;

    const keyTerm = keyTerms[Math.floor(Math.random() * keyTerms.length)]
      .replace(/[^a-zA-Z]/g, '');

    const questionText = `What is the significance of "${keyTerm}" in this context?`;

    const correctAnswer = keyTerm.charAt(0).toUpperCase() + keyTerm.slice(1);
    const distractors = generateDistractors(keyTerm, sentences);

    const options = [
      { id: 'a', text: correctAnswer, isCorrect: true },
      { id: 'b', text: distractors[0] || 'Alternative A', isCorrect: false },
      { id: 'c', text: distractors[1] || 'Alternative B', isCorrect: false },
      { id: 'd', text: distractors[2] || 'Alternative C', isCorrect: false }
    ].sort(() => Math.random() - 0.5);

    const correctOptionId = options.find(opt => opt.isCorrect)!.id;

    questions.push({
      id: `q${Date.now()}_${i}`,
      question: questionText,
      options: options.map(opt => ({ id: opt.id, text: opt.text })),
      correct_answer: correctOptionId,
      explanation: `The correct answer is based on: "${sentence}"`
    });
  }

  const quiz = {
    id: uuidv4(),
    user_id: getUserId(),
    title: 'Generated Quiz',
    questions,
    score: 0,
    total_questions: questions.length,
    completed: false,
    created_at: new Date().toISOString()
  };

  const quizzes = getMockData('quizzes') || [];
  quizzes.push(quiz);
  setMockData('quizzes', quizzes);

  logActivity('Generated quiz', 3);

  return {
    success: true,
    data: {
      quiz: { questions, total_questions: questions.length },
      saved_id: quiz.id
    }
  };
};

const generateDistractors = (correctTerm: string, allSentences: string[]): string[] => {
  const words = allSentences
    .join(' ')
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(w => w.length > 4 && w.toLowerCase() !== correctTerm.toLowerCase());

  const uniqueWords = [...new Set(words)];
  const distractors = [];

  for (let i = 0; i < 3 && uniqueWords.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * uniqueWords.length);
    const word = uniqueWords[randomIndex];
    distractors.push(word.charAt(0).toUpperCase() + word.slice(1));
    uniqueWords.splice(randomIndex, 1);
  }

  return distractors;
};

export const submitQuiz = (quizId: string, answers: any[]) => {
  const quizzes = getMockData('quizzes') || [];
  const quizIndex = quizzes.findIndex((q: any) => q.id === quizId);
  
  if (quizIndex === -1) {
    return { success: false, error: 'Quiz not found' };
  }

  const quiz = quizzes[quizIndex];
  let correctCount = 0;

  const results = answers.map(answer => {
    const question = quiz.questions.find((q: any) => q.id === answer.question_id);
    if (!question) return null;

    const isCorrect = answer.selected_option === question.correct_answer;
    if (isCorrect) correctCount++;

    return {
      question_id: answer.question_id,
      selected_option: answer.selected_option,
      correct_option: question.correct_answer,
      is_correct: isCorrect,
      explanation: question.explanation
    };
  }).filter(Boolean);

  const score = Math.round((correctCount / quiz.questions.length) * 100);

  quizzes[quizIndex] = {
    ...quiz,
    score: correctCount,
    completed: true,
    completed_at: new Date().toISOString()
  };
  setMockData('quizzes', quizzes);

  logActivity('Completed quiz', 10);
  updateStudyStreak();

  return {
    success: true,
    data: {
      score,
      correct_answers: correctCount,
      total_questions: quiz.questions.length,
      results
    }
  };
};

// Schedule API
export const generateSchedule = (topics: string[], startDate: Date) => {
  const schedule: any[] = [];
  const currentDate = new Date(startDate);
  const daysToSchedule = 7;
  const topicsPerDay = Math.ceil(topics.length / daysToSchedule);

  for (let day = 0; day < daysToSchedule; day++) {
    const dayTopics = topics.slice(day * topicsPerDay, (day + 1) * topicsPerDay);
    if (dayTopics.length === 0) break;

    dayTopics.forEach((topic) => {
      const scheduleItem = {
        id: uuidv4(),
        user_id: getUserId(),
        topic: topic,
        description: `Study session for ${topic}`,
        scheduled_date: new Date(currentDate).toISOString().split('T')[0],
        completed: false,
        created_at: new Date().toISOString()
      };
      schedule.push(scheduleItem);
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const schedules = getMockData('schedules') || [];
  schedules.push(...schedule);
  setMockData('schedules', schedules);

  logActivity('Created study schedule', 5);

  return {
    success: true,
    data: {
      schedule: {
        schedule: schedule.reduce((acc: any, item: any) => {
          const date = item.scheduled_date;
          if (!acc[date]) acc[date] = [];
          acc[date].push(item);
          return acc;
        }, {}),
        total_days: daysToSchedule,
        total_topics: topics.length
      },
      saved_count: schedule.length
    },
    error: undefined
  };
};

export const completeSchedule = (scheduleId: string) => {
  const schedules = getMockData('schedules') || [];
  const index = schedules.findIndex((s: any) => s.id === scheduleId);
  
  if (index === -1) {
    return { success: false, error: 'Schedule not found' };
  }

  schedules[index] = {
    ...schedules[index],
    completed: true,
    completed_at: new Date().toISOString()
  };
  setMockData('schedules', schedules);

  logActivity('Completed study session', 45);
  updateStudyStreak();

  return { success: true, data: { schedule: schedules[index] } };
};

// Helper functions
const logActivity = (action: string, timeSpent: number) => {
  const logs = getMockData('activity_logs') || [];
  logs.push({
    id: uuidv4(),
    user_id: getUserId(),
    action,
    time_spent: timeSpent,
    created_at: new Date().toISOString()
  });
  setMockData('activity_logs', logs);
};

const updateStudyStreak = () => {
  const userId = getUserId();
  if (!userId) return;

  const streaks = JSON.parse(localStorage.getItem('studyverse_mock_streaks') || '{}');
  const streak = streaks[userId] || { current_streak: 0, longest_streak: 0, last_study_date: null };

  const today = new Date().toISOString().split('T')[0];
  const lastStudy = streak.last_study_date;

  let newStreak = streak.current_streak;
  let newLongest = streak.longest_streak;

  if (lastStudy) {
    const lastDate = new Date(lastStudy);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  if (newStreak > newLongest) {
    newLongest = newStreak;
  }

  streaks[userId] = {
    current_streak: newStreak,
    longest_streak: newLongest,
    last_study_date: today
  };

  localStorage.setItem('studyverse_mock_streaks', JSON.stringify(streaks));
};

// Get all data for a user
export const getUserData = () => {
  return {
    summaries: getMockData('summaries') || [],
    quizzes: getMockData('quizzes') || [],
    schedules: getMockData('schedules') || [],
    activityLogs: getMockData('activity_logs') || []
  };
};

// Web Scraping API - Simulates fetching content from Wikipedia
export const scrapeContent = async (topic: string): Promise<{ success: boolean; content?: string; error?: string; source?: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const normalizedTopic = topic.toLowerCase().trim();
  
  // Check if we have cached content for this topic
  const cachedContent = getCachedScrapedContent(normalizedTopic);
  if (cachedContent) {
    return {
      success: true,
      content: cachedContent,
      source: 'Wikipedia (cached)'
    };
  }

  // Generate realistic content based on the topic
  const content = generateWikiContent(topic);
  
  // Cache the content
  cacheScrapedContent(normalizedTopic, content);

  return {
    success: true,
    content,
    source: 'Wikipedia'
  };
};

// Get cached scraped content
const getCachedScrapedContent = (topic: string): string | null => {
  const cached = localStorage.getItem(`studyverse_scraped_${topic}`);
  if (cached) {
    const { content, timestamp } = JSON.parse(cached);
    // Cache expires after 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (timestamp > sevenDaysAgo) {
      return content;
    }
  }
  return null;
};

// Cache scraped content
const cacheScrapedContent = (topic: string, content: string) => {
  localStorage.setItem(`studyverse_scraped_${topic}`, JSON.stringify({
    content,
    timestamp: Date.now()
  }));
};

// Generate realistic Wikipedia-style content for any topic
const generateWikiContent = (topic: string): string => {
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  
  return `${capitalizedTopic}

${capitalizedTopic} refers to a significant area of knowledge and study that has garnered attention across various disciplines. The concept encompasses a wide range of ideas, theories, and practical applications that continue to evolve with ongoing research and development.

Overview and Definition

At its core, ${topic} represents a fundamental aspect of understanding in its respective field. The term is derived from historical contexts and has been shaped by contributions from numerous scholars and practitioners over time. Modern interpretations of ${topic} have expanded to include diverse perspectives and methodologies.

The definition of ${topic} varies depending on the context in which it is applied. In academic settings, it is often studied through theoretical frameworks and empirical research. In practical applications, ${topic} serves as a foundation for solving real-world problems and advancing technological innovations.

Historical Development

The history of ${topic} can be traced back to ancient civilizations where early thinkers laid the groundwork for contemporary understanding. Throughout the centuries, various cultures have contributed to the development of ${topic}, each adding unique insights and perspectives.

Key historical milestones include:
- Early foundational work by pioneering researchers who established basic principles
- The Renaissance period, which saw renewed interest and significant advancements
- The Industrial Revolution, which brought practical applications and widespread adoption
- The modern era, characterized by rapid technological progress and interdisciplinary approaches

Core Concepts and Principles

Several fundamental concepts underpin the study of ${topic}. These include:

1. Theoretical Frameworks - Established models and theories that provide structure for understanding ${topic}

2. Methodological Approaches - Various techniques and methods used to study and apply ${topic} in different contexts

3. Practical Applications - Real-world implementations that demonstrate the utility and relevance of ${topic}

4. Interdisciplinary Connections - Links to other fields of study that enrich the understanding of ${topic}

Applications and Significance

${capitalizedTopic} finds applications across numerous domains, including:

Education: ${topic} is taught at various levels, from introductory courses to advanced specialized programs. Educational institutions worldwide recognize its importance in developing critical thinking and problem-solving skills.

Research: Ongoing research in ${topic} continues to yield new insights and discoveries. Academic journals, conferences, and research institutions dedicated to ${topic} contribute to the growing body of knowledge.

Industry: Many industries rely on principles derived from ${topic} to develop products, services, and solutions. The practical value of ${topic} is evident in its widespread adoption across commercial sectors.

Technology: Modern technological advancements have been significantly influenced by developments in ${topic}. From software algorithms to hardware design, ${topic} plays a crucial role in innovation.

Current Trends and Future Directions

The field of ${topic} continues to evolve with emerging trends and new discoveries. Current areas of focus include:

- Integration with artificial intelligence and machine learning
- Sustainable and environmentally conscious applications
- Global collaboration and knowledge sharing
- Ethical considerations and responsible implementation

Future developments in ${topic} are expected to address complex challenges and open new possibilities for advancement. Researchers and practitioners anticipate breakthroughs that will further expand the scope and impact of ${topic}.

Challenges and Considerations

Despite its many benefits, ${topic} also presents certain challenges:

Complexity: The multifaceted nature of ${topic} can make it difficult to master, requiring dedicated study and practice.

Rapid Change: The field evolves quickly, necessitating continuous learning and adaptation.

Resource Requirements: Advanced study and application of ${topic} may require significant resources and infrastructure.

Ethical Implications: As with any powerful tool or knowledge area, ${topic} raises important ethical questions that must be carefully considered.

Conclusion

${capitalizedTopic} remains a vital and dynamic field of study with far-reaching implications. Its continued development promises to bring new insights, applications, and solutions to the challenges facing society. As research progresses and technology advances, the importance of ${topic} is likely to grow, making it an essential area of knowledge for current and future generations.`;
};
