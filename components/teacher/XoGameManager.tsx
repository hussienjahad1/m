import React, { useState, useMemo, useEffect, useRef } from 'react';
// Fix: Import missing types
import type { Teacher, ClassData, Subject, XOQuestion, XOGameSettings, XOGameScore, User } from '../../types';
import { db } from '../../lib/firebase';
import { extractTextFromURL, generateXOQuestionsFromText } from '../../lib/gemini';
import { v4 as uuidv4 } from 'uuid';
import { BrainCircuit, Loader2, Plus, Save, Trash2, BookOpen, Gamepad2, Check, Settings, BarChart2, PlayCircle, X } from 'lucide-react';
import XoGame from '../student/XoGame';
import { normalizePathSegment } from '../../lib/utils';


interface XoGameManagerProps {
    teacher: Teacher;
    classes: ClassData[];
    users: User[];
}

const CHAPTERS = Array.from({ length: 14 }, (_, i) => `الفصل ${i + 1}`);
const DEFAULT_GAME_SETTINGS: XOGameSettings = {
    pointsPolicy: 'winner_takes_all',
    startTime: '',
    endTime: '',
    questionTimeLimit: 60,
    allowSinglePlayer: true,
};

export default function XoGameManager({ teacher, classes, users }: XoGameManagerProps) {
    const [selectedAssignment, setSelectedAssignment] = useState<string>(''); // classId|subjectId
    const [questions, setQuestions] = useState<XOQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'manager' | 'test_game'>('manager');
    const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'scores'>('questions');

    // State for manual question entry
    const [newQuestion, setNewQuestion] = useState<Partial<XOQuestion>>({
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
    });
    const [manualChapter, setManualChapter] = useState<string>('الفصل 1');
    
    // State for AI generation
    const [aiParams, setAiParams] = useState({
      startPage: 1, endPage: 10, questionCount: 30,
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState('');
    const [sourceMode, setSourceMode] = useState<'url' | 'text'>('url');
    const [pastedText, setPastedText] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [reviewQuestions, setReviewQuestions] = useState<XOQuestion[]>([]);
    const [aiChapter, setAiChapter] = useState<string>('الفصل 1');
    const [generationAttempts, setGenerationAttempts] = useState<Record<string, number>>({}); // Key: normalized chapter, Value: count


    // State for filtering and selecting active questions
    const [questionFilter, setQuestionFilter] = useState<'all' | 'ai' | 'teachers'>('all');
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [chapterFilters, setChapterFilters] = useState<string[]>([]);
    
    // State for Game Settings
    const [gameSettings, setGameSettings] = useState<XOGameSettings>(DEFAULT_GAME_SETTINGS);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // State for Student Scores
    const [subjectScores, setSubjectScores] = useState<XOGameScore[]>([]);
    const [isLoadingScores, setIsLoadingScores] = useState(false);
    const [isTutorialVisible, setIsTutorialVisible] = useState(false);


    const teacherAssignments = useMemo(() => {
        return (teacher.assignments || []).map(a => {
            const classInfo = classes.find(c => c.id === a.classId);
            const subjectInfo = classInfo?.subjects.find(s => s.id === a.subjectId);
            if (!classInfo || !subjectInfo) return null;
            return {
                value: `${a.classId}|${a.subjectId}`,
                label: `${classInfo.stage} - ${classInfo.section} / ${subjectInfo.name}`,
                classInfo,
                subjectInfo
            };
        }).filter((a): a is NonNullable<typeof a> => !!a);
    }, [teacher.assignments, classes]);
    
    const { selectedClass, selectedSubject } = useMemo(() => {
        if (!selectedAssignment) return { selectedClass: null, selectedSubject: null };
        const assignment = teacherAssignments.find(a => a.value === selectedAssignment);
        return { selectedClass: assignment?.classInfo || null, selectedSubject: assignment?.subjectInfo || null };
    }, [selectedAssignment, teacherAssignments]);

    const schoolIdentifier = useMemo(() => {
        const principal = users.find(u => u.id === teacher.principalId);
        if (principal?.schoolName) {
            return normalizePathSegment(principal.schoolName);
        }
        return teacher.principalId; // Fallback
    }, [users, teacher.principalId]);
    
    const normalizedStageName = useMemo(() => normalizePathSegment(selectedClass?.stage || ''), [selectedClass]);
    const normalizedSubjectName = useMemo(() => normalizePathSegment(selectedSubject?.name || ''), [selectedSubject]);

    // Effect for fetching all data when subject changes
    useEffect(() => {
        if (selectedClass && selectedSubject && schoolIdentifier && normalizedStageName && normalizedSubjectName) {
            setIsLoading(true);
            setSelectedQuestionIds({});
            setChapterFilters([]);

            // Paths
            const questionsRef = db.ref(`xo_questions/${schoolIdentifier}/${normalizedStageName}/${normalizedSubjectName}`);
            const activeQuestionsRef = db.ref(`active_xo_questions/${schoolIdentifier}/${normalizedStageName}/${normalizedSubjectName}`);
            const settingsRef = db.ref(`xo_game_settings/${schoolIdentifier}/${normalizedStageName}/${normalizedSubjectName}`);
            const scoresRef = db.ref(`xo_leaderboards/${schoolIdentifier}/subjects/${normalizedStageName}/${normalizedSubjectName}/scores`);
            const attemptsRef = db.ref(`xo_generation_attempts/${schoolIdentifier}/${normalizedStageName}/${normalizedSubjectName}`);


            // Callbacks
            const questionsCallback = (s: any) => setQuestions(s.val() ? Object.values(s.val()) : []);
            const activeQuestionsCallback = (s: any) => setSelectedQuestionIds(s.val() || {});
            const settingsCallback = (s: any) => setGameSettings(s.val() || DEFAULT_GAME_SETTINGS);
            const scoresCallback = (s: any) => {
                const scoresData: XOGameScore[] = s.val() ? Object.values(s.val()) : [];
                setSubjectScores(scoresData.sort((a,b) => b.points - a.points));
            };
            const attemptsCallback = (s: any) => setGenerationAttempts(s.val() || {});


            // Attach listeners
            questionsRef.on('value', questionsCallback);
            activeQuestionsRef.on('value', activeQuestionsCallback);
            settingsRef.on('value', settingsCallback);
            scoresRef.on('value', scoresCallback);
            attemptsRef.on('value', attemptsCallback);
            
            Promise.all([questionsRef.get(), activeQuestionsRef.get(), settingsRef.get(), scoresRef.get(), attemptsRef.get()])
                .finally(() => setIsLoading(false));

            return () => {
                questionsRef.off('value', questionsCallback);
                activeQuestionsRef.off('value', activeQuestionsCallback);
                settingsRef.off('value', settingsCallback);
                scoresRef.off('value', scoresCallback);
                attemptsRef.off('value', attemptsCallback);
            };
        } else {
            setQuestions([]);
            setSelectedQuestionIds({});
            setGameSettings(DEFAULT_GAME_SETTINGS);
            setSubjectScores([]);
        }
    }, [selectedClass, selectedSubject, schoolIdentifier, normalizedStageName, normalizedSubjectName]);
    
    const filteredQuestions = useMemo(() => {
        let tempQuestions = questions;
        
        switch(questionFilter) {
            case 'ai': tempQuestions = tempQuestions.filter(q => q.createdBy === 'ai'); break;
            case 'teachers': tempQuestions = tempQuestions.filter(q => q.createdBy !== 'ai'); break;
        }
        
        if (chapterFilters.length > 0) {
            tempQuestions = tempQuestions.filter(q => q.chapter && chapterFilters.includes(q.chapter));
        }

        return tempQuestions;
    }, [questions, questionFilter, chapterFilters]);
    
    const aiQuestionsInCurrentChapter = useMemo(() => {
        if (!aiChapter) return 0;
        return questions.filter(q => q.createdBy === 'ai' && q.chapter === aiChapter).length;
    }, [questions, aiChapter]);
    
    const normalizedAiChapter = useMemo(() => normalizePathSegment(aiChapter), [aiChapter]);
    const currentChapterAttempts = useMemo(() => generationAttempts[normalizedAiChapter] || 0, [generationAttempts, normalizedAiChapter]);
    const isGenerationLockedForChapter = currentChapterAttempts >= 3 || aiQuestionsInCurrentChapter >= 250;
    
    
    const handleAddManualQuestion = () => {
        if (!selectedClass || !selectedSubject || !newQuestion.questionText?.trim() || newQuestion.options?.some(o => !o.trim())) {
            alert('يرجى ملء جميع حقول السؤال والخيارات.');
            return;
        }

        const principal = users.find(u => u.id === teacher.principalId);

        const questionToAdd: XOQuestion = {
            id: uuidv4(),
            principalId: teacher.principalId,
            grade: selectedClass.stage,
            subject: selectedSubject.name,
            questionText: newQuestion.questionText.trim(),
            options: newQuestion.options as [string, string, string, string],
            correctOptionIndex: newQuestion.correctOptionIndex || 0,
            createdBy: teacher.id,
            creatorName: teacher.name,
            creatorSchool: principal?.schoolName || '',
            chapter: manualChapter,
        };

        db.ref(`xo_questions/${schoolIdentifier}/${normalizedStageName}/${normalizedSubjectName}/${questionToAdd.id}`).set(questionToAdd);
        setNewQuestion({ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 });
    };
    
    const handleExtractTextFromUrl = async () => {
        if (!sourceUrl) { alert('يرجى لصق الرابط أولاً.'); return; }
        setIsExtracting(true);
        try {
            const extractedText = await extractTextFromURL(sourceUrl, aiParams.startPage, aiParams.endPage, aiChapter);
            setPastedText(extractedText);
            alert('تم استخلاص النص بنجاح.');
            setSourceMode('text');
        } catch (error: any) {
            alert(`فشل استخلاص النص: ${error.message}`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGenerateAIQuestions = async () => {
        if (!selectedClass || !selectedSubject || !pastedText.trim()) { alert('يرجى توفير النص أولاً.'); return; }
        setIsGenerating(true); setReviewQuestions([]); setGenerationProgress('البدء في توليد الأسئلة...');
        try {
            setGenerationProgress('جاري تحليل النص وتوليد الأسئلة...');
            const generated = await generateXOQuestionsFromText(pastedText, aiParams.questionCount, selectedClass.stage, selectedSubject.name, teacher.principalId, aiChapter);
            if (generated?.length) {
                setReviewQuestions(generated); setGenerationProgress(`تم توليد ${generated.length} سؤال. يرجى المراجعة والحفظ.`);
            } else { throw new Error("AI returned no questions."); }
        } catch (error: any) {
            console.error(error); setGenerationProgress('حدث خطأ أثناء التوليد.'); alert(`فشل توليد الأسئلة: ${error.message}`);
        } finally { setIsGenerating(false); }
    };
    
    const handleSaveReviewedQuestions = async () => {
        if (!selectedClass || !selectedSubject || !reviewQuestions.length) return;
        setIsGenerating(true); setGenerationProgress('جاري حفظ الأسئلة...');
        try {
            const updates: Record<string, XOQuestion> = {};
            reviewQuestions.forEach(q => { 
                updates[q.id] = q;
            });
            await db.ref(`xo_questions/${schoolIdentifier}/${normalizedStageName}/${normalizedSubjectName}`).update(updates);
            
            // Increment attempt count
            const newAttemptCount = (generationAttempts[normalizedAiChapter] || 0) + 1;
            await db.ref(`xo_generation_attempts/${schoolIdentifier}/${normalizedStageName}/${normalizedSubjectName}/${normalizedAiChapter}`).set(newAttemptCount);
            
            setGenerationProgress('تم الحفظ بنجاح!'); alert(`تم حفظ ${reviewQuestions.length} سؤال جديد.`); setReviewQuestions([]);
        } catch (error: any) {
            console.error(error); setGenerationProgress('فشل الحفظ.'); alert(`فشل حفظ الأسئلة: ${error.