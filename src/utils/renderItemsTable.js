export function renderItemsTable(items, currency) {
  return `
    <table style="
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 13px;
      background: #fff;
      ">
      <tr>
        <th style="
          background: #f2f6fa;
          color: #205081;
          font-weight: bold;
          border: 1px solid #bbb;
          padding: 7px;
          text-align: left;
        ">Item</th>
        <th style="
          background: #f2f6fa;
          color: #205081;
          font-weight: bold;
          border: 1px solid #bbb;
          padding: 7px;
          text-align: left;
        ">Reference</th>
        <th style="
          background: #f2f6fa;
          color: #205081;
          font-weight: bold;
          border: 1px solid #bbb;
          padding: 7px;
          text-align: left;
        ">Qty</th>
        <th style="
          background: #f2f6fa;
          color: #205081;
          font-weight: bold;
          border: 1px solid #bbb;
          padding: 7px;
          text-align: left;
        ">Rate</th>
      </tr>
      ${items.map(item => `
        <tr>
          <td style="border: 1px solid #bbb; padding: 7px;">${item.name || ''}</td>
          <td style="border: 1px solid #bbb; padding: 7px;">${item.reference_number || ''}</td>
          <td style="border: 1px solid #bbb; padding: 7px;">${item.quantity || 0}</td>
          <td style="border: 1px solid #bbb; padding: 7px;">${currency}${item.price ? Number(item.price).toFixed(2) : '0.00'}</td>
        </tr>
      `).join('')}
    </table>
  `;
}