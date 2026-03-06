'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Save, User, Tags, Sparkles, Eye, BookOpen, FileText, Settings, Search, ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryConfig, MyAccountInfo, ResearchItem, ResearchItemId } from '@contenthub/types';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  useCategories,
  useUpdateCategories,
  useResetCategories,
} from '@/hooks/api/useCategories';
import {
  usePersona,
  useUpdatePersona,
  usePersonaList,
  useAddPersona,
  useDeletePersona,
  useGeneratePersonaExample,
  type PersonaSettings,
} from '@/hooks/api/usePersona';
import {
  useCustomInstructions,
  useUpdateCustomInstructions,
  useResearchNotes,
  useUpdateResearchItem,
} from '@/hooks/api/useContext';
import {
  useMyAccount,
  useUpdateMyAccount,
} from '@/hooks/api/useMyAccount';

// カラーパレット
const COLORS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899',
  '#14B8A6', '#6366F1', '#F97316', '#EF4444', '#84CC16',
];

type SettingsTab = 'genres' | 'persona' | 'research-notes' | 'custom-instructions' | 'my-account';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('genres');

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">設定</h1>
            <p className="text-sm text-gray-600">
              投稿ジャンル、ペルソナ、調査ノート、カスタム指示、マイアカウントを設定できます
            </p>
          </div>

          {/* タブ切り替え */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('genres')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'genres'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Tags className="w-4 h-4" />
              投稿ジャンル
            </button>
            <button
              onClick={() => setActiveTab('persona')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'persona'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <User className="w-4 h-4" />
              ペルソナ
            </button>
            <button
              onClick={() => setActiveTab('research-notes')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'research-notes'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Search className="w-4 h-4" />
              調査ノート
            </button>
            <button
              onClick={() => setActiveTab('custom-instructions')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'custom-instructions'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              カスタム指示
            </button>
            <button
              onClick={() => setActiveTab('my-account')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'my-account'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Settings className="w-4 h-4" />
              マイアカウント
            </button>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'genres' ? (
            <GenreSettings />
          ) : activeTab === 'persona' ? (
            <PersonaSettingsPanel />
          ) : activeTab === 'research-notes' ? (
            <ResearchNotesPanel />
          ) : activeTab === 'custom-instructions' ? (
            <CustomInstructionsPanel />
          ) : (
            <MyAccountPanel />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

// 投稿ジャンル設定コンポーネント（旧カテゴリ）
function GenreSettings() {
  const { data: categorySettings, isLoading } = useCategories();
  const updateMutation = useUpdateCategories();
  const resetMutation = useResetCategories();

  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (categorySettings?.categories) {
      setCategories(categorySettings.categories);
      setHasChanges(false);
    }
  }, [categorySettings]);

  const totalPercentage = categories.reduce((sum, c) => sum + c.percentage, 0);
  const isValidTotal = totalPercentage === 100;

  const handleAddCategory = () => {
    if (!newName.trim()) return;
    const newCategory: CategoryConfig = {
      id: `category-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      percentage: 0,
      color: COLORS[categories.length % COLORS.length],
    };
    setCategories([...categories, newCategory]);
    setNewName('');
    setNewDescription('');
    setHasChanges(true);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
    setHasChanges(true);
  };

  const handlePercentageChange = (id: string, value: number) => {
    setCategories(
      categories.map((c) =>
        c.id === id ? { ...c, percentage: Math.max(0, Math.min(100, value)) } : c
      )
    );
    setHasChanges(true);
  };

  const handleNameChange = (id: string, name: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
    setHasChanges(true);
  };

  const handleColorChange = (id: string, color: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, color } : c)));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!isValidTotal) return;
    await updateMutation.mutateAsync(categories);
    setHasChanges(false);
  };

  const handleReset = async () => {
    if (confirm('投稿ジャンル設定をデフォルトに戻しますか？')) {
      await resetMutation.mutateAsync();
      setHasChanges(false);
    }
  };

  const handleEqualDistribution = () => {
    const equalPercentage = Math.floor(100 / categories.length);
    const remainder = 100 - equalPercentage * categories.length;
    setCategories(
      categories.map((c, index) => ({
        ...c,
        percentage: equalPercentage + (index < remainder ? 1 : 0),
      }))
    );
    setHasChanges(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">投稿ジャンル一覧</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                合計: <span className={isValidTotal ? 'text-green-600' : 'text-red-600'}>{totalPercentage}%</span>
                {!isValidTotal && ' （100%にしてください）'}
              </p>
            </div>
            <button
              onClick={handleEqualDistribution}
              className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              均等配分
            </button>
          </div>

          <div className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <input
                      type="color"
                      value={category.color || '#8B5CF6'}
                      onChange={(e) => handleColorChange(category.id, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => handleNameChange(category.id, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm transition-all"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={category.percentage}
                        onChange={(e) => handlePercentageChange(category.id, parseInt(e.target.value) || 0)}
                        min={0}
                        max={100}
                        className="w-16 px-2 py-2 rounded-lg border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm text-center transition-all"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center text-gray-500 py-8">投稿ジャンルがありません</p>
                )}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleReset}
              disabled={resetMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              デフォルトに戻す
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSave}
              disabled={!hasChanges || !isValidTotal || updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {updateMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">投稿ジャンルを追加</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ジャンル名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: ライフハック"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">説明（任意）</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="例: 日常を便利にするコツ"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm transition-all"
              />
            </div>
            <button
              onClick={handleAddCategory}
              disabled={!newName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              追加
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">配分プレビュー</h2>
          <div className="space-y-2">
            {categories
              .filter((c) => c.percentage > 0)
              .sort((a, b) => b.percentage - a.percentage)
              .map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-sm text-gray-700 flex-1">{category.name}</span>
                  <span className="text-sm text-gray-500">{category.percentage}%</span>
                </div>
              ))}
          </div>
          <div className="mt-4 h-4 rounded-full overflow-hidden bg-gray-100 flex">
            {categories
              .filter((c) => c.percentage > 0)
              .map((category) => (
                <div
                  key={category.id}
                  style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                  title={`${category.name}: ${category.percentage}%`}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ペルソナ設定コンポーネント
function PersonaSettingsPanel() {
  const { data: personaData, isLoading } = usePersona();
  const { data: personaListData, isLoading: isListLoading } = usePersonaList();
  const updateMutation = useUpdatePersona();
  const addMutation = useAddPersona();
  const deleteMutation = useDeletePersona();
  const generateMutation = useGeneratePersonaExample();

  const [persona, setPersona] = useState<PersonaSettings | null>(null);
  const [personaName, setPersonaName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [newProblem, setNewProblem] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isNewPersona, setIsNewPersona] = useState(false);

  useEffect(() => {
    if (personaData) {
      setPersona(personaData);
      setPersonaName(personaData.name || '');
      setHasChanges(false);
      setIsNewPersona(false);
    }
  }, [personaData]);

  const handleFieldChange = (field: keyof PersonaSettings, value: string) => {
    if (!persona) return;
    setPersona({ ...persona, [field]: value });
    setHasChanges(true);
  };

  const handleExampleChange = (field: keyof PersonaSettings['personaExample'], value: string | number) => {
    if (!persona) return;
    setPersona({
      ...persona,
      personaExample: { ...persona.personaExample, [field]: value },
    });
    setHasChanges(true);
  };

  const handleAddProblem = () => {
    if (!persona || !newProblem.trim()) return;
    setPersona({ ...persona, problems: [...persona.problems, newProblem.trim()] });
    setNewProblem('');
    setHasChanges(true);
  };

  const handleRemoveProblem = (index: number) => {
    if (!persona) return;
    setPersona({ ...persona, problems: persona.problems.filter((_, i) => i !== index) });
    setHasChanges(true);
  };

  const handleAddInterest = () => {
    if (!persona || !newInterest.trim()) return;
    setPersona({ ...persona, interests: [...persona.interests, newInterest.trim()] });
    setNewInterest('');
    setHasChanges(true);
  };

  const handleRemoveInterest = (index: number) => {
    if (!persona) return;
    setPersona({ ...persona, interests: persona.interests.filter((_, i) => i !== index) });
    setHasChanges(true);
  };

  // 保存処理（新規作成または更新）
  const handleSave = async () => {
    if (!persona || !personaName.trim()) return;

    if (isNewPersona) {
      // 新規追加
      await addMutation.mutateAsync({ ...persona, name: personaName });
      setIsNewPersona(false);
    } else {
      // 既存を更新
      await updateMutation.mutateAsync({ ...persona, name: personaName });
    }

    setHasChanges(false);
  };

  const handleDeletePersona = async (id: string) => {
    if (!confirm('このペルソナを削除しますか？')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleLoadPersona = (savedPersona: PersonaSettings) => {
    setPersona({
      ...savedPersona,
      id: savedPersona.id,
    });
    setPersonaName(savedPersona.name || '');
    setHasChanges(false);
    setIsNewPersona(false);
  };

  // 新規ペルソナ作成
  const handleCreateNewPersona = () => {
    const newPersona: PersonaSettings = {
      ageRange: '',
      gender: '',
      occupation: '',
      problems: [],
      interests: [],
      personaExample: {
        name: '',
        age: 25,
        job: '',
        description: '',
      },
      updated_at: new Date().toISOString(),
    };
    setPersona(newPersona);
    setPersonaName('');
    setHasChanges(true);
    setIsNewPersona(true);
  };

  // AIでペルソナ例を生成
  const handleGeneratePersona = async () => {
    if (!persona) return;

    try {
      const result = await generateMutation.mutateAsync({
        ageRange: persona.ageRange,
        gender: persona.gender,
        occupation: persona.occupation,
        problems: persona.problems,
        interests: persona.interests,
      });

      setPersona({
        ...persona,
        personaExample: {
          name: result.name,
          age: result.age,
          job: result.job,
          description: result.description,
        },
      });
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to generate persona example:', error);
    }
  };

  if (isLoading || !persona) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 説明パネル */}
      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <h3 className="text-sm font-medium text-indigo-800 mb-2">
          ペルソナとは？
        </h3>
        <p className="text-sm text-indigo-700 mb-3">
          ターゲット読者の具体的な人物像を設定します。ここで設定した情報は以下で活用されます：
        </p>
        <ul className="text-sm text-indigo-700 space-y-1 ml-4 list-disc">
          <li>カレンダー生成時に、ターゲットに合ったタイトル・内容案・ハッシュタグを提案</li>
          <li>投稿作成や記事作成で、ペルソナに響く内容を生成</li>
          <li>一貫したターゲット設定でコンテンツの方向性を統一</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: 基本情報 */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">基本属性</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">年代</label>
              <input
                type="text"
                value={persona.ageRange}
                onChange={(e) => handleFieldChange('ageRange', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">性別</label>
              <input
                type="text"
                value={persona.gender}
                onChange={(e) => handleFieldChange('gender', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">職業・立場</label>
              <input
                type="text"
                value={persona.occupation}
                onChange={(e) => handleFieldChange('occupation', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">悩み・課題</h2>
          <div className="space-y-2 mb-3">
            {persona.problems.map((problem, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="flex-1 text-sm text-gray-700">{problem}</span>
                <button
                  onClick={() => handleRemoveProblem(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProblem}
              onChange={(e) => setNewProblem(e.target.value)}
              placeholder="新しい悩みを追加"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddProblem()}
            />
            <button
              onClick={handleAddProblem}
              disabled={!newProblem.trim()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">興味・関心</h2>
          <div className="space-y-2 mb-3">
            {persona.interests.map((interest, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="flex-1 text-sm text-gray-700">{interest}</span>
                <button
                  onClick={() => handleRemoveInterest(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="新しい興味を追加"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddInterest()}
            />
            <button
              onClick={handleAddInterest}
              disabled={!newInterest.trim()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ペルソナ例を生成ボタン */}
        <button
          onClick={handleGeneratePersona}
          disabled={generateMutation.isPending || persona.problems.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3
            bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl
            text-sm font-medium shadow-sm
            hover:from-indigo-600 hover:to-purple-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all"
        >
          {generateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              ペルソナ例を生成
            </>
          )}
        </button>
      </div>

      {/* 右側: ペルソナ例 */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">ペルソナ例</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">名前</label>
                <input
                  type="text"
                  value={persona.personaExample.name}
                  onChange={(e) => handleExampleChange('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">年齢</label>
                <input
                  type="number"
                  value={persona.personaExample.age}
                  onChange={(e) => handleExampleChange('age', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">職業</label>
              <input
                type="text"
                value={persona.personaExample.job}
                onChange={(e) => handleExampleChange('job', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">詳細</label>
              <textarea
                value={persona.personaExample.description}
                onChange={(e) => handleExampleChange('description', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* プレビュー */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
          <h2 className="font-semibold text-indigo-900 mb-3">プレビュー</h2>
          <div className="bg-white/80 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800 mb-2">
              「{persona.personaExample.name}」{persona.personaExample.age}歳・{persona.personaExample.job}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {persona.personaExample.description}
            </p>
          </div>
        </div>

        {/* ペルソナ名と保存 */}
        <div className={`rounded-2xl border shadow-sm p-5 space-y-4 ${
          isNewPersona ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-gray-200/60'
        }`}>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              ペルソナ名（保存用）{isNewPersona && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={personaName}
              onChange={(e) => {
                setPersonaName(e.target.value);
                setHasChanges(true);
              }}
              placeholder="例: メインターゲット、サブペルソナA など"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
            />
          </div>

          {isNewPersona && (
            <p className="text-xs text-indigo-600">
              新規ペルソナを作成中です。名前を入力して保存してください。
            </p>
          )}

          {hasChanges && !isNewPersona && (
            <p className="text-xs text-amber-600">
              変更があります。保存してください。
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges || !personaName.trim() || updateMutation.isPending || addMutation.isPending}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white transition-colors text-sm font-medium ${
              hasChanges && personaName.trim()
                ? 'bg-indigo-500 hover:bg-indigo-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {(updateMutation.isPending || addMutation.isPending) ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isNewPersona ? '新規保存' : '保存'}
          </button>
        </div>

        {/* 最終更新日時 */}
        {persona.updated_at && (
          <p className="text-xs text-gray-400 text-center">
            最終更新: {new Date(persona.updated_at).toLocaleString('ja-JP')}
          </p>
        )}

        {/* 保存済みペルソナ一覧 */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">保存済みペルソナ一覧</h2>
            <button
              onClick={handleCreateNewPersona}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3 h-3" />
              新規作成
            </button>
          </div>
          {isListLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : personaListData?.personas && personaListData.personas.length > 0 ? (
            <div className="space-y-2">
              {personaListData.personas.map((savedPersona) => {
                const isEditing = !isNewPersona && persona?.id === savedPersona.id;
                return (
                  <div
                    key={savedPersona.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isEditing ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isEditing ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {savedPersona.name || '名称未設定'}
                        {isEditing && <span className="ml-2 text-xs text-indigo-600">（編集中）</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {savedPersona.ageRange} / {savedPersona.gender} / {savedPersona.occupation}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadPersona(savedPersona)}
                      className={`p-2 rounded-lg transition-colors ${
                        isEditing ? 'text-indigo-400 cursor-default' : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                      title="表示"
                      disabled={isEditing}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => savedPersona.id && handleDeletePersona(savedPersona.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              保存済みのペルソナはありません
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// 調査ノートパネル（13項目）
function ResearchNotesPanel() {
  const { data: researchNotesData, isLoading } = useResearchNotes();
  const updateItemMutation = useUpdateResearchItem();

  const [items, setItems] = useState<ResearchItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<ResearchItemId>>(new Set());
  const [editingItem, setEditingItem] = useState<ResearchItemId | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (researchNotesData?.items) {
      setItems(researchNotesData.items);
    }
  }, [researchNotesData]);

  const toggleExpand = (id: ResearchItemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const startEditing = (item: ResearchItem) => {
    setEditingItem(item.id);
    setEditContent(item.content);
    // 自動的に展開
    const newExpanded = new Set(expandedItems);
    newExpanded.add(item.id);
    setExpandedItems(newExpanded);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditContent('');
  };

  const saveItem = async (id: ResearchItemId) => {
    await updateItemMutation.mutateAsync({ id, content: editContent });
    setEditingItem(null);
    setEditContent('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <h3 className="text-sm font-medium text-indigo-800 mb-2">
          調査ノートとは？
        </h3>
        <p className="text-sm text-indigo-700">
          コンテンツ作成に必要な13項目の調査結果を記録します。各項目はコンテンツ柱と紐づいており、カレンダー生成や投稿作成時に活用されます。
        </p>
      </div>

      {/* 調査項目一覧 */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const isExpanded = expandedItems.has(item.id);
          const isEditing = editingItem === item.id;
          const hasContent = item.content && item.content.trim().length > 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden"
            >
              {/* ヘッダー */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{item.category}</p>
                </div>
                {hasContent && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    記録あり
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* コンテンツ */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="pt-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={10}
                          placeholder="調査結果を入力してください..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={() => saveItem(item.id)}
                            disabled={updateItemMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                          >
                            {updateItemMutation.isPending ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {hasContent ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-400">
                                更新: {new Date(item.updated_at).toLocaleString('ja-JP')}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(item);
                                }}
                                className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                編集
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-sm text-gray-500 mb-3">まだ記録がありません</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(item);
                              }}
                              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm hover:bg-indigo-100 transition-colors"
                            >
                              記録を追加
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 最終更新日時 */}
      {researchNotesData?.updated_at && (
        <p className="text-xs text-gray-400 text-right">
          全体の最終更新: {new Date(researchNotesData.updated_at).toLocaleString('ja-JP')}
        </p>
      )}
    </div>
  );
}

// カスタム指示パネル
function CustomInstructionsPanel() {
  const { data: customInstructionsData, isLoading } = useCustomInstructions();
  const updateMutation = useUpdateCustomInstructions();

  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (customInstructionsData) {
      setContent(customInstructionsData.content || '');
      setHasChanges(false);
    }
  }, [customInstructionsData]);

  const handleSave = async () => {
    await updateMutation.mutateAsync(content);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <h3 className="text-sm font-medium text-indigo-800 mb-2">
          カスタム指示とは？
        </h3>
        <p className="text-sm text-indigo-700">
          AIへの追加指示を設定します。避けたい表現、必ず含めたい要素、文体の指定などを記述すると、生成結果に反映されます。
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-1">カスタム指示</h2>
        <p className="text-xs text-gray-500 mb-4">
          AIへの追加指示、避けたい表現、必ず含めたい要素など
        </p>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setHasChanges(true);
          }}
          rows={15}
          placeholder="例：&#10;【文体】&#10;・「絶対」「必ず」など断定的な表現は避ける&#10;・共感→解決策→行動促進の流れを意識&#10;・専門用語は使わず、わかりやすく&#10;&#10;【トーン】&#10;・絵文字は控えめに（1投稿に1〜2個まで）&#10;・親しみやすいが馴れ馴れしくない&#10;・読者に寄り添う姿勢を大切に"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
        />
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {updateMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          保存
        </button>
      </div>

      {/* 最終更新日時 */}
      {customInstructionsData?.updated_at && (
        <p className="text-xs text-gray-400 text-right">
          最終更新: {new Date(customInstructionsData.updated_at).toLocaleString('ja-JP')}
        </p>
      )}
    </div>
  );
}

// マイアカウントパネル
function MyAccountPanel() {
  const { data: myAccountData, isLoading } = useMyAccount();
  const updateMutation = useUpdateMyAccount();

  const [accountInfo, setAccountInfo] = useState<MyAccountInfo | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (myAccountData) {
      setAccountInfo(myAccountData);
      setHasChanges(false);
    }
  }, [myAccountData]);

  const handleFieldChange = (field: keyof MyAccountInfo, value: string) => {
    if (!accountInfo) return;
    setAccountInfo({ ...accountInfo, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!accountInfo) return;
    await updateMutation.mutateAsync(accountInfo);
    setHasChanges(false);
  };

  if (isLoading || !accountInfo) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <h3 className="text-sm font-medium text-indigo-800 mb-2">
          マイアカウントとは？
        </h3>
        <p className="text-sm text-indigo-700">
          あなたのSNSアカウントの方針、発信の軸、運用ルールを記録します。カレンダー生成や投稿作成時にAIへ渡され、一貫性のあるコンテンツ生成に活用されます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* アカウント方針 */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">アカウント方針</h2>
          <p className="text-xs text-gray-500 mb-4">
            アカウントの目的、ゴール、ミッションなど
          </p>
          <textarea
            value={accountInfo.account_policy}
            onChange={(e) => handleFieldChange('account_policy', e.target.value)}
            rows={8}
            placeholder="例：&#10;・HSP×ITのニッチで唯一無二のポジション確立&#10;・共感をベースに信頼を構築&#10;・最終的には有料noteやコンサルで収益化&#10;・月1万PV達成を目指す"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
          />
        </div>

        {/* 発信の軸・テーマ */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">発信の軸・テーマ</h2>
          <p className="text-xs text-gray-500 mb-4">
            メインテーマ、コンテンツの柱となるトピック
          </p>
          <textarea
            value={accountInfo.content_pillars}
            onChange={(e) => handleFieldChange('content_pillars', e.target.value)}
            rows={8}
            placeholder="例：&#10;【3つの柱】&#10;1. HSP×仕事術：繊細さを活かした働き方&#10;2. IT活用：ツールで日常を効率化&#10;3. マインドセット：自己肯定感を高める考え方"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
          />
        </div>

        {/* 運用ルール */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">運用ルール</h2>
          <p className="text-xs text-gray-500 mb-4">
            投稿頻度、時間帯、NG事項など
          </p>
          <textarea
            value={accountInfo.operation_rules}
            onChange={(e) => handleFieldChange('operation_rules', e.target.value)}
            rows={8}
            placeholder="例：&#10;【投稿ルール】&#10;・X：毎日2投稿（朝7時、夜20時）&#10;・Threads：週3回&#10;・NOTE：週1回（日曜日）&#10;&#10;【NG事項】&#10;・政治・宗教の話題は避ける&#10;・否定的な表現は使わない"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
          />
        </div>

        {/* ブランドボイス */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">ブランドボイス・トーン</h2>
          <p className="text-xs text-gray-500 mb-4">
            文体、トーン、人格設定など
          </p>
          <textarea
            value={accountInfo.brand_voice}
            onChange={(e) => handleFieldChange('brand_voice', e.target.value)}
            rows={8}
            placeholder="例：&#10;【人格】&#10;・30代後半の落ち着いた女性&#10;・IT企業で働いた経験あり&#10;・HSP当事者として発信&#10;&#10;【トーン】&#10;・穏やかで優しい語り口&#10;・押し付けがましくない&#10;・読者の気持ちに寄り添う"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
          />
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {updateMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          保存
        </button>
      </div>

      {/* 最終更新日時 */}
      {accountInfo.updated_at && (
        <p className="text-xs text-gray-400 text-right">
          最終更新: {new Date(accountInfo.updated_at).toLocaleString('ja-JP')}
        </p>
      )}
    </div>
  );
}
