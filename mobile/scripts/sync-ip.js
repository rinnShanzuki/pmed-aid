const os = require('os');
const fs = require('fs');
const path = require('path');

function getActiveLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lowerName = name.toLowerCase();

    // Skip virtual/tunnel interfaces if possible
    const isVirtual = lowerName.includes('vethernet') ||
                      lowerName.includes('virtual') ||
                      lowerName.includes('vbox') ||
                      lowerName.includes('vmware') ||
                      lowerName.includes('tailscale') ||
                      lowerName.includes('zerotier') ||
                      lowerName.includes('wsl');

    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        let score = 0;
        if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
          score += 50;
        } else if (lowerName.includes('ethernet') || lowerName.includes('eth') || lowerName.includes('en0')) {
          score += 40;
        }

        if (addr.address.startsWith('192.168.')) score += 20;
        else if (addr.address.startsWith('10.')) score += 15;
        else if (addr.address.startsWith('172.')) score += 10;

        if (isVirtual) score -= 50;

        candidates.push({ name, address: addr.address, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.length > 0 ? candidates[0] : null;
}

function syncEnvFile() {
  const active = getActiveLocalIP();
  if (!active) {
    console.warn('[sync-ip] ⚠️ No active network adapter found.');
    return;
  }

  const envPath = path.join(__dirname, '..', '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const ipKey = 'EXPO_PUBLIC_LOCAL_IP';
  const newLine = `${ipKey}=${active.address}`;

  if (content.includes(ipKey)) {
    content = content.replace(new RegExp(`^${ipKey}=.*$`, 'm'), newLine);
  } else {
    content = (content.trim() + '\n' + newLine).trim() + '\n';
  }

  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`[sync-ip] 🌐 Detected active adapter: ${active.name} (${active.address})`);
  console.log(`[sync-ip] ✅ Updated mobile/.env with EXPO_PUBLIC_LOCAL_IP=${active.address}`);
}

syncEnvFile();
