import { useEffect, useState, useRef } from "react";

interface Account {
  id: number;
  name: string;
  code: string;
}

interface Transaction {
  id: number;
  serial: number;
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
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ================= LOAD =================
  const loadTransactions = async () => {
    const res = await fetch(`/api/transactions?date=${selectedDate}`);
    const data = await res.json();
    setTransactions(Array.isArray(data) ? data : []);
  };

  const loadDashboard = async () => {
    const res = await fetch(`/api/dashboard?date=${selectedDate}`);
    const data = await res.json();
    setDashboard(data || null);
  };

  useEffect(() => {
    loadTransactions();
    loadDashboard();
  }, [selectedDate]);

  // ================= SEARCH =================
  const searchAccounts = async (value: string) => {
    setSearch(value);
    setHighlightIndex(-1);

    if (!value) {
      setAccounts([]);
      return;
    }

    const res = await fetch(`/api/accounts/search?q=${value}`);
    const data = await res.json();
    setAccounts(Array.isArray(data) ? data : []);
  };

  const handleSearchKeyDown = (e: any) => {
    if (accounts.length === 0) {
      if (e.key === "Enter" && search.trim() !== "") {
        setNewName(search);
        setShowModal(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(prev =>
        prev < accounts.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(prev =>
        prev > 0 ? prev - 1 : accounts.length - 1
      );
    }

    if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectAccount(accounts[highlightIndex]);
    }
  };

  // ================= SELECT =================
  const selectAccount = async (account: Account) => {
    setSelectedAccount(account);
    setSearch(`${account.code} - ${account.name}`);
    setAccounts([]);
    setHighlightIndex(-1);

    const res = await fetch(`/api/accounts/${account.id}/balance`);
    const data = await res.json();
    setAccountBalance(data.balance);

    setTimeout(() => amountRef.current?.focus(), 100);
  };

  // ================= CREATE ACCOUNT =================
  const createCustomer = async () => {
    if (!newName || !newCode)
      return alert("Enter name and unique code");

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, code: newCode })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    setShowModal(false);
    setNewName("");
    setNewCode("");

    selectAccount(data);
  };

