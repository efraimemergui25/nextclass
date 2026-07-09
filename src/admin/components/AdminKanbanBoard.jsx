/* eslint-disable */
import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLASS, RADIUS, SHADOW, SPRING, TAP, hexA, glow } from '../theme/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = ['חדש', 'ביצירת קשר', 'בדיקת מלאי', 'הוצע מחיר', 'ממתין לאישור', 'נסגר', 'הועבר לספק', 'בדרך', 'סופק'];
const COLORS = {
  'חדש':           '#FF3B30', 'ביצירת קשר':   '#FF9500', 'בדיקת מלאי':  '#F59E0B',
  'הוצע מחיר':    '#007AFF', 'ממתין לאישור': '#5856D6',  'נסגר':         '#34C759',
  'הועבר לספק':   '#0891B2', 'בדרך':          '#7C3AED',  'סופק':         '#1DB954',
};
// SVG paths for stage icons (24×24 viewBox, stroke-based)
const STAGE_ICON_PATHS = {
  'חדש':          'M12 4v16m8-8H4',
  'ביצירת קשר':   'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  'בדיקת מלאי':   'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  'הוצע מחיר':    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  'ממתין לאישור': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'נסגר':          'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'הועבר לספק':   'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  'בדרך':          'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  'סופק':          'M5 13l4 4L19 7',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysSince = (ts) => ts ? Math.floor((Date.now() - ts) / 86400000) : null;
const quoteTotal = (q) => q.subtotal || (q.items || []).reduce((s, i) => s + ((Number(i.salePrice) || Number(i.price) || 0) * (Number(i.qty) || 1)), 0);

function stalledDays(q) {
  // Try to get when it entered the current stage
  const last = [...(q.history || [])].reverse().find(h => h.status === q.status);
  return last?.ts ? daysSince(last.ts) : daysSince(q.dateTs);
}

function urgencyLevel(q) {
  const d = stalledDays(q);
  if (!d) return 'ok';
  if (['חדש', 'ביצירת קשר'].includes(q.status) && d > 3) return 'critical';
  if (['הוצע מחיר', 'ממתין לאישור'].includes(q.status) && d > 7) return 'critical';
  if (d > 5) return 'warning';
  return 'ok';
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────
function KanbanCard({ quote, color, onOpen, onDragStart, isDragging, onNameClick }) {
  const urgency = urgencyLevel(quote);
  const days    = stalledDays(quote);
  const total   = quoteTotal(quote);
  const initials = (quote.contactName || quote.institution || '?')[0].toUpperCase();

  return (
    <motion.div
      layout
      layoutId={`card-${quote.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: -6 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      draggable="true"
      onDragStart={(e) => onDragStart(e, quote.id)}
      onClick={() => onOpen(quote)}
      className="group relative cursor-pointer select-none overflow-hidden"
      style={{
        borderRadius: RADIUS.smCard,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: `blur(32px) saturate(200%)`,
        WebkitBackdropFilter: `blur(32px) saturate(200%)`,
        border: `1.5px solid ${urgency === 'critical' ? hexA('#FF3B30', 0.35) : 'rgba(255,255,255,0.9)'}`,
        boxShadow: urgency === 'critical'
          ? `${SHADOW.md}, ${glow('#FF3B30', 0.18, 18)}, ${SHADOW.specular}`
          : `${SHADOW.sm}, ${SHADOW.specular}`,
        padding: '10px 11px 9px',
        userSelect: 'none',
      }}
      whileHover={{ y: -3, scale: 1.02, boxShadow: `${SHADOW.lg}, 0 0 0 1px ${hexA(color, 0.3)}, ${glow(color, 0.16, 22)}, ${SHADOW.specular}` }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Top accent strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, borderRadius: `${RADIUS.smCard}px ${RADIUS.smCard}px 0 0`, background: `linear-gradient(90deg, ${color}, ${hexA(color, 0.55)})` }} />
      {/* Corner glow orb — Heaven halo behind the glass */}
      <div className="absolute -top-10 -left-8 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${hexA(color, 0.16)} 0%, transparent 66%)`, filter: 'blur(4px)' }} />

      {/* Unread indicator */}
      {quote.unreadAdmin && (
        <div style={{ position: 'absolute', top: 8, left: 9, width: 7, height: 7, borderRadius: '50%', background: '#34C759', border: '1.5px solid #fff', boxShadow: '0 0 0 2px rgba(52,199,89,0.3)' }} />
      )}

      {/* Header: avatar + name */}
      <div className="flex items-start justify-between gap-2 mt-1 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-black"
            style={{ background: `linear-gradient(135deg,${color},${color}80)` }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p
              className="text-[12px] font-black truncate leading-tight transition-colors"
              style={{ maxWidth: 120, color: onNameClick ? '#007AFF' : '#1D1D1F', cursor: onNameClick ? 'pointer' : 'default' }}
              onClick={onNameClick ? (e) => { e.stopPropagation(); onNameClick(quote); } : undefined}
            >
              {quote.contactName || '—'}
            </p>
            {quote.institution && (
              <p className="text-[9px] font-medium text-[#AEAEB2] truncate" style={{ maxWidth: 120 }}>
                {quote.institution}
              </p>
            )}
          </div>
        </div>

        {/* Urgency badge */}
        {urgency !== 'ok' && days && (
          <div className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{
              background: urgency === 'critical' ? 'rgba(255,59,48,0.12)' : 'rgba(255,149,0,0.12)',
              color: urgency === 'critical' ? '#FF3B30' : '#FF9500',
            }}>
            {days}י׳
          </div>
        )}
      </div>

      {/* Total amount */}
      {total > 0 && (
        <div className="mt-2.5 flex items-center justify-between relative z-10">
          <span className="text-[11px] font-black" style={{ color }}>₪{total.toLocaleString()}</span>
          <span className="text-[9px] text-[#C7C7CC] font-mono">{quote.id?.slice(-6)}</span>
        </div>
      )}

      {/* Items count pill */}
      {(quote.items?.length || 0) > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap relative z-10">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: `${color}12`, color }}>
            {quote.items.length} פריטים
          </span>
          {quote.reminderAt && quote.reminderAt > Date.now() && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(255,149,0,0.10)', color: '#FF9500' }}>
              ⏰ תזכורת
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────
function KanbanColumn({ stage, quotes, color, onOpen, onDragStart, onDrop, onDragEnter, isDragOver, draggingId, onNameClick }) {
  const total = quotes.reduce((s, q) => s + quoteTotal(q), 0);
  const criticalCount = quotes.filter(q => urgencyLevel(q) === 'critical').length;

  return (
    <div
      style={{ minWidth: 210, maxWidth: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}
      onDragOver={e => { e.preventDefault(); onDragEnter?.(stage); }}
      onDrop={e => onDrop(e, stage)}
    >
      {/* Column header */}
      <motion.div
        animate={isDragOver ? { scale: 1.03, y: -1 } : { scale: 1, y: 0 }}
        transition={SPRING.snappy}
        style={{
          padding: '8px 11px 9px',
          borderRadius: RADIUS.sm,
          background: isDragOver
            ? `linear-gradient(145deg, ${hexA(color, 0.18)} 0%, rgba(255,255,255,0.9) 80%)`
            : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: isDragOver ? `1.5px dashed ${color}` : '1px solid rgba(255,255,255,0.75)',
          boxShadow: isDragOver ? `0 0 0 3px ${hexA(color, 0.16)}, ${SHADOW.md}, ${SHADOW.specular}` : `${SHADOW.sm}, ${SHADOW.specular}`,
          marginBottom: 8,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STAGE_ICON_PATHS[stage] && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={STAGE_ICON_PATHS[stage]} />
              </svg>
            )}
            <span className="text-[11px] font-black" style={{ color: isDragOver ? color : '#1D1D1F' }}>{stage}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30' }}>
                {criticalCount}⚡
              </span>
            )}
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${color}18`, color }}>
              {quotes.length}
            </span>
          </div>
        </div>
        {total > 0 && (
          <p className="text-[10px] font-black mt-1" style={{ color: `${color}CC` }}>
            ₪{total.toLocaleString()}
          </p>
        )}
      </motion.div>

      {/* Drop zone + cards */}
      <div
        style={{
          flex: 1,
          minHeight: 120,
          padding: isDragOver ? '6px' : '0',
          borderRadius: RADIUS.sm,
          border: isDragOver ? `1.5px dashed ${hexA(color, 0.5)}` : '1.5px dashed transparent',
          background: isDragOver ? hexA(color, 0.05) : 'transparent',
          transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        <AnimatePresence>
          {quotes.map(q => (
            <KanbanCard
              key={q.id}
              quote={q}
              color={color}
              onOpen={onOpen}
              onDragStart={onDragStart}
              isDragging={draggingId === q.id}
              onNameClick={onNameClick}
            />
          ))}
        </AnimatePresence>

        {quotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragOver ? 0 : 1 }}
            style={{
              padding: '18px 12px',
              borderRadius: 12,
              border: `1.5px dashed ${color}25`,
              textAlign: 'center',
              color: '#C7C7CC',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {isDragOver ? '' : 'ריק'}
          </motion.div>
        )}

        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: '14px 12px',
              borderRadius: 12,
              border: `2px dashed ${color}60`,
              textAlign: 'center',
              color: color,
              fontSize: 11,
              fontWeight: 800,
              background: `${color}08`,
            }}
          >
            + הוסף לכאן
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main KanbanBoard ─────────────────────────────────────────────────────────
export default function AdminKanbanBoard({ quotes, onUpdateStatus, onOpen, showToast, onNameClick }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const dragIdRef = useRef(null);

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach(s => { map[s] = []; });
    quotes.forEach(q => {
      const s = q.status;
      if (map[s]) map[s].push(q);
      // else ignore non-kanban statuses
    });
    return map;
  }, [quotes]);

  const handleDragStart = useCallback((e, quoteId) => {
    dragIdRef.current = quoteId;
    setDraggingId(quoteId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', quoteId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverStage(null);
    dragIdRef.current = null;
  }, []);

  const handleDrop = useCallback((e, targetStage) => {
    e.preventDefault();
    const id = dragIdRef.current || e.dataTransfer.getData('text/plain');
    if (!id) return;
    const quote = quotes.find(q => q.id === id);
    if (!quote || quote.status === targetStage) {
      setDraggingId(null);
      setDragOverStage(null);
      return;
    }
    onUpdateStatus(id, targetStage);
    showToast(`"${quote.contactName || quote.id}" → ${targetStage}`, 'success');
    setDraggingId(null);
    setDragOverStage(null);
  }, [quotes, onUpdateStatus, showToast]);

  const totalPipeline = useMemo(() => quotes.reduce((s, q) => s + quoteTotal(q), 0), [quotes]);
  const criticalAll   = useMemo(() => quotes.filter(q => urgencyLevel(q) === 'critical').length, [quotes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onDragEnd={handleDragEnd}>

      {/* Pipeline summary bar */}
      <div className="flex items-center gap-4 px-1 flex-wrap">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING.soft}
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ borderRadius: RADIUS.pill, background: hexA('#007AFF', 0.08), border: `1px solid ${hexA('#007AFF', 0.2)}`, boxShadow: `${glow('#007AFF', 0.1, 14)}, ${SHADOW.specular}` }}>
          <span className="text-[11px] font-black text-[#007AFF] tracking-tight">Pipeline: ₪{totalPipeline.toLocaleString()}</span>
        </motion.div>
        {criticalAll > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING.soft, delay: 0.05 }}
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{ borderRadius: RADIUS.pill, background: hexA('#FF3B30', 0.08), border: `1px solid ${hexA('#FF3B30', 0.2)}`, boxShadow: `${glow('#FF3B30', 0.1, 14)}, ${SHADOW.specular}` }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
            <span className="text-[11px] font-black text-[#FF3B30]">{criticalAll} הצעות זקוקות לתשומת לב</span>
          </motion.div>
        )}
        <span className="text-[10px] text-[#AEAEB2] font-bold mr-auto">גרור כרטיס לעמודה אחרת לשינוי סטטוס</span>
      </div>

      {/* Board */}
      <div
        style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, paddingTop: 2, cursor: 'default' }}
        className="custom-scrollbar"
        dir="rtl"
      >
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            quotes={byStage[stage] || []}
            color={COLORS[stage] || '#007AFF'}
            onOpen={onOpen}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragEnter={setDragOverStage}
            isDragOver={dragOverStage === stage && draggingId !== null}
            draggingId={draggingId}
            onNameClick={onNameClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF3B30]" />
          <span className="text-[10px] text-[#AEAEB2] font-bold">ממתין יותר מדי — פעולה דחופה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#34C759' }} />
          <span className="text-[10px] text-[#AEAEB2] font-bold">הודעה חדשה מלקוח</span>
        </div>
      </div>
    </div>
  );
}
