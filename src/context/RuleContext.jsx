import React, {
  createContext,
  useContext,
  useMemo,
  useState
} from 'react';
import dayjs from 'dayjs';

export const RULE_STATUS = {
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE'
};

const todayStrForMock = '20260302';

const initialRules = [
  {
    ruleId: 1,
    ruleCode: `AML_RULE_${todayStrForMock}_001`,
    ruleName: 'High-risk customer large cumulative amount',
    ruleDesc:
      'Monitor high-risk customers whose total transaction amount in a single day is greater than or equal to 500,000 CNY',
    conditions: [
      {
        timeRange: 'Single day',
        target: 'High-risk customer',
        txType: 'All transaction types',
        txStatus: 'Success',
        aggregation: 'Cumulative amount ≥ threshold',
        operator: '>=',
        thresholdValue: 500000,
        unit: 'CNY'
      }
    ],
    logicExpression: '1',
    status: RULE_STATUS.ENABLE
  },
  {
    ruleId: 2,
    ruleCode: `AML_RULE_${todayStrForMock}_002`,
    ruleName: 'Cross-border transfer to high-risk country',
    ruleDesc: 'Monitor cross-border transfers whose counterparty is in a high-risk country',
    conditions: [
      {
        timeRange: 'Single day',
        target: 'Cross-border counterparty in high-risk country',
        txType: 'Transfer',
        txStatus: 'Success',
        aggregation: 'Single transaction amount ≥ threshold',
        operator: '>=',
        thresholdValue: 100000,
        unit: 'CNY'
      }
    ],
    logicExpression: '1',
    status: RULE_STATUS.DISABLE
  },
  {
    ruleId: 3,
    ruleCode: `AML_RULE_${todayStrForMock}_003`,
    ruleName: 'Frequent small outgoing transfers',
    ruleDesc: 'Monitor accounts whose number of small outgoing transactions in a single day ≥ 30',
    conditions: [
      {
        timeRange: 'Single day',
        target: 'All customers',
        txType: 'Transfer',
        txStatus: 'Success',
        aggregation: 'Number of transactions ≥ threshold',
        operator: '>=',
        thresholdValue: 30,
        unit: 'Transactions'
      }
    ],
    logicExpression: '1',
    status: RULE_STATUS.ENABLE
  },
  {
    ruleId: 4,
    ruleCode: `AML_RULE_${todayStrForMock}_004`,
    ruleName: 'Concentrated large transactions during night',
    ruleDesc: 'Monitor large transactions concentrated between 23:00 and 06:00',
    conditions: [
      {
        timeRange: 'Last 7 days',
        target: 'All customers',
        txType: 'All transaction types',
        txStatus: 'Success',
        aggregation: 'Cumulative amount ≥ threshold',
        operator: '>=',
        thresholdValue: 1000000,
        unit: 'CNY'
      }
    ],
    logicExpression: '1',
    status: RULE_STATUS.DISABLE
  },
  {
    ruleId: 5,
    ruleCode: `AML_RULE_${todayStrForMock}_005`,
    ruleName: 'High-frequency transactions to same counterparty',
    ruleDesc: 'Monitor customers whose number of transactions to the same counterparty in a single day ≥ 20',
    conditions: [
      {
        timeRange: 'Single day',
        target: 'All customers',
        txType: 'All transaction types',
        txStatus: 'Success',
        aggregation: 'Number of transactions ≥ threshold',
        operator: '>=',
        thresholdValue: 20,
        unit: 'Transactions'
      }
    ],
    logicExpression: '1',
    status: RULE_STATUS.ENABLE
  }
];

const initialDrafts = [
  {
    ruleId: 1,
    ruleCode: `AML_RULE_${todayStrForMock}_001`,
    ruleName: 'High-risk customer large cumulative amount',
    ruleDesc:
      'Monitor high-risk customers whose total transaction amount in a single day is greater than or equal to 500,000 CNY',
    conditions: initialRules[0].conditions,
    logicExpression: initialRules[0].logicExpression
  },
  {
    ruleId: 2,
    ruleCode: `AML_RULE_${todayStrForMock}_002`,
    ruleName: 'Cross-border transfer to high-risk country',
    ruleDesc: 'Monitor cross-border transfers whose counterparty is in a high-risk country',
    conditions: initialRules[1].conditions,
    logicExpression: initialRules[1].logicExpression
  },
  {
    ruleId: 3,
    ruleCode: `AML_RULE_${todayStrForMock}_003`,
    ruleName: 'Frequent small outgoing transfers',
    ruleDesc: 'Monitor accounts whose number of small outgoing transactions in a single day ≥ 30',
    conditions: initialRules[2].conditions,
    logicExpression: initialRules[2].logicExpression
  }
];

