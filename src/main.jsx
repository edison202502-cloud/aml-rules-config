import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import App from './App';
import { RuleProvider } from './context/RuleContext';
import 'antd/dist/reset.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={enUS}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorSuccess: '#52c41a',
          colorError: '#f5222d',
          fontFamily: '"Microsoft YaHei", "Inter", sans-serif',
          fontSize: 14
        }
      }}
    >
      <RuleProvider>
        <App />
      </RuleProvider>
    </ConfigProvider>
  </React.StrictMode>
);

