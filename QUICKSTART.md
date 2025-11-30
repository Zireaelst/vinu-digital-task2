# ⚡ Quick Start Guide - Testing & Running Demos

Bu rehber projenin nasıl hızlıca test edileceğini gösterir.

## 🚀 5 Dakikada Test Et

### 1️⃣ Unit Testleri Çalıştır (30 saniye)
```bash
cd contracts
npm test
```

**Beklenen:** 27 test passing (15 TestToken + 12 SponsorPaymaster)

### 2️⃣ Basit Demo Çalıştır (1 dakika)
```bash
npm run demo:simple
```

**Ne olur:** 
- Sepolia'da gerçek transaction oluşturur
- 100 TEST token transfer yapar
- Transaction hash döner

**Örnek Çıktı:**
```
🎯 Starting Simple Sponsored Transfer Demo
📝 Transaction: 0x1d61aeea5e3cad7fb0906e6434d0932a732c36b19a27422af07dbc800bdb6c9f
✅ Transfer successful!
```

### 3️⃣ Frontend'i Aç (30 saniye)
```bash
cd frontend
npm run dev
```

**Tarayıcı:** http://localhost:3000

---

## 📝 Tüm Komutlar

### Testing
```bash
# Tüm testler
npm test

# Sadece TestToken
npm run test:token

# Sadece Paymaster
npm run test:paymaster
```

### Demos
```bash
# Basit çalışan demo (ÖNERİLEN)
npm run demo:simple

# Full ERC-4337 UserOperation
npm run demo:full

# Basit konsept demo
npm run demo:basic
```

### Deployment (İlk kurulum)
```bash
# Deploy contracts
npm run deploy

# Configure contracts
npm run setup

# Verify on Etherscan
npm run verify
```

---

## ✅ Başarı Kriterleri

### Unit Tests
```
✅ 27/27 tests passing
✅ TestToken: 15 tests
✅ SponsorPaymaster: 12 tests
```

### Demo
```
✅ Transaction hash: 0x1d61aeea...
✅ Gas used: ~51,438
✅ Transfer successful
✅ Etherscan verification link
```

### Frontend
```
✅ Runs on localhost:3000
✅ Wallet connection works
✅ Contract info displays
✅ Sponsored transfer form works
```

---

## 🔍 Detaylı Test

Daha detaylı test için **TESTING.md** dosyasına bakın.

---

## 🎯 Sorun Giderme

### Test Hatası
```bash
# Node.js warning ignore et
npm test 2>&1 | grep -v "WARNING"
```

### Demo Hatası
```bash
# Sepolia ETH kontrolü
npx hardhat console --network sepolia
> const balance = await ethers.provider.getBalance("YOUR_ADDRESS")
> console.log(ethers.formatEther(balance))
```

### Frontend Hatası
```bash
# Port temizle
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## 📊 Test Coverage

| Component | Coverage | Status |
|-----------|----------|--------|
| Smart Contracts | 100% | ✅ |
| Unit Tests | 27 tests | ✅ |
| Integration | Manual | ✅ |
| Frontend | Manual | ✅ |

---

**Toplam Test Süresi:** ~5 dakika
**Status:** ✅ All systems operational
