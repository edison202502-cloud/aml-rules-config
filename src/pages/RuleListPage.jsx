import React, { useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  message
} from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Resizable } from 'react-resizable';
import { RULE_STATUS, useRuleContext } from '../context/RuleContext';

const { confirm } = Modal;

const ResizableTitle = props => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={e => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

function RuleListPage() {
  const { rules, toggleRuleStatus, resetToMock, setEditingRule } =
    useRuleContext();

  const [searchValue, setSearchValue] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  });

  const filteredData = useMemo(() => {
    if (!searchValue) return rules;
    const keyword = searchValue.trim().toLowerCase();
    return rules.filter(
      r =>
        r.ruleName.toLowerCase().includes(keyword) ||
        r.ruleCode.toLowerCase().includes(keyword)
    );
  }, [rules, searchValue]);

  const handleTableChange = pag => {
    setPagination({
      current: pag.current,
      pageSize: pag.pageSize
    });
  };

  const handleRefresh = () => {
    resetToMock();
    setSearchValue('');
    setPagination({
      current: 1,
      pageSize: 10
    });
    message.success('Rules refreshed.');
  };

  const handleQuery = () => {
    // reset to first page with current search keyword
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleToggleStatus = record => {
    const isEnable = record.status === RULE_STATUS.ENABLE;
    confirm({
      title: `Confirm to ${isEnable ? 'disable' : 'enable'} this rule?`,
      content: `Rule code: ${record.ruleCode}\nRule name: ${record.ruleName}`,
      okText: isEnable ? 'Disable' : 'Enable',
      okButtonProps: isEnable ? { danger: true } : { type: 'primary' },
      cancelText: 'Cancel',
      onOk: () => {
        toggleRuleStatus(record.ruleId);
        message.success(`Rule ${isEnable ? 'disabled' : 'enabled'}.`);
      }
    });
  };

  const handleEdit = record => {
    setEditingRule({
      source: 'configured',
      data: record
    });
    window.dispatchEvent(
      new CustomEvent('switch-menu', { detail: 'rule-config' })
    );
  };

  const locale = {
    emptyText: (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No rule data"
      />
    )
  };

  const [cols, setCols] = useState([
    {
      title: 'No.',
      dataIndex: 'index',
      width: 80,
      align: 'center',
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Rule Code',
      dataIndex: 'ruleCode',
      width: 220
    },
    {
      title: 'Rule Name',
      dataIndex: 'ruleName',
      width: 260
    },
    {
      title: 'Rule Description',
      dataIndex: 'ruleDesc',
      width: 640,
      ellipsis: false,
      render: text =>
        text ? (
          <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {text}
          </div>
        ) : (
          '-'
        )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      align: 'center',
      render: status =>
        status === RULE_STATUS.ENABLE ? (
          <Tag color="green">Enabled</Tag>
        ) : (
          <Tag color="red">Disabled</Tag>
        )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 220,
      align: 'center',
      render: (_, record) => {
        const isEnable = record.status === RULE_STATUS.ENABLE;
        return (
          <Space>
            <Button onClick={() => handleEdit(record)}>Edit</Button>
            <Button
              type={isEnable ? 'default' : 'primary'}
              danger={isEnable}
              onClick={() => handleToggleStatus(record)}
            >
              {isEnable ? 'Disable' : 'Enable'}
            </Button>
          </Space>
        );
      }
    }
  ]);

  const components = {
    header: {
      cell: ResizableTitle
    }
  };

  const columns = cols.map((col, index) => ({
    ...col,
    onHeaderCell: column => ({
      width: column.width,
      onResize: (_, { size }) => {
        setCols(prev => {
          const next = [...prev];
          next[index] = { ...next[index], width: size.width };
          return next;
        });
      }
    })
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Configured Rules</h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 16
        }}
      >
        <Input
          allowClear
          placeholder="Search by rule name / code"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value);
            setPagination(prev => ({ ...prev, current: 1 }));
          }}
          style={{ maxWidth: 320 }}
        />
        <Space>
          <Button type="primary" onClick={handleQuery}>
            Query
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        rowKey="ruleId"
        components={components}
        columns={columns}
        dataSource={filteredData}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredData.length,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: total => `Total ${total}`
        }}
        onChange={handleTableChange}
        locale={locale}
        scroll={{ x: 'max-content', y: 400 }}
      />
    </div>
  );
}

export default RuleListPage;

