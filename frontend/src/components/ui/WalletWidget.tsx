import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../redux/walletSlice';

export const WalletWidget: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { balance, pendingBalance, currency, transactions, isLoading } = useSelector(
    (state: any) => state.wallet
  );

  useEffect(() => {
    dispatch(fetchWallet());
  }, [dispatch]);

  if (isLoading && !balance) {
    return <div className="p-4 rounded-xl border animate-pulse">Завантаження балансу...</div>;
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-sm text-text-secondary font-medium">Доступний баланс</span>
          <div className="text-3xl font-bold tracking-tight text-text">
            {balance.toLocaleString('uk-UA')} <span className="text-xl font-normal text-text-secondary">{currency}</span>
          </div>
        </div>
        <div className="bg-surface-secondary px-4 py-2 rounded-xl border border-border">
          <span className="text-xs text-text-secondary block">Заблоковано (у ході змін)</span>
          <span className="text-lg font-semibold text-accent">
            {pendingBalance.toLocaleString('uk-UA')} {currency}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-text-secondary mb-3">Останній рух коштів</h4>
      <div className="space-y-2">
        {transactions && transactions.length > 0 ? (
          transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary text-sm"
            >
              <div>
                <p className="font-medium text-text">{tx.description || `Транзакція #${tx.id}`}</p>
                <span className="text-xs text-text-secondary">
                  {new Date(tx.createdAt).toLocaleDateString('uk-UA', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="text-right">
                <span className={`font-semibold ${tx.type === 'hold' ? 'text-warning' : 'text-success'}`}>
                  {tx.type === 'hold' ? '🔒 ' : '+'}
                  {tx.amount} {currency}
                </span>
                <span className="block text-xs uppercase tracking-wider text-text-secondary">{tx.status}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-text-secondary italic">Історія транзакцій порожня</p>
        )}
      </div>
    </div>
  );
};