const RuleContext = createContext(null);

export function RuleProvider({ children }) {
  const [rules, setRules] = useState(initialRules);
  const [draftRules, setDraftRules] = useState(initialDrafts);
  const [editingRule, setEditingRule] = useState(null);

  const resetToMock = () => {
    setRules(initialRules);
    setDraftRules(initialDrafts);
    setEditingRule(null);
  };

  const generateRuleCode = () => {
    const todayStr = dayjs().format('YYYYMMDD');
    const prefix = `AML_RULE_${todayStr}_`;
    const allCodes = [...rules, ...draftRules]
      .filter(r => r.ruleCode && r.ruleCode.startsWith(prefix))
      .map(r => r.ruleCode);

    let maxSeq = 0;
    allCodes.forEach(code => {
      const parts = code.split('_');
      const seqStr = parts[parts.length - 1];
      const num = parseInt(seqStr, 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
  };

  const addDraft = values => {
    const nextId =
      (draftRules.length
        ? Math.max(...draftRules.map(r => r.ruleId))
        : 0) + 1;
    const newDraft = {
      ruleId: nextId,
      ruleCode: values.ruleCode,
      ruleName: values.ruleName,
      ruleDesc: values.ruleDesc || '',
      // 可选：规则逻辑结构化信息
      conditions: values.conditions || [],
      logicExpression: values.logicExpression || ''
    };
    setDraftRules(prev => [...prev, newDraft]);
    return newDraft;
  };

  const updateDraft = (ruleId, values) => {
    setDraftRules(prev =>
      prev.map(r => (r.ruleId === ruleId ? { ...r, ...values } : r))
    );
  };

  const deleteDraft = ruleId => {
    setDraftRules(prev => prev.filter(r => r.ruleId !== ruleId));
  };

  const addConfiguredRule = values => {
    const nextId =
      (rules.length ? Math.max(...rules.map(r => r.ruleId)) : 0) + 1;
    const newRule = {
      ruleId: nextId,
      ruleCode: values.ruleCode,
      ruleName: values.ruleName,
      ruleDesc: values.ruleDesc || '',
      conditions: values.conditions || [],
      logicExpression: values.logicExpression || '',
      status: RULE_STATUS.DISABLE
    };
    setRules(prev => [...prev, newRule]);
    return newRule;
  };

  const updateConfiguredRule = (ruleId, values) => {
    setRules(prev =>
      prev.map(r =>
        r.ruleId === ruleId
          ? {
              ...r,
              ruleName: values.ruleName,
              ruleDesc: values.ruleDesc || r.ruleDesc,
              conditions:
                values.conditions !== undefined
                  ? values.conditions
                  : r.conditions || [],
              logicExpression:
                values.logicExpression !== undefined
                  ? values.logicExpression
                  : r.logicExpression || ''
            }
          : r
      )
    );
  };

  const deleteConfiguredRule = ruleId => {
    setRules(prev => prev.filter(r => r.ruleId !== ruleId));
  };

  const toggleRuleStatus = ruleId => {
    setRules(prev =>
      prev.map(r =>
        r.ruleId === ruleId
          ? {
              ...r,
              status:
                r.status === RULE_STATUS.ENABLE
                  ? RULE_STATUS.DISABLE
                  : RULE_STATUS.ENABLE
            }
          : r
      )
    );
  };

  const value = useMemo(
    () => ({
      rules,
      draftRules,
      editingRule,
      setEditingRule,
      generateRuleCode,
      addDraft,
      updateDraft,
      deleteDraft,
      addConfiguredRule,
      updateConfiguredRule,
      deleteConfiguredRule,
      toggleRuleStatus,
      resetToMock
    }),
    [rules, draftRules, editingRule]
  );

  return (
    <RuleContext.Provider value={value}>{children}</RuleContext.Provider>
  );
}

export function useRuleContext() {
  const ctx = useContext(RuleContext);
  if (!ctx) {
    throw new Error('useRuleContext 必须在 RuleProvider 中使用');
  }
  return ctx;
}

