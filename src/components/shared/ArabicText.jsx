export default function ArabicText({ children, className = '', ...props }) {
  return (
    <span
      className={`arabic ${className}`}
      style={{ fontFamily: "'Amiri', serif", direction: 'rtl' }}
      {...props}
    >
      {children}
    </span>
  );
}
