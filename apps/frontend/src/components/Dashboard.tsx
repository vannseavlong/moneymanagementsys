import React from 'react'
import { FinancialDashboard } from './ComprehensiveDashboard'

export const Dashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  return <FinancialDashboard onLogout={onLogout} />
}