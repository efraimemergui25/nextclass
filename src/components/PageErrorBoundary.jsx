import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class PageErrorBoundary extends Component {
    state = { crashed: false };
    static getDerivedStateFromError() { return { crashed: true }; }
    componentDidCatch(error, info) { console.error('[PageErrorBoundary]', error, info); }

    render() {
        if (!this.state.crashed) return this.props.children;
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1D1D1F] flex items-center justify-center">
                    <span className="text-white text-2xl font-black">N</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight mb-2">הדף נתקל בשגיאה</h2>
                    <p className="text-[#86868B] font-medium">אנחנו מודעים לבעיה ופועלים לתקן אותה.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => this.setState({ crashed: false })}
                        className="px-6 py-2.5 rounded-full bg-[#007AFF] text-white font-bold text-sm"
                    >
                        נסה שוב
                    </button>
                    <Link to="/" className="px-6 py-2.5 rounded-full bg-[#F5F5F7] text-[#1D1D1F] font-bold text-sm">
                        דף הבית
                    </Link>
                </div>
            </div>
        );
    }
}
