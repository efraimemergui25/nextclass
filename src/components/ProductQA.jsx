import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 MessageSquare,
 Send,
 User,
 ShieldCheck,
 Clock,
 HelpCircle,
 ChevronDown,
 Plus,
 X
} from 'lucide-react';
import { db } from '../firebase';
import { 
 collection, 
 addDoc, 
 query, 
 where, 
 orderBy, 
 onSnapshot, 
 serverTimestamp 
} from 'firebase/firestore';

const ProductQA = ({ productId }) => {
 const [questions, setQuestions] = useState([]);
 const [newQuestion, setNewQuestion] = useState('');
 const [userName, setUserName] = useState('');
 const [isAsking, setIsAsking] = useState(false);
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
 if (!productId) return;

 const q = query(
 collection(db, 'product_questions'),
 where('productId', '==', productId),
 where('status', '==', 'approved'),
 orderBy('timestamp', 'desc')
 );

 const unsubscribe = onSnapshot(q, (snapshot) => {
 const data = snapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data()
 }));
 setQuestions(data);
 setLoading(false);
 }, () => {
 setLoading(false);
 });

 return () => unsubscribe();
 }, [productId]);

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!newQuestion.trim()) return;

 setSubmitting(true);
 try {
 await addDoc(collection(db, 'product_questions'), {
 productId,
 question: newQuestion.trim(),
 author: userName.trim() || 'אורח',
 timestamp: serverTimestamp(),
 status: 'approved', // Auto-approve for demo, usually 'pending'
 answers: []
 });
 setNewQuestion('');
 setUserName('');
 setIsAsking(false);
 setSubmitting(false);
 } catch (err) {
 console.error('QA Error:', err);
 setSubmitting(false);
 }
 };

 return (
 <section id="pd-qa" className="w-full mt-20 pt-20 border-t border-gray-100">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
 <div>
 <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tighter mb-3 flex items-center gap-3">
 <MessageSquare size={32} className="text-[#007AFF]" />
 שאלות ותשובות מהקהילה
 </h2>
 <p className="text-lg text-[#86868B] font-medium max-w-2xl">
 יש לך שאלה על המוצר? שאל את הקהילה ואת המומחים שלנו. מנהלי בתי ספר וצוותי רכש משתפים כאן מהניסיון שלהם.
 </p>
 </div>

 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => setIsAsking(!isAsking)}
 className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-xl ${
 isAsking 
 ? 'bg-gray-100 text-gray-500' 
 : 'bg-[#1D1D1F] text-white hover:shadow-black/10'
 }`}
 >
 {isAsking ? <X size={20} /> : <Plus size={20} />}
 {isAsking ? 'בטל שאלה' : 'שאל שאלה חדשה'}
 </motion.button>
 </div>

 {/* Ask Form */}
 <AnimatePresence>
 {isAsking && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden mb-12"
 >
 <form onSubmit={handleSubmit} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-black text-gray-400 px-2">השם שלך (אופציונלי)</label>
 <input 
 type="text"
 value={userName}
 onChange={(e) => setUserName(e.target.value)}
 placeholder="למשל: ד״ר ירון לוי, מנהל פדגוגי"
 className="w-full h-14 bg-white rounded-2xl px-6 font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-black text-gray-400 px-2">השאלה שלך</label>
 <input 
 required
 type="text"
 value={newQuestion}
 onChange={(e) => setNewQuestion(e.target.value)}
 placeholder="למשל: האם ניתן לחבר למערכת הקיימת בבית הספר?"
 className="w-full h-14 bg-white rounded-2xl px-6 font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
 />
 </div>
 </div>
 <div className="flex justify-end">
 <button 
 disabled={submitting}
 type="submit"
 className="px-10 py-4 bg-[#007AFF] text-white rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
 >
 {submitting ? 'שולח...' : 'פרסם שאלה'}
 <Send size={18} className="-rotate-45" />
 </button>
 </div>
 </form>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Questions List */}
 <div className="space-y-6">
 {loading ? (
 <div className="py-20 flex flex-col items-center gap-4 text-gray-300">
 <div className="w-8 h-8 border-4 border-gray-100 border-t-[#007AFF] rounded-full animate-spin" />
 <span className="text-sm font-bold">טוען שאלות...</span>
 </div>
 ) : questions.length === 0 ? (
 <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
 <HelpCircle size={48} className="mx-auto text-gray-200 mb-4" />
 <h3 className="text-xl font-bold text-gray-400">עדיין אין שאלות על המוצר הזה</h3>
 <p className="text-gray-400 text-sm mt-2">היה הראשון לשאול!</p>
 </div>
 ) : (
 questions.map((q, idx) => (
 <QuestionItem key={q.id} item={q} />
 ))
 )}
 </div>
 </section>
 );
};

const QuestionItem = ({ item }) => {
 const [isOpen, setIsOpen] = useState(false);

 return (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="group"
 >
 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:border-blue-100 p-8">
 <div className="flex items-start justify-between gap-6">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-8 h-8 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center">
 <User size={14} />
 </div>
 <span className="text-sm font-black text-[#1D1D1F]">{item.author}</span>
 <span className="w-1 h-1 rounded-full bg-gray-200" />
 <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
 <Clock size={10} />
 {item.timestamp?.toDate().toLocaleDateString('he-IL')}
 </span>
 </div>
 <h3 className="text-xl font-bold text-[#1D1D1F] leading-tight">{item.question}</h3>
 </div>
 
 {item.answers?.length > 0 && (
 <div className="shrink-0 flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black">
 <ShieldCheck size={12} />
 נענה
 </div>
 )}
 </div>

 {item.answers?.length > 0 && (
 <div className="mt-8 space-y-4">
 {item.answers.map((ans, i) => (
 <div key={i} className="bg-gray-50 rounded-2xl p-6 border-r-4 border-[#007AFF]/20">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-[10px] font-black text-[#007AFF]">תשובת צוות NextClass</span>
 <ShieldCheck size={12} className="text-[#007AFF]" />
 </div>
 <p className="text-base text-gray-600 font-medium leading-relaxed">{ans.text}</p>
 </div>
 ))}
 </div>
 )}
 
 {(!item.answers || item.answers.length === 0) && (
 <div className="mt-6 flex items-center gap-2 text-[#AEAEB2] text-xs font-bold italic">
 <HelpCircle size={14} />
 השאלה מחכה לתשובה מהמומחים שלנו...
 </div>
 )}
 </div>
 </motion.div>
 );
};

export default ProductQA;
