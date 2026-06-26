const fs = require('fs');
let c = fs.readFileSync('src/Customers.jsx', 'utf8');
const search = '<button className="bp-btn-primary" style={{ background: \'var(--brand-primary)\', color: \'#fff\', border: \'none\', padding: \'8px\', borderRadius: \'8px\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'8px\', cursor: \'pointer\', fontWeight: 600, fontSize: \'0.85rem\' }} onClick={onBackup}>\n              <Ic.Download s={14} /> Download Backup\n            </button>';
const rep = `<div style={{ display: 'flex', gap: '8px', marginTop: 10 }}>
              <button className="bp-btn-primary" style={{ flex: 1, background: 'var(--brand-primary)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onBackup}>
                <Ic.Download s={14} /> Download
              </button>
              <button className="bp-btn-primary" style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onShareBackup}>
                <Ic.Share s={14} /> Share WA
              </button>
            </div>`;
c = c.replace(search, rep);
fs.writeFileSync('src/Customers.jsx', c);
