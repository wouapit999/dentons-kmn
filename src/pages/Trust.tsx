import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, CheckCircle } from "lucide-react";
import { mockTrustAccounts, mockTrustTransactions, mockClients } from "../data/mockData";
import { TrustAccount, TrustTransaction } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

export default function Trust() {
  const { t } = useTranslation();
  const [accounts] = useState<TrustAccount[]>(mockTrustAccounts);
  const [transactions] = useState<TrustTransaction[]>(mockTrustTransactions);
  const [selectedAccount, setSelectedAccount] = useState<TrustAccount | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [transType, setTransType] = useState<"deposit" | "withdrawal" | "transfer">("deposit");

  const getClient = (id: string) => mockClients.find(c => c.id === id);
  const getAccountTransactions = (id: string) => transactions.filter(t2 => t2.trustAccountId === id);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const typeColor: Record<string, string> = { deposit: "badge-green", withdrawal: "badge-red", transfer: "badge-blue" };
  const typeLabel: Record<string, string> = { deposit: t("trust.deposit"), withdrawal: t("trust.withdrawal"), transfer: t("trust.transfer") };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("trust.title")}</div>
          <div className="page-header-subtitle">{accounts.length} comptes</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Nouvelle transaction</button>
      </div>

      {/* Total balance banner */}
      <div style={{ background: "var(--primary)", color: "white", borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Solde total des comptes séquestres</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{fmt(totalBalance)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{accounts.length} comptes actifs</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Dernière réconciliation: 31/05/2026</div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <CheckCircle size={14} />
            <span style={{ fontSize: 12 }}>Réconcilié</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Accounts list */}
        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">{t("trust.title")}</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              {accounts.map(acc => {
                const client = getClient(acc.clientId);
                const accTrans = getAccountTransactions(acc.id);
                return (
                  <div key={acc.id} onClick={() => setSelectedAccount(acc)}
                    style={{ padding: "16px 20px", cursor: "pointer", borderBottom: "1px solid var(--gray-100)", background: selectedAccount?.id === acc.id ? "var(--gray-50)" : "white", transition: "background 0.1s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{client?.name}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2, fontFamily: "monospace" }}>{acc.accountNumber}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--primary)" }}>{fmt(acc.balance)}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>{accTrans.length} transactions</div>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ marginTop: 10 }}>
                      <div className="progress-fill" style={{ width: `${Math.min(100, (acc.balance / totalBalance) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          {selectedAccount ? (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t("trust.transactionHistory")}</span>
                <span style={{ fontSize: 12, color: "var(--gray-500)" }}>{getClient(selectedAccount.clientId)?.name}</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {getAccountTransactions(selectedAccount.id).map(trans => (
                  <div key={trans.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--gray-100)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className={`badge ${typeColor[trans.type]}`}>{typeLabel[trans.type]}</span>
                          {trans.reference && <span style={{ fontSize: 11, color: "var(--gray-400)", fontFamily: "monospace" }}>{trans.reference}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--gray-700)" }}>{trans.description}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>{trans.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: trans.type === "deposit" ? "var(--success)" : "var(--danger)" }}>
                          {trans.type === "deposit" ? "+" : "-"}{fmt(trans.amount)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                          Solde: {fmt(trans.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--gray-400)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏦</div>
              <div style={{ fontWeight: 500 }}>Sélectionnez un compte pour voir l'historique</div>
            </div>
          )}

          {/* Three-way reconciliation */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">{t("trust.threeWayReconciliation")}</span></div>
            <div className="card-body">
              {[
                [t("trust.bankBalance"), fmt(totalBalance + 150000), true],
                [t("trust.trustLedger"), fmt(totalBalance), true],
                [t("trust.clientLedger"), fmt(totalBalance), true],
                ["Écart", fmt(150000), false],
              ].map(([label, val, ok], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--gray-100)" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-700)", fontWeight: 500 }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{val}</span>
                    <CheckCircle size={15} color={ok ? "var(--success)" : "var(--warning)"} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }}>{t("trust.reconcile")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nouvelle transaction séquestre</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t("common.type")}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["deposit","withdrawal","transfer"] as const).map(type => (
                    <button key={type} className={`btn ${transType === type ? "btn-primary" : "btn-outline"} btn-sm`} onClick={() => setTransType(type)}>
                      {typeLabel[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("trust.account")}</label>
                <select className="form-control">
                  {accounts.map(a => <option key={a.id}>{getClient(a.clientId)?.name} – {a.accountNumber}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("common.amount")} (FCFA)</label>
                  <input className="form-control" type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("common.date")}</label>
                  <input className="form-control" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary">{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
