'use client';

import { Plus } from 'lucide-react';
import { SampleInputItem } from './SampleInputItem';

interface SampleInputListProps {
  samples: string[];
  onChange: (samples: string[]) => void;
  maxSamples?: number;
}

export function SampleInputList({
  samples,
  onChange,
  maxSamples = 10,
}: SampleInputListProps) {
  const handleSampleChange = (index: number, value: string) => {
    const newSamples = [...samples];
    newSamples[index] = value;
    onChange(newSamples);
  };

  const handleAddSample = () => {
    if (samples.length < maxSamples) {
      onChange([...samples, '']);
    }
  };

  const handleRemoveSample = (index: number) => {
    if (samples.length > 1) {
      const newSamples = samples.filter((_, i) => i !== index);
      onChange(newSamples);
    }
  };

  return (
    <div className="space-y-3">
      {samples.map((sample, index) => (
        <SampleInputItem
          key={index}
          index={index}
          value={sample}
          onChange={(value) => handleSampleChange(index, value)}
          onRemove={() => handleRemoveSample(index)}
          canRemove={samples.length > 1}
        />
      ))}

      {samples.length < maxSamples && (
        <button
          onClick={handleAddSample}
          className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600
            hover:bg-indigo-50 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          サンプルを追加
        </button>
      )}

      <p className="text-xs text-gray-500">
        {samples.length} / {maxSamples} サンプル
      </p>
    </div>
  );
}
