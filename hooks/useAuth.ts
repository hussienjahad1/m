import { useState, useEffect } from 'react';
import type { SchoolSettings, ClassData, User } from '../types';
import { DEFAULT_SCHOOL_SETTINGS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export type LocalTeacher = User & { role: 'teacher' };

const useLocalData = () => {
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<LocalTeacher[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('school_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedClasses = localStorage.getItem('school_classes');
      if (savedClasses) setClasses(JSON.parse(savedClasses));

      const savedTeachers = localStorage.getItem('school_teachers');
      if (savedTeachers) setTeachers(JSON.parse(savedTeachers));
    } catch (error) {
        console.error("Failed to load data from local storage", error);
    } finally {
        setIsDataReady(true);
    }
  }, []);

  const saveSettings = (newSettings: SchoolSettings) => {
      setSettings(newSettings);
      localStorage.setItem('school_settings', JSON.stringify(newSettings));
  };
  
  const addTeacher = (teacher: Omit<LocalTeacher, 'id' | 'code'>) => {
    const newTeacher: LocalTeacher = { ...teacher, id: uuidv4(), code: 'local', role: 'teacher' };
    setTeachers(prev => {
        const updated = [...prev, newTeacher];
        localStorage.setItem('school_teachers', JSON.stringify(updated));
        return updated;
    });
    return newTeacher;
  };

  const updateTeacher = (teacherId: string, updater: (teacher: LocalTeacher) => LocalTeacher) => {
    setTeachers(prev => {
        const updated = prev.map(t => t.id === teacherId ? updater(t) : t);
        localStorage.setItem('school_teachers', JSON.stringify(updated));
        return updated;
    });
  };
  
  const deleteTeacher = (teacherId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المدرس؟')) {
        setTeachers(prev => {
            const updated = prev.filter(t => t.id !== teacherId);
            localStorage.setItem('school_teachers', JSON.stringify(updated));
            return updated;
        });
    }
  };

  const updateClasses = (newClassesOrUpdater: ClassData[] | ((prevClasses: ClassData[]) => ClassData[])) => {
    setClasses(prevClasses => {
        const newClasses = typeof newClassesOrUpdater === 'function' ? newClassesOrUpdater(prevClasses) : newClassesOrUpdater;
        
        if (newClasses.length === 1 && prevClasses.some(c => c.id === newClasses[0].id)) {
             const updatedClasses = prevClasses.map(c => c.id === newClasses[0].id ? newClasses[0] : c);
             localStorage.setItem('school_classes', JSON.stringify(updatedClasses));
             return updatedClasses;
        }

        localStorage.setItem('school_classes', JSON.stringify(newClasses));
        return newClasses;
    });
  };
  
  return {
    settings,
    setSettings: saveSettings,
    classes,
    updateClasses,
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    isDataReady
  };
};

export default useLocalData;
