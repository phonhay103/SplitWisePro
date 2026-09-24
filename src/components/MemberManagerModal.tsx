import React, { useState } from 'react';
import { X, UserPlus, Trash2, Edit2, Check, ShieldCheck, Users, Plus } from 'lucide-react';
import { Member } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface MemberManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  collectorId?: string;
  lang: Language;
  onSaveMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onSetCollector: (memberId: string) => void;
  onBatchAddMembers: (count: number) => void;
  hasExpensesForMember: (memberId: string) => boolean;
}

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-pink-500',
];

export const MemberManagerModal: React.FC<MemberManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  collectorId,
  lang,
  onSaveMember,
  onDeleteMember,
  onSetCollector,
  onBatchAddMembers,
  hasExpensesForMember,
}) => {
  const t = TRANSLATIONS[lang];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState('');

  // Quick batch generator state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCount, setBatchCount] = useState<number>(3);

  if (!isOpen) return null;

  const startNewMember = () => {
    setEditingId('new');
    setName('');
    setPaymentDetails('');
    setColor(AVATAR_COLORS[members.length % AVATAR_COLORS.length]);
    setErrorMsg('');
  };

  const startEditMember = (m: Member) => {
    setEditingId(m.id);
    setName(m.name);
    setPaymentDetails(m.paymentDetails || '');
    setColor(m.avatarColor || AVATAR_COLORS[0]);
    setErrorMsg('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập tên thành viên' : 'Please enter a member name');
      return;
    }

    const memberToSave: Member = {
      id: editingId === 'new' ? `mem-${Date.now()}` : editingId!,
      name: name.trim(),
      avatarColor: color,
      paymentDetails: paymentDetails.trim() || undefined,
    };

    onSaveMember(memberToSave);
    setEditingId(null);
  };

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.max(1, Math.min(30, batchCount));
    onBatchAddMembers(count);
    setShowBatchModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">{t.groupMembersTitle} ({members.length})</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.groupMembersSub}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Quick Batch Generate Toggle */}
          {showBatchModal ? (
            <form onSubmit={handleBatchGenerate} className="p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-neutral-800 dark:text-neutral-200">
                <span>{t.quickBatchAdd}</span>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">{t.quickBatchPrompt}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:border-emerald-600 focus:outline-none dark:focus:bg-neutral-800"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors"
                >
                  {t.generateBtn}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={startNewMember}
                className="flex-1 py-2 px-3 border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors bg-white dark:bg-neutral-800 hover:bg-emerald-50/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.addMemberBtn}</span>
              </button>

              <button
                onClick={() => setShowBatchModal(true)}
                className="py-2 px-3 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors bg-neutral-50 dark:bg-neutral-800"
                title={t.quickBatchPrompt}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? '+ Tạo hàng loạt' : '+ Quick Batch'}</span>
              </button>
            </div>
          )}

          {editingId && (
            <form onSubmit={handleSave} className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-700">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {editingId === 'new' ? (lang === 'vi' ? 'Thêm thành viên mới' : 'Add New Member') : (lang === 'vi' ? 'Chỉnh sửa thành viên' : 'Edit Member Details')}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  {t.cancelBtn}
                </button>
              </div>

              {errorMsg && (
                <div className="p-2 text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded border border-red-100 dark:border-red-800">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {t.memberNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 dark:focus:bg-neutral-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {t.paymentDetailsLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.paymentDetailsPlaceholder}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500 dark:focus:bg-neutral-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">{t.colorLabel}</label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full ${c} flex items-center justify-center transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-neutral-800 dark:ring-neutral-200 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          )}

          {/* Members list */}
          {members.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400 dark:text-neutral-500 italic">
              {lang === 'vi' ? 'Chưa có thành viên nào trong chuyến đi này. Bấm Thêm thành viên để bắt đầu.' : 'No members in this trip yet. Click Add Member to get started.'}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => {
                const isCollector = collectorId === m.id;
                const canDelete = !hasExpensesForMember(m.id);

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full ${m.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{m.name}</span>
                          {isCollector && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                              {t.collectorBadge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                          {m.paymentDetails ? (
                            <span className="text-neutral-600 dark:text-neutral-300 font-mono text-[11px] truncate">
                              {m.paymentDetails}
                            </span>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 italic text-[11px]">
                              {lang === 'vi' ? 'Chưa có thông tin nhận tiền' : 'No payment handle'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isCollector && (
                        <button
                          onClick={() => onSetCollector(m.id)}
                          title={t.setCollectorBtn}
                          className="px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors hidden sm:inline-block"
                        >
                          {t.setCollectorBtn}
                        </button>
                      )}
                      <button
                        onClick={() => startEditMember(m)}
                        title="Edit member"
                        className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (canDelete) {
                            onDeleteMember(m.id);
                          } else {
                            alert(t.deleteMemberPrompt);
                          }
                        }}
                        disabled={!canDelete}
                        title={canDelete ? 'Delete member' : t.deleteMemberPrompt}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canDelete
                            ? 'text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                            : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white rounded-lg transition-colors"
          >
            {t.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
