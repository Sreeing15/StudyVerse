import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { axiosInstance, USE_MOCK_AUTH } from '@/context/AuthContext';
import { createSummary, scrapeContent } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Download,
  BookOpen,
  Wand2,
  Globe,
  Search,
  X
} from 'lucide-react';

const Summarize: React.FC = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scrapedContent, setScrapedContent] = useState<string | null>(null);
  const [showScrapeOption, setShowScrapeOption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch for title changes to offer web scraping
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title.trim().length > 3 && !text.trim() && !scrapedContent) {
        setShowScrapeOption(true);
      } else {
        setShowScrapeOption(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [title, text, scrapedContent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);
    setError('');

    try {
      if (USE_MOCK_AUTH) {
        // Simulate PDF text extraction with mock content
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate mock PDF content based on filename
        const mockContent = generateMockPdfContent(file.name);
        setText(mockContent);
        setTitle(file.name.replace('.pdf', '').replace(/_/g, ' '));
      } else {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await axiosInstance.post('/pdf/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setText(response.data.data.text);
          setTitle(file.name.replace('.pdf', ''));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error uploading PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPdfContent = (filename: string): string => {
    const topic = filename.replace('.pdf', '').replace(/[_-]/g, ' ');
    return `Introduction to ${topic}

This document provides a comprehensive overview of ${topic}. The fundamental concepts covered in this material are essential for understanding the subject matter.

Key Concepts and Definitions

${topic} represents an important area of study with numerous applications in modern contexts. The primary principles include theoretical frameworks and practical methodologies that have evolved over time.

Historical Background

The development of ${topic} can be traced back to early research in related fields. Pioneering work by notable researchers established the foundation for current understanding and practices.

Main Components

The subject consists of several interconnected components:
- Core theoretical principles that form the basis of understanding
- Practical applications in real-world scenarios
- Advanced techniques for specialized contexts
- Emerging trends and future directions

Applications and Use Cases

${topic} finds applications across various domains including education, research, industry, and technology. The versatility of these concepts makes them valuable for professionals and students alike.

Methodology and Approaches

Different approaches can be employed when working with ${topic}. The choice of methodology depends on specific requirements, available resources, and desired outcomes. Common approaches include systematic analysis, comparative studies, and experimental methods.

Challenges and Considerations

Working with ${topic} presents certain challenges that practitioners should be aware of. These include complexity of concepts, need for specialized knowledge, and staying current with developments in the field.

Future Directions

The field of ${topic} continues to evolve with new research and technological advances. Future developments are expected to expand the scope and impact of these concepts across multiple disciplines.

Conclusion

Understanding ${topic} provides valuable insights and capabilities for addressing complex problems. Continued study and application of these principles will contribute to advancement in various fields.`;
  };

  const handleScrapeContent = async () => {
    if (!title.trim()) return;

    setIsScraping(true);
    setError('');

    try {
      const result = await scrapeContent(title);
      if (result.success && result.content) {
        setScrapedContent(result.content);
        setText(result.content);
      } else {
        setError(result.error || 'Could not fetch content from web');
      }
    } catch (err: any) {
      setError('Error fetching content from web');
    } finally {
      setIsScraping(false);
    }
  };

  const clearScrapedContent = () => {
    setScrapedContent(null);
    setText('');
  };

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to summarize');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (USE_MOCK_AUTH) {
        const result = createSummary(text, title || undefined, 10);
        if (result.success) {
          setSummary(result.data.summary);
        } else {
          setError(result.error || 'Error generating summary');
        }
      } else {
        const response = await axiosInstance.post('/study/summarize', {
          text,
          title: title || undefined,
          max_bullet_points: 10
        });

        if (response.data.success) {
          setSummary(response.data.data.summary);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error generating summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (summary?.full_summary) {
      navigator.clipboard.writeText(summary.full_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (summary?.full_summary) {
      const blob = new Blob([summary.full_summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${summary.title || 'summary'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span>Auto-Summarizer</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Upload your notes, paste text, or search the web to generate concise bullet-point summaries
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="text" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Text Input</span>
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload PDF</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paste Your Text</CardTitle>
              <CardDescription>
                Enter your study notes, article, or any text you want to summarize
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <div className="relative">
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Machine Learning"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="pr-10"
                  />
                  {title && (
                    <button
                      onClick={() => {
                        setTitle('');
                        setScrapedContent(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Web Scrape Option */}
              {showScrapeOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              Search the web for "{title}"?
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Fetch content from Wikipedia and other sources
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleScrapeContent}
                          disabled={isScraping}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {isScraping ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-1" />
                              Search
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Scraped Content Indicator */}
              {scrapedContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      Content fetched from web ({scrapedContent.length} characters)
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearScrapedContent}>
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="text">Your Text</Label>
                <Textarea
                  id="text"
                  placeholder="Paste your text here... or search the web using the title field above"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-slate-500">
                  {text.length} characters
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Upload your syllabus, notes, or any PDF document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  PDF files up to 10MB
                </p>
                {uploadedFile && (
                  <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                      {uploadedFile.name}
                    </p>
                    {text && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Content extracted successfully
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        <Button
          onClick={handleSummarize}
          disabled={isLoading || !text.trim()}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate Summary
            </>
          )}
        </Button>
      </div>

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>{summary.title}</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">
                      {summary.bullet_points.length} key points
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {summary.compression_ratio}% compression
                    </span>
                  </div>
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.bullet_points.map((point: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {index + 1}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{point}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Summarize;
