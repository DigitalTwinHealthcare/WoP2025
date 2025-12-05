import * as LucideIcons from 'lucide-react';

const Icon = ({ name, size = 24, color = 'currentColor', className = '', ...props }) => {
  const LucideIcon = LucideIcons[name];
  
  if (!LucideIcon) {
    console.warn(`Icon '${name}' not found`);
    return null;
  }

  return (
    <LucideIcon 
      size={size} 
      color={color} 
      className={className}
      {...props} 
    />
  );
};

export default Icon;
