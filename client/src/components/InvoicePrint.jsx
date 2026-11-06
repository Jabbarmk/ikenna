import { money, formatDate } from '../utils/format';

export default function InvoicePrint({ settings, docType, docNo, docDate, party, items, subtotal, vatAmount, total, vatRate = 5, extraNote }) {
  return (
    <div className="invoice-print">
      <div className="invoice-header">
        <div className="invoice-company">
          <div className="invoice-company-name">{settings?.name || 'IKENNA KAMAL GENERAL TRADING L.L.C.'}</div>
          <div className="invoice-company-line">Mob: {settings?.phone || '+971555265418'}</div>
          <div className="invoice-company-line">Email: {settings?.email || 'lowiskata4real2007@yahoo.com'}</div>
          <div className="invoice-company-line">P.O. Box: {settings?.po_box || '377977'}</div>
          <div className="invoice-company-line">{settings?.address}</div>
        </div>
        <div className="invoice-meta">
          <div className="invoice-title">{docType}</div>
          <div className="invoice-trn">TRN: {settings?.trn || '100608218200003'}</div>
          <div className="invoice-no">No: {docNo}</div>
          <div className="invoice-date">Date: {formatDate(docDate)}</div>
        </div>
      </div>

      <div className="invoice-party">
        <div className="invoice-party-label">Mr./M/s:</div>
        <div className="invoice-party-name">{party?.name} {party?.company ? `(${party.company})` : ''}</div>
        {party?.address && <div>{party.address}</div>}
        {party?.phone && <div>Phone: {party.phone}</div>}
        {party?.trn && <div>TRN: {party.trn}</div>}
      </div>

      <table className="invoice-items-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>S.No</th>
            <th>Description</th>
            <th style={{ width: '80px' }}>Qty</th>
            <th style={{ width: '100px' }}>Rate</th>
            <th style={{ width: '110px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{it.description}</td>
              <td>{it.qty}</td>
              <td>{money(it.unit_price ?? it.unit_cost)}</td>
              <td>{money(Number(it.qty) * Number(it.unit_price ?? it.unit_cost))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-totals">
        <div className="invoice-totals-row"><span>Subtotal</span><span>{money(subtotal)} AED</span></div>
        <div className="invoice-totals-row"><span>VAT ({vatRate}%)</span><span>{money(vatAmount)} AED</span></div>
        <div className="invoice-totals-row invoice-grand"><span>Grand Total</span><span>{money(total)} AED</span></div>
      </div>

      {extraNote && <div className="invoice-note">{extraNote}</div>}

      <div className="invoice-signatures">
        <div>Receiver's Sign: ______________________</div>
        <div>for {settings?.name || 'IKENNA KAMAL GENERAL TRADING L.L.C.'}</div>
      </div>
    </div>
  );
}
