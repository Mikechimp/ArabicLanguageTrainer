import { useState, useEffect, useCallback } from 'react';

let showComboGlobal = null;

export function triggerCombo(text) {
  if (showComboGlobal) showComboGlobal(text);
}

export default function ComboPopup() {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg) => {
    setText(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 1500);
  }, []);

  useEffect(() => {
    showComboGlobal = show;
    return () => {
      showComboGlobal = null;
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div className="combo-popup show">
      {text}
    </div>
  );
}
