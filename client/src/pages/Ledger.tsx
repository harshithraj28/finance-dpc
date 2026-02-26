import { useEffect, useState } from "react";

interface Account {
  id: number;
  name: string;
  code: string;
}

interface Transaction {
  id: number;
  accountId: number;
  name: string;
  amount: string;
  type: string;
  detail?: string;
  date: string;
}

export default function Ledger() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("credit");
  const [detail, setDetail] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const today = new Date().toLocaleDateString("en-GB");

  // ==============================
  // LOAD DATA
  // ==============================
  const loadTransactions = async () => {
    try {
      const res = await fetch("/api/transactions/today");
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setDashboard(data || null);
    } catch {
      setDashboard(null);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadDashboard();
  }, []);

  // ==============================
  // SEARCH ACCOUNTS
  // ==============================
  const searchAccounts = async (value: string) => {
    setSearch(value);
    if (!value) return setAccounts([]);

    try {
      const res = await fetch(`/api/accounts/search?q=${value}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      setAccounts([]);
    }
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
    setSearch(`${account.code} - ${account.name}`);
    setAccounts([]);
  };

  // ==============================
  // SAVE / UPDATE
  // ==============================
  const saveTransaction = async () => {
    if (!selectedAccount || !amount) {
      alert("Fill required fields");
      return;
    }

    try {
      if (editingId) {
        await fetch(`/api/transactions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, type, detail })
        });
      } else {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: selectedAccount.id,
            amount,
            type,
            detail
          })
        });
      }

      // Reset form
      setAmount("");
      setDetail("");
      setEditingId(null);
      setSelectedAccount(null);
      setSearch("");

      loadTransactions();
      loadDashboard();

    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const editTransaction = (tx: Transaction) => {
    setEditingId(tx.id);
    setSelectedAccount({
      id: tx.accountId,
      name: tx.name,
      code: ""
    });
    setSearch(tx.name);
    setAmount(tx.amount);
    setType(tx.type);
    setDetail(tx.detail || "");
  };

  const deleteTransaction = async (id: number) => {
    if (!window.confirm("Delete this transaction?")) return;

    try {
      await fetch(`/api/transactions/${id}`, {
        method: "DELETE"
      });

      loadTransactions();
      loadDashboard();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEnter = (e: any) => {
    if (e.key === "Enter") {
      saveTransaction();
    }
  };

  // ==============================
  // STYLES
  // ==============================
  const thStyle = {
    border: "1px solid #ddd",
    padding: "8px",
    background: "#f4f6f8",
    textAlign: "left" as const
  };

  const tdStyle = {
    border: "1px solid #ddd",
    padding: "8px"
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Daily Ledger</h1>
      <h3>Date: {today}</h3>

      {/* ENTRY FORM */}
      <div style={{ border: "1px solid #ccc", padding: 20, marginBottom: 20 }}>
        <input
          placeholder="Search Code or Name"
          value={search}
          onChange={(e) => searchAccounts(e.target.value)}
          onKeyDown={handleEnter}
          style={{ marginRight: 10 }}
        />

        {accounts.length > 0 && (
          <div style={{ border: "1px solid #ccc", maxWidth: 300 }}>
            {accounts.map(acc => (
              <div
                key={acc.id}
                style={{ padding: 6, cursor: "pointer" }}
                onClick={() => selectAccount(acc)}
              >
                {acc.code} - {acc.name}
              </div>
            ))}
          </div>
        )}

        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleEnter}
          style={{ marginRight: 10 }}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ marginRight: 10 }}
        >
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>

        <input
          placeholder="Detail (Optional)"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onKeyDown={handleEnter}
          style={{ marginRight: 10 }}
        />

        <button onClick={saveTransaction}>
          {editingId ? "Update" : "Save"}
        </button>
      </div>

      {/* TABLE */}
      <h3>Today's Transactions</h3>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Serial</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Detail</th>
            <th style={thStyle}>Credit</th>
            <th style={thStyle}>Debit</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 && (
            <tr>
              <td style={tdStyle} colSpan={6}>
                No transactions today
              </td>
            </tr>
          )}

          {transactions.map((tx, index) => (
            <tr key={tx.id}>
              <td style={tdStyle}>{index + 1}</td>

              <td
                style={{
                  ...tdStyle,
                  color: "blue",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
                onClick={() => {
                  setSelectedAccount({
                    id: tx.accountId,
                    name: tx.name,
                    code: ""
                  });
                  setSearch(tx.name);
                }}
              >
                {tx.name}
              </td>

              <td style={tdStyle}>{tx.detail || "-"}</td>

              <td style={tdStyle}>
                {tx.type === "credit"
                  ? Number(tx.amount).toFixed(2)
                  : ""}
              </td>

              <td style={tdStyle}>
                {tx.type === "debit"
                  ? Number(tx.amount).toFixed(2)
                  : ""}
              </td>

              <td style={tdStyle}>
                <button onClick={() => editTransaction(tx)}>
                  Edit
                </button>
                <button
                  onClick={() => deleteTransaction(tx.id)}
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SUMMARY */}
      {dashboard && (
        <div style={{ marginTop: 20 }}>
          <h3>Summary</h3>
          <p>Total Credit: {dashboard.totalCredit}</p>
          <p>Total Debit: {dashboard.totalDebit}</p>
          <p>Outstanding: {dashboard.outstanding}</p>
        </div>
      )}
    </div>
  );
}