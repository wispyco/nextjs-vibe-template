'use client';

interface AppTileProps {
  title: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function AppTile({ title, isSelected, onClick }: AppTileProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'bg-white hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <h3 className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-sm mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
        Click to view details
      </p>
    </div>
  );
}
