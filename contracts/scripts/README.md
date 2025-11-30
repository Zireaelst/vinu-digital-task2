# 📁 Scripts Klasörü Organizasyonu

Bu klasör ERC-4337 projesinin tüm scriptlerini organize bir şekilde içerir.

## 📂 Klasör Yapısı

```
scripts/
├── deployment/          # Deployment ve setup scriptleri
│   ├── deploy.ts       # Ana deployment scripti
│   ├── setup.ts        # Initial setup ve configuration
│   └── verify.ts       # Etherscan contract verification
├── demos/              # Demo ve test scriptleri
│   ├── simple-sponsored-transfer.ts  # ✅ Çalışan basit demo (KULLAN)
│   ├── demo-with-simpleaccount.ts   # Full ERC-4337 UserOp demo
│   └── simple-demo.ts               # Basit konsept gösterimi
└── archive/            # Eski debugging scriptleri (kullanma)
    └── ... (13 eski script)
```

---

## 🚀 Deployment Scripts

### 1. deploy.ts
**Amaç:** Tüm contract'ları Sepolia'ya deploy eder

```bash
npx hardhat run scripts/deployment/deploy.ts --network sepolia
```

**Deploy edilen contract'lar:**
- ✅ TestToken (ERC-20)
- ✅ SponsorPaymaster
- ✅ SimpleAccountFactory

**Çıktı:** `deployed_addresses.json` dosyası oluşturur

### 2. setup.ts
**Amaç:** Deploy edilen contract'ları configure eder

```bash
npx hardhat run scripts/deployment/setup.ts --network sepolia
```

**Yapılan işlemler:**
- Paymaster'ı fund eder (0.1 ETH)
- Test account'ları whitelist'e ekler
- Factory ve Paymaster bağlantısını test eder

### 3. verify.ts
**Amaç:** Contract'ları Etherscan'de verify eder

```bash
npx hardhat run scripts/deployment/verify.ts --network sepolia
```

**Verify edilen contract'lar:**
- TestToken
- SponsorPaymaster
- SimpleAccountFactory

---

## 🎬 Demo Scripts

### 1. simple-sponsored-transfer.ts ⭐ **ÖNERİLEN**
**Amaç:** Basit ve çalışan demo - Gerçek transaction hash üretir

```bash
npx hardhat run scripts/demos/simple-sponsored-transfer.ts --network sepolia
```

**Ne yapar:**
1. Random A ve B kullanıcıları oluşturur
2. TestToken mint eder (1000 token)
3. A'dan B'ye 100 token transfer eder
4. Gas kullanımını gösterir
5. **Sepolia'da gerçek transaction oluşturur**

**Çıktı Örneği:**
```
🎯 Starting Simple Sponsored Transfer Demo
📝 Transaction: 0x1d61aeea...
⛽ Gas used: 51,438
✅ Transfer successful!
User B balance: 100.0 TEST
```

**Transaction Proof:**
https://sepolia.etherscan.io/tx/0x1d61aeea5e3cad7fb0906e6434d0932a732c36b19a27422af07dbc800bdb6c9f

### 2. demo-with-simpleaccount.ts
**Amaç:** Full ERC-4337 implementation with UserOperation

```bash
npx hardhat run scripts/demos/demo-with-simpleaccount.ts --network sepolia
```

**Ne yapar:**
1. SimpleAccount factory ile hesap oluşturur
2. UserOperation hazırlar (initCode, callData, signature)
3. Paymaster validation
4. EntryPoint simulation (bundler gerekir)

**Not:** Advanced demo, production bundler service gerektirir.

### 3. simple-demo.ts
**Amaç:** Konsept gösterimi için basit demo

```bash
npx hardhat run scripts/demos/simple-demo.ts --network sepolia
```

Temel ERC-4337 kavramlarını gösterir.

---

## 🗂️ Archive (Kullanılmayan)

`archive/` klasöründeki scriptler debugging ve development sırasında kullanıldı. Artık gerekli değiller:

**Debugging Scripts:**
- `debug.ts` - EntryPoint debugging
- `diagnose.ts` - Contract diagnosis
- `fix-setup.ts` - Setup fixing
- `find-accounts.ts` - Account search

