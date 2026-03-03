import React, { useEffect, useState } from 'react';
import MainLayout from './layout/MainLayout';
import RuleConfigPage from './pages/RuleConfigPage';
import RuleListPage from './pages/RuleListPage';

function App() {
  const [selectedMenuKey, setSelectedMenuKey] = useState('rule-config');

  useEffect(() => {
    const handler = event => {
      if (event.detail === 'rule-config') {
        setSelectedMenuKey('rule-config');
      }
    };
    window.addEventListener('switch-menu', handler);
    return () => window.removeEventListener('switch-menu', handler);
  }, []);

  const renderContent = () => {
    if (selectedMenuKey === 'rule-config') return <RuleConfigPage />;
    if (selectedMenuKey === 'rule-list') return <RuleListPage />;
    return null;
  };

  return (
    <MainLayout
      selectedMenuKey={selectedMenuKey}
      onMenuChange={setSelectedMenuKey}
    >
      {renderContent()}
    </MainLayout>
  );
}

export default App;

