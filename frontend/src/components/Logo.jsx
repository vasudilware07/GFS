export default function Logo({ className = "h-12 w-12", showText = false }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 200 200" className="h-full w-auto">
        <defs>
          <linearGradient id="fruitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Background Circle */}
        <circle cx="100" cy="100" r="95" fill="url(#fruitGradient)" />
        
        {/* Inner White Circle */}
        <circle cx="100" cy="100" r="80" fill="white" />
        
        {/* Fruit/Apple Shape */}
        <ellipse cx="100" cy="115" rx="45" ry="50" fill="url(#fruitGradient)" />
        
        {/* Apple Indent */}
        <ellipse cx="100" cy="70" rx="12" ry="8" fill="white" />
        
        {/* Leaf */}
        <path d="M100 65 Q115 45 130 55 Q120 70 100 65" fill="url(#leafGradient)" />
        
        {/* Stem */}
        <rect x="97" y="55" width="6" height="15" rx="2" fill="#8B4513" />
        
        {/* LBR Text */}
        <text x="100" y="130" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="32" fontWeight="bold" fill="white">LBR</text>
        
        {/* Highlight */}
        <ellipse cx="80" cy="100" rx="8" ry="12" fill="rgba(255,255,255,0.3)" />
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-green-600">LBR Fruit</span>
          <span className="text-xs text-gray-500">Suppliers</span>
        </div>
      )}
    </div>
  );
}

// Simple icon version without text inside
export function LogoIcon({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <defs>
        <linearGradient id="fruitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      
      {/* Apple Shape */}
      <ellipse cx="100" cy="115" rx="55" ry="60" fill="url(#fruitGrad)" />
      
      {/* Apple Indent */}
      <ellipse cx="100" cy="60" rx="15" ry="10" fill="white" />
      
      {/* Leaf */}
      <path d="M100 55 Q120 30 145 45 Q125 65 100 55" fill="url(#leafGrad)" />
      
      {/* Stem */}
      <rect x="95" y="42" width="10" height="20" rx="3" fill="#8B4513" />
      
      {/* Highlight */}
      <ellipse cx="75" cy="100" rx="12" ry="18" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}