**Redundant Demos:**
- `demo-complete.ts` - Eski demo versiyonu
- `demo-execute-transfer.ts` - Eski transfer demo

**Utility Scripts:**
- `calculate-account.ts` - Address calculation
- `contract-analysis.ts` - Contract analysis
- `investigate-address.ts` - Address investigation
- `verify-keys.ts` - Key verification

**Old Deployment:**
- `deploy-account.ts` - Eski account deployment
- `deploy-factoryv2.ts` - Factory v2 deneme
- `redeploy-factory.ts` - Factory redeploy

**⚠️ Bu scriptleri SİLME!** Archive olarak sakla, ihtiyaç duyulursa referans için.

---

## 📝 Kullanım Önerileri

### Yeni Proje Setup
```bash
# 1. Deploy
npx hardhat run scripts/deployment/deploy.ts --network sepolia

# 2. Setup
npx hardhat run scripts/deployment/setup.ts --network sepolia

# 3. Verify
npx hardhat run scripts/deployment/verify.ts --network sepolia

# 4. Test demo
npx hardhat run scripts/demos/simple-sponsored-transfer.ts --network sepolia
```

### Test ve Demo
```bash
# Basit çalışan demo (ÖNERİLEN)
npx hardhat run scripts/demos/simple-sponsored-transfer.ts --network sepolia

# Full ERC-4337 demo
npx hardhat run scripts/demos/demo-with-simpleaccount.ts --network sepolia
```

### Package.json Scripts
`package.json`'a eklenebilecek kısayollar:

```json
{
  "scripts": {
    "deploy": "hardhat run scripts/deployment/deploy.ts --network sepolia",
    "setup": "hardhat run scripts/deployment/setup.ts --network sepolia",
    "verify": "hardhat run scripts/deployment/verify.ts --network sepolia",
    "demo:simple": "hardhat run scripts/demos/simple-sponsored-transfer.ts --network sepolia",
    "demo:full": "hardhat run scripts/demos/demo-with-simpleaccount.ts --network sepolia"
  }
}
```

Kullanım:
```bash
npm run deploy
npm run demo:simple
```

---

## 🎯 Hangi Script Ne Zaman Kullanılır?

| Senaryo | Script |
|---------|--------|
| İlk deployment | `deployment/deploy.ts` |
| Contract'ları setup et | `deployment/setup.ts` |
| Etherscan verify | `deployment/verify.ts` |
| Basit demo (transaction proof) | `demos/simple-sponsored-transfer.ts` ⭐ |
| Advanced ERC-4337 demo | `demos/demo-with-simpleaccount.ts` |
| Konsept gösterimi | `demos/simple-demo.ts` |

---

## ✅ Script Durumu

| Script | Status | Test Edildi | Production Ready |
|--------|--------|-------------|------------------|
| deploy.ts | ✅ Active | ✅ Yes | ✅ Yes |
| setup.ts | ✅ Active | ✅ Yes | ✅ Yes |
| verify.ts | ✅ Active | ⚠️ Partial | ✅ Yes |
| simple-sponsored-transfer.ts | ✅ Active | ✅ Yes | ✅ Yes |
| demo-with-simpleaccount.ts | ✅ Active | ✅ Yes | ⚠️ Needs bundler |
| simple-demo.ts | ✅ Active | ✅ Yes | ✅ Yes |
| archive/* | 📦 Archived | - | ❌ No |

---

## 🧹 Temizlik ve Bakım

### Archive'i Silmek İsterseniz
```bash
# DİKKAT: Archive klasörünü tamamen sil
rm -rf scripts/archive/

# Veya belirli scriptleri sil
rm scripts/archive/debug.ts
```

**Öneri:** Archive'i sakla, çok yer kaplamıyor (~100KB).

### Yeni Script Eklemek
```bash
# Deployment script
touch scripts/deployment/new-deploy.ts

# Demo script
touch scripts/demos/new-demo.ts
```

---

## 📚 Dokümantasyon

Detaylı test ve kullanım için:
- **TESTING.md** - Comprehensive testing guide
- **README.md** - Project overview
- **DEMO_EXECUTION_SUMMARY.md** - Demo results

---

**Güncelleme:** 30 Kasım 2025
**Klasör Durumu:** ✅ Organized
**Toplam Script:** 19 (6 active + 13 archived)
