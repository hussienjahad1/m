import React, { useState, useEffect, useMemo } from 'react';
// Fix: Import AppNotification type
import type { User, SchoolLevel, AppNotification, ClassData, Student } from '../../types';
import { Plus, UserCog, LogOut, Copy, Check, Edit, Trash2, Save, X, RefreshCw, SendHorizonal, Users, ChevronDown, ChevronUp, Power, PowerOff } from 'lucide-react';
import { SCHOOL_LEVELS } from '../../constants';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../lib/firebase';

interface AdminDashboardProps {
    currentUser: User;
    users: User[];
    addUser: (user: Omit<User, 'id'>) => User;
    updateUser: (userId: string, updater: (user: User) => User) => void;
    deleteUser: (userId: string) => void;
    onLogout: () => void;
}

const generateCode = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export default function AdminDashboard({ currentUser, users, addUser, updateUser, deleteUser, onLogout }: AdminDashboardProps) {
    const [newPrincipalName, setNewPrincipalName] = useState('');
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolLevel, setNewSchoolLevel] = useState<SchoolLevel>('متوسطة');
    const [newStudentCodeLimit, setNewStudentCodeLimit] = useState(100);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // State for editing modal
    const [editingPrincipal, setEditingPrincipal] = useState<User | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedSchoolName, setEditedSchoolName] = useState('');
    const [editedSchoolLevel, setEditedSchoolLevel] = useState<SchoolLevel>('متوسطة');
    const [editedCode, setEditedCode] = useState('');
    const [editedStudentCodeLimit, setEditedStudentCodeLimit] = useState(100);
    const [editedEmail, setEditedEmail] = useState('');

    // State for notifications
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationRecipient, setNotificationRecipient] = useState<'all_principals' | 'all_teachers'>('all_principals');
    const [isSending, setIsSending] = useState(false);
    
    // State for student management
    const [allClasses, setAllClasses] = useState<ClassData[]>([]);
    const [disabledCodes, setDisabledCodes] = useState<Record<string, boolean>>({});
    const [expandedPrincipalId, setExpandedPrincipalId] = useState<string | null>(null);

    const principals = users.filter(u => u.role === 'principal');
    
    useEffect(() => {
        const classesRef = db.ref('classes');
        const codesRef = db.ref('student_access_codes_individual');

        const classesCallback = (snapshot: any) => {
            const data = snapshot.val();
            setAllClasses(data ? Object.values(data) : []);
        };
        const codesCallback = (snapshot: any) => {
            const data = snapshot.val() || {};
            const disabled: Record<string, boolean> = {};
            Object.entries(data).forEach(([code, value]: [string, any]) => {
                if (value.disabled) {
                    disabled[code] = true;
                }
            });
            setDisabledCodes(disabled);
        };

        classesRef.on('value', classesCallback);
        codesRef.on('value', codesCallback);
        return () => {
            classesRef.off('value', classesCallback);
            codesRef.off('value', codesCallback);
        };
    }, []);

    const handleAddPrincipal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPrincipalName.trim() || !newSchoolName.trim()) {
            alert('يرجى إدخال اسم المدير واسم المدرسة.');
            return;
        }

        const newCode = generateCode(8);
        addUser({
            name: newPrincipalName.trim(),
            schoolName: newSchoolName.trim(),
            schoolLevel: newSchoolLevel,
            role: 'principal',
            code: newCode,
// Fix: Add studentCodeLimit to the object passed to addUser, which is now allowed by the updated User type.
            studentCodeLimit: newStudentCodeLimit,
        });

        setNewPrincipalName('');
        setNewSchoolName('');
        setNewSchoolLevel('متوسطة');
        setNewStudentCodeLimit(100);
    };

    const handleOpenEditModal = (principal: User) => {
        setEditingPrincipal(principal);
        setEditedName(principal.name);
        setEditedSchoolName(principal.schoolName || '');
        setEditedSchoolLevel(principal.schoolLevel || 'متوسطة');
        setEditedCode(principal.code);
// Fix: Add studentCodeLimit and email properties to User type to resolve this error.
        setEditedStudentCodeLimit(principal.studentCodeLimit || 100);
        setEditedEmail(principal.email || '');
    };

    const handleSaveEdit = () => {
        if (!editingPrincipal || !editedName.trim() || !editedSchoolName.trim() || !editedCode.trim()) {
            alert('يرجى ملء جميع الحقول بشكل صحيح.');
            return;
        }
        updateUser(editingPrincipal.id, (user) => ({
            ...user,
            name: editedName.trim(),
            schoolName: editedSchoolName.trim(),
            schoolLevel: editedSchoolLevel,
            code: editedCode.trim(),
            studentCodeLimit: editedStudentCodeLimit,
            email: editedEmail.trim(),
        }));
        setEditingPrincipal(null);
    };


    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        });
    };

    const handleSendNotification = (e: React.FormEvent) => {
        e.preventDefault();
        if (!notificationMessage.trim()) {
            alert('يرجى كتابة نص الإشعار.');
            return;
        }
        setIsSending(true);
        const newNotif: AppNotification = {
            id: uuidv4(),
            senderId: currentUser.id,
            senderName: 'المسؤول',
            recipientScope: notificationRecipient,
            message: notificationMessage.trim(),
            timestamp: new Date().toISOString()
        };
        db.ref(`notifications/${newNotif.id}`).set(newNotif).then(() => {
            alert('تم إرسال الإشعار بنجاح!');
            setNotificationMessage('');
            setIsSending(false);
        }).catch((error: any) => {
            alert('فشل إرسال الإشعار. يرجى المحاولة مرة أخرى.');
            console.error(error);
            setIsSending(false);
        });
    };
    
    const handleTogglePrincipalAccess = async (principal: User) => {
// Fix: Add disabled property to User type to resolve this error.
        const isDisabling = !principal.disabled;
        const actionText = isDisabling ? "تعطيل" : "تمكين";
        const confirmationMessage = `هل أنت متأكد من ${actionText} حساب المدير ${principal.name}؟\nسيتم ${actionText} دخول جميع المدرسين والطلاب المرتبطين بهذه المدرسة وتسجيل خروجهم تلقائيًا.`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        const updates: Record<string, any> = {};
        
        // 1. Update principal
        updates[`/users/${principal.id}/disabled`] = isDisabling;

        // 2. Update associated teachers and counselors
// Fix: Add principalId property to User type to resolve this error.
        const associatedStaff = users.filter(u => u.principalId === principal.id);
        associatedStaff.forEach(staff => {
            updates[`/users/${staff.id}/disabled`] = isDisabling;
        });

        // 3. Update associated students by disabling their access codes
        const associatedClasses = allClasses.filter(c => c.principalId === principal.id);
        associatedClasses.forEach(cls => {
            (cls.students || []).forEach(student => {
                if (student.studentAccessCode) {
                    updates[`/student_access_codes_individual/${student.studentAccessCode}/disabled`] = isDisabling;
                }
            });
        });

        try {
            await db.ref().update(updates);
            alert(`تم ${actionText} الحساب بنجاح وجميع الحسابات المرتبطة به.`);
        } catch (error) {
            console.error("Failed to update user statuses:", error);
            alert("حدث خطأ أثناء تحديث حالة الحسابات.");
        }
    };
    
    const handleToggleStudentAccess = (code: string, isDisabled: boolean) => {
        const path = `student_access_codes_individual/${code}/disabled`;
        db.ref(path).set(!isDisabled);
    };

    const handleDeleteStudentAccess = (student: Student & { classId: string }) => {
        if (!student.studentAccessCode) return;
        if (window.confirm(`هل أنت متأكد من حذف صلاحية دخول الطالب ${student.name} بشكل نهائي؟`)) {
            const classData = allClasses.find(c => c.id === student.classId);
            if (!classData) return;
            const studentIndex = (classData.students || []).findIndex(s => s.id === student.id);
            if (studentIndex === -1) return;

            const updates: Record<string, null> = {};
            updates[`/classes/${student.classId}/students/${studentIndex}/studentAccessCode`] = null;
            updates[`/student_access_codes_individual/${student.studentAccessCode}`] = null;
            
            db.ref().update(updates).then(() => {
                alert('تم حذف صلاحية الدخول بنجاح.');
            });
        }
    };

    const studentsWithCodes = useMemo(() => {
        if (!expandedPrincipalId) return [];
        
        const principalClasses = allClasses.filter(c => c.principalId === expandedPrincipalId);
        const studentsList: (Student & { classId: string, className: string })[] = [];
        principalClasses.forEach(c => {
            (c.students || []).forEach(s => {
                if (s.studentAccessCode) {
                    studentsList.push({ ...s, classId: c.id, className: `${c.stage} - ${c.section}` });
                }
            });
        });
        return studentsList;
    }, [allClasses, expandedPrincipalId]);

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-gray-800 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <UserCog size={28} />
                        <h1 className="text-2xl font-bold">لوحة تحكم المسؤول</h1>
                    </div>
                    <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition">
                        <LogOut size={20} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Add Principal Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-lg h-full">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">إضافة مدير مدرسة</h2>
                            <form onSubmit={handleAddPrincipal} className="space-y-4">
                                <fieldset className="border p-4 rounded-lg">
                                    <legend className="px-2 font-semibold text-gray-700">بيانات المدير</legend>
                                    <div>
                                        <label htmlFor="principalName" className="block text-md font-medium text-gray-700 mb-2">اسم المدير</label>
                                        <input
                                            id="principalName"
                                            type="text"
                                            value={newPrincipalName}
                                            onChange={(e) => setNewPrincipalName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                                            placeholder="الاسم الكامل للمدير"
                                            required
                                        />
                                    </div>
                                </fieldset>

                                <fieldset className="border p-4 rounded-lg">
                                    <legend className="px-2 font-semibold text-gray-700">بيانات المدرسة</legend>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="schoolName" className="block text-md font-medium text-gray-700 mb-2">اسم المدرسة</label>
                                            <input
                                                id="schoolName"
                                                type="text"
                                                value={newSchoolName}
                                                onChange={(e) => setNewSchoolName(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                                                placeholder="اسم المدرسة الرسمي"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="schoolLevel" className="block text-md font-medium text-gray-700 mb-2">درجة المدرسة</label>
                                            <select
                                                id="schoolLevel"
                                                value={newSchoolLevel}
                                                onChange={(e) => setNewSchoolLevel(e.target.value as SchoolLevel)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                                                required
                                            >
                                                {SCHOOL_LEVELS.map(level => (
                                                    <option key={level} value={level}>{level}</option>
                                                ))}
                                            </select>
                                        </div>
                                         <div>
                                            <label htmlFor="studentCodeLimit" className="block text-md font-medium text-gray-700 mb-2">حد أكواد الطلاب</label>
                                            <input
                                                id="studentCodeLimit"
                                                type="number"
                                                value={newStudentCodeLimit}
                                                onChange={(e) => setNewStudentCodeLimit(parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </fieldset>

                                <button type="submit" className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition">
                                    <Plus size={20} />
                                    <span>إضافة</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Principals List & Notification Sender */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">إرسال إشعار</h2>
                            <form onSubmit={handleSendNotification} className="space-y-4">
                                <div>
                                    <label htmlFor="notificationMessage" className="block text-md font-medium text-gray-700 mb-2">نص الرسالة</label>
                                    <textarea
                                        id="notificationMessage"
                                        value={notificationMessage}
                                        onChange={e => setNotificationMessage(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="اكتب رسالتك هنا..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="notificationRecipient" className="block text-md font-medium text-gray-700 mb-2">إرسال إلى</label>
                                    <select
                                        id="notificationRecipient"
                                        value={notificationRecipient}
                                        onChange={e => setNotificationRecipient(e.target.value as any)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                                    >
                                        <option value="all_principals">جميع المدراء</option>
                                        <option value="all_teachers">جميع المدرسين</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={isSending} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400">
                                    <SendHorizonal size={20} />
                                    <span>{isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}</span>
                                </button>
                            </form>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">قائمة مدراء المدارس ({principals.length})</h2>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {principals.length > 0 ? (
                                    principals.map(p => (
                                        <div key={p.id} className="bg-gray-50 p-4 rounded-lg border">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <p className="font-semibold text-lg text-gray-700">{p.name}</p>
                                                    <p className="text-sm text-gray-500">{p.schoolName} <span className="font-semibold">({p.schoolLevel || 'غير محدد'})</span></p>
                                                    <div className="mt-2 text-sm bg-gray-100 p-2 rounded-md border">
                                                        <p><strong>البريد الإلكتروني:</strong> {p.email || 'لم يضف بعد'}</p>
                                                        <div className="flex items-center gap-2">
                                                            <strong>رمز الدخول:</strong>
                                                            <code className="bg-gray-200 text-gray-800 font-mono font-bold px-2 py-0.5 rounded-md text-md">{p.code}</code>
                                                            <button onClick={() => copyToClipboard(p.code)} className="p-1 text-gray-500 hover:text-cyan-600 hover:bg-cyan-100 rounded-full transition">
                                                                {copiedCode === p.code ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button 
                                                        onClick={() => handleTogglePrincipalAccess(p)}
// Fix: Add disabled property to User type to resolve this error.
                                                        className={`p-2 text-white rounded-md transition ${p.disabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`} 
                                                        title={p.disabled ? 'تمكين الدخول' : 'تعطيل الدخول'}
                                                    >
                                                        {p.disabled ? <Power size={18}/> : <PowerOff size={18}/>}
                                                    </button>
                                                    <button onClick={() => handleOpenEditModal(p)} className="p-2 text-white bg-yellow-500 rounded-md hover:bg-yellow-600 transition" title="تعديل"><Edit size={18}/></button>
                                                    <button onClick={() => deleteUser(p.id)} className="p-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition" title="حذف"><Trash2 size={18}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">لم يتم إضافة أي مدير بعد.</p>
                                )}
                            </div>
                        </div>
                    </div>
                     {/* Student Access Management */}
                    <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">إدارة دخول الطلاب</h2>
                        <div className="space-y-2">
                            {principals.map(p => (
                                <div key={p.id} className="border rounded-lg">
                                    <button onClick={() => setExpandedPrincipalId(prev => prev === p.id ? null : p.id)} className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200">
                                        <span className="font-bold">{p.name} - {p.schoolName}</span>
                                        {expandedPrincipalId === p.id ? <ChevronUp /> : <ChevronDown />}
                                    </button>
                                    {expandedPrincipalId === p.id && (
                                        <div className="p-4 overflow-x-auto">
                                            {studentsWithCodes.length > 0 ? (
                                                <table className="min-w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="p-2 text-right">اسم الطالب</th>
                                                            <th className="p-2 text-right">الصف</th>
                                                            <th className="p-2 text-center">الرمز</th>
                                                            <th className="p-2 text-center">الحالة</th>
                                                            <th className="p-2 text-center">الإجراءات</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {studentsWithCodes.map(student => {
                                                            const isDisabled = !!(student.studentAccessCode && disabledCodes[student.studentAccessCode]);
                                                            return (
                                                                <tr key={student.id} className="border-t">
                                                                    <td className="p-2 font-semibold">{student.name}</td>
                                                                    <td className="p-2">{student.className}</td>
                                                                    <td className="p-2 text-center font-mono">{student.studentAccessCode}</td>
                                                                    <td className={`p-2 text-center font-bold ${isDisabled ? 'text-red-500' : 'text-green-500'}`}>{isDisabled ? 'معطل' : 'مفعل'}</td>
                                                                    <td className="p-2">
                                                                        <div className="flex justify-center items-center gap-2">
                                                                            <button onClick={() => handleToggleStudentAccess(student.studentAccessCode!, isDisabled)} className={`p-2 rounded-full ${isDisabled ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`} title={isDisabled ? 'تمكين الدخول' : 'تعطيل الدخول'}>
                                                                                {isDisabled ? <Power size={18}/> : <PowerOff size={18}/>}
                                                                            </button>
                                                                            <button onClick={() => handleDeleteStudentAccess(student)} className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full" title="حذف صلاحية الدخول نهائياً">
                                                                                <Trash2 size={18} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            ) : <p className="text-center text-gray-500 p-4">لا يوجد طلاب لديهم رموز دخول لهذه المدرسة.</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {editingPrincipal && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">تعديل بيانات المدير</h3>
                        <div className="space-y-4">
                            <fieldset className="border p-4 rounded-lg">
                                <legend className="px-2 font-semibold text-gray-700">بيانات المدير</legend>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium">اسم المدير</label>
                                        <input value={editedName} onChange={e => setEditedName(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium">البريد الإلكتروني</label>
                                        <input type="email" value={editedEmail} onChange={e => setEditedEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">رمز الدخول</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input value={editedCode} onChange={e => setEditedCode(e.target.value)} className="w-full px-3 py-2 border rounded-md font-mono" />
                                            <button 
                                                onClick={() => setEditedCode(generateCode(8))} 
                                                className="p-2 text-white bg-cyan-500 rounded-md hover:bg-cyan-600 transition" 
                                                title="إعادة توليد رمز جديد"
                                            >
                                                <RefreshCw size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                             <fieldset className="border p-4 rounded-lg">
                                <legend className="px-2 font-semibold text-gray-700">بيانات المدرسة والصلاحيات</legend>
                                <div className="space-y-4">
                                     <div>
                                        <label className="block text-sm font-medium">اسم المدرسة</label>
                                        <input value={editedSchoolName} onChange={e => setEditedSchoolName(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">درجة المدرسة</label>
                                        <select
                                            value={editedSchoolLevel}
                                            onChange={(e) => setEditedSchoolLevel(e.target.value as SchoolLevel)}
                                            className="w-full mt-1 px-3 py-2 border rounded-md bg-white"
                                        >
                                            {SCHOOL_LEVELS.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium">حد أكواد الطلاب</label>
                                        <input type="number" value={editedStudentCodeLimit} onChange={e => setEditedStudentCodeLimit(parseInt(e.target.value) || 0)} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditingPrincipal(null)} className="px-4 py-2 bg-gray-200 rounded-md flex items-center gap-2"><X size={18} /> إلغاء</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"><Save size={18} /> حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}