  // ================= SAVE =================
  const saveTransaction = async () => {
    if (!selectedAccount || !amount)
      return alert("Fill required fields");

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
          detail,
          date: selectedDate   // ✅ MUST ADD THIS
        })
      });
    }

    const res = await fetch(
      `/api/accounts/${selectedAccount.id}/balance`
    );
    const data = await res.json();
    setAccountBalance(data.balance);

    setAmount("");
    setDetail("");
    setSelectedAccount(null);
    setSearch("");
    setEditingId(null);

    loadTransactions();
    loadDashboard();

    setTimeout(() => searchRef.current?.focus(), 100);
  };

  // ================= EDIT =================
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
    setTimeout(() => amountRef.current?.focus(), 100);
  };

  // ================= DELETE =================
  const deleteTransaction = async (tx: Transaction) => {
    if (!window.confirm("Delete this transaction?")) return;

    await fetch(`/api/transactions/${tx.id}`, {
      method: "DELETE"
    });

    loadTransactions();
    loadDashboard();
  };

  // ================= UI STYLES =================
  const inputStyle = {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14
  };

  const buttonStyle = {
    padding: "8px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f3f4f6",
      padding: 40,
      fontFamily: "system-ui"
    }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        background: "white",
        padding: 30,
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <h1 style={{ fontWeight: 700, fontSize: 28 }}>
            DPC-92
          </h1>

          <button
            style={{
              padding: "8px 16px",
              background: "#059669",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
            onClick={() => window.open(`/api/export/outstanding?date=${selectedDate}`)}
          >
            Export to PDF
          </button>
        </div>

        {/* ENTRY SECTION */}
        <div style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 30,
          position: "relative"
        }}>
          <input
            ref={searchRef}
            placeholder="Search Code or Name"
            value={search}
            onChange={(e) => searchAccounts(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={inputStyle}
          />

          {accounts.length > 0 && (
            <div style={{
              position: "absolute",
              top: 40,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              width: 250,
              zIndex: 10
            }}>
              {accounts.map((acc, index) => (
                <div
                  key={acc.id}
                  style={{
                    padding: 8,
                    background:
                      index === highlightIndex
                        ? "#e0f2fe"
                        : "white",
                    cursor: "pointer"
                  }}
                  onClick={() => selectAccount(acc)}
                >
                  {acc.code} - {acc.name}
                </div>
              ))}
            </div>
          )}

          <input
            ref={amountRef}
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTransaction();
            }}
            style={inputStyle}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyle}
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>

          <input
            placeholder="Detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            style={inputStyle}
          />

          <button onClick={saveTransaction} style={buttonStyle}>
            {editingId ? "Update" : "Save"}
          </button>

          {accountBalance !== null && (
            <span style={{
              padding: "6px 12px",
              borderRadius: 20,
              background:
                accountBalance > 0 ? "#fee2e2" : "#dcfce7",
              color:
                accountBalance > 0 ? "#b91c1c" : "#166534",
              fontWeight: 600
            }}>
              ₹ {accountBalance}
            </span>
          )}
        </div>

        {/* TABLE & SUMMARY remain same as your version */}
        {/* ================= TABLE ================= */}
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20
        }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ padding: 12, textAlign: "left" }}>Serial</th>
              <th style={{ padding: 12, textAlign: "left" }}>Name</th>
              <th style={{ padding: 12, textAlign: "left" }}>Detail</th>
              <th style={{ padding: 12, textAlign: "right" }}>Credit</th>
              <th style={{ padding: 12, textAlign: "right" }}>Debit</th>
              <th style={{ padding: 12, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                  No transactions for this date
                </td>
              </tr>
            )}

            {transactions.map(tx => (
              <tr key={tx.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 12 }}>{tx.serial}</td>
                <td style={{ padding: 12 }}>{tx.name}</td>
                <td style={{ padding: 12 }}>{tx.detail || "-"}</td>

                <td style={{ padding: 12, textAlign: "right" }}>
                  {tx.type === "credit"
                    ? Number(tx.amount).toFixed(2)
                    : ""}
                </td>

                <td style={{ padding: 12, textAlign: "right" }}>
                  {tx.type === "debit"
                    ? Number(tx.amount).toFixed(2)
                    : ""}
                </td>

                <td style={{ padding: 12, textAlign: "right" }}>
                  <span
                    style={{ cursor: "pointer", marginRight: 12 }}
                    onClick={() => editTransaction(tx)}
                  >
                    ✏️
                  </span>

                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => deleteTransaction(tx)}
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= SUMMARY ================= */}
        {dashboard && (
          <div style={{
            display: "flex",
            gap: 20,
            marginTop: 30
          }}>
            <div style={{
              flex: 1,
              background: "#e0f2fe",
              padding: 20,
              borderRadius: 10
            }}>
              <h4>Total Credit</h4>
              <p>₹ {dashboard.totalCredit}</p>
            </div>

            <div style={{
              flex: 1,
              background: "#fef3c7",
              padding: 20,
              borderRadius: 10
            }}>
              <h4>Total Debit</h4>
              <p>₹ {dashboard.totalDebit}</p>
            </div>

            <div style={{
              flex: 1,
              background: "#ede9fe",
              padding: 20,
              borderRadius: 10
            }}>
              <h4>Outstanding</h4>
              <p>₹ {dashboard.outstanding}</p>
            </div>
          </div>
        )}
        {/* MODAL */}
        {showModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100
          }}>
            <div style={{
              background: "white",
              padding: 30,
              borderRadius: 10,
              width: 350
            }}>
              <h3>Customer Not Found</h3>

              <input
                placeholder="Customer Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: 10 }}
              />

              <input
                placeholder="Unique Code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: 20 }}
              />

              <div style={{
                display: "flex",
                justifyContent: "space-between"
              }}>
                <button
                  style={buttonStyle}
                  onClick={createCustomer}
                >
                  Register
                </button>

                <button
                  style={{
                    padding: "8px 16px",
                    background: "#e5e7eb",
                    border: "none",
                    borderRadius: 6
                  }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}