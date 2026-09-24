import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Edit2,
  Check,
  Globe,
  DollarSign,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { Group } from '../types';
import { formatCurrency } from '../utils/currency';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { getStorageStatus, requestPersistentStorage, StorageStatus } from '../utils/persistentStorage';

interface GroupSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  currentGroupId: string;
  lang: Language;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string, currency: string, initialMemberCount: number) => void;
  onUpdateGroupDetails: (groupId: string, newName: string, newCurrency: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onResetSample: () => void;
  onExportAllJson: () => void;
  onImportJson: (jsonData: string) => void;
}

const CURRENCIES = ['$', '₫', '€', '£', '¥', 'A$', 'C$', 'CHF', 'SGD'];

export const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({
  isOpen,
  onClose,
  groups,
  currentGroupId,
  lang,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroupDetails,
  onDeleteGroup,
  onResetSample,
  onExportAllJson,
  onImportJson,
}) => {
  const t = TRANSLATIONS[lang];

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('$');
  const [memberCount, setMemberCount] = useState<number>(0); // Default 0 as requested

  // Editing existing trip
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCurrency, setEditCurrency] = useState('$');

  const [errorMsg, setErrorMsg] = useState('');
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      getStorageStatus().then(setStorageStatus);
    }
  }, [isOpen]);

  const handleRequestPersist = async () => {
    const granted = await requestPersistentStorage();
    const updated = await getStorageStatus();
    setStorageStatus(updated);
  };

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập tên chuyến đi' : 'Please enter a trip name');
      return;
    }
    onCreateGroup(name.trim(), currency.trim() || '$', Math.max(0, Math.floor(memberCount)));
    setIsCreating(false);
    setName('');
    setMemberCount(0);
    setErrorMsg('');
  };

  const startEditGroup = (g: Group) => {
    setEditingGroupId(g.id);
    setEditName(g.name);
    setEditCurrency(g.currency || '$');
  };

  const handleSaveEdit = (groupId: string) => {
    if (!editName.trim()) return;
    onUpdateGroupDetails(groupId, editName.trim(), editCurrency);
    setEditingGroupId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJson(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">{t.tripsModalTitle}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.tripsModalSub}</p>
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
          {/* Create new trip form */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{t.createNewTripBtn}</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  {t.cancelBtn}
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-2 rounded">{errorMsg}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {t.tripNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.tripNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400 dark:focus:bg-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    {t.currencySymbolLabel}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400 dark:focus:bg-neutral-800"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    {t.initialMemberCountLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    value={memberCount || ''}
                    onChange={(e) => setMemberCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400 dark:focus:bg-neutral-800"
                  />
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                {t.initialMemberCountHelp}
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  {t.createTripSubmit}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-3 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors bg-neutral-50/50 dark:bg-neutral-900 hover:bg-emerald-50/20"
            >
              <Plus className="w-4 h-4" />
              <span>{t.createNewTripBtn}</span>
            </button>
          )}

          {/* Group list */}
          <div className="space-y-2">
            {groups.map((g) => {
              const isCurrent = g.id === currentGroupId;
              const isEditing = editingGroupId === g.id;
              const totalSpent = g.expenses.reduce((s, e) => s + e.amount, 0);

              if (isEditing) {
                return (
                  <div
                    key={g.id}
                    className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-emerald-300 dark:border-emerald-600 space-y-2 text-xs"
                  >
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {lang === 'vi' ? 'Đổi tên & Tiền tệ' : 'Rename & Change Currency'}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:border-emerald-600 dark:focus:border-emerald-400 dark:focus:bg-neutral-800 focus:outline-none font-semibold"
                      />
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value)}
                        className="w-16 px-1.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:border-emerald-600 dark:focus:border-emerald-400 dark:focus:bg-neutral-800 focus:outline-none"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingGroupId(null)}
                        className="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                      >
                        {t.cancelBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(g.id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold"
                      >
                        {lang === 'vi' ? 'Lưu' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={g.id}
                  onClick={() => {
                    onSelectGroup(g.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                          {g.name}
                        </h4>
                        <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 font-semibold px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-700 rounded">
                          {g.currency}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            {t.activeBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        <span>{g.members.length} {t.membersCount}</span>
                        <span aria-hidden="true">·</span>
                        <span>{g.expenses.length} {t.expensesLogged}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {formatCurrency(totalSpent, g.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditGroup(g);
                        }}
                        className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        title={lang === 'vi' ? 'Đổi tên & tiền tệ' : 'Rename & currency'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {groups.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(lang === 'vi' ? `Bạn có chắc muốn xoá chuyến đi "${g.name}"?` : `Delete group "${g.name}"?`)) {
                              onDeleteGroup(g.id);
                            }
                          }}
                          className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          title="Delete trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Storage Engine & Longevity Information */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide block">
              {lang === 'vi' ? 'Bộ nhớ & Độ bền dữ liệu' : 'Storage Engine & Longevity'}
            </span>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {storageStatus?.engine || 'IndexedDB + StorageManager'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    storageStatus?.isPersistent
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {storageStatus?.isPersistent
                    ? (lang === 'vi' ? 'Đã bảo vệ chống xoá' : 'Persistent (No Eviction)')
                    : (lang === 'vi' ? 'Tiêu chuẩn IndexedDB' : 'IndexedDB Active')}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {lang === 'vi'
                  ? 'Ứng dụng lưu vào IndexedDB thay vì chỉ dùng localStorage thông thường. Dữ liệu được bảo vệ an toàn, không bị giới hạn 5MB và không bị Safari tự xoá sau 7 ngày.'
                  : 'Data is stored asynchronously in IndexedDB and exempted from automatic browser cache eviction (no 5MB limit, no 7-day Safari ITP purge).'}
              </p>

              {storageStatus && !storageStatus.isPersistent && (
                <button
                  type="button"
                  onClick={handleRequestPersist}
                  className="w-full mt-1 py-1.5 px-3 bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-neutral-700 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Kích hoạt Lưu trữ vĩnh viễn (Persist)' : 'Enable Persistent Storage'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide block">
              {t.backupDataTitle}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportAllJson}
                className="p-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>{t.backupJsonBtn}</span>
              </button>
              <label className="p-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>{t.importJsonBtn}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={() => {
                if (confirm(lang === 'vi' ? 'Khôi phục chuyến đi mẫu?' : 'Restore sample trip?')) {
                  onResetSample();
                  onClose();
                }
              }}
              className="w-full text-center text-xs text-neutral-500 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 py-1.5 flex items-center justify-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t.restoreSampleBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white rounded-lg transition-colors"
          >
            {t.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
