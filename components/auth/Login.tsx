
import React, { useState } from 'react';
import { LogIn, Key, AtSign, User as UserIcon, X, PlayCircle, Phone } from 'lucide-react';
import type { User } from '../../types';

interface LoginProps {
    onLogin: (identifier: string, secret: string) => boolean;
    onStudentLogin: (code: string) => Promise<boolean>;
    onSubmissionCode: (code: string) => Promise<boolean>;
}

export default function Login({ onLogin, onStudentLogin, onSubmissionCode }: LoginProps) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const isEmail = identifier.includes('@');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try admin/teacher/principal login first
        const isAdminOrTeacher = onLogin(identifier, password);
        
        if (isAdminOrTeacher) {
             setIsSubmitting(false);
             return;
        }
        
        if (!isEmail) {
            // Try existing student login first
            const isExistingStudent = await onStudentLogin(identifier);
            if (isExistingStudent) {
                setIsSubmitting(false);
                return;
            }
            
            // Then try new student submission code
            const isSubmissionCode = await onSubmissionCode(identifier);
            if (isSubmissionCode) {
                 setIsSubmitting(false);
                 return;
            }
            
            // If neither, it's an invalid code
            setError('رمز الدخول غير صحيح. يرجى التأكد من الرمز والمحاولة مرة أخرى.');
        } else {
            // It was an email but login failed
            setError('بيانات الاعتماد غير صحيحة. يرجى المحاولة مرة أخرى.');
        }

        setIsSubmitting(false);
    };

    const SocialButton = ({ href, imgSrc, title, description, motivation }: { href: string; imgSrc: string; title: string; description: string; motivation?: string }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300 hover:shadow-md"
        >
            <img src={imgSrc} alt={`${title} logo`} className="w-12 h-12" />
            <div>
                <h4 className="font-bold text-gray-800">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
                {motivation && <p className="text-xs text-cyan-600 font-semibold mt-1">{motivation}</p>}
            </div>
        </a>
    );
    

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4" style={{ fontFamily: "'Cairo', sans-serif" }}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-6">

                {/* New Header Section */}
                <div className="text-center space-y-3 mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 relative -top-3 leading-tight pb-2">
                        تربوي تك المدراء
                    </h1>
                    <img src="https://i.imgur.com/BUhE8Ti.png" alt="شعار تربوي تك" className="mx-auto w-36 mb-4" />
                    <p className="text-lg text-gray-700 leading-relaxed">
                        بوابتكم نحو إدارة تعليمية ذكية ومتكاملة. نمكّن قادة المدارس بأدوات مبتكرة لإدارة الدرجات، إنشاء الجداول، وإصدار كافة السجلات والتقارير بكل سهولة ودقة.
                    </p>
                    <p className="font-bold text-xl text-orange-500 animate-pulse pt-2">
                        ارتقِ بإدارتك المدرسية... انضم لمستقبل الكفاءة والتميز!
                    </p>
                </div>


                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">تسجيل الدخول</h2>
                    <p className="text-sm text-gray-500 mt-1">للمدراء والمدرسين والطلاب</p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="البريد الإلكتروني أو رمز الدخول"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                            required
                        />
                         <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                             {isEmail ? <AtSign size={20} /> : <UserIcon size={20} />}
                         </div>
                    </div>
                    
                    {isEmail && (
                         <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="كلمة المرور"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                                required
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Key size={20} />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors shadow-lg disabled:bg-gray-400"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>جاري الدخول...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>دخول</span>
                            </>
                        )}
                    </button>
                </form>

                {/* New Social/Contact Section */}
                <div className="pt-6 border-t border-gray-200 space-y-4">
                     <button 
                        onClick={() => setIsVideoModalOpen(true)}
                        className="w-full flex items-center gap-4 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-300 hover:shadow-md text-red-700"
                     >
                        <PlayCircle className="w-12 h-12" />
                        <div>
                            <h4 className="font-bold text-red-800">شاهد العرض التوضيحي</h4>
                            <p className="text-sm text-red-600">تعرف على بعض امكانيات تربوي تك المدراء في خمس دقائق .</p>
                        </div>
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <SocialButton
                            href="https://www.facebook.com/profile.php?id=61578356680977"
                            imgSrc="https://i.imgur.com/zC26Bw6.png"
                            title="فيسبوك"
                            description="تابع آخر التحديثات والأخبار."
                        />
                        <SocialButton
                            href="https://wa.me/9647727554379"
                            imgSrc="https://i.imgur.com/Nhimac3.png"
                            title="واتساب"
                            description="للاستفسار والاشتراك."
                            motivation="اطلب فترتك التجريبية المجانية!"
                        />
                         <SocialButton
                            href="https://www.instagram.com/trbawetk/?utm_source=qr&igsh=MXNoNTNmdDRncnNjag%3D%3D#"
                            imgSrc="https://i.imgur.com/J6SeeNQ.png"
                            title="انستغرام"
                            description="تابعنا للحصول على محتوى تعليمي."
                        />
                    </div>
                    <a
                        href="tel:+9647727554379"
                        className="flex items-center justify-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-300 hover:shadow-md text-gray-700 w-full"
                    >
                        <Phone className="w-6 h-6 text-green-600" />
                        <span className="font-semibold">او اتصل بالرقم 07727554379</span>
                    </a>
                </div>
            </div>

            {/* Video Modal */}
            {isVideoModalOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
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
                                src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2F61578356680977%2Fvideos%2F1112391473652635%2F&show_text=false&autoplay=1&mute=0"
                                className="absolute top-0 left-0 w-full h-full"
                                style={{ border: 'none', overflow: 'hidden' }}
                                title="Facebook video player"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                allowFullScreen={true}>
                            </iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
