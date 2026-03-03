import React from 'react';
import { Layout, Menu } from 'antd';
import {
  ProfileOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import styles from '../styles/AppLayout.module.css';

const { Header, Content, Footer, Sider } = Layout;

const menuItems = [
  {
    key: 'rule-config',
    icon: <ProfileOutlined />,
    label: 'Rule Configuration'
  },
  {
    key: 'rule-list',
    icon: <UnorderedListOutlined />,
    label: 'Configured Rules'
  }
];

function MainLayout({ selectedMenuKey, onMenuChange, children }) {
  return (
    <Layout className={styles.appLayout}>
      <Header className={styles.header}>
        <div className={styles.logo}>AML Rule Management</div>
      </Header>
      <Layout>
        <Sider width={220} className={styles.sider}>
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[selectedMenuKey]}
            onClick={info => onMenuChange(info.key)}
            items={[
              {
                key: 'rule-group',
                label: 'Rule Management',
                children: menuItems
              }
            ]}
          />
        </Sider>
        <Layout className={styles.main}>
          <Content className={styles.content}>{children}</Content>
          <Footer className={styles.footer}>
            AML Monitoring Rule Configuration · Demo
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default MainLayout;

