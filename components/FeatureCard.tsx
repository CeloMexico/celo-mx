'use client';
import Image from 'next/image';

export default function FeatureCard({ title, description, icon }: { title: string; description: string; icon?: string }) {
  return (
    <div 
      className="relative rounded-none p-4 sm:p-5 lg:p-6 h-full cursor-pointer overflow-hidden group transition-all duration-300 ease-in-out"
      style={{ 
        background: 'transparent',
        border: '0.5px solid #374151'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(to bottom, #ffff66, #fffacd)';
        e.currentTarget.style.borderColor = '#000';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = '#374151';
      }}
    >
      
      {/* Contenido de la tarjeta */}
      <div className="relative z-10">
        <div className="mb-3 sm:mb-4">
          <Image 
            src={`/icons/${icon}.svg`} 
            alt={title}
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl leading-tight text-gray-900 mb-2" style={{ fontFamily: 'GT Alpina VAR Trial, ui-serif, system-ui', fontWeight: 400 }}>{title}</h3>
        <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}



