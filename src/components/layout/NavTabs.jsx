import { NavLink } from 'react-router-dom';

const tabs = [
  { path: '/', icon: 'ا', label: 'Alphabet' },
  { path: '/quiz', icon: '⚔', label: 'Quiz' },
  { path: '/words', icon: '📝', label: 'Words' },
  { path: '/reading', icon: '📖', label: 'Reading' },
  { path: '/progress', icon: '📊', label: 'Progress' },
];

export default function NavTabs() {
  return (
    <div className="nav-tabs">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `nav-tab${isActive ? ' active' : ''}`
          }
        >
          <span className="tab-icon">{tab.icon}</span> {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
