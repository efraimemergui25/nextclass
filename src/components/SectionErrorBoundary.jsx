import { Component } from 'react';

/**
 * Lightweight error boundary for individual page sections.
 * Prevents a single crashed section from taking down the whole page.
 * Usage: <SectionErrorBoundary><MySection /></SectionErrorBoundary>
 */
export default class SectionErrorBoundary extends Component {
 state = { crashed: false };

 static getDerivedStateFromError() {
 return { crashed: true };
 }

 componentDidCatch(error) {
 if (import.meta.env.DEV) {
 console.error('[SectionErrorBoundary]', error.message);
 }
 }

 render() {
 if (!this.state.crashed) return this.props.children;
 return (
 <div className="py-10 text-center" dir="rtl">
 <p className="text-sm text-[#AEAEB2] font-medium">
 סקשן זה לא נטען כראוי.{' '}
 <button
 onClick={() => this.setState({ crashed: false })}
 className="text-[#007AFF] font-semibold hover:underline"
 >
 נסה שוב
 </button>
 </p>
 </div>
 );
 }
}
