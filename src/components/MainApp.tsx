import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SettingsIcon, Home, Printer, BarChart, ClipboardList, Archive, User, Eye, ChevronsRight, ChevronsLeft, BookCopy, LayoutGrid, ClipboardCheck, Info, Presentation, Brush, Mail, BookMarked, BookText, FileText, UserPlus, PlayCircle, X, Users, CalendarClock } from 'lucide-react';
import type { SchoolSettings, ClassData, User as CurrentUser } from '../types';
import type { LocalTeacher } from '../hooks/useAuth';

import Settings from './Settings';
import ClassManager from './ClassManager';
import GradeSheet from './GradeSheet';
import ExportManager from './ExportManager';
import StatisticsManager from './StatisticsManager';
import TeacherLogExporter from './TeacherLogExporter';
import AdminLogExporter from './AdminLogExporter';
import PrincipalDashboard from './principal/PrincipalDashboard';
import ElectronicLogbookGenerator from './principal/ElectronicLogbookGenerator';
import GradeBoardExporter from './principal/GradeBoardExporter';
import OralExamListsExporter from './principal/OralExamListsExporter';
import PromotionLog from './principal/PromotionLog';
import AboutModal from './AboutModal';
import ExamHallsManager from './principal/ExamHallsManager';
import CoverEditor from './principal/CoverEditor';
import ParentInvitationExporter from './principal/ParentInvitationExporter';
import ExamCardsExporter from './principal/ExamCardsExporter';
import ExamControlLog from './principal/ExamControlLog';
import AdministrativeCorrespondence from './principal/AdministrativeCorrespondence';
import PrimaryLogExporter from './principal/PrimaryLogExporter';
import StudentRegistrationFormManager from './principal/StudentRegistrationFormManager';
import SchoolArchive from './principal/SchoolArchive';

type View = 'home' | 'settings' | 'class_manager' | 'grade_sheet' | 'export_results' | 'statistics' | 'teacher_log_exporter' | 'admin_log_exporter' | 'principal_dashboard' | 'electronic_logbook' | 'grade_board' | 'oral_exam_lists' | 'promotion_log' | 'exam_halls' | 'cover_editor' | 'parent_invitations' | 'exam_cards' | 'exam_control_log' | 'administrative_correspondence' | 'primary_school_log' | 'student_registration_form' | 'school_archive';

interface NavItem {
    view: View;
    icon: React.ElementType;
    label: string;
    classId?: string;
}

interface NavButtonProps {
    item: NavItem;
    isCollapsed: boolean;
    onClick: () => void;
    isActive: boolean;
    disabled?: boolean;
}

interface MainAppProps {
    currentUser: CurrentUser;
    settings: SchoolSettings;
    onSaveSettings: (settings: SchoolSettings) => void;
    classes: ClassData[];
    onUpdateClasses: (classes: ClassData[]) => void;
    teachers: LocalTeacher[];
    addTeacher: (teacher: Omit<LocalTeacher, 'id' | 'code'>) => LocalTeacher;
    updateTeacher: (teacherId: string, updater: (teacher: LocalTeacher) => LocalTeacher) => void;
    deleteTeacher: (teacherId: string) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isCollapsed, onClick, isActive, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center w-full gap-3 px-4 py-2 rounded-lg transition-colors relative ${isActive ? 'bg-cyan-600 text-white shadow-inner' : 'hover:bg-gray-700'} ${isCollapsed ? 'justify-center' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isCollapsed ? item.label : ''}
    >
        <item.icon size={20} />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
    </button>
);


