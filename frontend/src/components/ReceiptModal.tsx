import React from 'react';
import { CheckCircle2, X, Printer, Share2, ShieldCheck } from 'lucide-react';
import { Transaction } from '../types';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-6 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Transaction Receipt</h2>
          <p className="text-emerald-100 text-sm">NativePay Verified Transaction</p>
        </div>

        {/* Amount Hero */}
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
          <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">
            Amount Transferred
          </p>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ₦{transaction.amount.toLocaleString()}
          </div>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Biometrically Verified
          </div>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-3.5 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Recipient</span>
            <span className="font-semibold text-slate-900">{transaction.recipient || 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Action</span>
            <span className="font-semibold text-slate-900 capitalize">{transaction.action}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Reference</span>
            <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">
              {transaction.reference}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Date & Time</span>
            <span className="font-medium text-slate-700">
              {new Date(transaction.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Transfer Fee</span>
            <span className="font-medium text-emerald-700">₦0.00 (Free)</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 capitalize">
              ● {transaction.status}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors cursor-pointer text-sm shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
