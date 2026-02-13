'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Save, User, Tags, Sparkles, Eye } from 'lucide-react';
import type { CategoryConfig } from '@contenthub/types';
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
  type PersonaSettings,
} from '@/hooks/api/usePersona';
import {
  useCompetitors,
  useAddCompetitor,
  useDeleteCompetitor,
  type CompetitorAccount,
} from '@/hooks/api/useCompetitors';

// カラーパレット
const COLORS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899',
  '#14B8A6', '#6366F1', '#F97316', '#EF4444', '#84CC16',
];

type SettingsTab = 'categories' | 'persona' | 'competitors';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">設定</h1>
            <p className="text-sm text-gray-600">
              カテゴリ、ターゲット読者像、競合アカウントを設定できます
            </p>
          </div>

          {/* タブ切り替え */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('categories')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'categories'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Tags className="w-4 h-4" />
              カテゴリ
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
              onClick={() => setActiveTab('competitors')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === 'competitors'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Eye className="w-4 h-4" />
              競合アカウント
            </button>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'categories' ? (
            <CategorySettings />
          ) : activeTab === 'persona' ? (
            <PersonaSettingsPanel />
          ) : (
            <CompetitorSettingsPanel />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

// カテゴリ設定コンポーネント
function CategorySettings() {
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
    if (confirm('カテゴリ設定をデフォルトに戻しますか？')) {
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
              <h2 className="font-semibold text-gray-900">カテゴリ一覧</h2>
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
                  <p className="text-center text-gray-500 py-8">カテゴリがありません</p>
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
          <h2 className="font-semibold text-gray-900 mb-4">カテゴリを追加</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">カテゴリ名</label>
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
  const updateMutation = useUpdatePersona();

  const [persona, setPersona] = useState<PersonaSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [newProblem, setNewProblem] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (personaData) {
      setPersona(personaData);
      setHasChanges(false);
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

  const handleSave = async () => {
    if (!persona) return;
    await updateMutation.mutateAsync(persona);
    setHasChanges(false);
  };

  // AIでペルソナ例を生成
  const handleGeneratePersona = async () => {
    if (!persona) return;
    setIsGenerating(true);

    // TODO: Claude API連携
    // 現在はモック実装
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 入力情報からペルソナ例を生成
    const names = ['ゆい', 'みさき', 'あやか', 'りな', 'さくら', 'ゆか', 'まい'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const ageMatch = persona.ageRange.match(/(\d+)/);
    const baseAge = ageMatch ? parseInt(ageMatch[1]) : 25;
    const randomAge = baseAge + Math.floor(Math.random() * 10);

    const jobs = ['事務職', '営業', '販売スタッフ', 'カスタマーサポート', '経理', '一般事務'];
    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

    // 悩みと興味から説明文を生成
    const problemText = persona.problems.length > 0
      ? persona.problems.slice(0, 2).join('、')
      : '日々の生活に少し疲れを感じている';
    const interestText = persona.interests.length > 0
      ? persona.interests.join('や')
      : '新しいスキル';

    const description = `${persona.occupation}として働く${persona.gender}。${problemText}と感じている。SNSで同じような境遇の人の発信を見て共感したり、${interestText}の情報を集めたりしている。もっと自分らしく、無理なく働ける生き方を模索中。`;

    setPersona({
      ...persona,
      personaExample: {
        name: randomName,
        age: randomAge,
        job: randomJob,
        description,
      },
    });
    setHasChanges(true);
    setIsGenerating(false);
  };

  if (isLoading || !persona) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
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
              onKeyDown={(e) => e.key === 'Enter' && handleAddProblem()}
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
              onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
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
          disabled={isGenerating || persona.problems.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3
            bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl
            text-sm font-medium shadow-sm
            hover:from-indigo-600 hover:to-purple-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all"
        >
          {isGenerating ? (
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

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
  );
}

// 競合アカウント設定コンポーネント
const PLATFORM_OPTIONS: { value: CompetitorAccount['platform']; label: string; color: string }[] = [
  { value: 'note', label: 'NOTE', color: '#41C9B4' },
  { value: 'x', label: 'X', color: '#000000' },
  { value: 'threads', label: 'Threads', color: '#000000' },
];

function CompetitorSettingsPanel() {
  const { data: competitorData, isLoading } = useCompetitors();
  const addMutation = useAddCompetitor();
  const deleteMutation = useDeleteCompetitor();

  const [newAccount, setNewAccount] = useState<Omit<CompetitorAccount, 'id'>>({
    platform: 'note',
    username: '',
    displayName: '',
    description: '',
  });

  const accounts = competitorData?.accounts || [];

  const handleAddAccount = async () => {
    if (!newAccount.username.trim()) return;
    await addMutation.mutateAsync(newAccount);
    setNewAccount({
      platform: 'note',
      username: '',
      displayName: '',
      description: '',
    });
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  // プラットフォームごとにグループ化
  const groupedAccounts = {
    note: accounts.filter((a) => a.platform === 'note'),
    x: accounts.filter((a) => a.platform === 'x'),
    threads: accounts.filter((a) => a.platform === 'threads'),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左側: アカウント一覧 */}
      <div className="lg:col-span-2 space-y-6">
        {PLATFORM_OPTIONS.map((platform) => (
          <div
            key={platform.value}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              <h2 className="font-semibold text-gray-900">{platform.label}</h2>
              <span className="text-xs text-gray-500">
                {groupedAccounts[platform.value].length}件
              </span>
            </div>

            <div className="p-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : groupedAccounts[platform.value].length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  まだ登録されていません
                </p>
              ) : (
                <div className="space-y-3">
                  {groupedAccounts[platform.value].map((account) => (
                    <div
                      key={account.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {account.displayName || account.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{account.username}
                        </p>
                        {account.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {account.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 右側: 新規追加 */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">アカウントを追加</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                プラットフォーム
              </label>
              <select
                value={newAccount.platform}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, platform: e.target.value as CompetitorAccount['platform'] })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                ユーザー名 / URL <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                placeholder="例: @example または URL"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                表示名（任意）
              </label>
              <input
                type="text"
                value={newAccount.displayName}
                onChange={(e) => setNewAccount({ ...newAccount, displayName: e.target.value })}
                placeholder="例: 〇〇さん"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                メモ（任意）
              </label>
              <textarea
                value={newAccount.description}
                onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                placeholder="例: HSP系で有料note販売、フォロワー1万人"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm resize-none"
              />
            </div>

            <button
              onClick={handleAddAccount}
              disabled={!newAccount.username.trim() || addMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              追加
            </button>
          </div>
        </div>

        {/* ヒント */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <h3 className="text-sm font-medium text-indigo-800 mb-2">
            選定のコツ
          </h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• 同ジャンルで活発に発信している人</li>
            <li>• フォロワー5,000〜50,000人程度の中規模アカウント</li>
            <li>• 「少し先を行く先輩」的な存在がおすすめ</li>
          </ul>
        </div>

        {/* 登録数サマリー */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">登録状況</h2>
          <div className="space-y-2">
            {PLATFORM_OPTIONS.map((platform) => (
              <div key={platform.value} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{platform.label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {groupedAccounts[platform.value].length}件
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">合計</span>
              <span className="text-sm font-medium text-indigo-600">
                {accounts.length}件
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