export default function MainApp({ currentUser, settings, onSaveSettings, classes, onUpdateClasses, teachers, addTeacher, updateTeacher, deleteTeacher }: MainAppProps): React.ReactNode {
    const [activeView, setActiveView] = useState<View>('home');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    
    const handleSelectClass = (classId: string) => {
        setSelectedClassId(classId);
        setActiveView('grade_sheet');
    };

    const handleSaveSettings = (newSettings: SchoolSettings) => {
        onSaveSettings(newSettings);
        alert('تم حفظ الإعدادات بنجاح!');
        setActiveView('home');
    };

    const selectedClass = useMemo(() => {
        if (!selectedClassId) return null;
        return classes.find(c => c.id === selectedClassId) || null;
    }, [classes, selectedClassId]);

    const correspondenceNavItems: NavItem[] = [
        { view: 'parent_invitations', icon: Mail, label: 'دعوات أولياء الأمور' },
        { view: 'administrative_correspondence', icon: FileText, label: 'مخاطبات ادارية' },
    ];

    const reportNavItems: NavItem[] = [
        { view: 'export_results', icon: Printer, label: 'النتائج الامتحانية' },
        { view: 'statistics', icon: BarChart, label: 'التقارير والإحصاءات' },
        { view: 'teacher_log_exporter', icon: ClipboardList, label: 'سجل المدرس' },
        { view: 'admin_log_exporter', icon: Archive, label: 'السجل العام' },
        { view: 'primary_school_log', icon: BookText, label: 'درجات الابتدائية' },
    ];
    
    const examRecordsNavItems: NavItem[] = [
        { view: 'grade_board', icon: LayoutGrid, label: 'بورد الدرجات' },
        { view: 'oral_exam_lists', icon: ClipboardCheck, label: 'قوائم الشفوي' },
        { view: 'exam_cards', icon: BookMarked, label: 'بطاقات امتحانية' },
        { view: 'exam_halls', icon: Presentation, label: 'قاعات امتحانية' },
        { view: 'cover_editor', icon: Brush, label: 'محرر الأغلفة' },
    ];

    const studentAffairsNavItems: NavItem[] = [
        { view: 'student_registration_form', icon: UserPlus, label: 'استمارة تسجيل طالب' },
    ];

    const renderView = () => {
        switch (activeView) {
            case 'home':
            case 'class_manager':
                return <ClassManager classes={classes} onUpdateClasses={onUpdateClasses} onSelectClass={handleSelectClass} currentUser={currentUser} />;
            case 'settings':
                return <Settings currentSettings={settings} onSave={handleSaveSettings} currentUser={currentUser} updateUser={() => {}} />;
            case 'grade_sheet':
                if (selectedClass) {
                    return <GradeSheet classData={selectedClass} settings={settings} onUpdateClasses={onUpdateClasses} />;
                }
                return (
                    <div className="text-center p-8 bg-white rounded-lg shadow">
                        <h2 className="text-2xl font-bold">عرض سجل الدرجات</h2>
                        <p className="mt-2 text-gray-600">من فضلك، اختر شعبة من قائمة <span className="font-bold text-cyan-600">"إدارة الشعب"</span> لعرض أو تعديل سجل الدرجات الخاص بها.</p>
                    </div>
                );
            case 'parent_invitations':
                return <ParentInvitationExporter classes={classes} settings={settings} />;
            case 'administrative_correspondence':
                return <AdministrativeCorrespondence />;
            case 'export_results':
                return <ExportManager classes={classes} settings={settings} />;
            case 'statistics':
                return <StatisticsManager classes={classes} settings={settings} />;
            case 'teacher_log_exporter':
                return <TeacherLogExporter classes={classes} settings={settings} />;
            case 'admin_log_exporter':
                return <AdminLogExporter classes={classes} settings={settings} />;
            case 'primary_school_log':
                return <PrimaryLogExporter classes={classes} settings={settings} />;
            case 'principal_dashboard':
                return <PrincipalDashboard principal={currentUser} classes={classes} teachers={teachers} addTeacher={addTeacher} updateTeacher={updateTeacher} deleteTeacher={deleteTeacher} />;
            case 'electronic_logbook':
                return <ElectronicLogbookGenerator classes={classes} settings={settings} />;
            case 'promotion_log':
                return <PromotionLog classes={classes} settings={settings} />;
            case 'grade_board':
                return <GradeBoardExporter classes={classes} settings={settings} />;
            case 'oral_exam_lists':
                return <OralExamListsExporter classes={classes} settings={settings} />;
            case 'exam_cards':
                return <ExamCardsExporter settings={settings} />;
            case 'exam_halls':
                return <ExamHallsManager />;
            case 'cover_editor':
                return <CoverEditor />;
            case 'exam_control_log':
                return <ExamControlLog principal={currentUser} users={teachers} classes={classes} settings={settings} />;
            case 'student_registration_form':
                return <StudentRegistrationFormManager />;
            case 'school_archive':
                return <SchoolArchive />;
            default:
                return <ClassManager classes={classes} onUpdateClasses={onUpdateClasses} onSelectClass={handleSelectClass} currentUser={currentUser} />;
        }
    };

    const navForPrincipal: NavItem[] = [
        { view: 'home', icon: Home, label: 'الرئيسية / الشعب' },
        { view: 'principal_dashboard', icon: User, label: 'إدارة المدرسين' },
        { view: 'electronic_logbook', icon: BookCopy, label: 'الدفتر الالكتروني' },
        { view: 'school_archive', icon: Archive, label: 'ارشيف المدرسة' },
        { view: 'exam_control_log', icon: BookText, label: 'سجل السيطرة الامتحانية' },
        { view: 'promotion_log', icon: ClipboardList, label: 'سجل الترحيل' },
    ];
    
    const showAboutButton = activeView === 'home' || activeView === 'class_manager';

    const handleNavClick = (view: View, classId?: string) => {
        setActiveView(view);
        if (classId) {
            handleSelectClass(classId);
        } else {
             setSelectedClassId(null);
        }
    };

    return (
        <div className="flex h-screen bg-gray-200" dir="rtl">
            <div className={`bg-gray-800 text-white flex flex-col transition-all duration-300 relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="flex items-center justify-center p-4 border-b border-gray-700 h-16 flex-shrink-0">
                    {!isSidebarCollapsed && <span className="font-bold text-xl whitespace-nowrap">لوحة التحكم</span>}
                </div>

                <div className="flex-1 flex flex-col overflow-y-auto">
                    <nav className="px-2 py-4 space-y-1">
                        {navForPrincipal.map(item => <NavButton key={item.view} item={item} isCollapsed={isSidebarCollapsed} onClick={() => handleNavClick(item.view)} isActive={activeView === item.view}/>)}
                        
                        <div className="pt-2 mt-2 border-t border-gray-700 space-y-1">
                            <h3 className={`px-4 text-xs font-semibold uppercase text-gray-400 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>شؤون الطلاب</h3>
                            {studentAffairsNavItems.map(item => <NavButton key={item.view} item={item} isCollapsed={isSidebarCollapsed} onClick={() => handleNavClick(item.view)} isActive={activeView === item.view}/>)}
                        </div>

                         <div className="pt-2 mt-2 border-t border-gray-700 space-y-1">
                            <h3 className={`px-4 text-xs font-semibold uppercase text-gray-400 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>دعوات ومراسلات</h3>
                            {correspondenceNavItems.map(item => <NavButton key={item.view} item={item} isCollapsed={isSidebarCollapsed} onClick={() => handleNavClick(item.view)} isActive={activeView === item.view}/>)}
                        </div>

                        <div className="pt-2 mt-2 border-t border-gray-700 space-y-1">
                            <h3 className={`px-4 text-xs font-semibold uppercase text-gray-400 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>سجلات امتحانية</h3>
                            {examRecordsNavItems.map(item => <NavButton key={item.view} item={item} isCollapsed={isSidebarCollapsed} onClick={() => handleNavClick(item.view)} isActive={activeView === item.view}/>)}
                        </div>

                        <div className="pt-2 mt-2 border-t border-gray-700 space-y-1">
                            <h3 className={`px-4 text-xs font-semibold uppercase text-gray-400 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>التقارير</h3>
                            {reportNavItems.map(item => {
                                let isDisabled = false;
                                if (item.view === 'admin_log_exporter') {
                                    isDisabled = settings.schoolLevel === 'ابتدائية';
                                }
                                if (item.view === 'primary_school_log') {
                                    isDisabled = settings.schoolLevel !== 'ابتدائية';
                                }
                                return <NavButton key={item.view} item={item} isCollapsed={isSidebarCollapsed} onClick={() => handleNavClick(item.view)} isActive={activeView === item.view} disabled={isDisabled} />
                            })}
                        </div>
                        
                        <div className="pt-2 mt-2 border-t border-gray-700 space-y-1">
{/* Fix: 'item' is not defined in this scope. Changed to check against 'settings' view directly. */}
                             <NavButton item={{view: 'settings', icon: SettingsIcon, label: 'الإعدادات'}} isCollapsed={isSidebarCollapsed} onClick={() => handleNavClick('settings')} isActive={activeView === 'settings'}/>
                        </div>

                    </nav>
                </div>

                 <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute top-16 -left-5 transform bg-green-600 text-white p-2 rounded-full z-10 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white shadow-lg">
                    {isSidebarCollapsed ? <ChevronsLeft size={24} /> : <ChevronsRight size={24} />}
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">{settings.principalName || 'مدير المدرسة'} (مدير)</h1>
                            <p className="text-sm text-gray-500">{settings.schoolName || 'اسم المدرسة'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href="https://www.instagram.com/trbawetk/?utm_source=qr&igsh=MXNoNTNmdDRncnNjag%3D%3D#" target="_blank" rel="noopener noreferrer" title="تابعنا على انستغرام" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <img src="https://i.imgur.com/J6SeeNQ.png" alt="Instagram logo" className="w-8 h-8" />
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61578356680977" target="_blank" rel="noopener noreferrer" title="تابعنا على فيسبوك" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <img src="https://i.imgur.com/zC26Bw6.png" alt="Facebook logo" className="w-8 h-8" />
                        </a>
                        <a href="https://t.me/trbwetk" target="_blank" rel="noopener noreferrer" title="انضم الى كروب المناقشات" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <img src="https://i.imgur.com/YsOAIfV.png" alt="Telegram logo" className="w-8 h-8" />
                        </a>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4 sm:p-6 lg:p-8">
                    {showAboutButton && (
                         <div className="mb-6 space-y-4">
                             <button 
                                onClick={() => setIsVideoModalOpen(true)}
                                className="w-full flex items-center gap-4 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-300 hover:shadow-md text-red-700"
                            >
                                <PlayCircle className="w-12 h-12" />
                                <div>
                                    <h4 className="font-bold text-red-800">شاهد العرض التوضيحي</h4>
                                    <p className="text-sm text-red-600">تعرف على إمكانيات الحقيبة الرقمية في دقيقتين.</p>
                                </div>
                            </button>
                            <button 
                                onClick={() => setIsAboutModalOpen(true)}
                                className="w-full text-center p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xl rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                <Info size={28} />
                                <span>تعرف من نحن</span>
                            </button>
                        </div>
                    )}
                    {renderView()}
                </main>
            </div>
             {isVideoModalOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] p-4"
                    onClick={() => setIsVideoModalOpen(false)}
                >
                    <div 
                        className="bg-black p-2 rounded-lg shadow-xl w-full max-w-4xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setIsVideoModalOpen(false)}
                            className="absolute -top-3 -right-3 bg-white text-black rounded-full p-2 z-10 shadow-lg hover:scale-110 transition-transform"
                            aria-label="Close video"
                        >
                            <X size={24} />
                        </button>
                        <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 16:9 Aspect Ratio */}
                            <iframe 
                                className="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube.com/embed/Pi35fNJIx08?autoplay=1"
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
        </div>
    );
}