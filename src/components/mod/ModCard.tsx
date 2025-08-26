import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ModData, ModDetails } from '../../types/mod';
import { clsx } from 'clsx';

interface ModCardProps {
  mod: ModData;
  details?: ModDetails;
  isSelected: boolean;
  hasConflicts: boolean;
  onToggle: (modId: string) => void;
  onViewDetails: (modId: string) => void;
}

export const ModCard: React.FC<ModCardProps> = ({
  mod,
  details,
  isSelected,
  hasConflicts,
  onToggle,
  onViewDetails
}) => {
  const [imageError, setImageError] = useState(false);

  const getStatusIcon = () => {
    if (hasConflicts) {
      return (
        <ExclamationTriangleIcon 
          className="h-5 w-5 text-red-500" 
          aria-label="Has conflicts"
        />
      );
    }
    
    return mod.status === 'installé' ? (
      <CheckCircleIcon 
        className="h-5 w-5 text-green-500" 
        aria-label="Installed"
      />
    ) : null;
  };

  const getToggleIcon = () => {
    return isSelected ? (
      <MinusCircleIcon className="h-5 w-5" />
    ) : (
      <PlusCircleIcon className="h-5 w-5" />
    );
  };

  const cardClasses = clsx(
    'group relative card-glass transition-all duration-200',
    'hover:border-amber-300 focus-within:ring-2 focus-within:ring-amber-500 focus-within:ring-offset-2',
    {
      'border-green-400/60 bg-green-100/20': isSelected && !hasConflicts,
      'border-red-400/60 bg-red-100/20': hasConflicts,
      'border-transparent': !isSelected && !hasConflicts,
    }
  );

  const buttonClasses = clsx(
    'w-full p-4 text-left focus:outline-none focus:ring-0',
    'disabled:opacity-75 disabled:cursor-not-allowed'
  );

  const categoryColors: Record<string, string> = {
    'Qualité de vie': 'bg-blue-100/60 text-blue-700 border border-blue-200/40',
    'survie': 'bg-green-100/60 text-green-700 border border-green-200/40',
    'librairie': 'bg-purple-100/60 text-purple-700 border border-purple-200/40',
    'armes': 'bg-red-100/60 text-red-700 border border-red-200/40',
    'nouriture': 'bg-amber-100/60 text-amber-700 border border-amber-200/40',
    'generation': 'bg-indigo-100/60 text-indigo-700 border border-indigo-200/40',
    'visual': 'bg-pink-100/60 text-pink-700 border border-pink-200/40',
    'Modpack': 'bg-amber-100/60 text-amber-700 border border-amber-200/40',
    'default': 'bg-tertiary/20 text-tertiary border border-tertiary/20'
  };

  const categoryClass = categoryColors[mod.category] || categoryColors.default;

  return (
    <article
      className={cardClasses}
      role="article"
      aria-labelledby={`mod-title-${mod.id}`}
      aria-describedby={`mod-description-${mod.id}`}
    >
      {/* Main card content */}
      <button
        className={buttonClasses}
        onClick={() => onViewDetails(mod.id)}
        aria-describedby={`mod-status-${mod.id}`}
      >
        <div className="flex items-start space-x-3">
          {/* Mod image */}
          <div className="flex-shrink-0 w-12 h-12 bg-tertiary/20 rounded-md overflow-hidden">
            {details?.imageUrl && !imageError ? (
              <img
                src={details.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <span className="text-amber-600 text-xs font-medium">
                  {mod.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Mod info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 
                  id={`mod-title-${mod.id}`}
                  className="text-sm font-medium text-primary truncate group-hover:text-amber-700 transition-colors"
                >
                  {mod.name}
                </h3>
                
                {details?.description && (
                  <p 
                    id={`mod-description-${mod.id}`}
                    className="mt-1 text-xs text-secondary line-clamp-2"
                  >
                    {details.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="mt-2 flex items-center space-x-2">
                  <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', categoryClass)}>
                    {mod.category}
                  </span>
                  
                  {mod.side !== 'Both' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-tertiary/20 text-tertiary">
                      {mod.side}
                    </span>
                  )}
                </div>

                {/* Dependencies indicator */}
                {mod.dependencies.length > 0 && (
                  <div className="mt-1 text-xs text-tertiary">
                    <InformationCircleIcon className="inline h-3 w-3 mr-1" />
                    {mod.dependencies.length} dependencies
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0 ml-2">
                {getStatusIcon()}
              </div>
            </div>
          </div>
        </div>

        {/* Additional details for expanded view */}
        {details && (
          <div className="mt-3 pt-3 border-t border-primary/10">
            <div className="flex items-center justify-between text-xs text-tertiary">
              <span>by {details.author}</span>
              <div className="flex items-center space-x-3">
                <span>{details.downloads} downloads</span>
                <span>v{details.version}</span>
              </div>
            </div>
          </div>
        )}
      </button>

      {/* Action button overlay */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(mod.id);
          }}
          className={clsx(
            'p-2 rounded-full shadow-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
            'opacity-0 group-hover:opacity-100',
            {
              'bg-green-500 text-white hover:bg-green-600': isSelected && !hasConflicts,
              'bg-red-500 text-white hover:bg-red-600': hasConflicts,
              'bg-amber-500 text-white hover:bg-amber-600': !isSelected && !hasConflicts,
            }
          )}
          aria-label={isSelected ? `Remove ${mod.name} from pack` : `Add ${mod.name} to pack`}
          disabled={hasConflicts}
        >
          {getToggleIcon()}
        </button>
      </div>

      {/* Conflict indicator */}
      {hasConflicts && (
        <div 
          id={`mod-status-${mod.id}`}
          className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm"
          role="status"
          aria-label="Mod has conflicts"
        >
          Conflict
        </div>
      )}
    </article>
  );
};