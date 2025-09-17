import React, { useState, useMemo } from 'react';
import type { User, ClassData, TeacherAssignment } from '../../types';
import { Plus, UserPlus, Trash2, Edit, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GRADE_LEVELS } from '../../constants';
import type { LocalTeacher } from '../../hooks/useAuth';


interface PrincipalDashboardProps {
    principal: User;
    classes: ClassData[];
    teachers: LocalTeacher[];
    addTeacher: (teacher: Omit<LocalTeacher, 'id' | 'code'>) => LocalTeacher;
    updateTeacher: (teacherId: string, updater: (teacher: LocalTeacher) => LocalTeacher) => void;
    deleteTeacher: (teacherId: string) => void;
}

export default function PrincipalDashboard({ principal, classes, teachers, addTeacher, updateTeacher, deleteTeacher }: PrincipalDashboardProps) {
    const [newTeacherName, setNewTeacherName] = useState('');
    const [editingTeacher, setEditingTeacher] = useState<LocalTeacher | null>(null);
    const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

    const sortedClassesForModal = useMemo(() => {
        return [...classes].sort((a, b) => {
            const stageAIndex = GRADE_LEVELS.indexOf(a.stage);
            const stageBIndex = GRADE_LEVELS.indexOf(b.stage);
    
            if (stageAIndex === -1 && stageBIndex !== -1) return 1;
            if (stageAIndex !== -1 && stageBIndex === -1) return -1;
            
            if (stageAIndex !== stageBIndex) {
                return stageAIndex - stageBIndex;
            }
    
            return a.section.localeCompare(b.section, 'ar-IQ');
        });
    }, [classes]);

    const handleAddTeacher = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeacherName.trim()) return;

        addTeacher({
            name: newTeacherName.trim(),
            role: 'teacher',
            assignments: [],
        });

        setNewTeacherName('');
    };

    const handleEditAssignments = (teacher: LocalTeacher) => {
        setEditingTeacher(teacher);
        setAssignments(teacher.assignments || []);
    };
    
    const handleAssignmentChange = (classId: string, subjectId: string, isChecked: boolean) => {
        setAssignments(prev => {
            if (isChecked) {
                return [...prev, { classId, subjectId }];
            } else {
                return prev.filter(a => !(a.classId === classId && a.subjectId === subjectId));
            }
        });
    };

    const handleSaveAssignments = () => {
        if (!editingTeacher) return;
        
        updateTeacher(editingTeacher.id, user => ({ ...user, assignments }));
        setEditingTeacher(null);
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">إدارة المدرسين</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">إضافة مدرس جديد</h3>
                    <form onSubmit={handleAddTeacher} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-md font-medium text-gray-700 mb-2">اسم المدرس</label>
                            <input
                                type="text"
                                value={newTeacherName}
                                onChange={(e) => setNewTeacherName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                placeholder="الاسم الكامل للمدرس"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700">
                            <UserPlus size={20} />
                            <span>إضافة مدرس</span>
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-700">قائمة المدرسين ({teachers.length})</h3>
                    </div>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-lg text-gray-700">{teacher.name}</p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditAssignments(teacher)} className="p-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"><Edit size={18} /></button>
                                        <button onClick={() => deleteTeacher(teacher.id)} className="p-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition" title="حذف المدرس"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 mt-2">
                                    المواد المسندة: {(teacher.assignments || []).length}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {editingTeacher && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
                        <h3 className="text-xl font-bold mb-4">تعيين المواد لـ: {editingTeacher.name}</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 border rounded-lg">
                            {sortedClassesForModal.map(cls => (
                                <div key={cls.id} className="p-3 bg-gray-50 rounded-md">
                                    <h4 className="font-bold text-lg text-cyan-700">{cls.stage} - {cls.section}</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                        {(cls.subjects || []).map(sub => (
                                            <label key={sub.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded text-cyan-600"
                                                    checked={assignments.some(a => a.classId === cls.id && a.subjectId === sub.id)}
                                                    onChange={(e) => handleAssignmentChange(cls.id, sub.id, e.target.checked)}
                                                />
                                                <span>{sub.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditingTeacher(null)} className="px-4 py-2 bg-gray-300 rounded-md"><X className="inline-block ml-1"/> إلغاء</button>
                            <button onClick={handleSaveAssignments} className="px-4 py-2 bg-green-600 text-white rounded-md"><Save className="inline-block ml-1" /> حفظ التعيينات</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}