import React from 'react';
import useLocalData from './hooks/useAuth';
import MainApp from './MainApp';
import { Loader2 } from 'lucide-react';
import type { User } from './types';

export default function App(): React.ReactNode {
    const { settings, setSettings, classes, updateClasses, teachers, addTeacher, updateTeacher, deleteTeacher, isDataReady } = useLocalData();

    if (!isDataReady) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-700">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-lg font-semibold">جاري تحميل البيانات المحلية...</p>
            </div>
        );
    }
    
    const principalUser: User = {
        id: 'local_principal',
        role: 'principal',
        name: settings.principalName || 'مدير المدرسة',
        schoolName: settings.schoolName || 'اسم المدرسة',
        code: 'local',
        schoolLevel: settings.schoolLevel
    };

    return <MainApp 
                currentUser={principalUser} 
                settings={settings}
                onSaveSettings={setSettings}
                classes={classes}
                onUpdateClasses={updateClasses}
                teachers={teachers} 
                addTeacher={addTeacher} 
                updateTeacher={updateTeacher} 
                deleteTeacher={deleteTeacher} 
            />;
}